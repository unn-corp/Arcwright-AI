---
name: "team-hotfix"
description: "Rapid Response — emergency fix with strict guardrails: max 4 files, isolated subsystem, Security reviews fix before PTM"
---

# Agent Team: Hotfix — Rapid Response

> **Default orchestration:** in-process via [`claude-subagent-protocol`](.agents/skills/claude-subagent-protocol/SKILL.md). tmux split-pane variant is opt-in (see step blocks).
>
> **Kiro CLI:** this team is available as a Kiro `subagent` pipeline. See `## Kiro Pipeline` at the end of this skill.

## Best Used For

- Production incidents requiring immediate targeted remediation
- Critical bugs in isolated subsystems (null pointer, broken auth check, bad query)
- Situations where time-to-fix is more important than review completeness
- Any emergency where the scope is genuinely bounded to 1-4 files in a single subsystem
- NEVER use for: architectural changes, multi-subsystem refactors, new features, scope > 4 files

## Team Composition

| Role | Agent | Skills |
|------|-------|--------|
| Dev | `arcwright-dev` | Targeted fix, isolated scope |
| Security | `arcwright-review-orchestrator` (security lens) | Fix review, regression safety check |

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

Load `.agents/skills/tmux-protocol/SKILL.md` before running tmux commands. Default path is in-process — no pane operations needed.

#### tmux Variant (when $TMUX is set and user wants visibility)

Load `.agents/skills/tmux-protocol/SKILL.md` before running these commands.

```bash
# 1. Split Dev pane (top-right)
tmux split-window -h -c "#{pane_current_path}" "~/.config/tmux/bin/agent_spawn.sh 'You are the Dev agent in the Hotfix (Rapid Response) team managed by Conductor (master-orchestrator). Read and activate: {project-root}/_arcwright/awm/agents/dev.md. GUARDRAILS: touch MAX 4 files, isolated subsystem only, no cross-cutting changes. Your task queue comes from the master pane. Before stopping any task output: AGENT_SIGNAL::TASK_DONE::dev::{task_id}::{status}::{summary}. On long tasks emit AGENT_SIGNAL::PROGRESS every 60s. Wait for your first task.'"
sleep 8

# 2. Split Security pane (bottom-right)
tmux split-window -v -c "#{pane_current_path}" "~/.config/tmux/bin/agent_spawn.sh 'You are the Security reviewer in the Hotfix (Rapid Response) team managed by Conductor (master-orchestrator). Activate with a security-only review lens. In this team: review the Dev fix for security regressions, new vulnerabilities, or unsafe patterns introduced by the fix. You are NOT reviewing for architectural quality. Signal TASK_DONE::approved or TASK_DONE::blocked. Your task queue comes from the master pane. Before stopping any task output: AGENT_SIGNAL::TASK_DONE::security::{task_id}::{status}::{summary}. Wait for your first task.'"
sleep 8

# 3. Equalize pane sizes
tmux select-layout tiled
sleep 6
```

## Agent Activation

> **Project context**: Master passes the `## Project Context` block (from its activation scan) to each agent in their first task message. Agents receive context from master — they do not re-scan independently.

- **Dev**: activate `arcwright-dev`
  - Constrained: max 4 files, isolated subsystem, no cross-cutting changes.
- **Security**: activate with **security-only sub-spec lens**.
  - Focused on: does the fix introduce a security regression or new vulnerability? Not architectural quality.

## Steps

No iterative loop. Linear flow with guardrail gates.

### 1. Guardrail Verification

**What this step does:** Master verifies `[emergency]` confirmation has been received and that the issue fits within guardrails before proceeding.
**Inputs:** User's `[emergency]` confirmation + issue description
**Output:** `$STEP_1_OUTPUT` — guardrail check: proceed or escalate

This step is performed by master directly (no Agent spawn needed): confirm `[emergency]` received, confirm issue fits in 1-4 files in a single subsystem. If either check fails, surface options to user.

---

### 2. Emergency Fix

**What this step does:** Dev identifies and implements the fix within guardrail constraints.
**Inputs:** Issue description + guardrail constraints
**Output:** `$STEP_2_OUTPUT` — fix complete with files changed, OR guardrail-blocked signal

---

#### Default: In-Process (Agent tool)

```json
{
  "name": "Agent",
  "input": {
    "subagent_type": "arcwright-dev",
    "prompt": "Emergency fix for production issue. GUARDRAILS ARE NON-NEGOTIABLE: touch MAX 4 files, isolated to the specified subsystem only, no cross-cutting changes. If the fix requires violating a guardrail, stop and report which guardrail would be violated and why.\n\n## Inputs\nIssue: {issue_description}\nSubsystem: {subsystem}\nGuardrails: max 4 files, isolated subsystem, no cross-cutting changes\n\n## Output\nFix complete with files changed listed. OR: 'GUARDRAIL_BLOCKED: {reason}' if a guardrail would be violated.",
    "model": "sonnet"
  }
}
```

Capture result into `$STEP_2_OUTPUT`. If `GUARDRAIL_BLOCKED`: surface to user immediately. Otherwise pass to step 3.

---

#### tmux Variant (when $TMUX is set and user wants visibility)

Load `.agents/skills/tmux-protocol/SKILL.md` before spawning.

```bash
tmux send-keys -t {dev_pane_id} "TASK-{id}-fix: Emergency fix for: {issue}. GUARDRAILS: max 4 files, isolated to {subsystem} only. Signal TASK_DONE when fixed with files changed." Enter
```

Completion signal: `AGENT_SIGNAL::TASK_DONE::dev::{task_id}::fixed::{files_changed}` or `AGENT_SIGNAL::TASK_BLOCKED::dev::{task_id}::guardrail::{reason}`

---

### 3. Security Review

**What this step does:** Security reviews the fix for regressions and new vulnerabilities — not architectural quality.
**Inputs:** `$STEP_2_OUTPUT` (files changed + fix description) + original issue
**Output:** `$STEP_3_OUTPUT` — approved (proceed to PTM) or blocked (security concern)

---

#### Default: In-Process (Agent tool)

```json
{
  "name": "Agent",
  "input": {
    "subagent_type": "arcwright-review-orchestrator",
    "prompt": "Review this hotfix for security regressions ONLY. Does the fix introduce any: new attack surface, auth bypass, injection opportunity, unsafe data handling, or other security vulnerability? Do NOT review for architectural quality.\n\n## Inputs\nFiles changed: {$STEP_2_OUTPUT}\nIssue being fixed: {issue_description}\n\n## Output\nEither 'Approved: fix is safe, no security regressions introduced.' OR 'Blocked: {specific_security_concern}'",
    "model": "opus"
  }
}
```

Capture result into `$STEP_3_OUTPUT`. If approved: proceed to PTM. If blocked: surface to user for decision. Final output — no next step.

---

#### tmux Variant (when $TMUX is set and user wants visibility)

Load `.agents/skills/tmux-protocol/SKILL.md` before spawning.

```bash
tmux send-keys -t {security_pane_id} "TASK-{id}-review: Review hotfix for security regressions only. Files changed: {$STEP_2_OUTPUT}. Issue: {issue_description}. Signal TASK_DONE::approved or TASK_DONE::blocked." Enter
```

Completion signal: `AGENT_SIGNAL::TASK_DONE::security::{task_id}::approved::Fix is safe, no security regressions` or `AGENT_SIGNAL::TASK_DONE::security::{task_id}::blocked::{security_concern}`

---

## Communication Protocol

See [`tmux-protocol`](.agents/skills/tmux-protocol/SKILL.md) for the tmux signal protocol; this skill's default is in-process — Agent tool return value is the sole completion signal.

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

## Team Close Protocol

When master needs to close this team:
1. Read pane IDs from `active_team` in `_arcwright/_memory/master-orchestrator-sidecar/session-state.md`
2. Kill each pane directly: `tmux kill-pane -t {pane_id}` (DO NOT send `/exit`)
3. Clear `active_team` from session-state.md

## Kiro Pipeline

Use the `subagent` tool to run this team as a Kiro pipeline.

```json
{
  "task": "Emergency hotfix: Dev fixes production issue within guardrails (max 4 files, isolated subsystem), Security reviews fix before PTM.",
  "stages": [
    {
      "name": "emergency-fix",
      "role": "arcwright-dev",
      "prompt_template": "Emergency fix for production issue. GUARDRAILS ARE NON-NEGOTIABLE: touch MAX 4 files, isolated to the specified subsystem only, no cross-cutting changes: {task}",
      "depends_on": []
    },
    {
      "name": "sec-review",
      "role": "arcwright-review-orchestrator",
      "prompt_template": "Review this hotfix for security regressions ONLY. Does the fix introduce any new attack surface, auth bypass, injection opportunity, unsafe data handling, or other security vulnerability? Do NOT review for architectural quality: {task}",
      "depends_on": ["emergency-fix"]
    }
  ]
}
```
