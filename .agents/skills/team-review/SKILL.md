---
name: "team-review"
description: "Review + Fix Loop — Architect and UX Designer review concurrently, findings batch to Dev, loop until clean"
---

# Agent Team: Review + Fix Loop

> **Default orchestration:** in-process via [`claude-subagent-protocol`](.agents/skills/claude-subagent-protocol/SKILL.md). tmux split-pane variant is opt-in (see step blocks).
>
> **Kiro CLI:** this team is available as a Kiro `subagent` pipeline. See `## Kiro Pipeline` at the end of this skill.

## Best Used For

- Pre-merge quality gates on feature branches
- Periodic code health reviews of a subsystem or component set
- Before a release when both architectural soundness and UX compliance need confirmation
- After a large refactor where design token usage or structural patterns may have drifted
- Any situation where DRY/SOLID + UV both need to pass before proceeding to merge

## Team Composition

| Role | Agent | Skills |
|------|-------|--------|
| Architect | `arcwright-architect` | Architecture review, DRY/SOLID, full dev skill access |
| UX Designer | `arcwright-ux-designer` | UV review, accessibility, design token compliance, full dev skill access |
| Dev | `arcwright-dev` | Fix implementation, can invoke architect and QA skills inline |

## Purpose

The Review + Fix Loop runs concurrent architectural and UX reviews, aggregates all findings by severity, and dispatches a batched fix task to Dev. After Dev fixes, only the affected areas are re-reviewed by the relevant reviewer — not a full re-review of everything. The loop exits when both reviewers signal a clean pass. Use this team when existing code needs a structured quality pass before merge or release, or when a feature needs dual-lens validation.

## Layout (tmux)

```
┌─────────┬───────────┐
│         │ Architect │
│ Master  ├───────────┤
│ (left)  │    UX     │
│         ├───────────┤
│         │    Dev    │
└─────────┴───────────┘
```

## Spawn Sequence

Load `.agents/skills/tmux-protocol/SKILL.md` before running tmux commands. Default path is in-process — no pane operations needed.

#### tmux Variant (when $TMUX is set and user wants visibility)

Load `.agents/skills/tmux-protocol/SKILL.md` before running these commands.

```bash
# 1. Split Architect pane (top-right)
tmux split-window -h -c "#{pane_current_path}" "~/.config/tmux/bin/agent_spawn.sh 'You are the Architect agent in the Review+Fix Loop team managed by Conductor (master-orchestrator). Read and activate: {project-root}/_arcwright/awm/agents/architect.md. You have full dev skill access. Emit AGENT_SIGNAL::FINDING signals as you discover issues. Your task queue comes from the master pane. Before stopping any task output: AGENT_SIGNAL::TASK_DONE::architect::{task_id}::{status}::{summary}. On long tasks emit AGENT_SIGNAL::PROGRESS every 60s. Wait for your first task.'"
sleep 8

# 2. Split UX Designer pane (mid-right, below Architect)
tmux split-window -v -c "#{pane_current_path}" "~/.config/tmux/bin/agent_spawn.sh 'You are the UX Designer agent in the Review+Fix Loop team managed by Conductor (master-orchestrator). Read and activate: {project-root}/_arcwright/awm/agents/ux-designer.md. You have full dev skill access. Emit AGENT_SIGNAL::FINDING signals as you discover issues. Your task queue comes from the master pane. Before stopping any task output: AGENT_SIGNAL::TASK_DONE::ux::{task_id}::{status}::{summary}. On long tasks emit AGENT_SIGNAL::PROGRESS every 60s. Wait for your first task.'"
sleep 8

# 3. Split Dev pane (bottom-right, below UX)
tmux split-window -v -c "#{pane_current_path}" "~/.config/tmux/bin/agent_spawn.sh 'You are the Dev agent in the Review+Fix Loop team managed by Conductor (master-orchestrator). Read and activate: {project-root}/_arcwright/awm/agents/dev.md. You can invoke architect and QA skills from .agents/skills/ inline during fix phases. Your task queue comes from the master pane. Before stopping any task output: AGENT_SIGNAL::TASK_DONE::dev::{task_id}::{status}::{summary}. On long tasks emit AGENT_SIGNAL::PROGRESS every 60s. Wait for your first task.'"
sleep 8

# 4. Equalize pane sizes
tmux select-layout tiled
sleep 6
```

## Agent Activation

> **Project context**: Master passes the `## Project Context` block (from its activation scan) to each agent in their first task message. Agents receive context from master — they do not re-scan independently.

- **Architect**: activate `arcwright-architect`
  - Has **full dev skill access** — can invoke any skill in `.agents/skills/` directly.
- **UX Designer**: activate `arcwright-ux-designer`
  - Has **full dev skill access** — can invoke any skill in `.agents/skills/` directly.
- **Dev**: activate `arcwright-dev`
  - Can invoke architect and QA skills from `.agents/skills/` inline during fix phases.

## Steps

### 1. Concurrent Review

**What this step does:** Architect and UX Designer run concurrent reviews of the target scope, each producing a list of findings by severity.
**Inputs:** Review scope (files/areas) from master
**Output:** `$STEP_1_AR_OUTPUT`, `$STEP_1_UX_OUTPUT` — findings from each reviewer

---

#### Default: In-Process (Agent tool)

Issue both Agent calls in a single assistant message (parallel fan-out):

```json
[
  {
    "name": "Agent",
    "input": {
      "subagent_type": "arcwright-architect",
      "prompt": "Review the following scope for architectural issues: DRY/SOLID violations, structural problems, integration pattern issues, dead code. List each finding with severity (critical | major | minor) and description.\n\n## Inputs\nReview scope: {review_scope}\n\n## Output\nList of findings with severity. If none: 'No findings.'",
      "model": "opus"
    }
  },
  {
    "name": "Agent",
    "input": {
      "subagent_type": "arcwright-ux-designer",
      "prompt": "Review the following scope for UX/UI issues: accessibility violations, design token non-compliance, interaction pattern problems, visual inconsistencies. List each finding with severity (critical | major | minor).\n\n## Inputs\nReview scope: {review_scope}\n\n## Output\nList of findings with severity. If none: 'No findings.'",
      "model": "sonnet"
    }
  }
]
```

Capture results into `$STEP_1_AR_OUTPUT` and `$STEP_1_UX_OUTPUT`. Merge and sort all findings by severity (critical first, then major, then minor). Tag each finding with its owning reviewer. Pass merged findings to step 2.

---

#### tmux Variant (when $TMUX is set and user wants visibility)

Load `.agents/skills/tmux-protocol/SKILL.md` before spawning. Dispatch to both panes simultaneously; wait for both TASK_DONE signals.

```bash
tmux send-keys -t {architect_pane_id} "TASK-{id}-ar: Review scope: {review_scope}. Emit FINDING signals per issue. Signal TASK_DONE when review complete." Enter
tmux send-keys -t {ux_pane_id} "TASK-{id}-ux: Review scope: {review_scope}. Emit FINDING signals per issue. Signal TASK_DONE when review complete." Enter
```

Completion signals (wait for both):
```
AGENT_SIGNAL::TASK_DONE::architect::{task_id}::complete::{finding_count}
AGENT_SIGNAL::TASK_DONE::ux::{task_id}::complete::{finding_count}
```

---

### 2. Fix Batch

**What this step does:** Dev fixes all findings in severity order.
**Inputs:** Merged and sorted findings from step 1
**Output:** `$STEP_2_OUTPUT` — fix complete with files changed

---

#### Default: In-Process (Agent tool)

```json
{
  "name": "Agent",
  "input": {
    "subagent_type": "arcwright-dev",
    "prompt": "Fix all review findings in priority order (critical first, then major, then minor).\n\n## Inputs\nFindings (sorted by severity, tagged by reviewer): {merged_findings_from_step_1}\n\n## Output\nFix complete. List all files changed and describe each fix. Tag each fix with its finding severity and originating reviewer.",
    "model": "sonnet"
  }
}
```

Capture result into `$STEP_2_OUTPUT`. Pass to step 3.

---

#### tmux Variant (when $TMUX is set and user wants visibility)

Load `.agents/skills/tmux-protocol/SKILL.md` before spawning.

```bash
tmux send-keys -t {dev_pane_id} "TASK-{id}-fix: Fix findings in priority order. Findings: {merged_findings}. Signal TASK_DONE with files changed." Enter
```

Completion signal: `AGENT_SIGNAL::TASK_DONE::dev::{task_id}::fixed::{files_changed}`

---

### 3. Targeted Re-Review

**What this step does:** Only the reviewers whose findings were addressed re-review only the affected areas (not a full re-review).
**Inputs:** `$STEP_2_OUTPUT` (files changed + fix descriptions)
**Output:** `$STEP_3_OUTPUT` — re-review result: clean or new findings. Loop exits when both reviewers give clean pass.

---

#### Default: In-Process (Agent tool)

Issue re-review calls only for reviewers with affected findings. Both reviewers if both had fixes, one if only one had fixes:

```json
[
  {
    "name": "Agent",
    "input": {
      "subagent_type": "arcwright-architect",
      "prompt": "Re-review ONLY the areas that were just fixed. Confirm the architectural findings are resolved and no new issues were introduced.\n\n## Inputs\nFiles changed: {$STEP_2_OUTPUT}\nOriginal AR findings: {$STEP_1_AR_OUTPUT}\n\n## Output\nClean pass OR new/remaining findings with severity.",
      "model": "opus"
    }
  },
  {
    "name": "Agent",
    "input": {
      "subagent_type": "arcwright-ux-designer",
      "prompt": "Re-review ONLY the areas that were just fixed. Confirm the UX findings are resolved and no new issues were introduced.\n\n## Inputs\nFiles changed: {$STEP_2_OUTPUT}\nOriginal UX findings: {$STEP_1_UX_OUTPUT}\n\n## Output\nClean pass OR new/remaining findings with severity.",
      "model": "sonnet"
    }
  }
]
```

Capture results into `$STEP_3_OUTPUT`. If both reviewers report clean: loop exits, task complete. If new findings: return to step 2 with remaining findings. Final output — no next step.

---

#### tmux Variant (when $TMUX is set and user wants visibility)

Load `.agents/skills/tmux-protocol/SKILL.md` before spawning. Dispatch only to reviewers with affected findings.

```bash
tmux send-keys -t {architect_pane_id} "TASK-{id}-reverify: Re-review ONLY these areas that were just fixed: {affected_areas}. Signal TASK_DONE with clean or new findings." Enter
tmux send-keys -t {ux_pane_id} "TASK-{id}-reverify: Re-review ONLY these areas that were just fixed: {affected_areas}. Signal TASK_DONE with clean or new findings." Enter
```

Completion signals:
```
AGENT_SIGNAL::TASK_DONE::architect::{task_id}::clean::No new findings
AGENT_SIGNAL::TASK_DONE::ux::{task_id}::clean::No new findings
```

---

## Communication Protocol

See [`tmux-protocol`](.agents/skills/tmux-protocol/SKILL.md) for the tmux signal protocol; this skill's default is in-process — Agent tool return value is the sole completion signal.

## Team Registration

When spawning this team, master writes to `_arcwright/_memory/master-orchestrator-sidecar/session-state.md` under `active_team`:
```yaml
active_team:
  code: review
  name: "Review + Fix Loop"
  spawned_at: {ISO8601}
  panes:
    architect: {pane_id}
    ux: {pane_id}
    dev: {pane_id}
```

## Team Close Protocol

When master needs to close this team:
1. Read pane IDs from `active_team` in `_arcwright/_memory/master-orchestrator-sidecar/session-state.md`
2. Kill each pane directly: `tmux kill-pane -t {pane_id}` (DO NOT send `/exit`)
3. Clear `active_team` from session-state.md

## Kiro Pipeline

> Note: This pipeline represents one iteration of the review+fix loop. Re-invoke for additional iterations if re-review finds new findings.

Use the `subagent` tool to run this team as a Kiro pipeline.

```json
{
  "task": "Concurrent architectural and UX review, batched fix, and targeted re-review until both reviewers signal clean.",
  "stages": [
    {
      "name": "review-ar",
      "role": "arcwright-architect",
      "prompt_template": "Review the scope for architectural issues: DRY/SOLID violations, structural problems, integration pattern issues, dead code. List each finding with severity: {task}",
      "depends_on": []
    },
    {
      "name": "review-ux",
      "role": "arcwright-ux-designer",
      "prompt_template": "Review the scope for UX/UI issues: accessibility violations, design token non-compliance, interaction pattern problems, visual inconsistencies. List each finding with severity: {task}",
      "depends_on": []
    },
    {
      "name": "dev-fix",
      "role": "arcwright-dev",
      "prompt_template": "Fix all review findings in priority order (critical first, then major, then minor). Tag each fix with its finding severity and originating reviewer: {task}",
      "depends_on": ["review-ar", "review-ux"]
    },
    {
      "name": "re-review-ar",
      "role": "arcwright-architect",
      "prompt_template": "Re-review ONLY the areas that were just fixed. Confirm architectural findings are resolved and no new issues were introduced: {task}",
      "depends_on": ["dev-fix"]
    },
    {
      "name": "re-review-ux",
      "role": "arcwright-ux-designer",
      "prompt_template": "Re-review ONLY the areas that were just fixed. Confirm UX findings are resolved and no new issues were introduced: {task}",
      "depends_on": ["dev-fix"]
    }
  ]
}
```
