---
name: "team-review"
description: "Review + Fix Loop — Architect and UX Designer review concurrently, findings batch to Dev, loop until clean"
---

# Agent Team: Review + Fix Loop

## tmux Protocol

If `$TMUX` is set, load `.agents/skills/tmux-protocol/SKILL.md` before any pane operations.


## Team Composition

| Role | Agent | Skills |
|------|-------|--------|
| Architect | `bmad-agent-bmm-architect` | Architecture review, DRY/SOLID, full dev skill access |
| UX Designer | `bmad-agent-bmm-ux-designer` | UV review, accessibility, design token compliance, full dev skill access |
| Dev | `bmad-agent-bmm-dev` | Fix implementation, can invoke architect and QA skills inline |

## Purpose

The Review + Fix Loop runs concurrent architectural and UX reviews, aggregates all findings by severity, and dispatches a batched fix task to Dev. After Dev fixes, only the affected areas are re-reviewed by the relevant reviewer — not a full re-review of everything. The loop exits when both reviewers signal a clean pass. Use this team when existing code needs a structured quality pass before merge or release, or when a feature needs dual-lens validation.

## Layout (tmux)

```
┌─────────┬───────────┐
│         │ Architect │
│ Master  ├───────────┤
│ (left)  │    UX     │
│         ├───────────┤
│         │    Dev    │
└─────────┴───────────┘
```

## Spawn Sequence

```bash
# 1. Split Architect pane (top-right)
tmux split-window -h -c "#{pane_current_path}" "~/.config/tmux/bin/agent_spawn.sh 'You are the Architect agent in the Review+Fix Loop team managed by Conductor (master-orchestrator). Read and activate: {project-root}/.claude/commands/bmad-agent-bmm-architect.md. You have full dev skill access and can invoke any skill in .agents/skills/ directly. Emit AGENT_SIGNAL::FINDING signals as you discover issues. Your task queue comes from the master pane. Before stopping any task output: AGENT_SIGNAL::TASK_DONE::architect::{task_id}::{status}::{summary}. On long tasks emit AGENT_SIGNAL::PROGRESS every 60s. Wait for your first task.'"
sleep 8

# 2. Split UX Designer pane (mid-right, below Architect)
tmux split-window -v -c "#{pane_current_path}" "~/.config/tmux/bin/agent_spawn.sh 'You are the UX Designer agent in the Review+Fix Loop team managed by Conductor (master-orchestrator). Read and activate: {project-root}/.claude/commands/bmad-agent-bmm-ux-designer.md. You have full dev skill access and can invoke any skill in .agents/skills/ directly. Emit AGENT_SIGNAL::FINDING signals as you discover issues. Your task queue comes from the master pane. Before stopping any task output: AGENT_SIGNAL::TASK_DONE::ux::{task_id}::{status}::{summary}. On long tasks emit AGENT_SIGNAL::PROGRESS every 60s. Wait for your first task.'"
sleep 8

# 3. Split Dev pane (bottom-right, below UX)
tmux split-window -v -c "#{pane_current_path}" "~/.config/tmux/bin/agent_spawn.sh 'You are the Dev agent in the Review+Fix Loop team managed by Conductor (master-orchestrator). Read and activate: {project-root}/.claude/commands/bmad-agent-bmm-dev.md. You can invoke architect and QA skills from .agents/skills/ inline during fix phases. Your task queue comes from the master pane. Before stopping any task output: AGENT_SIGNAL::TASK_DONE::dev::{task_id}::{status}::{summary}. On long tasks emit AGENT_SIGNAL::PROGRESS every 60s. Wait for your first task.'"
sleep 8

# 4. Equalize pane sizes
tmux select-layout tiled
sleep 6
```

## Agent Activation

- **Architect**: `Read and activate: {project-root}/.claude/commands/bmad-agent-bmm-architect.md`
  - Has **full dev skill access** — can invoke any skill in `.agents/skills/` directly.
- **UX Designer**: `Read and activate: {project-root}/.claude/commands/bmad-agent-bmm-ux-designer.md`
  - Has **full dev skill access** — can invoke any skill in `.agents/skills/` directly.
- **Dev**: `Read and activate: {project-root}/.claude/commands/bmad-agent-bmm-dev.md`
  - Can invoke architect and QA skills from `.agents/skills/` inline during fix phases.

## Iterative Loop

```
1. Master dispatches review scope to Architect AND UX Designer simultaneously
   → tmux send-keys -t {architect_pane_id} "TASK-{id}-ar: Review scope: {files/areas}. Emit FINDING signals per issue. Signal TASK_DONE when review complete." Enter
   → tmux send-keys -t {ux_pane_id} "TASK-{id}-ux: Review scope: {files/areas}. Emit FINDING signals per issue. Signal TASK_DONE when review complete." Enter

2. Both run concurrent reviews
   → Each emits: AGENT_SIGNAL::FINDING::{role}::{task_id}::finding::{severity}::{description}
     where severity is: critical | major | minor
   → Each emits TASK_DONE when their review is complete

3. Master waits for BOTH TASK_DONE signals, then:
   → Captures all FINDING signals from both reviewers
   → Sorts by severity (critical first, then major, then minor)
   → Batches into a single fix task for Dev

4. Master dispatches fix batch to Dev with full findings context
   → tmux send-keys -t {dev_pane_id} "TASK-{id}-fix: Fix these findings in priority order. Findings: {sorted_findings}. Signal TASK_DONE with files changed." Enter

5. Dev fixes all findings
   → AGENT_SIGNAL::TASK_DONE::dev::{task_id}::fixed::{files_changed}

6. Master re-dispatches ONLY affected areas to the relevant reviewer(s)
   → If only UX findings were fixed: dispatch to UX only
   → If only Architect findings were fixed: dispatch to Architect only
   → If both: dispatch to both
   → "TASK-{id}-reverify: Re-review ONLY these areas that were just fixed: {affected_areas}. Signal TASK_DONE with clean or new findings."

7. Loop continues until:
   → Both reviewers emit TASK_DONE with no new findings: loop exits, master marks complete
   → OR user confirms acceptance of remaining findings (escalation path)
```

## Communication Protocol

### Signal Format
```
AGENT_SIGNAL::{TYPE}::{FROM_ROLE}::{TASK_ID}::{STATUS}::{DETAIL}
```
Types: `READY` | `TASK_START` | `PROGRESS` | `TASK_DONE` | `TASK_BLOCKED` | `FINDING` | `ERROR`

Examples:
- `AGENT_SIGNAL::FINDING::architect::task-010::finding::major::AuthMiddleware bypasses rate limiting on /api/internal`
- `AGENT_SIGNAL::FINDING::ux::task-010::finding::minor::Button uses hardcoded color orange-500, should use design token`
- `AGENT_SIGNAL::TASK_DONE::architect::task-010::complete::4 findings emitted`
- `AGENT_SIGNAL::TASK_DONE::dev::task-010::fixed::3 files changed — auth.py, button.tsx, middleware.py`

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

When spawning this team, master writes to `_bmad/_memory/master-orchestrator-sidecar/session-state.md` under `active_team`:
```yaml
active_team:
  code: review
  name: "Review + Fix Loop"
  spawned_at: {ISO8601}
  panes:
    architect: {pane_id}
    ux: {pane_id}
    dev: {pane_id}
```

## In-Process Fallback

When `$TMUX` is not set, run agents sequentially using the Agent tool:

1. Spawn Architect agent (Agent tool) with review scope → capture all findings
2. Spawn UX Designer agent (Agent tool) with review scope → capture all findings
3. Merge and sort all findings by severity
4. Spawn Dev agent (Agent tool) with sorted findings → wait for fix completion
5. Spawn Architect agent again with only affected areas → check for new findings
6. Spawn UX Designer again with only affected areas → check for new findings
7. If new findings from either: repeat from step 3. If clean: mark complete

## Team Close Protocol

When master needs to close this team:
1. Read pane IDs from `active_team` in `_bmad/_memory/master-orchestrator-sidecar/session-state.md`
2. Kill each pane directly: `tmux kill-pane -t {pane_id}` (DO NOT send `/exit`)
3. Clear `active_team` from session-state.md

## Best Used For

- Pre-merge quality gates on feature branches
- Periodic code health reviews of a subsystem or component set
- Before a release when both architectural soundness and UX compliance need confirmation
- After a large refactor where design token usage or structural patterns may have drifted
- Any situation where DRY/SOLID + UV both need to pass before proceeding to merge
