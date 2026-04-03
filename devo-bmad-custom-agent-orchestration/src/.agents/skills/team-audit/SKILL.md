---
name: "team-audit"
description: "The Crucible — full audit with Architect, UX, and Security running concurrently; Security has final sign-off"
---

# Agent Team: Full Audit + Fix Loop — The Crucible

## Team Composition

| Role | Agent | Skills |
|------|-------|--------|
| Architect | `bmad-agent-bmm-architect` | Architecture audit, DRY/SOLID, full dev skill access |
| UX Designer | `bmad-agent-bmm-ux-designer` | UV audit, accessibility, design token compliance, full dev skill access |
| Security | Security reviewer (review agent with security-only sub-spec lens) | OWASP, injection, XSS, auth vulnerabilities |
| Dev | `bmad-agent-bmm-dev` | Fix implementation, can invoke architect, QA, and security skills inline |

## Purpose

The Crucible is the most thorough audit configuration available. Architect, UX Designer, and Security reviewer run concurrently to maximize coverage and minimize clock time. All findings are aggregated and severity-triaged, with critical security issues addressed first. Security has final sign-off authority — the loop does not exit until Security signals a clean pass on all remediated areas. Use The Crucible before major releases, for legacy code onboarding, or whenever a codebase area needs comprehensive multi-dimensional validation.

## Layout (tmux)

```
┌─────────┬───────────┐
│         │ Architect │
│ Master  ├───────────┤
│ (left)  │    UX     │
│         ├───────────┤
│         │ Security  │
├─────────┼───────────┤
│  (open) │    Dev    │
└─────────┴───────────┘
```

## Spawn Sequence

```bash
# 1. Split Architect pane (top-right)
tmux split-window -h -c "#{pane_current_path}" "claude --dangerously-skip-permissions 'You are the Architect agent in The Crucible audit team managed by Krakken (squid-master). Read and activate: {project-root}/.claude/commands/bmad-agent-bmm-architect.md. You have full dev skill access and can invoke any skill in .agents/skills/ directly. Emit AGENT_SIGNAL::FINDING signals as you discover issues. Your task queue comes from the master pane. Before stopping any task output: AGENT_SIGNAL::TASK_DONE::architect::{task_id}::{status}::{summary}. On long tasks emit AGENT_SIGNAL::PROGRESS every 60s. Wait for your first task.'"
sleep 8

# 2. Split UX pane (mid-right)
tmux split-window -v -c "#{pane_current_path}" "claude --dangerously-skip-permissions 'You are the UX Designer agent in The Crucible audit team managed by Krakken (squid-master). Read and activate: {project-root}/.claude/commands/bmad-agent-bmm-ux-designer.md. You have full dev skill access and can invoke any skill in .agents/skills/ directly. Emit AGENT_SIGNAL::FINDING signals as you discover issues. Your task queue comes from the master pane. Before stopping any task output: AGENT_SIGNAL::TASK_DONE::ux::{task_id}::{status}::{summary}. On long tasks emit AGENT_SIGNAL::PROGRESS every 60s. Wait for your first task.'"
sleep 8

# 3. Split Security pane (bottom-right)
tmux split-window -v -c "#{pane_current_path}" "claude --dangerously-skip-permissions 'You are the Security reviewer in The Crucible audit team managed by Krakken (squid-master). Activate with a security-only review lens: focus exclusively on OWASP Top 10, injection vulnerabilities, XSS, auth bypass, secrets exposure, and insecure data handling. Emit AGENT_SIGNAL::FINDING signals as you discover issues. You have FINAL SIGN-OFF authority — the loop does not exit until you emit a clean pass. Your task queue comes from the master pane. Before stopping any task output: AGENT_SIGNAL::TASK_DONE::security::{task_id}::{status}::{summary}. On long tasks emit AGENT_SIGNAL::PROGRESS every 60s. Wait for your first task.'"
sleep 8

# 4. Split Dev pane (4th pane — horizontal split from bottom area)
tmux split-window -h -c "#{pane_current_path}" "claude --dangerously-skip-permissions 'You are the Dev agent in The Crucible audit team managed by Krakken (squid-master). Read and activate: {project-root}/.claude/commands/bmad-agent-bmm-dev.md. You can invoke architect, QA, and security skills from .agents/skills/ inline during fix phases. Your task queue comes from the master pane. Before stopping any task output: AGENT_SIGNAL::TASK_DONE::dev::{task_id}::{status}::{summary}. On long tasks emit AGENT_SIGNAL::PROGRESS every 60s. Wait for your first task.'"
sleep 8

# 5. Equalize pane sizes
tmux select-layout tiled
sleep 6
```

## Agent Activation

- **Architect**: `Read and activate: {project-root}/.claude/commands/bmad-agent-bmm-architect.md`
  - Has **full dev skill access** — can invoke any skill in `.agents/skills/` directly.
- **UX Designer**: `Read and activate: {project-root}/.claude/commands/bmad-agent-bmm-ux-designer.md`
  - Has **full dev skill access** — can invoke any skill in `.agents/skills/` directly.
- **Security**: Activate review agent with **security-only sub-spec lens** (OWASP Top 10, injection, XSS, auth, secrets).
  - Security has **final sign-off authority** — no loop exit without Security's clean pass.
- **Dev**: `Read and activate: {project-root}/.claude/commands/bmad-agent-bmm-dev.md`
  - Can invoke architect, QA, and security skills from `.agents/skills/` inline during fix phases.

## Iterative Loop

```
1. Master dispatches audit scope to Architect, UX Designer, AND Security simultaneously
   → tmux send-keys -t {architect_pane_id} "TASK-{id}-ar: Audit scope: {files/areas}. Emit FINDING signals per issue. Signal TASK_DONE when audit complete." Enter
   → tmux send-keys -t {ux_pane_id} "TASK-{id}-ux: Audit scope: {files/areas}. Emit FINDING signals per issue. Signal TASK_DONE when audit complete." Enter
   → tmux send-keys -t {security_pane_id} "TASK-{id}-sec: Audit scope: {files/areas}. Emit FINDING signals per security issue. Signal TASK_DONE when audit complete." Enter

2. All three run concurrent audits
   → Each emits: AGENT_SIGNAL::FINDING::{role}::{task_id}::finding::{severity}::{description}
     where severity is: critical | major | minor
   → Each emits TASK_DONE when their audit is complete

3. Master waits for ALL THREE TASK_DONE signals, then:
   → Captures all FINDING signals from all three reviewers
   → Severity-triages: critical security findings first (🔴), then critical arch/ux, then major, then minor
   → Tags each finding with its owning reviewer

4. Master dispatches fix batch to Dev in severity order
   → tmux send-keys -t {dev_pane_id} "TASK-{id}-fix: Fix these findings in priority order. Critical security first. Findings: {sorted_findings}. Signal TASK_DONE with files changed." Enter

5. Dev fixes findings
   → AGENT_SIGNAL::TASK_DONE::dev::{task_id}::fixed::{files_changed}

6. Master re-dispatches affected areas ONLY to the reviewer(s) who own those findings
   → Security always gets re-review on any security-tagged findings
   → Architect gets re-review only if architectural findings were fixed
   → UX gets re-review only if UX findings were fixed
   → "TASK-{id}-reverify: Re-audit ONLY these affected areas: {areas}. Signal TASK_DONE with clean pass or new findings."

7. Loop exits ONLY when:
   → Security emits TASK_DONE with clean pass on all security findings
   → AND all other outstanding findings are resolved or accepted by user
   → Security's clean pass is REQUIRED — it cannot be skipped or overridden

8. Dev can invoke architect, QA, and security skills inline during fix phases for assistance
```

## Communication Protocol

### Signal Format
```
AGENT_SIGNAL::{TYPE}::{FROM_ROLE}::{TASK_ID}::{STATUS}::{DETAIL}
```
Types: `READY` | `TASK_START` | `PROGRESS` | `TASK_DONE` | `TASK_BLOCKED` | `FINDING` | `ERROR`

Examples:
- `AGENT_SIGNAL::FINDING::security::task-020::finding::critical::SQL injection in /api/search query param`
- `AGENT_SIGNAL::FINDING::architect::task-020::finding::major::UserService violates SRP, handles auth + profile`
- `AGENT_SIGNAL::FINDING::ux::task-020::finding::minor::Three components duplicate spinner implementation`
- `AGENT_SIGNAL::TASK_DONE::security::task-020::clean::All security findings resolved — sign-off granted`

### Master Polling Protocol
After dispatching any task to a pane:
1. `sleep 8` then begin polling
2. Every 30s: `tmux capture-pane -t {pane_id} -p | tail -30 | grep "AGENT_SIGNAL"`
3. On `TASK_DONE`: route next action per Iterative Loop above
4. On `TASK_BLOCKED`: surface to user immediately
5. No signal after 2 min: send `tmux send-keys -t {pane_id} "STATUS_CHECK" Enter`, wait 15s, poll once more
6. Still no signal: mark pane as unresponsive in session file, present recovery options to user

### Heartbeat Rule
Agents on tasks expected to take >90s MUST emit `AGENT_SIGNAL::PROGRESS::{role}::{task_id}::running::{brief_status}` every 60s.

## Team Registration

When spawning this team, master writes to `_bmad/_memory/squid-master-sidecar/session-state.md` under `active_team`:
```yaml
active_team:
  code: audit
  name: "The Crucible"
  spawned_at: {ISO8601}
  panes:
    architect: {pane_id}
    ux: {pane_id}
    security: {pane_id}
    dev: {pane_id}
```

## In-Process Fallback

When `$TMUX` is not set, run agents sequentially using the Agent tool:

1. Spawn Architect agent (Agent tool) with audit scope → capture findings
2. Spawn UX Designer agent (Agent tool) with audit scope → capture findings
3. Spawn Security reviewer agent (Agent tool) with audit scope → capture findings
4. Merge all findings, sort by severity (critical security first)
5. Spawn Dev agent (Agent tool) with sorted findings → wait for fix completion
6. Spawn Security reviewer again with only security-affected areas → check for clean pass
7. If Security not clean: repeat from step 5 for remaining security findings
8. Spawn Architect/UX with their affected areas → check for new findings
9. Repeat until all reviewers clean

## Team Close Protocol

When master needs to close this team:
1. Read pane IDs from `active_team` in `_bmad/_memory/squid-master-sidecar/session-state.md`
2. Kill each pane directly: `tmux kill-pane -t {pane_id}` (DO NOT send `/exit`)
3. Clear `active_team` from session-state.md

## Best Used For

- Pre-release comprehensive quality audits where all three dimensions must pass
- Legacy codebase onboarding where security, architecture, and UX health are all unknown
- High-stakes subsystems (auth, payments, admin panels) requiring full multi-dimensional review
- Post-incident remediation where a broad audit scope is needed after a production issue
- Periodic scheduled health checks on critical application areas
