---
name: "team-hotfix"
description: "Rapid Response — emergency fix with strict guardrails: max 4 files, isolated subsystem, Security reviews fix before PTM"
---

# Agent Team: Hotfix — Rapid Response

## tmux Protocol

If `$TMUX` is set, load `.agents/skills/tmux-protocol/SKILL.md` before any pane operations.


## Team Composition

| Role | Agent | Skills |
|------|-------|--------|
| Dev | `arcwright-agent-awm-dev` | Targeted fix, isolated scope |
| Security | Security reviewer (review agent with security-only sub-spec lens) | Fix review, regression safety check |

## Purpose

Rapid Response is the production emergency team. It moves fast and skips non-essential review stages, but compensates with hard guardrails and mandatory Security review of the fix before proceeding to PTM. Dev identifies and fixes the issue. Security reviews the fix — not for architectural elegance, but to confirm the fix doesn't introduce a security regression or new vulnerability. No AR loop, no UX review, no spec phase. Requires explicit `[emergency]` confirmation from the user before the team spawns.

## GUARDRAILS — READ BEFORE SPAWN

**These constraints are NON-NEGOTIABLE:**

1. **Max 4 files touched** — if the fix requires more than 4 files, this is not a hotfix. Escalate to a full track.
2. **Isolated subsystem only** — changes must be confined to a single, identifiable subsystem. No cross-cutting changes.
3. **`[emergency]` confirmation required** — master MUST receive explicit `[emergency]` from the user before spawning this team. Do not spawn on assumption.
4. **No AR loop** — architectural review is skipped.
5. **No UX review** — UX validation is skipped.
6. **No spec phase** — no PRD, no story, no sprint planning.
7. **Security review is MANDATORY** — no PTM without Security sign-off on the fix.

If any guardrail would be violated, stop and present the user with options: escalate to a full track, or narrow scope to fit within guardrails.

## Layout (tmux)

```
┌─────────┬───────────┐
│         │    Dev    │
│ Master  ├───────────┤
│ (left)  │ Security  │
└─────────┴───────────┘
```

## Spawn Sequence

**MUST have received `[emergency]` from user before running these commands.**

```bash
# 1. Split Dev pane (top-right)
tmux split-window -h -c "#{pane_current_path}" "~/.config/tmux/bin/agent_spawn.sh 'You are the Dev agent in the Hotfix (Rapid Response) team managed by Conductor (master-orchestrator). Read and activate: {project-root}/.claude/commands/arcwright-agent-awm-dev.md. GUARDRAILS: touch MAX 4 files, isolated subsystem only, no cross-cutting changes. Your task queue comes from the master pane. Before stopping any task output: AGENT_SIGNAL::TASK_DONE::dev::{task_id}::{status}::{summary}. On long tasks emit AGENT_SIGNAL::PROGRESS every 60s. Wait for your first task.'"
sleep 8

# 2. Split Security pane (bottom-right)
tmux split-window -v -c "#{pane_current_path}" "~/.config/tmux/bin/agent_spawn.sh 'You are the Security reviewer in the Hotfix (Rapid Response) team managed by Conductor (master-orchestrator). Activate with a security-only review lens. In this team: review the Dev fix for security regressions, new vulnerabilities, or unsafe patterns introduced by the fix. You are NOT reviewing for architectural quality. Signal TASK_DONE::approved or TASK_DONE::blocked. Your task queue comes from the master pane. Before stopping any task output: AGENT_SIGNAL::TASK_DONE::security::{task_id}::{status}::{summary}. Wait for your first task.'"
sleep 8

# 3. Equalize pane sizes
tmux select-layout tiled
sleep 6
```

## Agent Activation

- **Dev**: `Read and activate: {project-root}/.claude/commands/arcwright-agent-awm-dev.md`
  - Constrained: max 4 files, isolated subsystem, no cross-cutting changes.
- **Security**: Activate review agent with **security-only sub-spec lens**.
  - Focused on: does the fix introduce a security regression or new vulnerability? Not architectural quality.

## Task Routing Protocol

No iterative loop. Linear flow:

```
1. User confirms [emergency] — master verifies guardrails are satisfied
   (if not: present options to user before proceeding)

2. Master dispatches fix task to Dev
   → tmux send-keys -t {dev_pane_id} "TASK-{id}-fix: Emergency fix for: {issue}. GUARDRAILS: max 4 files, isolated to {subsystem} only. Signal TASK_DONE when fixed with files changed." Enter

3. Dev identifies and fixes the issue
   → AGENT_SIGNAL::TASK_DONE::dev::{task_id}::fixed::{files_changed}
   → If guardrail would be violated: AGENT_SIGNAL::TASK_BLOCKED::dev::{task_id}::guardrail::{reason}

4. If guardrail blocked: master surfaces to user for escalation decision

5. If fix complete: master dispatches to Security for fix review
   → tmux send-keys -t {security_pane_id} "TASK-{id}-review: Review this hotfix for security regressions only. Files changed: {files_changed}. Issue being fixed: {issue}. Signal TASK_DONE::approved or TASK_DONE::blocked." Enter

6. Security reviews the fix
   → AGENT_SIGNAL::TASK_DONE::security::{task_id}::approved::Fix is safe, no security regressions
   → OR: AGENT_SIGNAL::TASK_DONE::security::{task_id}::blocked::{security_concern}

7a. If Security APPROVED: master proceeds to PTM
7b. If Security BLOCKED: master surfaces concern to user for decision
    → User decides: revise fix (re-dispatch to Dev) or escalate
```

## Communication Protocol

### Signal Format
```
AGENT_SIGNAL::{TYPE}::{FROM_ROLE}::{TASK_ID}::{STATUS}::{DETAIL}
```
Types: `READY` | `TASK_START` | `PROGRESS` | `TASK_DONE` | `TASK_BLOCKED` | `FINDING` | `ERROR`

Examples:
- `AGENT_SIGNAL::TASK_DONE::dev::task-hf1::fixed::backend/routes/auth.py — null check added`
- `AGENT_SIGNAL::TASK_BLOCKED::dev::task-hf1::guardrail::Fix requires 6 files — exceeds 4-file limit`
- `AGENT_SIGNAL::TASK_DONE::security::task-hf1::approved::Fix is safe — no new attack surface introduced`
- `AGENT_SIGNAL::TASK_DONE::security::task-hf1::blocked::Null check bypasses rate limit on same code path`

### Master Polling Protocol
After dispatching any task to a pane:
1. `sleep 8` then begin polling
2. Every 30s: `tmux capture-pane -t {pane_id} -p | tail -30 | grep "AGENT_SIGNAL"`
3. On `TASK_DONE`: route next action per Task Routing Protocol above
4. On `TASK_BLOCKED`: surface to user immediately — do NOT auto-escalate
5. No signal after 2 min: send `tmux send-keys -t {pane_id} "STATUS_CHECK" Enter`, wait 15s, poll once more
6. Still no signal: mark pane as unresponsive in session file, present recovery options to user

### Heartbeat Rule
Agents on tasks expected to take >90s MUST emit `AGENT_SIGNAL::PROGRESS::{role}::{task_id}::running::{brief_status}` every 60s.

## Team Registration

When spawning this team, master writes to `_arcwright/_memory/master-orchestrator-sidecar/session-state.md` under `active_team`:
```yaml
active_team:
  code: hotfix
  name: "Rapid Response"
  spawned_at: {ISO8601}
  emergency_confirmed: true
  panes:
    dev: {pane_id}
    security: {pane_id}
```

## In-Process Fallback

When `$TMUX` is not set, run agents sequentially using the Agent tool:

1. Verify `[emergency]` confirmed and guardrails satisfied
2. Spawn Dev agent (Agent tool) with fix task → wait for completion
3. If guardrail blocked: surface to user
4. Spawn Security reviewer (Agent tool) with fix details → wait for approval or block
5. If approved: proceed to PTM
6. If blocked: surface to user

## Team Close Protocol

When master needs to close this team:
1. Read pane IDs from `active_team` in `_arcwright/_memory/master-orchestrator-sidecar/session-state.md`
2. Kill each pane directly: `tmux kill-pane -t {pane_id}` (DO NOT send `/exit`)
3. Clear `active_team` from session-state.md

## Best Used For

- Production incidents requiring immediate targeted remediation
- Critical bugs in isolated subsystems (null pointer, broken auth check, bad query)
- Situations where time-to-fix is more important than review completeness
- Any emergency where the scope is genuinely bounded to 1-4 files in a single subsystem
- NEVER use for: architectural changes, multi-subsystem refactors, new features, scope > 4 files
