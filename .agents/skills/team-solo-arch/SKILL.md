---
name: "team-solo-arch"
description: "The Oracle — single Architect with full dev skill access for architecture analysis, design proposals, and prototyping"
---

# Agent Team: Solo Architect — The Oracle

## tmux Protocol

If `$TMUX` is set, load `.agents/skills/tmux-protocol/SKILL.md` before any pane operations.


## Team Composition

| Role | Agent | Skills |
|------|-------|--------|
| Architect | `arcwright-agent-awm-architect` | Architecture analysis, design proposals, prototype code, full dev skill access |

## Purpose

The Oracle is a single-agent architecture team. The Architect receives a question, scope, or design problem and produces architecture analysis, design proposals, and recommendations. The Architect has full dev skill access and can write prototype code to validate assumptions. Output is recommendations and architecture notes — not production-ready implementation. Use The Oracle when you need architectural guidance, a second opinion on a design decision, or a feasibility assessment before committing to a direction.

## Layout (tmux)

```
┌─────────┬───────────┐
│         │           │
│ Master  │ Architect │
│ (left)  │ (Oracle)  │
└─────────┴───────────┘
```

## Spawn Sequence

```bash
# 1. Split Architect pane (right)
tmux split-window -h -c "#{pane_current_path}" "~/.config/tmux/bin/agent_spawn.sh 'You are the Architect agent (The Oracle) managed by Conductor (master-orchestrator). Read and activate: {project-root}/.claude/commands/arcwright-agent-awm-architect.md. You have full dev skill access and can invoke any skill in .agents/skills/ directly, including writing prototype code to validate design assumptions. Your task queue comes from the master pane. Before stopping any task output: AGENT_SIGNAL::TASK_DONE::architect::{task_id}::{status}::{summary}. On long tasks emit AGENT_SIGNAL::PROGRESS every 60s. Wait for your first task.'"
sleep 8

# 2. Equalize pane sizes
tmux select-layout tiled
sleep 6
```

## Agent Activation

> **Project context**: Master passes the `## Project Context` block (from its activation scan) to each agent in their first task message. Agents receive context from master — they do not re-scan independently.

- **Architect**: `Read and activate: {project-root}/.claude/commands/arcwright-agent-awm-architect.md`
  - Has **full dev skill access** — can invoke any skill in `.agents/skills/` directly.
  - Can write prototype code to validate design assumptions.
  - Output is architecture notes and recommendations, not production code.

## Task Routing Protocol

Single agent, no loop. Master queues tasks and dispatches one at a time:

1. Master dispatches architecture task to Architect
2. Architect analyzes and produces output → `TASK_DONE`
3. Master receives output, presents to user or routes to another team
4. Master dispatches next queued task

```bash
# Dispatch a task
tmux send-keys -t {architect_pane_id} "TASK-{id}: {architecture_question_or_scope}. Produce: {desired_output_type}. Signal TASK_DONE when complete." Enter
```

Output types the Architect can produce:
- Architecture analysis report
- Design proposal with trade-offs
- API contract specification
- Data model recommendations
- Prototype code to validate a design assumption
- Feasibility assessment
- Migration strategy
- Technology selection rationale

## Communication Protocol

### Signal Format
```
AGENT_SIGNAL::{TYPE}::{FROM_ROLE}::{TASK_ID}::{STATUS}::{DETAIL}
```
Types: `READY` | `TASK_START` | `PROGRESS` | `TASK_DONE` | `TASK_BLOCKED` | `FINDING` | `ERROR`

Examples:
- `AGENT_SIGNAL::TASK_DONE::architect::task-080::done::Architecture analysis complete — recommend event-driven approach, 3 trade-offs documented`
- `AGENT_SIGNAL::TASK_DONE::architect::task-081::done::Prototype written to validate DB schema — see /tmp/schema-prototype.sql`

### Master Polling Protocol
After dispatching any task to a pane:
1. `sleep 8` then begin polling
2. Every 30s: `tmux capture-pane -t {pane_id} -p | tail -30 | grep "AGENT_SIGNAL"`
3. On `TASK_DONE`: capture output, dispatch next queued task or present to user
4. On `TASK_BLOCKED`: surface to user immediately
5. No signal after 2 min: send `tmux send-keys -t {pane_id} "STATUS_CHECK" Enter`, wait 15s, poll once more
6. Still no signal: mark pane as unresponsive in session file, present recovery options to user

### Heartbeat Rule
Agents on tasks expected to take >90s MUST emit `AGENT_SIGNAL::PROGRESS::architect::{task_id}::running::{brief_status}` every 60s.

## Team Registration

When spawning this team, master writes to `_arcwright/_memory/master-orchestrator-sidecar/session-state.md` under `active_team`:
```yaml
active_team:
  code: solo-arch
  name: "The Oracle"
  spawned_at: {ISO8601}
  panes:
    architect: {pane_id}
```

## In-Process Fallback

When `$TMUX` is not set, run the agent using the Agent tool:

1. Spawn Architect agent (Agent tool) with architecture task → wait for output
2. Capture recommendations, present to user or route to next team
3. Spawn again for next queued task if needed

## Team Close Protocol

When master needs to close this team:
1. Read pane ID from `active_team` in `_arcwright/_memory/master-orchestrator-sidecar/session-state.md`
2. Kill the pane directly: `tmux kill-pane -t {pane_id}` (DO NOT send `/exit`)
3. Clear `active_team` from session-state.md

## Best Used For

- Getting a second opinion on a design decision before committing
- Feasibility assessments before a feature is added to the sprint plan
- Designing API contracts, data models, or system integrations without building them yet
- Prototyping to validate whether a design assumption holds under realistic constraints
- Technical debt analysis and migration strategy planning
- Any situation where architectural expertise is needed without requiring a full multi-agent team
