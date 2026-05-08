---
name: "team-solo-dev"
description: "Ghost — single quick-flow-solo-dev agent, master queues tasks, dev signals completion each time"
---

# Agent Team: Solo Dev — Ghost

> **Default orchestration:** in-process via [`claude-subagent-protocol`](.agents/skills/claude-subagent-protocol/SKILL.md). tmux split-pane variant is opt-in (see step blocks).
>
> **Kiro CLI:** this team is available as a Kiro `subagent` pipeline. See `## Kiro Pipeline` at the end of this skill.

## Best Used For

- Well-scoped tasks where spec is already clear and review overhead isn't needed
- Batch of small, independent tasks that can be queued and executed sequentially
- Nano/small track work where the quick-flow-solo-dev agent's combined spec+dev pass is sufficient
- Prototyping or exploration tasks where speed matters more than formal review
- Tasks too small to justify spinning up a multi-agent team

## Team Composition

| Role | Agent | Skills |
|------|-------|--------|
| Solo Dev | `arcwright-quick-flow-solo-dev` | Full-stack implementation, spec writing, autonomous task execution |

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

Load `.agents/skills/tmux-protocol/SKILL.md` before running tmux commands. Default path is in-process — no pane operations needed.

#### tmux Variant (when $TMUX is set and user wants visibility)

Load `.agents/skills/tmux-protocol/SKILL.md` before running these commands.

```bash
# 1. Split Solo Dev pane (right)
tmux split-window -h -c "#{pane_current_path}" "~/.config/tmux/bin/agent_spawn.sh 'You are the Solo Dev (Ghost) agent managed by Conductor (master-orchestrator). Read and activate: {project-root}/_arcwright/awm/agents/quick-flow-solo-dev.md. Your task queue comes from the master pane. Execute tasks autonomously and completely. Before stopping any task output: AGENT_SIGNAL::TASK_DONE::solo-dev::{task_id}::{status}::{summary}. On long tasks emit AGENT_SIGNAL::PROGRESS every 60s. Wait for your first task.'"
sleep 8

# 2. Equalize pane sizes
tmux select-layout tiled
sleep 6
```

## Agent Activation

> **Project context**: Master passes the `## Project Context` block (from its activation scan) to each agent in their first task message. Agents receive context from master — they do not re-scan independently.

- **Solo Dev**: activate `arcwright-quick-flow-solo-dev`

## Steps

Master maintains a task queue. Tasks are dispatched one at a time. Repeat step 1 for each queued task.

### 1. Task Execution

**What this step does:** Solo Dev executes the task autonomously — spec, implement, and self-validate in one pass.
**Inputs:** Task description and acceptance criteria from master
**Output:** `$STEP_1_OUTPUT` — task complete with summary. Final output — no next step (repeat for next queued task).

---

#### Default: In-Process (Agent tool)

```json
{
  "name": "Agent",
  "input": {
    "subagent_type": "arcwright-quick-flow-solo-dev",
    "prompt": "Execute this task autonomously and completely. Write a quick spec, implement, and self-validate before finishing.\n\n## Inputs\nTask: {task_description}\nAcceptance criteria: {criteria}\n\n## Output\nTask complete. List all files changed and summarize what was done.",
    "model": "sonnet"
  }
}
```

Capture result into `$STEP_1_OUTPUT`. Mark task complete. Dispatch next queued task if any. Final output — no next step.

---

#### tmux Variant (when $TMUX is set and user wants visibility)

Load `.agents/skills/tmux-protocol/SKILL.md` before spawning.

```bash
tmux send-keys -t {solo_dev_pane_id} "TASK-{id}: {task_description}. Acceptance criteria: {criteria}. Signal TASK_DONE when complete." Enter
```

Completion signal: `AGENT_SIGNAL::TASK_DONE::solo-dev::{task_id}::{status}::{summary}`

---

## Communication Protocol

See [`tmux-protocol`](.agents/skills/tmux-protocol/SKILL.md) for the tmux signal protocol; this skill's default is in-process — Agent tool return value is the sole completion signal.

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

## Team Close Protocol

When master needs to close this team:
1. Read pane ID from `active_team` in `_arcwright/_memory/master-orchestrator-sidecar/session-state.md`
2. Kill the pane directly: `tmux kill-pane -t {pane_id}` (DO NOT send `/exit`)
3. Clear `active_team` from session-state.md

## Kiro Pipeline

Use the `subagent` tool to run this team as a Kiro pipeline.

```json
{
  "task": "Execute a well-scoped task autonomously: spec, implement, and self-validate in one pass.",
  "stages": [
    {
      "name": "solo-dev-execute",
      "role": "arcwright-quick-flow-solo-dev",
      "prompt_template": "Execute this task autonomously and completely. Write a quick spec, implement, and self-validate before finishing: {task}",
      "depends_on": []
    }
  ]
}
```
