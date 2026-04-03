---
name: "team-blueprint"
description: "War Room — strategic planning council with PM, Analyst, and Architect before any build"
---

# Agent Team: Blueprint — The War Room

## Team Composition

| Role | Agent | Skills |
|------|-------|--------|
| PM | `bmad-agent-bmm-pm` | PRD creation, backlog, sprint planning |
| Analyst | `bmad-agent-bmm-analyst` | Domain research, market research, competitive analysis |
| Architect | `bmad-agent-bmm-architect` | Architecture design, feasibility validation, prototype code |

## Purpose

The War Room assembles before any significant build begins. The PM drives the product specification and acceptance criteria, the Analyst researches domain constraints, user needs, and competitive landscape, and the Architect validates technical feasibility and can write prototype code to pressure-test assumptions. Output is planning artifacts only — no production code is produced by this team.

## Layout (tmux)

```
┌─────────┬───────────┐
│         │    PM     │
│ Master  ├───────────┤
│ (left)  │  Analyst  │
│         ├───────────┤
│         │ Architect │
└─────────┴───────────┘
```

## Spawn Sequence

```bash
# 1. Split PM pane (top-right)
tmux split-window -h -c "#{pane_current_path}" "claude --dangerously-skip-permissions 'You are the PM agent in the Blueprint (War Room) team managed by Krakken (squid-master). Read and activate: {project-root}/.claude/commands/bmad-agent-bmm-pm.md. Your task queue comes from the master pane. Before stopping any task output: AGENT_SIGNAL::TASK_DONE::pm::{task_id}::{status}::{summary}. On long tasks emit AGENT_SIGNAL::PROGRESS every 60s. Wait for your first task.'"
sleep 8

# 2. Split Analyst pane (mid-right, below PM)
tmux split-window -v -c "#{pane_current_path}" "claude --dangerously-skip-permissions 'You are the Analyst agent in the Blueprint (War Room) team managed by Krakken (squid-master). Read and activate: {project-root}/.claude/commands/bmad-agent-bmm-analyst.md. Your task queue comes from the master pane. Before stopping any task output: AGENT_SIGNAL::TASK_DONE::analyst::{task_id}::{status}::{summary}. On long tasks emit AGENT_SIGNAL::PROGRESS every 60s. Wait for your first task.'"
sleep 8

# 3. Split Architect pane (bottom-right, below Analyst)
tmux split-window -v -c "#{pane_current_path}" "claude --dangerously-skip-permissions 'You are the Architect agent in the Blueprint (War Room) team managed by Krakken (squid-master). Read and activate: {project-root}/.claude/commands/bmad-agent-bmm-architect.md. You have full dev skill access and can invoke any skill in .agents/skills/ directly. Your task queue comes from the master pane. Before stopping any task output: AGENT_SIGNAL::TASK_DONE::architect::{task_id}::{status}::{summary}. On long tasks emit AGENT_SIGNAL::PROGRESS every 60s. Wait for your first task.'"
sleep 8

# 4. Equalize pane sizes
tmux select-layout tiled
sleep 6
```

## Agent Activation

- **PM**: `Read and activate: {project-root}/.claude/commands/bmad-agent-bmm-pm.md`
- **Analyst**: `Read and activate: {project-root}/.claude/commands/bmad-agent-bmm-analyst.md`
- **Architect**: `Read and activate: {project-root}/.claude/commands/bmad-agent-bmm-architect.md`
  - Architect has **full dev skill access** and can invoke any skill in `.agents/skills/` directly, including prototype code to validate assumptions.

## Task Routing Protocol

This team has no iterative loop. Master routes tasks sequentially or in parallel depending on independence:

1. **Parallel start**: Master dispatches research brief to Analyst AND initial PRD stub to PM simultaneously.
2. **Analyst → PM handoff**: When Analyst emits `TASK_DONE`, master forwards research findings to PM to enrich the PRD.
3. **PM → Architect handoff**: When PM emits `TASK_DONE` with PRD draft, master forwards to Architect for feasibility review.
4. **Architect output**: Architect returns architecture notes, technical risks, and any prototype code to master.
5. **Final synthesis**: Master collates all artifacts (PRD, research report, architecture notes, sprint plan) and presents to user.

Master dispatches tasks by sending to the relevant pane:
```bash
tmux send-keys -t {pm_pane_id} "TASK-001: Draft initial PRD for feature X. Context: {brief}. Signal TASK_DONE when complete." Enter
```

## Communication Protocol

### Signal Format
```
AGENT_SIGNAL::{TYPE}::{FROM_ROLE}::{TASK_ID}::{STATUS}::{DETAIL}
```
Types: `READY` | `TASK_START` | `PROGRESS` | `TASK_DONE` | `TASK_BLOCKED` | `FINDING` | `ERROR`

Example: `AGENT_SIGNAL::TASK_DONE::pm::task-001::done::PRD v1 complete, 8 acceptance criteria defined`

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
  code: blueprint
  name: "The War Room"
  spawned_at: {ISO8601}
  panes:
    pm: {pane_id}
    analyst: {pane_id}
    architect: {pane_id}
```

## In-Process Fallback

When `$TMUX` is not set, run agents sequentially using the Agent tool:

1. Spawn Analyst agent (Agent tool) with research brief → wait for completion → capture research output
2. Spawn PM agent (Agent tool) with brief + research output → wait for completion → capture PRD draft
3. Spawn Architect agent (Agent tool) with PRD + brief → wait for completion → capture architecture notes
4. Collate all outputs and present final planning artifacts to user

## Team Close Protocol

When master needs to close this team:
1. Read pane IDs from `active_team` in `_bmad/_memory/squid-master-sidecar/session-state.md`
2. Kill each pane directly: `tmux kill-pane -t {pane_id}` (DO NOT send `/exit`)
3. Clear `active_team` from session-state.md

## Best Used For

- Kicking off a new feature or product area before any code is written
- Validating technical feasibility of a product idea before committing sprint capacity
- Creating a full planning package: PRD + research report + architecture notes + sprint plan
- Large initiatives where poor upfront planning would be costly to unwind
- Situations where PM, research, and architecture concerns need to be resolved together
