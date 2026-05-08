---
name: "team-arch-dev"
description: "The Foundry — Architect designs approach, Dev implements, Architect spot-checks completed work"
---

# Agent Team: Arch + Dev — The Foundry

> **Default orchestration:** in-process via [`claude-subagent-protocol`](.agents/skills/claude-subagent-protocol/SKILL.md). tmux split-pane variant is opt-in (see step blocks).
>
> **Kiro CLI:** this team is available as a Kiro `subagent` pipeline. See `## Kiro Pipeline` at the end of this skill.

## Best Used For

- New subsystems or modules where design decisions will have long-term impact
- Cross-cutting changes (auth, caching, data model, API contracts)
- Refactors where architectural guidance prevents regression into bad patterns
- Integration work where API contracts and data flow need design sign-off
- Tasks where a developer could implement correctly but benefit from architectural guardrails

## Team Composition

| Role | Agent | Skills |
|------|-------|--------|
| Architect | `arcwright-architect` | Architecture design, full dev skill access, spot-checks |
| Dev | `arcwright-dev` | Full implementation per architect's design |

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

Load `.agents/skills/tmux-protocol/SKILL.md` before running tmux commands. Default path is in-process — no pane operations needed.

#### tmux Variant (when $TMUX is set and user wants visibility)

Load `.agents/skills/tmux-protocol/SKILL.md` before running these commands.

```bash
# 1. Split Architect pane (top-right)
tmux split-window -h -c "#{pane_current_path}" "~/.config/tmux/bin/agent_spawn.sh 'You are the Architect agent in the Arch+Dev (Foundry) team managed by Conductor (master-orchestrator). Read and activate: {project-root}/_arcwright/awm/agents/architect.md. You have full dev skill access and can invoke any skill in .agents/skills/ directly. Your task queue comes from the master pane. Before stopping any task output: AGENT_SIGNAL::TASK_DONE::architect::{task_id}::{status}::{summary}. On long tasks emit AGENT_SIGNAL::PROGRESS every 60s. Wait for your first task.'"
sleep 8

# 2. Split Dev pane (bottom-right, below Architect)
tmux split-window -v -c "#{pane_current_path}" "~/.config/tmux/bin/agent_spawn.sh 'You are the Dev agent in the Arch+Dev (Foundry) team managed by Conductor (master-orchestrator). Read and activate: {project-root}/_arcwright/awm/agents/dev.md. Your task queue comes from the master pane. Before stopping any task output: AGENT_SIGNAL::TASK_DONE::dev::{task_id}::{status}::{summary}. On long tasks emit AGENT_SIGNAL::PROGRESS every 60s. Wait for your first task.'"
sleep 8

# 3. Equalize pane sizes
tmux select-layout tiled
sleep 6
```

## Agent Activation

> **Project context**: Master passes the `## Project Context` block (from its activation scan) to each agent in their first task message. Agents receive context from master — they do not re-scan independently.

- **Architect**: activate `arcwright-architect`
  - Architect has **full dev skill access** and can invoke any skill in `.agents/skills/` directly, including writing prototype code to validate design assumptions.
- **Dev**: activate `arcwright-dev`

## Steps

### 1. Architecture Design

**What this step does:** The Architect reviews scope and requirements and proposes a design approach (may include prototype code).
**Inputs:** Scope and requirements from master (none prior)
**Output:** `$STEP_1_OUTPUT` — architecture design proposal

---

#### Default: In-Process (Agent tool)

```json
{
  "name": "Agent",
  "input": {
    "subagent_type": "arcwright-architect",
    "prompt": "Review the following scope and propose a design approach. Include any prototype code needed to validate design assumptions.\n\n## Inputs\n{scope_and_requirements}\n\n## Output\nArchitecture design proposal with approach, rationale, and any prototype code.",
    "model": "opus"
  }
}
```

Capture result into `$STEP_1_OUTPUT`. Pass to step 2.

---

#### tmux Variant (when $TMUX is set and user wants visibility)

Load `.agents/skills/tmux-protocol/SKILL.md` before spawning.

```bash
tmux send-keys -t {architect_pane_id} "TASK-{id}: Review scope and propose design approach. Scope: {scope_and_requirements}. Signal TASK_DONE when complete." Enter
```

Completion signal: `AGENT_SIGNAL::TASK_DONE::architect::{task_id}::done::{design_summary}`

---

### 2. Implementation

**What this step does:** The Dev implements the feature according to the Architect's design proposal.
**Inputs:** `$STEP_1_OUTPUT` (architecture design from step 1) + original requirements
**Output:** `$STEP_2_OUTPUT` — implementation completion summary with files changed

---

#### Default: In-Process (Agent tool)

```json
{
  "name": "Agent",
  "input": {
    "subagent_type": "arcwright-dev",
    "prompt": "Implement the feature according to the architecture design provided. Follow the design approach exactly.\n\n## Inputs\nArchitecture design: {$STEP_1_OUTPUT}\nOriginal requirements: {requirements}\n\n## Output\nImplementation complete. List all files changed.",
    "model": "sonnet"
  }
}
```

Capture result into `$STEP_2_OUTPUT`. Pass to step 3.

---

#### tmux Variant (when $TMUX is set and user wants visibility)

Load `.agents/skills/tmux-protocol/SKILL.md` before spawning.

```bash
tmux send-keys -t {dev_pane_id} "TASK-{id}: Implement feature per architecture design. Design: {$STEP_1_OUTPUT}. Requirements: {requirements}. Signal TASK_DONE when complete." Enter
```

Completion signal: `AGENT_SIGNAL::TASK_DONE::dev::{task_id}::done::{files_changed}`

---

### 3. Architect Spot-Check

**What this step does:** The Architect reviews the completed implementation for architectural compliance and emits findings if any issues exist.
**Inputs:** `$STEP_2_OUTPUT` (implementation summary from step 2) + original design proposal
**Output:** `$STEP_3_OUTPUT` — spot-check result: clean pass or list of findings with severity

---

#### Default: In-Process (Agent tool)

```json
{
  "name": "Agent",
  "input": {
    "subagent_type": "arcwright-architect",
    "prompt": "Spot-check the completed implementation for architectural compliance. Review for: structural correctness, adherence to the agreed design, DRY/SOLID violations, integration pattern correctness. Emit findings with severity (critical | major | minor) for any issues.\n\n## Inputs\nImplementation summary: {$STEP_2_OUTPUT}\nOriginal design proposal: {$STEP_1_OUTPUT}\n\n## Output\nSpot-check result: clean pass OR list of findings with severity. If findings exist, list each with severity and description.",
    "model": "opus"
  }
}
```

Capture result into `$STEP_3_OUTPUT`. If findings exist: pass to step 4. If clean: task complete.

---

#### tmux Variant (when $TMUX is set and user wants visibility)

Load `.agents/skills/tmux-protocol/SKILL.md` before spawning.

```bash
tmux send-keys -t {architect_pane_id} "TASK-{id}-spotcheck: Spot-check implementation for architectural compliance. Implementation: {$STEP_2_OUTPUT}. Original design: {$STEP_1_OUTPUT}. Emit FINDING signals per issue. Signal TASK_DONE when complete." Enter
```

Completion signal: `AGENT_SIGNAL::TASK_DONE::architect::{task_id}::done::{clean_or_finding_count}`

---

### 4. Remediation (conditional — only if step 3 found issues)

**What this step does:** The Dev fixes all findings from the Architect's spot-check.
**Inputs:** `$STEP_3_OUTPUT` (findings from spot-check)
**Output:** `$STEP_4_OUTPUT` — remediation complete, files changed. Return to step 3.

---

#### Default: In-Process (Agent tool)

```json
{
  "name": "Agent",
  "input": {
    "subagent_type": "arcwright-dev",
    "prompt": "Fix all findings from the Architect's spot-check. Address critical findings first, then major, then minor.\n\n## Inputs\nFindings: {$STEP_3_OUTPUT}\n\n## Output\nRemediation complete. List all files changed and describe each fix.",
    "model": "sonnet"
  }
}
```

Capture result into `$STEP_4_OUTPUT`. Return to step 3 (Architect re-spot-checks). When Architect confirms clean: task complete. Final output — no next step.

---

#### tmux Variant (when $TMUX is set and user wants visibility)

Load `.agents/skills/tmux-protocol/SKILL.md` before spawning.

```bash
tmux send-keys -t {dev_pane_id} "TASK-{id}-fix: Fix architectural findings. Findings: {$STEP_3_OUTPUT}. Signal TASK_DONE when fixed." Enter
```

Completion signal: `AGENT_SIGNAL::TASK_DONE::dev::{task_id}::fixed::{files_changed}`

---

## Communication Protocol

See [`tmux-protocol`](.agents/skills/tmux-protocol/SKILL.md) for the tmux signal protocol; this skill's default is in-process — Agent tool return value is the sole completion signal.

## Team Registration

When spawning this team, master writes to `_arcwright/_memory/master-orchestrator-sidecar/session-state.md` under `active_team`:
```yaml
active_team:
  code: arch-dev
  name: "The Foundry"
  spawned_at: {ISO8601}
  panes:
    architect: {pane_id}
    dev: {pane_id}
```

## Team Close Protocol

When master needs to close this team:
1. Read pane IDs from `active_team` in `_arcwright/_memory/master-orchestrator-sidecar/session-state.md`
2. Kill each pane directly: `tmux kill-pane -t {pane_id}` (DO NOT send `/exit`)
3. Clear `active_team` from session-state.md

## Kiro Pipeline

> Note: This pipeline represents one iteration of the Architect spot-check loop. Re-invoke with remaining findings for additional iterations.

Use the `subagent` tool to run this team as a Kiro pipeline.

```json
{
  "task": "Design, implement, and architect-spot-check a feature: Architect proposes design, Dev implements, Architect validates compliance.",
  "stages": [
    {
      "name": "architect-design",
      "role": "arcwright-architect",
      "prompt_template": "Review scope and propose a design approach for: {task}. Include any prototype code needed to validate design assumptions.",
      "depends_on": []
    },
    {
      "name": "dev-impl",
      "role": "arcwright-dev",
      "prompt_template": "Implement the feature according to the architecture design. Follow the design approach exactly: {task}",
      "depends_on": ["architect-design"]
    },
    {
      "name": "arch-spot-check",
      "role": "arcwright-architect",
      "prompt_template": "Spot-check the completed implementation for architectural compliance. Check structural correctness, adherence to design, DRY/SOLID violations, integration pattern correctness: {task}",
      "depends_on": ["dev-impl"]
    },
    {
      "name": "dev-remediate",
      "role": "arcwright-dev",
      "prompt_template": "Fix all findings from the Architect spot-check. Address critical first, then major, then minor: {task}",
      "depends_on": ["arch-spot-check"]
    }
  ]
}
```
