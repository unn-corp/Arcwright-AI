---
name: "team-ux-arch"
description: "The Blueprint Room — UX and Architect produce design artifacts together; no implementation, no iterative loop"
---

# Agent Team: UX + Architecture — The Blueprint Room

> **Default orchestration:** in-process via [`claude-subagent-protocol`](.agents/skills/claude-subagent-protocol/SKILL.md). tmux split-pane variant is opt-in (see step blocks).
>
> **Kiro CLI:** this team is available as a Kiro `subagent` pipeline. See `## Kiro Pipeline` at the end of this skill.

## Best Used For

- Feature design phase before any sprint capacity is committed to implementation
- Validating that a UX concept is architecturally feasible and API-compatible
- Designing new API contracts and component specs together so both are coherent
- Large UI reworks where the architecture needs to adapt to new interaction patterns
- Situations where design/architecture conflicts need to be resolved before dev begins rather than during

## Team Composition

| Role | Agent | Skills |
|------|-------|--------|
| UX Designer | `arcwright-ux-designer` | Wireframes, component specs, interaction design, full dev skill access |
| Architect | `arcwright-architect` | API contract validation, data flow design, feasibility, full dev skill access |

## Purpose

The Blueprint Room is a design-only team — no production code is written, no iterative implementation loop runs. The UX Designer produces wireframes and component specifications; the Architect validates API contracts and data flow against the proposed design. Master mediates any design/architecture conflicts. Output is design artifacts only: wireframes, component specs, API contracts, data flow diagrams, and integration notes. Use this team to design a feature fully before handing it off to a dev team, or to validate that a UX design is architecturally feasible before building begins.

## Layout (tmux)

```
┌─────────┬───────────┐
│         │    UX     │
│ Master  ├───────────┤
│ (left)  │ Architect │
└─────────┴───────────┘
```

## Spawn Sequence

Load `.agents/skills/tmux-protocol/SKILL.md` before running tmux commands. Default path is in-process — no pane operations needed.

#### tmux Variant (when $TMUX is set and user wants visibility)

Load `.agents/skills/tmux-protocol/SKILL.md` before running these commands.

```bash
# 1. Split UX Designer pane (top-right)
tmux split-window -h -c "#{pane_current_path}" "~/.config/tmux/bin/agent_spawn.sh 'You are the UX Designer agent in The Blueprint Room team managed by Conductor (master-orchestrator). Read and activate: {project-root}/_arcwright/awm/agents/ux-designer.md. You have full dev skill access. This team produces DESIGN ARTIFACTS ONLY — wireframes, component specs, interaction specs. No production code. Your task queue comes from the master pane. Before stopping any task output: AGENT_SIGNAL::TASK_DONE::ux::{task_id}::{status}::{summary}. On long tasks emit AGENT_SIGNAL::PROGRESS every 60s. Wait for your first task.'"
sleep 8

# 2. Split Architect pane (bottom-right, below UX)
tmux split-window -v -c "#{pane_current_path}" "~/.config/tmux/bin/agent_spawn.sh 'You are the Architect agent in The Blueprint Room team managed by Conductor (master-orchestrator). Read and activate: {project-root}/_arcwright/awm/agents/architect.md. You have full dev skill access. This team produces DESIGN ARTIFACTS ONLY — API contracts, data flow specs, feasibility notes. No production code. Your task queue comes from the master pane. Before stopping any task output: AGENT_SIGNAL::TASK_DONE::architect::{task_id}::{status}::{summary}. On long tasks emit AGENT_SIGNAL::PROGRESS every 60s. Wait for your first task.'"
sleep 8

# 3. Equalize pane sizes
tmux select-layout tiled
sleep 6
```

## Agent Activation

> **Project context**: Master passes the `## Project Context` block (from its activation scan) to each agent in their first task message. Agents receive context from master — they do not re-scan independently.

- **UX Designer**: activate `arcwright-ux-designer`
  - Has **full dev skill access** — can invoke any skill in `.agents/skills/` directly, including prototyping tools to validate design assumptions.
- **Architect**: activate `arcwright-architect`
  - Has **full dev skill access** — can invoke any skill in `.agents/skills/` directly, including writing prototype code to validate feasibility.

## Steps

No iterative loop. Defined forward flow with a parallel start and a conflict-resolution gate if needed.

### 1. Parallel Design + Requirements Analysis

**What this step does:** UX Designer produces wireframes and component specs while Architect analyzes requirements for API and data flow implications — both start from the same brief.
**Inputs:** Design brief and requirements from master
**Output:** `$STEP_1_UX_OUTPUT` — wireframes + component specs; `$STEP_1_ARCH_OUTPUT` — initial API/data flow analysis

---

#### Default: In-Process (Agent tool)

Issue both Agent calls in a single assistant message (parallel fan-out):

```json
[
  {
    "name": "Agent",
    "input": {
      "subagent_type": "arcwright-ux-designer",
      "prompt": "Produce wireframes and component specifications for the design brief. This is a DESIGN ARTIFACT ONLY — no production code.\n\n## Inputs\nDesign brief: {design_brief}\n\n## Output\nWireframes (text descriptions or ASCII), component specs, and interaction design notes.",
      "model": "sonnet"
    }
  },
  {
    "name": "Agent",
    "input": {
      "subagent_type": "arcwright-architect",
      "prompt": "Analyze the requirements for API contract and data flow implications. Identify: what data the UX will need, what API endpoints are required, what data flow patterns apply. Write prototype code to validate assumptions if needed.\n\n## Inputs\nRequirements: {requirements}\nDesign brief: {design_brief}\n\n## Output\nInitial API/data flow analysis: required endpoints, data shapes, feasibility assessment.",
      "model": "opus"
    }
  }
]
```

Capture results into `$STEP_1_UX_OUTPUT` and `$STEP_1_ARCH_OUTPUT`. Pass both to step 2.

---

#### tmux Variant (when $TMUX is set and user wants visibility)

Load `.agents/skills/tmux-protocol/SKILL.md` before spawning. Dispatch to both panes simultaneously; wait for both TASK_DONE signals.

```bash
tmux send-keys -t {ux_pane_id} "TASK-{id}: Produce wireframes and component specs for: {design_brief}. Signal TASK_DONE when complete." Enter
tmux send-keys -t {architect_pane_id} "TASK-{id}: Analyze requirements for API/data flow implications. Requirements: {requirements}. Signal TASK_DONE when complete." Enter
```

Completion signals (wait for both):
```
AGENT_SIGNAL::TASK_DONE::ux::{task_id}::done::Wireframes complete for {N} screens
AGENT_SIGNAL::TASK_DONE::architect::{task_id}::done::API analysis complete
```

---

### 2. Architecture Validation of UX Design

**What this step does:** Architect validates the UX design against API/data flow constraints and identifies any design/architecture conflicts.
**Inputs:** `$STEP_1_UX_OUTPUT` (wireframes + component specs) + `$STEP_1_ARCH_OUTPUT` (initial analysis) + requirements
**Output:** `$STEP_2_OUTPUT` — API contracts + data flow specs, approved OR design-conflict signals

---

#### Default: In-Process (Agent tool)

```json
{
  "name": "Agent",
  "input": {
    "subagent_type": "arcwright-architect",
    "prompt": "Validate the UX design against API and data flow constraints. Produce: final API contracts, data flow diagrams, integration notes. Identify any design/architecture conflicts where the UX requires data or patterns not available in the current architecture.\n\n## Inputs\nUX wireframes and component specs: {$STEP_1_UX_OUTPUT}\nInitial API analysis: {$STEP_1_ARCH_OUTPUT}\nRequirements: {requirements}\n\n## Output\nAPI contracts, data flow specs, integration notes. If conflicts: list each as 'DESIGN_CONFLICT: {description}'.",
    "model": "opus"
  }
}
```

Capture result into `$STEP_2_OUTPUT`. If design conflicts found: pass to step 3. Otherwise pass to step 4.

---

#### tmux Variant (when $TMUX is set and user wants visibility)

Load `.agents/skills/tmux-protocol/SKILL.md` before spawning.

```bash
tmux send-keys -t {architect_pane_id} "TASK-{id}-validate: Validate UX design against API constraints. UX output: {$STEP_1_UX_OUTPUT}. Emit FINDING signals for design conflicts. Signal TASK_DONE when complete." Enter
```

Completion signal: `AGENT_SIGNAL::TASK_DONE::architect::{task_id}::done::API contracts validated` or `AGENT_SIGNAL::FINDING::architect::{task_id}::design-conflict::{description}`

---

### 3. Conflict Resolution (conditional — only if step 2 found conflicts)

**What this step does:** Master surfaces conflicts to both agents for negotiation. Each proposes a resolution. Master presents options to user if not auto-resolvable.
**Inputs:** `$STEP_2_OUTPUT` (conflict descriptions) + `$STEP_1_UX_OUTPUT`
**Output:** `$STEP_3_OUTPUT` — resolved design adjustments. Return to step 2.

This step may require user judgment if both agents cannot auto-resolve. Master presents the conflict and options to the user before proceeding.

---

#### Default: In-Process (Agent tool)

Issue both resolution calls in a single assistant message:

```json
[
  {
    "name": "Agent",
    "input": {
      "subagent_type": "arcwright-ux-designer",
      "prompt": "A design/architecture conflict was identified. Propose a UX-side resolution that addresses the constraint.\n\n## Inputs\nConflict: {design_conflicts_from_step_2}\nOriginal UX design: {$STEP_1_UX_OUTPUT}\n\n## Output\nProposed UX resolution: what UX adjustment would satisfy the architectural constraint.",
      "model": "sonnet"
    }
  },
  {
    "name": "Agent",
    "input": {
      "subagent_type": "arcwright-architect",
      "prompt": "A design/architecture conflict was identified. Propose an architecture-side resolution that satisfies the UX need.\n\n## Inputs\nConflict: {design_conflicts_from_step_2}\nOriginal UX design: {$STEP_1_UX_OUTPUT}\n\n## Output\nProposed architecture resolution: what API/data change would satisfy the UX requirement.",
      "model": "opus"
    }
  }
]
```

Capture results into `$STEP_3_OUTPUT`. Present both resolution options to user if auto-resolution is not clear. After user selects direction: return to step 2 with resolved design.

---

#### tmux Variant (when $TMUX is set and user wants visibility)

Load `.agents/skills/tmux-protocol/SKILL.md` before spawning.

```bash
tmux send-keys -t {ux_pane_id} "CONFLICT-{id}: Architecture conflict found. Propose UX-side resolution. Conflict: {conflict}. Signal TASK_DONE with proposed resolution." Enter
tmux send-keys -t {architect_pane_id} "CONFLICT-{id}: Design conflict found. Propose architecture-side resolution. Conflict: {conflict}. Signal TASK_DONE with proposed resolution." Enter
```

Completion signals (wait for both, then present to user for decision):
```
AGENT_SIGNAL::TASK_DONE::ux::{task_id}::done::UX resolution proposed
AGENT_SIGNAL::TASK_DONE::architect::{task_id}::done::Architecture resolution proposed
```

---

### 4. Final Artifact Collation

**What this step does:** Master collates all design outputs and presents the final package to the user.
**Inputs:** `$STEP_1_UX_OUTPUT`, `$STEP_2_OUTPUT` (architecture validation + contracts)
**Output:** `$STEP_4_OUTPUT` — final design package. Final output — no next step.

This step is performed by master directly: collate wireframes, component specs, API contracts, data flow diagrams, and integration notes into a final design package and present to user.

---

## Communication Protocol

See [`tmux-protocol`](.agents/skills/tmux-protocol/SKILL.md) for the tmux signal protocol; this skill's default is in-process — Agent tool return value is the sole completion signal.

## Team Registration

When spawning this team, master writes to `_arcwright/_memory/master-orchestrator-sidecar/session-state.md` under `active_team`:
```yaml
active_team:
  code: ux-arch
  name: "The Blueprint Room"
  spawned_at: {ISO8601}
  panes:
    ux: {pane_id}
    architect: {pane_id}
```

## Team Close Protocol

When master needs to close this team:
1. Read pane IDs from `active_team` in `_arcwright/_memory/master-orchestrator-sidecar/session-state.md`
2. Kill each pane directly: `tmux kill-pane -t {pane_id}` (DO NOT send `/exit`)
3. Clear `active_team` from session-state.md

## Kiro Pipeline

> Note: The conflict resolution path (step 3) is conditional on design conflicts being found in step 2. This pipeline models the happy path (no conflicts). If conflicts arise, re-invoke with a conflict-resolution stage inserted between `arch-validate` and `final-collate`.

Use the `subagent` tool to run this team as a Kiro pipeline.

```json
{
  "task": "Design a feature: UX produces wireframes and component specs while Architect analyzes API/data flow, Architect validates compatibility, master collates final design package.",
  "stages": [
    {
      "name": "ux-design",
      "role": "arcwright-ux-designer",
      "prompt_template": "Produce wireframes and component specifications for the design brief. This is a DESIGN ARTIFACT ONLY — no production code: {task}",
      "depends_on": []
    },
    {
      "name": "arch-analysis",
      "role": "arcwright-architect",
      "prompt_template": "Analyze the requirements for API contract and data flow implications. Identify what data the UX will need, what API endpoints are required, what data flow patterns apply: {task}",
      "depends_on": []
    },
    {
      "name": "arch-validate",
      "role": "arcwright-architect",
      "prompt_template": "Validate the UX design against API and data flow constraints. Produce final API contracts, data flow specs, integration notes. Identify any design/architecture conflicts: {task}",
      "depends_on": ["ux-design", "arch-analysis"]
    },
    {
      "name": "ux-conflict-resolve",
      "role": "arcwright-ux-designer",
      "prompt_template": "If any design/architecture conflicts were identified, propose a UX-side resolution that addresses the constraint. Otherwise confirm design is compatible: {task}",
      "depends_on": ["arch-validate"]
    }
  ]
}
```
