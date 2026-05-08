---
name: "team-solo-arch"
description: "The Oracle — single Architect with full dev skill access for architecture analysis, design proposals, and prototyping"
---

# Agent Team: Solo Architect — The Oracle

> **Default orchestration:** in-process via [`claude-subagent-protocol`](.agents/skills/claude-subagent-protocol/SKILL.md). tmux split-pane variant is opt-in (see step blocks).
>
> **Kiro CLI:** this team is available as a Kiro `subagent` pipeline. See `## Kiro Pipeline` at the end of this skill.

## Best Used For

- Getting a second opinion on a design decision before committing
- Feasibility assessments before a feature is added to the sprint plan
- Designing API contracts, data models, or system integrations without building them yet
- Prototyping to validate whether a design assumption holds under realistic constraints
- Technical debt analysis and migration strategy planning
- Any situation where architectural expertise is needed without requiring a full multi-agent team

## Team Composition

| Role | Agent | Skills |
|------|-------|--------|
| Architect | `arcwright-architect` | Architecture analysis, design proposals, prototype code, full dev skill access |

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

Load `.agents/skills/tmux-protocol/SKILL.md` before running tmux commands. Default path is in-process — no pane operations needed.

#### tmux Variant (when $TMUX is set and user wants visibility)

Load `.agents/skills/tmux-protocol/SKILL.md` before running these commands.

```bash
# 1. Split Architect pane (right)
tmux split-window -h -c "#{pane_current_path}" "~/.config/tmux/bin/agent_spawn.sh 'You are the Architect agent (The Oracle) managed by Conductor (master-orchestrator). Read and activate: {project-root}/_arcwright/awm/agents/architect.md. You have full dev skill access and can invoke any skill in .agents/skills/ directly, including writing prototype code to validate design assumptions. Your task queue comes from the master pane. Before stopping any task output: AGENT_SIGNAL::TASK_DONE::architect::{task_id}::{status}::{summary}. On long tasks emit AGENT_SIGNAL::PROGRESS every 60s. Wait for your first task.'"
sleep 8

# 2. Equalize pane sizes
tmux select-layout tiled
sleep 6
```

## Agent Activation

> **Project context**: Master passes the `## Project Context` block (from its activation scan) to each agent in their first task message. Agents receive context from master — they do not re-scan independently.

- **Architect**: activate `arcwright-architect`
  - Has **full dev skill access** — can invoke any skill in `.agents/skills/` directly.
  - Can write prototype code to validate design assumptions.
  - Output is architecture notes and recommendations, not production code.

## Steps

Single agent, no loop. Master queues tasks and dispatches one at a time.

### 1. Architecture Task

**What this step does:** Architect analyzes the question or scope and produces the requested architecture output type.
**Inputs:** Architecture question or scope from master
**Output:** `$STEP_1_OUTPUT` — architecture analysis, design proposal, or other output type. Final output — no next step.

---

#### Default: In-Process (Agent tool)

```json
{
  "name": "Agent",
  "input": {
    "subagent_type": "arcwright-architect",
    "prompt": "Analyze the following architecture question or scope and produce the requested output. Include trade-offs, risks, and recommendations. Write prototype code if needed to validate assumptions.\n\n## Inputs\nTask: {architecture_question_or_scope}\nRequested output type: {output_type}\n\n## Output\n{output_type} with: analysis, trade-offs, risks, and clear recommendations.",
    "model": "opus"
  }
}
```

Capture result into `$STEP_1_OUTPUT`. Final output — no next step. Present to user or route to another team.

Output types the Architect can produce:
- Architecture analysis report
- Design proposal with trade-offs
- API contract specification
- Data model recommendations
- Prototype code to validate a design assumption
- Feasibility assessment
- Migration strategy
- Technology selection rationale

---

#### tmux Variant (when $TMUX is set and user wants visibility)

Load `.agents/skills/tmux-protocol/SKILL.md` before spawning.

```bash
tmux send-keys -t {architect_pane_id} "TASK-{id}: {architecture_question_or_scope}. Produce: {desired_output_type}. Signal TASK_DONE when complete." Enter
```

Completion signal: `AGENT_SIGNAL::TASK_DONE::architect::{task_id}::done::{output_summary}`

---

## Communication Protocol

See [`tmux-protocol`](.agents/skills/tmux-protocol/SKILL.md) for the tmux signal protocol; this skill's default is in-process — Agent tool return value is the sole completion signal.

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

## Team Close Protocol

When master needs to close this team:
1. Read pane ID from `active_team` in `_arcwright/_memory/master-orchestrator-sidecar/session-state.md`
2. Kill the pane directly: `tmux kill-pane -t {pane_id}` (DO NOT send `/exit`)
3. Clear `active_team` from session-state.md

## Kiro Pipeline

Use the `subagent` tool to run this team as a Kiro pipeline.

```json
{
  "task": "Run an architecture analysis, design proposal, or feasibility assessment for the given scope.",
  "stages": [
    {
      "name": "architect-task",
      "role": "arcwright-architect",
      "prompt_template": "Analyze the architecture question or scope and produce the requested output. Include trade-offs, risks, and recommendations. Write prototype code if needed to validate assumptions: {task}",
      "depends_on": []
    }
  ]
}
```
