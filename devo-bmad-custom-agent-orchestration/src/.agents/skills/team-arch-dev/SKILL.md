---
name: "team-arch-dev"
description: "The Foundry — Architect designs approach, Dev implements, Architect spot-checks completed work"
---

# Agent Team: Arch + Dev — The Foundry

## Team Composition

| Role | Agent | Skills |
|------|-------|--------|
| Architect | `bmad-agent-bmm-architect` | Architecture design, full dev skill access, spot-checks |
| Dev | `bmad-agent-bmm-dev` | Full implementation per architect's design |

## Purpose

The Foundry pairs an Architect with a Dev to ensure implementation is grounded in sound design. The Architect reviews scope, proposes a design approach, and spot-checks completed work for architectural compliance. The Dev owns the actual implementation. Findings from Architect spot-checks route through master back to Dev. Use this team when the task has non-trivial architectural implications — new subsystems, cross-cutting concerns, data model changes, or integration patterns that need design validation before and after implementation.

## Layout (tmux)

```
┌─────────┬───────────┐
│         │ Architect │
│ Master  ├───────────┤
│ (left)  │    Dev    │
└─────────┴───────────┘
```

## Spawn Sequence

```bash
# 1. Split Architect pane (top-right)
tmux split-window -h -c "#{pane_current_path}" "claude --dangerously-skip-permissions 'You are the Architect agent in the Arch+Dev (Foundry) team managed by Krakken (squid-master). Read and activate: {project-root}/.claude/commands/bmad-agent-bmm-architect.md. You have full dev skill access and can invoke any skill in .agents/skills/ directly. Your task queue comes from the master pane. Before stopping any task output: AGENT_SIGNAL::TASK_DONE::architect::{task_id}::{status}::{summary}. On long tasks emit AGENT_SIGNAL::PROGRESS every 60s. Wait for your first task.'"
sleep 8

# 2. Split Dev pane (bottom-right, below Architect)
tmux split-window -v -c "#{pane_current_path}" "claude --dangerously-skip-permissions 'You are the Dev agent in the Arch+Dev (Foundry) team managed by Krakken (squid-master). Read and activate: {project-root}/.claude/commands/bmad-agent-bmm-dev.md. Your task queue comes from the master pane. Before stopping any task output: AGENT_SIGNAL::TASK_DONE::dev::{task_id}::{status}::{summary}. On long tasks emit AGENT_SIGNAL::PROGRESS every 60s. Wait for your first task.'"
sleep 8

# 3. Equalize pane sizes
tmux select-layout tiled
sleep 6
```

## Agent Activation

- **Architect**: `Read and activate: {project-root}/.claude/commands/bmad-agent-bmm-architect.md`
  - Architect has **full dev skill access** and can invoke any skill in `.agents/skills/` directly, including writing prototype code to validate design assumptions.
- **Dev**: `Read and activate: {project-root}/.claude/commands/bmad-agent-bmm-dev.md`

## Task Routing Protocol

1. Master dispatches scope and requirements to Architect for design review
2. Architect proposes design approach (can include prototype code) → `TASK_DONE`
3. Master forwards design + original requirements to Dev for implementation
4. Dev implements → `TASK_DONE`
5. Master dispatches completed implementation back to Architect for spot-check
6. Architect reviews for compliance → emits `FINDING` signals for any issues, then `TASK_DONE`
7. If findings exist: master routes findings back to Dev for remediation, repeat from step 4
8. If clean: master marks task complete

Findings during spot-check use:
```
AGENT_SIGNAL::FINDING::architect::{task_id}::finding::{severity}::{description}
```
where severity is `critical` | `major` | `minor`.

## Communication Protocol

### Signal Format
```
AGENT_SIGNAL::{TYPE}::{FROM_ROLE}::{TASK_ID}::{STATUS}::{DETAIL}
```
Types: `READY` | `TASK_START` | `PROGRESS` | `TASK_DONE` | `TASK_BLOCKED` | `FINDING` | `ERROR`

### Master Polling Protocol
After dispatching any task to a pane:
1. `sleep 8` then begin polling
2. Every 30s: `tmux capture-pane -t {pane_id} -p | tail -30 | grep "AGENT_SIGNAL"`
3. On `TASK_DONE`: route next action per Task Routing Protocol above
4. On `TASK_BLOCKED`: surface to user immediately
5. No signal after 2 min: send `tmux send-keys -t {pane_id} "STATUS_CHECK" Enter`, wait 15s, poll once more
6. Still no signal: mark pane as unresponsive in session file, present recovery options to user

### Heartbeat Rule
Agents on tasks expected to take >90s MUST emit `AGENT_SIGNAL::PROGRESS::{role}::{task_id}::running::{brief_status}` every 60s.

## Team Registration

When spawning this team, master writes to `_bmad/_memory/squid-master-sidecar/session-state.md` under `active_team`:
```yaml
active_team:
  code: arch-dev
  name: "The Foundry"
  spawned_at: {ISO8601}
  panes:
    architect: {pane_id}
    dev: {pane_id}
```

## In-Process Fallback

When `$TMUX` is not set, run agents sequentially using the Agent tool:

1. Spawn Architect agent (Agent tool) with scope → wait for design output
2. Spawn Dev agent (Agent tool) with design + requirements → wait for implementation output
3. Spawn Architect agent again (Agent tool) with implementation output for spot-check → wait for findings
4. If findings: spawn Dev again with findings → repeat from step 3
5. When Architect confirms clean: mark task complete

## Team Close Protocol

When master needs to close this team:
1. Read pane IDs from `active_team` in `_bmad/_memory/squid-master-sidecar/session-state.md`
2. Kill each pane directly: `tmux kill-pane -t {pane_id}` (DO NOT send `/exit`)
3. Clear `active_team` from session-state.md

## Best Used For

- New subsystems or modules where design decisions will have long-term impact
- Cross-cutting changes (auth, caching, data model, API contracts)
- Refactors where architectural guidance prevents regression into bad patterns
- Integration work where API contracts and data flow need design sign-off
- Tasks where a developer could implement correctly but benefit from architectural guardrails
