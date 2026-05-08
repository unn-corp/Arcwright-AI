---
name: "team-blueprint"
description: "War Room — strategic planning council with PM, Analyst, and Architect before any build"
---

# Agent Team: Blueprint — The War Room

> **Default orchestration:** in-process via [`claude-subagent-protocol`](.agents/skills/claude-subagent-protocol/SKILL.md). tmux split-pane variant is opt-in (see step blocks).
>
> **Kiro CLI:** this team is available as a Kiro `subagent` pipeline. See `## Kiro Pipeline` at the end of this skill.

## Best Used For

- Kicking off a new feature or product area before any code is written
- Validating technical feasibility of a product idea before committing sprint capacity
- Creating a full planning package: PRD + research report + architecture notes + sprint plan
- Large initiatives where poor upfront planning would be costly to unwind
- Situations where PM, research, and architecture concerns need to be resolved together

## Team Composition

| Role | Agent | Skills |
|------|-------|--------|
| PM | `arcwright-pm` | PRD creation, backlog, sprint planning |
| Analyst | `arcwright-analyst` | Domain research, market research, competitive analysis |
| Architect | `arcwright-architect` | Architecture design, feasibility validation, prototype code |

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

Load `.agents/skills/tmux-protocol/SKILL.md` before running tmux commands. Default path is in-process — no pane operations needed.

#### tmux Variant (when $TMUX is set and user wants visibility)

Load `.agents/skills/tmux-protocol/SKILL.md` before running these commands.

```bash
# 1. Split PM pane (top-right)
tmux split-window -h -c "#{pane_current_path}" "~/.config/tmux/bin/agent_spawn.sh 'You are the PM agent in the Blueprint (War Room) team managed by Conductor (master-orchestrator). Read and activate: {project-root}/_arcwright/awm/agents/pm.md. Your task queue comes from the master pane. Before stopping any task output: AGENT_SIGNAL::TASK_DONE::pm::{task_id}::{status}::{summary}. On long tasks emit AGENT_SIGNAL::PROGRESS every 60s. Wait for your first task.'"
sleep 8

# 2. Split Analyst pane (mid-right, below PM)
tmux split-window -v -c "#{pane_current_path}" "~/.config/tmux/bin/agent_spawn.sh 'You are the Analyst agent in the Blueprint (War Room) team managed by Conductor (master-orchestrator). Read and activate: {project-root}/_arcwright/awm/agents/analyst.md. Your task queue comes from the master pane. Before stopping any task output: AGENT_SIGNAL::TASK_DONE::analyst::{task_id}::{status}::{summary}. On long tasks emit AGENT_SIGNAL::PROGRESS every 60s. Wait for your first task.'"
sleep 8

# 3. Split Architect pane (bottom-right, below Analyst)
tmux split-window -v -c "#{pane_current_path}" "~/.config/tmux/bin/agent_spawn.sh 'You are the Architect agent in the Blueprint (War Room) team managed by Conductor (master-orchestrator). Read and activate: {project-root}/_arcwright/awm/agents/architect.md. You have full dev skill access and can invoke any skill in .agents/skills/ directly. Your task queue comes from the master pane. Before stopping any task output: AGENT_SIGNAL::TASK_DONE::architect::{task_id}::{status}::{summary}. On long tasks emit AGENT_SIGNAL::PROGRESS every 60s. Wait for your first task.'"
sleep 8

# 4. Equalize pane sizes
tmux select-layout tiled
sleep 6
```

## Agent Activation

> **Project context**: Master passes the `## Project Context` block (from its activation scan) to each agent in their first task message. Agents receive context from master — they do not re-scan independently.

- **PM**: activate `arcwright-pm`
- **Analyst**: activate `arcwright-analyst`
- **Architect**: activate `arcwright-architect`
  - Architect has **full dev skill access** and can invoke any skill in `.agents/skills/` directly, including prototype code to validate assumptions.

## Steps

### 1. Research + Initial PRD (parallel start)

**What this step does:** Analyst conducts domain research while PM drafts the initial PRD stub — both run in parallel since they start from the same brief.
**Inputs:** Feature brief from master
**Output:** `$STEP_1_ANALYST_OUTPUT` — research findings; `$STEP_1_PM_OUTPUT` — initial PRD draft

---

#### Default: In-Process (Agent tool)

Issue both Agent calls in a single assistant message (parallel fan-out):

```json
[
  {
    "name": "Agent",
    "input": {
      "subagent_type": "arcwright-analyst",
      "prompt": "Conduct domain research for the feature brief. Cover: domain constraints, user needs, competitive landscape, technical feasibility signals, and any relevant prior art.\n\n## Inputs\nFeature brief: {feature_brief}\n\n## Output\nStructured research findings with key insights and recommendations.",
      "model": "sonnet"
    }
  },
  {
    "name": "Agent",
    "input": {
      "subagent_type": "arcwright-pm",
      "prompt": "Draft an initial PRD stub for the feature brief. Cover: goals, user stories, acceptance criteria (draft), out-of-scope items, and open questions.\n\n## Inputs\nFeature brief: {feature_brief}\n\n## Output\nInitial PRD draft.",
      "model": "sonnet"
    }
  }
]
```

Capture results into `$STEP_1_ANALYST_OUTPUT` and `$STEP_1_PM_OUTPUT`. Pass both to step 2.

---

#### tmux Variant (when $TMUX is set and user wants visibility)

Load `.agents/skills/tmux-protocol/SKILL.md` before spawning. Dispatch to both panes simultaneously; wait for both TASK_DONE signals.

```bash
tmux send-keys -t {analyst_pane_id} "TASK-{id}-research: Research brief: {feature_brief}. Cover domain constraints, user needs, competitive landscape. Signal TASK_DONE with structured findings." Enter
tmux send-keys -t {pm_pane_id} "TASK-{id}-prd: Draft initial PRD stub for: {feature_brief}. Signal TASK_DONE when complete." Enter
```

Completion signals (wait for both):
```
AGENT_SIGNAL::TASK_DONE::analyst::{task_id}::done::{findings_summary}
AGENT_SIGNAL::TASK_DONE::pm::{task_id}::done::{prd_summary}
```

---

### 2. PRD Enrichment

**What this step does:** PM enriches the PRD draft with the Analyst's research findings, producing a complete PRD.
**Inputs:** `$STEP_1_ANALYST_OUTPUT` (research) + `$STEP_1_PM_OUTPUT` (initial PRD draft)
**Output:** `$STEP_2_OUTPUT` — complete PRD with research-enriched acceptance criteria

---

#### Default: In-Process (Agent tool)

```json
{
  "name": "Agent",
  "input": {
    "subagent_type": "arcwright-pm",
    "prompt": "Enrich the initial PRD draft with the research findings. Update acceptance criteria, resolve open questions where the research provides answers, and add any research-derived constraints or opportunities.\n\n## Inputs\nInitial PRD draft: {$STEP_1_PM_OUTPUT}\nResearch findings: {$STEP_1_ANALYST_OUTPUT}\n\n## Output\nComplete enriched PRD.",
    "model": "sonnet"
  }
}
```

Capture result into `$STEP_2_OUTPUT`. Pass to step 3.

---

#### tmux Variant (when $TMUX is set and user wants visibility)

Load `.agents/skills/tmux-protocol/SKILL.md` before spawning.

```bash
tmux send-keys -t {pm_pane_id} "TASK-{id}-enrich: Enrich PRD draft with research findings. Research: {$STEP_1_ANALYST_OUTPUT}. PRD draft: {$STEP_1_PM_OUTPUT}. Signal TASK_DONE with enriched PRD." Enter
```

Completion signal: `AGENT_SIGNAL::TASK_DONE::pm::{task_id}::done::PRD enriched`

---

### 3. Architecture Feasibility

**What this step does:** Architect validates technical feasibility of the enriched PRD and produces architecture notes, technical risks, and any prototype code.
**Inputs:** `$STEP_2_OUTPUT` (enriched PRD) + feature brief
**Output:** `$STEP_3_OUTPUT` — architecture notes, technical risks, feasibility assessment, any prototype code

---

#### Default: In-Process (Agent tool)

```json
{
  "name": "Agent",
  "input": {
    "subagent_type": "arcwright-architect",
    "prompt": "Validate technical feasibility of the PRD. Produce: architecture notes, technical risks, feasibility assessment. Write any prototype code needed to validate assumptions.\n\n## Inputs\nEnriched PRD: {$STEP_2_OUTPUT}\nFeature brief: {feature_brief}\n\n## Output\nArchitecture notes with technical risks, feasibility verdict, and any prototype code.",
    "model": "opus"
  }
}
```

Capture result into `$STEP_3_OUTPUT`. Pass to step 4.

---

#### tmux Variant (when $TMUX is set and user wants visibility)

Load `.agents/skills/tmux-protocol/SKILL.md` before spawning.

```bash
tmux send-keys -t {architect_pane_id} "TASK-{id}-arch: Validate feasibility of PRD. PRD: {$STEP_2_OUTPUT}. Brief: {feature_brief}. Produce architecture notes, risks, prototype code if needed. Signal TASK_DONE when complete." Enter
```

Completion signal: `AGENT_SIGNAL::TASK_DONE::architect::{task_id}::done::{feasibility_summary}`

---

### 4. Synthesis

**What this step does:** Master collates all planning artifacts and presents the final package to the user.
**Inputs:** `$STEP_1_ANALYST_OUTPUT`, `$STEP_2_OUTPUT` (enriched PRD), `$STEP_3_OUTPUT` (architecture notes)
**Output:** `$STEP_4_OUTPUT` — final planning package. Final output — no next step.

---

#### Default: In-Process (Agent tool)

```json
{
  "name": "Agent",
  "input": {
    "subagent_type": "arcwright-pm",
    "prompt": "Collate all planning artifacts into a final planning package. Summarize the key decisions, open risks, and recommended next steps.\n\n## Inputs\nResearch findings: {$STEP_1_ANALYST_OUTPUT}\nEnriched PRD: {$STEP_2_OUTPUT}\nArchitecture notes: {$STEP_3_OUTPUT}\n\n## Output\nFinal planning package summary with: key decisions, open risks, recommended next steps, and artifact index.",
    "model": "sonnet"
  }
}
```

Capture result into `$STEP_4_OUTPUT`. Final output — no next step. Present to user.

---

#### tmux Variant (when $TMUX is set and user wants visibility)

Load `.agents/skills/tmux-protocol/SKILL.md` before spawning.

```bash
tmux send-keys -t {pm_pane_id} "TASK-{id}-collate: Collate all planning artifacts. Research: {$STEP_1_ANALYST_OUTPUT}. PRD: {$STEP_2_OUTPUT}. Architecture: {$STEP_3_OUTPUT}. Signal TASK_DONE with final summary." Enter
```

Completion signal: `AGENT_SIGNAL::TASK_DONE::pm::{task_id}::done::Planning package complete`

---

## Communication Protocol

See [`tmux-protocol`](.agents/skills/tmux-protocol/SKILL.md) for the tmux signal protocol; this skill's default is in-process — Agent tool return value is the sole completion signal.

## Team Registration

When spawning this team, master writes to `_arcwright/_memory/master-orchestrator-sidecar/session-state.md` under `active_team`:
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

## Team Close Protocol

When master needs to close this team:
1. Read pane IDs from `active_team` in `_arcwright/_memory/master-orchestrator-sidecar/session-state.md`
2. Kill each pane directly: `tmux kill-pane -t {pane_id}` (DO NOT send `/exit`)
3. Clear `active_team` from session-state.md

## Kiro Pipeline

Use the `subagent` tool to run this team as a Kiro pipeline.

```json
{
  "task": "Strategic planning: parallel research + initial PRD, enrich PRD with research, validate architecture feasibility, collate final planning package.",
  "stages": [
    {
      "name": "research",
      "role": "arcwright-analyst",
      "prompt_template": "Conduct domain research for the feature brief. Cover domain constraints, user needs, competitive landscape, technical feasibility signals, and prior art: {task}",
      "depends_on": []
    },
    {
      "name": "prd-draft",
      "role": "arcwright-pm",
      "prompt_template": "Draft an initial PRD stub for the feature brief. Cover goals, user stories, acceptance criteria (draft), out-of-scope items, and open questions: {task}",
      "depends_on": []
    },
    {
      "name": "prd-enrich",
      "role": "arcwright-pm",
      "prompt_template": "Enrich the initial PRD draft with the research findings. Update acceptance criteria, resolve open questions, and add research-derived constraints or opportunities: {task}",
      "depends_on": ["research", "prd-draft"]
    },
    {
      "name": "arch-feasibility",
      "role": "arcwright-architect",
      "prompt_template": "Validate technical feasibility of the enriched PRD. Produce architecture notes, technical risks, feasibility assessment, and any prototype code needed to validate assumptions: {task}",
      "depends_on": ["prd-enrich"]
    },
    {
      "name": "synthesis",
      "role": "arcwright-pm",
      "prompt_template": "Collate all planning artifacts into a final planning package. Summarize key decisions, open risks, and recommended next steps: {task}",
      "depends_on": ["arch-feasibility"]
    }
  ]
}
```
