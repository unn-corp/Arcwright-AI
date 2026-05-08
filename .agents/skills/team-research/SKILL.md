---
name: "team-research"
description: "Recon Pod — Analyst researches, PM synthesizes into briefs, Tech Writer documents outputs"
---

# Agent Team: Research — Recon Pod

> **Default orchestration:** in-process via [`claude-subagent-protocol`](.agents/skills/claude-subagent-protocol/SKILL.md). tmux split-pane variant is opt-in (see step blocks).
>
> **Kiro CLI:** this team is not currently available as a Kiro `subagent` pipeline. Track-level workflows have Kiro pipelines; teams remain Claude Code / tmux for now.

## Best Used For

- Pre-sprint research phases where domain knowledge needs to be gathered and synthesized
- Competitive analysis before a major feature decision
- Market research to validate product direction before committing sprint capacity
- Technical feasibility studies that need to be documented as reference artifacts
- Any research task large enough to benefit from researcher + synthesizer + documenter separation of concerns

## Team Composition

| Role | Agent | Skills |
|------|-------|--------|
| Analyst | `arcwright-analyst` | Domain research, market research, competitive analysis, technical investigation |
| PM | `arcwright-pm` | Synthesis, strategic framing, brief writing |
| Tech Writer | `arcwright-tech-writer` | Documentation, structured output, clarity editing |

## Purpose

The Recon Pod assembles for deep research tasks before strategy or build decisions. The Analyst conducts the primary research — domain analysis, competitive landscape, technical feasibility, user patterns. The PM synthesizes raw findings into actionable product briefs. The Tech Writer then structures and documents the final output for consumption by other teams or stakeholders. Master can spawn a second Analyst in parallel if the research scope demands it. Sequential flow: research → synthesis → documentation.

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

*Optional: Master can issue a second parallel Analyst Agent call for parallel research tracks.*

## Spawn Sequence

Load `.agents/skills/tmux-protocol/SKILL.md` before running tmux commands. Default path is in-process — no pane operations needed.

#### tmux Variant (when $TMUX is set and user wants visibility)

Load `.agents/skills/tmux-protocol/SKILL.md` before running these commands.

```bash
# 1. Split Analyst pane (top-right)
tmux split-window -h -c "#{pane_current_path}" "~/.config/tmux/bin/agent_spawn.sh 'You are the Analyst agent in the Recon Pod team managed by Conductor (master-orchestrator). Read and activate: {project-root}/_arcwright/awm/agents/analyst.md. Your task queue comes from the master pane. Before stopping any task output: AGENT_SIGNAL::TASK_DONE::analyst::{task_id}::{status}::{summary}. On long tasks emit AGENT_SIGNAL::PROGRESS every 60s. Wait for your first task.'"
sleep 8

# 2. Split PM pane (mid-right)
tmux split-window -v -c "#{pane_current_path}" "~/.config/tmux/bin/agent_spawn.sh 'You are the PM agent in the Recon Pod team managed by Conductor (master-orchestrator). Read and activate: {project-root}/_arcwright/awm/agents/pm.md. Your task queue comes from the master pane. Before stopping any task output: AGENT_SIGNAL::TASK_DONE::pm::{task_id}::{status}::{summary}. On long tasks emit AGENT_SIGNAL::PROGRESS every 60s. Wait for your first task.'"
sleep 8

# 3. Split Tech Writer pane (bottom-right)
tmux split-window -v -c "#{pane_current_path}" "~/.config/tmux/bin/agent_spawn.sh 'You are the Tech Writer agent in the Recon Pod team managed by Conductor (master-orchestrator). Read and activate: {project-root}/_arcwright/awm/agents/tech-writer.md. Your task queue comes from the master pane. Before stopping any task output: AGENT_SIGNAL::TASK_DONE::tech-writer::{task_id}::{status}::{summary}. On long tasks emit AGENT_SIGNAL::PROGRESS every 60s. Wait for your first task.'"
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

> **Project context**: Master passes the `## Project Context` block (from its activation scan) to each agent in their first task message. Agents receive context from master — they do not re-scan independently.

- **Analyst**: activate `arcwright-analyst`
- **PM**: activate `arcwright-pm`
- **Tech Writer**: activate `arcwright-tech-writer`

## Steps

Sequential flow: research → synthesis → documentation.

### 1. Research

**What this step does:** Analyst conducts primary domain research. If two parallel research tracks are needed, issue two Analyst Agent calls simultaneously.
**Inputs:** Research brief from master
**Output:** `$STEP_1_OUTPUT` — structured research findings (or `$STEP_1_OUTPUT_A` + `$STEP_1_OUTPUT_B` if parallel)

---

#### Default: In-Process (Agent tool)

Single research track:

```json
{
  "name": "Agent",
  "input": {
    "subagent_type": "arcwright-analyst",
    "prompt": "Conduct domain research on the specified topic. Cover all focus areas thoroughly.\n\n## Inputs\nResearch brief: {research_brief}\nFocus areas: {focus_areas}\n\n## Output\nStructured research findings with key insights, patterns identified, and recommendations.",
    "model": "sonnet"
  }
}
```

For parallel research tracks, issue two Agent calls in a single message — assign separate research domains to avoid overlap. Capture results into `$STEP_1_OUTPUT_A` and `$STEP_1_OUTPUT_B`, then merge before passing to step 2.

Capture result into `$STEP_1_OUTPUT`. Pass to step 2.

---

#### tmux Variant (when $TMUX is set and user wants visibility)

Load `.agents/skills/tmux-protocol/SKILL.md` before spawning.

```bash
tmux send-keys -t {analyst_pane_id} "TASK-{id}-research: Research: {topic}. Focus areas: {areas}. Signal TASK_DONE with structured findings." Enter
```

Completion signal: `AGENT_SIGNAL::TASK_DONE::analyst::{task_id}::done::{findings_summary}`

---

### 2. Synthesis

**What this step does:** PM synthesizes raw research findings into an actionable product brief with insights and recommendations.
**Inputs:** `$STEP_1_OUTPUT` (research findings from step 1)
**Output:** `$STEP_2_OUTPUT` — product brief with strategic insights and recommendations

---

#### Default: In-Process (Agent tool)

```json
{
  "name": "Agent",
  "input": {
    "subagent_type": "arcwright-pm",
    "prompt": "Synthesize the research findings into an actionable product brief. Extract key insights, identify strategic implications, and provide clear recommendations.\n\n## Inputs\nResearch findings: {$STEP_1_OUTPUT}\n\n## Output\nProduct brief with: executive summary, key insights, strategic recommendations, and open questions.",
    "model": "sonnet"
  }
}
```

Capture result into `$STEP_2_OUTPUT`. Pass to step 3.

---

#### tmux Variant (when $TMUX is set and user wants visibility)

Load `.agents/skills/tmux-protocol/SKILL.md` before spawning.

```bash
tmux send-keys -t {pm_pane_id} "TASK-{id}-synthesis: Synthesize research findings into a product brief. Findings: {$STEP_1_OUTPUT}. Signal TASK_DONE with brief." Enter
```

Completion signal: `AGENT_SIGNAL::TASK_DONE::pm::{task_id}::done::{brief_summary}`

---

### 3. Documentation

**What this step does:** Tech Writer structures and documents the final research output as a reference artifact.
**Inputs:** `$STEP_2_OUTPUT` (PM brief) + `$STEP_1_OUTPUT` (raw research)
**Output:** `$STEP_3_OUTPUT` — structured reference document. Final output — no next step.

---

#### Default: In-Process (Agent tool)

```json
{
  "name": "Agent",
  "input": {
    "subagent_type": "arcwright-tech-writer",
    "prompt": "Structure and document the research output as a clear reference document for consumption by other teams or stakeholders.\n\n## Inputs\nProduct brief: {$STEP_2_OUTPUT}\nRaw research: {$STEP_1_OUTPUT}\n\n## Output\nStructured reference document with: overview, findings, analysis, recommendations, and artifact index.",
    "model": "sonnet"
  }
}
```

Capture result into `$STEP_3_OUTPUT`. Final output — no next step. Present research package to user.

---

#### tmux Variant (when $TMUX is set and user wants visibility)

Load `.agents/skills/tmux-protocol/SKILL.md` before spawning.

```bash
tmux send-keys -t {tech_writer_pane_id} "TASK-{id}-docs: Document research brief as a structured reference doc. Brief: {$STEP_2_OUTPUT}. Raw research: {$STEP_1_OUTPUT}. Signal TASK_DONE when documented." Enter
```

Completion signal: `AGENT_SIGNAL::TASK_DONE::tech-writer::{task_id}::done::{document_path}`

---

## Communication Protocol

See [`tmux-protocol`](.agents/skills/tmux-protocol/SKILL.md) for the tmux signal protocol; this skill's default is in-process — Agent tool return value is the sole completion signal.

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

## Team Close Protocol

When master needs to close this team:
1. Read pane IDs from `active_team` in `_arcwright/_memory/master-orchestrator-sidecar/session-state.md`
2. Kill each pane directly: `tmux kill-pane -t {pane_id}` (DO NOT send `/exit`)
3. Clear `active_team` from session-state.md

## Kiro CLI

This team is not currently available as a Kiro `subagent` pipeline. Track-level workflows have Kiro pipelines; team orchestration remains Claude Code / tmux for now. A team-level Kiro DAG is planned for a follow-up release.
