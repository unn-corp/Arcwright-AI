---
name: "team-solo-dev"
description: "Ghost — single quick-flow-solo-dev agent, master queues tasks, dev signals completion each time"
---

# Agent Team: Solo Dev — Ghost

## tmux Protocol

If `$TMUX` is set, load `.agents/skills/tmux-protocol/SKILL.md` before any pane operations.


## Team Composition

| Role | Agent | Skills |
|------|-------|--------|
| Solo Dev | `arcwright-agent-awm-quick-flow-solo-dev` | Full-stack implementation, spec writing, autonomous task execution |

## Purpose

Ghost is a single-agent team for autonomous task execution without review overhead. The quick-flow-solo-dev agent handles spec, implementation, and basic self-validation in one pass. Master queues tasks and Ghost works through them sequentially, signaling completion after each. Use Ghost when tasks are well-defined, scope is bounded, and you want maximum throughput without the coordination cost of a multi-agent team.

## Layout (tmux)

```
┌─────────┬───────────┐
│         │           │
│ Master  │ Solo Dev  │
│ (left)  │  (Ghost)  │
└─────────┴───────────┘
```

## Spawn Sequence

```bash
# 1. Split Solo Dev pane (right)
tmux split-window -h -c "#{pane_current_path}" "~/.config/tmux/bin/agent_spawn.sh 'You are the Solo Dev (Ghost) agent managed by Conductor (master-orchestrator). Read and activate: {project-root}/.claude/commands/arcwright-agent-awm-quick-flow-solo-dev.md. Your task queue comes from the master pane. Execute tasks autonomously and completely. Before stopping any task output: AGENT_SIGNAL::TASK_DONE::solo-dev::{task_id}::{status}::{summary}. On long tasks emit AGENT_SIGNAL::PROGRESS every 60s. Wait for your first task.'"
sleep 8

# 2. Equalize pane sizes
tmux select-layout tiled
sleep 6
```

## Agent Activation

> **Project context**: Master passes the `## Project Context` block (from its activation scan) to each agent in their first task message. Agents receive context from master — they do not re-scan independently.

- **Solo Dev**: `Read and activate: {project-root}/.claude/commands/arcwright-agent-awm-quick-flow-solo-dev.md`

## Task Routing Protocol

Master maintains a task queue. Tasks are dispatched one at a time:

1. Master dispatches first task to Solo Dev pane
2. Solo Dev executes autonomously (spec → implement → self-validate)
3. Solo Dev emits `TASK_DONE` signal
4. Master polls for signal, receives it, marks task complete
5. Master dispatches next queued task
6. Repeat until queue is empty

```bash
# Dispatch a task
tmux send-keys -t {solo_dev_pane_id} "TASK-{id}: {description}. Acceptance criteria: {criteria}. Signal TASK_DONE when complete." Enter
```

## Communication Protocol

### Signal Format
```
AGENT_SIGNAL::{TYPE}::{FROM_ROLE}::{TASK_ID}::{STATUS}::{DETAIL}
```
Types: `READY` | `TASK_START` | `PROGRESS` | `TASK_DONE` | `TASK_BLOCKED` | `FINDING` | `ERROR`

Examples:
- `AGENT_SIGNAL::TASK_DONE::solo-dev::task-001::done::Footer link updated, 1 file changed`
- `AGENT_SIGNAL::TASK_BLOCKED::solo-dev::task-002::blocked::Cannot resolve dependency version conflict, need guidance`

### Master Polling Protocol
After dispatching any task to a pane:
1. `sleep 8` then begin polling
2. Every 30s: `tmux capture-pane -t {pane_id} -p | tail -30 | grep "AGENT_SIGNAL"`
3. On `TASK_DONE`: dispatch next queued task
4. On `TASK_BLOCKED`: surface to user immediately
5. No signal after 2 min: send `tmux send-keys -t {pane_id} "STATUS_CHECK" Enter`, wait 15s, poll once more
6. Still no signal: mark pane as unresponsive in session file, present recovery options to user

### Heartbeat Rule
Agents on tasks expected to take >90s MUST emit `AGENT_SIGNAL::PROGRESS::solo-dev::{task_id}::running::{brief_status}` every 60s.

## Team Registration

When spawning this team, master writes to `_arcwright/_memory/master-orchestrator-sidecar/session-state.md` under `active_team`:
```yaml
active_team:
  code: solo-dev
  name: "Ghost"
  spawned_at: {ISO8601}
  panes:
    solo-dev: {pane_id}
```

## In-Process Fallback

When `$TMUX` is not set, run the agent using the Agent tool:

1. Spawn quick-flow-solo-dev agent (Agent tool) with first task → wait for completion
2. Capture output, mark task complete
3. Spawn again with next task → repeat until queue empty

## Team Close Protocol

When master needs to close this team:
1. Read pane ID from `active_team` in `_arcwright/_memory/master-orchestrator-sidecar/session-state.md`
2. Kill the pane directly: `tmux kill-pane -t {pane_id}` (DO NOT send `/exit`)
3. Clear `active_team` from session-state.md

## Best Used For

- Well-scoped tasks where spec is already clear and review overhead isn't needed
- Batch of small, independent tasks that can be queued and executed sequentially
- Nano/small track work where the quick-flow-solo-dev agent's combined spec+dev pass is sufficient
- Prototyping or exploration tasks where speed matters more than formal review
- Tasks too small to justify spinning up a multi-agent team
