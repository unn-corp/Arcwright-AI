---
name: "team-research"
description: "Recon Pod — Analyst researches, PM synthesizes into briefs, Tech Writer documents outputs"
---

# Agent Team: Research — Recon Pod

## tmux Protocol

If `$TMUX` is set, load `.agents/skills/tmux-protocol/SKILL.md` before any pane operations.


## Team Composition

| Role | Agent | Skills |
|------|-------|--------|
| Analyst | `arcwright-agent-awm-analyst` | Domain research, market research, competitive analysis, technical investigation |
| PM | `arcwright-agent-awm-pm` | Synthesis, strategic framing, brief writing |
| Tech Writer | `arcwright-agent-awm-tech-writer` | Documentation, structured output, clarity editing |

## Purpose

The Recon Pod assembles for deep research tasks before strategy or build decisions. The Analyst conducts the primary research — domain analysis, competitive landscape, technical feasibility, user patterns. The PM synthesizes raw findings into actionable product briefs. The Tech Writer then structures and documents the final output for consumption by other teams or stakeholders. Master can spawn a second Analyst pane in parallel if the research scope demands it. Sequential flow: research → synthesis → documentation.

## Layout (tmux)

```
┌─────────┬───────────┐
│         │  Analyst  │
│ Master  ├───────────┤
│ (left)  │    PM     │
│         ├───────────┤
│         │  Writer   │
└─────────┴───────────┘
```

*Optional: Master can spawn a second Analyst pane (4th pane) for parallel research tracks.*

## Spawn Sequence

```bash
# 1. Split Analyst pane (top-right)
tmux split-window -h -c "#{pane_current_path}" "~/.config/tmux/bin/agent_spawn.sh 'You are the Analyst agent in the Recon Pod team managed by Conductor (master-orchestrator). Read and activate: {project-root}/.claude/commands/arcwright-agent-awm-analyst.md. Your task queue comes from the master pane. Before stopping any task output: AGENT_SIGNAL::TASK_DONE::analyst::{task_id}::{status}::{summary}. On long tasks emit AGENT_SIGNAL::PROGRESS every 60s. Wait for your first task.'"
sleep 8

# 2. Split PM pane (mid-right)
tmux split-window -v -c "#{pane_current_path}" "~/.config/tmux/bin/agent_spawn.sh 'You are the PM agent in the Recon Pod team managed by Conductor (master-orchestrator). Read and activate: {project-root}/.claude/commands/arcwright-agent-awm-pm.md. Your task queue comes from the master pane. Before stopping any task output: AGENT_SIGNAL::TASK_DONE::pm::{task_id}::{status}::{summary}. On long tasks emit AGENT_SIGNAL::PROGRESS every 60s. Wait for your first task.'"
sleep 8

# 3. Split Tech Writer pane (bottom-right)
tmux split-window -v -c "#{pane_current_path}" "~/.config/tmux/bin/agent_spawn.sh 'You are the Tech Writer agent in the Recon Pod team managed by Conductor (master-orchestrator). Read and activate: {project-root}/.claude/commands/arcwright-agent-awm-tech-writer.md. Your task queue comes from the master pane. Before stopping any task output: AGENT_SIGNAL::TASK_DONE::tech-writer::{task_id}::{status}::{summary}. On long tasks emit AGENT_SIGNAL::PROGRESS every 60s. Wait for your first task.'"
sleep 8

# 4. Equalize pane sizes
tmux select-layout tiled
sleep 6

# Optional: Spawn second Analyst pane for parallel research tracks
# tmux split-window -h -c "#{pane_current_path}" "~/.config/tmux/bin/agent_spawn.sh 'You are Analyst-2 in the Recon Pod team...'"
# sleep 8
# tmux select-layout tiled
# sleep 6
```

## Agent Activation

- **Analyst**: `Read and activate: {project-root}/.claude/commands/arcwright-agent-awm-analyst.md`
- **PM**: `Read and activate: {project-root}/.claude/commands/arcwright-agent-awm-pm.md`
- **Tech Writer**: `Read and activate: {project-root}/.claude/commands/arcwright-agent-awm-tech-writer.md`

## Task Routing Protocol

Sequential flow: research → synthesis → documentation.

1. **Research phase**: Master dispatches research brief to Analyst (and optionally Analyst-2 for parallel tracks)
   - If two analysts: assign separate research domains to avoid overlap
   - Wait for TASK_DONE from all active analysts

2. **Synthesis phase**: Master forwards all research findings to PM
   - PM synthesizes into a structured product brief with insights and recommendations
   - Wait for TASK_DONE from PM

3. **Documentation phase**: Master forwards PM brief + raw research to Tech Writer
   - Tech Writer structures and documents the final output
   - Wait for TASK_DONE from Tech Writer

4. **Output**: Master collates and presents final documented research package to user

```bash
# Phase 1: Dispatch to Analyst
tmux send-keys -t {analyst_pane_id} "TASK-{id}-research: Research: {topic}. Focus areas: {areas}. Signal TASK_DONE with structured findings." Enter

# Phase 2: Dispatch to PM (after analyst TASK_DONE)
tmux send-keys -t {pm_pane_id} "TASK-{id}-synthesis: Synthesize these research findings into a product brief. Findings: {analyst_output}. Signal TASK_DONE with brief." Enter

# Phase 3: Dispatch to Tech Writer (after PM TASK_DONE)
tmux send-keys -t {tech_writer_pane_id} "TASK-{id}-docs: Document this research brief as a structured reference doc. Brief: {pm_output}. Raw research: {analyst_output}. Signal TASK_DONE when documented." Enter
```

## Communication Protocol

### Signal Format
```
AGENT_SIGNAL::{TYPE}::{FROM_ROLE}::{TASK_ID}::{STATUS}::{DETAIL}
```
Types: `READY` | `TASK_START` | `PROGRESS` | `TASK_DONE` | `TASK_BLOCKED` | `FINDING` | `ERROR`

Examples:
- `AGENT_SIGNAL::TASK_DONE::analyst::task-050::done::12 competitors analyzed, 3 key patterns identified`
- `AGENT_SIGNAL::TASK_DONE::pm::task-050::done::Product brief written, 5 strategic recommendations`
- `AGENT_SIGNAL::TASK_DONE::tech-writer::task-050::done::Research report documented at docs/research/feature-x.md`

### Master Polling Protocol
After dispatching any task to a pane:
1. `sleep 8` then begin polling
2. Every 30s: `tmux capture-pane -t {pane_id} -p | tail -30 | grep "AGENT_SIGNAL"`
3. On `TASK_DONE`: advance to next phase per Task Routing Protocol
4. On `TASK_BLOCKED`: surface to user immediately
5. No signal after 2 min: send `tmux send-keys -t {pane_id} "STATUS_CHECK" Enter`, wait 15s, poll once more
6. Still no signal: mark pane as unresponsive in session file, present recovery options to user

### Heartbeat Rule
Agents on tasks expected to take >90s MUST emit `AGENT_SIGNAL::PROGRESS::{role}::{task_id}::running::{brief_status}` every 60s.

## Team Registration

When spawning this team, master writes to `_arcwright/_memory/master-orchestrator-sidecar/session-state.md` under `active_team`:
```yaml
active_team:
  code: research
  name: "Recon Pod"
  spawned_at: {ISO8601}
  panes:
    analyst: {pane_id}
    pm: {pane_id}
    tech-writer: {pane_id}
    # analyst-2: {pane_id}  # if spawned
```

## In-Process Fallback

When `$TMUX` is not set, run agents sequentially using the Agent tool:

1. Spawn Analyst agent (Agent tool) with research brief → wait for findings
2. (Optional) Spawn second Analyst agent (Agent tool) for parallel domain → wait for findings
3. Merge all findings
4. Spawn PM agent (Agent tool) with merged findings → wait for product brief
5. Spawn Tech Writer agent (Agent tool) with brief + raw findings → wait for documented output
6. Present final research package to user

## Team Close Protocol

When master needs to close this team:
1. Read pane IDs from `active_team` in `_arcwright/_memory/master-orchestrator-sidecar/session-state.md`
2. Kill each pane directly: `tmux kill-pane -t {pane_id}` (DO NOT send `/exit`)
3. Clear `active_team` from session-state.md

## Best Used For

- Pre-sprint research phases where domain knowledge needs to be gathered and synthesized
- Competitive analysis before a major feature decision
- Market research to validate product direction before committing sprint capacity
- Technical feasibility studies that need to be documented as reference artifacts
- Any research task large enough to benefit from researcher + synthesizer + documenter separation of concerns
