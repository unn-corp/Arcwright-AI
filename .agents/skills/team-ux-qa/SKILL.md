---
name: "team-ux-qa"
description: "The Atelier — UX Designer implements (can write code), QA validates live UI with playwright-cli, loop until clean"
---

# Agent Team: UX + QA — The Atelier

> **Default orchestration:** in-process via [`claude-subagent-protocol`](.agents/skills/claude-subagent-protocol/SKILL.md). tmux split-pane variant is opt-in (see step blocks).
>
> **Kiro CLI:** this team is available as a Kiro `subagent` pipeline. See `## Kiro Pipeline` at the end of this skill.

## Best Used For

- UI feature implementation where design intent must be verified through live browser behavior
- Component redesigns, theming changes, or responsive layout work
- Accessibility improvements where playwright-cli assertions confirm WCAG compliance
- Any task where a UX Designer writing code directly is more efficient than design→dev handoff
- Design system compliance checks that need functional validation, not just visual inspection

## Team Composition

| Role | Agent | Skills |
|------|-------|--------|
| UX Designer | `arcwright-ux-designer` | Design, implementation (can write code), full dev skill access |
| QA | `arcwright-qa` | playwright-cli, visual + functional UI validation |

## Purpose

The Atelier pairs a UX Designer who can write code directly with a QA agent that validates the live UI. The UX Designer handles both the design and the implementation — they are not limited to wireframes. After each implementation pass, QA navigates the live application with playwright-cli, asserts visual correctness and functional behavior, and signals pass or fail. Failures loop back to UX for revision. Use this team for UI feature work, component redesigns, or accessibility improvements where design intent must be validated through actual browser behavior.

## Layout (tmux)

```
┌─────────┬───────────┐
│         │    UX     │
│ Master  ├───────────┤
│ (left)  │    QA     │
└─────────┴───────────┘
```

## Spawn Sequence

Load `.agents/skills/tmux-protocol/SKILL.md` before running tmux commands. Default path is in-process — no pane operations needed.

#### tmux Variant (when $TMUX is set and user wants visibility)

Load `.agents/skills/tmux-protocol/SKILL.md` before running these commands.

```bash
# 1. Split UX Designer pane (top-right)
tmux split-window -h -c "#{pane_current_path}" "~/.config/tmux/bin/agent_spawn.sh 'You are the UX Designer agent in The Atelier team managed by Conductor (master-orchestrator). Read and activate: {project-root}/_arcwright/awm/agents/ux-designer.md. You have full dev skill access and can write code directly — you are not limited to design artifacts. Your task queue comes from the master pane. Before stopping any task output: AGENT_SIGNAL::TASK_DONE::ux::{task_id}::{status}::{summary}. On long tasks emit AGENT_SIGNAL::PROGRESS every 60s. Wait for your first task.'"
sleep 8

# 2. Split QA pane (bottom-right, below UX)
tmux split-window -v -c "#{pane_current_path}" "~/.config/tmux/bin/agent_spawn.sh 'You are the QA agent in The Atelier team managed by Conductor (master-orchestrator). Read and activate: {project-root}/_arcwright/awm/agents/qa.md. Use playwright-cli to navigate the live UI and assert visual correctness and functional behavior. Your task queue comes from the master pane. Before stopping any task output: AGENT_SIGNAL::TASK_DONE::qa::{task_id}::{pass|fail}::{summary}. On long tasks emit AGENT_SIGNAL::PROGRESS every 60s. Wait for your first task.'"
sleep 8

# 3. Equalize pane sizes
tmux select-layout tiled
sleep 6
```

## Agent Activation

> **Project context**: Master passes the `## Project Context` block (from its activation scan) to each agent in their first task message. Agents receive context from master — they do not re-scan independently.

- **UX Designer**: activate `arcwright-ux-designer`
  - Has **full dev skill access** — can write code directly, not limited to wireframes or specs. Can invoke any skill in `.agents/skills/`.
- **QA**: activate `arcwright-qa`

## Steps

### 1. Design + Implementation

**What this step does:** UX Designer designs and implements the UI task (can write code directly).
**Inputs:** Task description and acceptance criteria from master
**Output:** `$STEP_1_OUTPUT` — design and implementation complete, files changed

---

#### Default: In-Process (Agent tool)

```json
{
  "name": "Agent",
  "input": {
    "subagent_type": "arcwright-ux-designer",
    "prompt": "Design and implement the UI task. You can write code directly — you are not limited to design artifacts. Implement to meet the acceptance criteria.\n\n## Inputs\nTask: {task_description}\nAcceptance criteria: {criteria}\n\n## Output\nDesign and implementation complete. List all files changed and describe what was done.",
    "model": "sonnet"
  }
}
```

Capture result into `$STEP_1_OUTPUT`. Pass to step 2.

---

#### tmux Variant (when $TMUX is set and user wants visibility)

Load `.agents/skills/tmux-protocol/SKILL.md` before spawning.

```bash
tmux send-keys -t {ux_pane_id} "TASK-{id}: Design and implement: {task_description}. Acceptance criteria: {criteria}. Signal TASK_DONE when complete." Enter
```

Completion signal: `AGENT_SIGNAL::TASK_DONE::ux::{task_id}::done::{summary_of_changes}`

---

### 2. Live UI Validation

**What this step does:** QA navigates the live UI via playwright-cli and asserts visual correctness and functional behavior.
**Inputs:** `$STEP_1_OUTPUT` (implementation summary) + acceptance criteria
**Output:** `$STEP_2_OUTPUT` — pass or fail with specific failed assertions

---

#### Default: In-Process (Agent tool)

```json
{
  "name": "Agent",
  "input": {
    "subagent_type": "arcwright-qa",
    "prompt": "Validate the live UI using playwright-cli. Navigate to the affected areas and assert visual correctness and functional behavior against the acceptance criteria.\n\n## Inputs\nImplementation context: {$STEP_1_OUTPUT}\nAcceptance criteria: {criteria}\n\n## Output\nPass or fail verdict. If pass: 'All visual and functional assertions green.' If fail: list each failed assertion with description.",
    "model": "sonnet"
  }
}
```

Capture result into `$STEP_2_OUTPUT`. If pass: task complete. If fail: pass to step 3.

---

#### tmux Variant (when $TMUX is set and user wants visibility)

Load `.agents/skills/tmux-protocol/SKILL.md` before spawning.

```bash
tmux send-keys -t {qa_pane_id} "TASK-{id}-qa: Validate live UI using playwright-cli. Assert: {criteria}. Navigate to affected areas and verify visual + functional correctness. Signal TASK_DONE with pass or fail." Enter
```

Completion signal: `AGENT_SIGNAL::TASK_DONE::qa::{task_id}::pass::All visual and functional assertions green` or `AGENT_SIGNAL::TASK_DONE::qa::{task_id}::fail::{failed_assertions}`

---

### 3. Revision (conditional — only if step 2 failed)

**What this step does:** UX Designer revises the implementation based on QA findings and restarts the validation loop.
**Inputs:** `$STEP_2_OUTPUT` (QA findings)
**Output:** `$STEP_3_OUTPUT` — revision complete. Return to step 2.

---

#### Default: In-Process (Agent tool)

```json
{
  "name": "Agent",
  "input": {
    "subagent_type": "arcwright-ux-designer",
    "prompt": "Revise the UI implementation based on QA findings. Address each failed assertion specifically.\n\n## Inputs\nQA findings: {$STEP_2_OUTPUT}\n\n## Output\nRevision complete. List all files changed.",
    "model": "sonnet"
  }
}
```

Capture result into `$STEP_3_OUTPUT`. Return to step 2 (QA re-validates). When QA passes: task complete. Final output — no next step.

---

#### tmux Variant (when $TMUX is set and user wants visibility)

Load `.agents/skills/tmux-protocol/SKILL.md` before spawning.

```bash
tmux send-keys -t {ux_pane_id} "TASK-{id}-revise: QA found issues. Findings: {$STEP_2_OUTPUT}. Revise and signal TASK_DONE." Enter
```

Completion signal: `AGENT_SIGNAL::TASK_DONE::ux::{task_id}::revised::{files_changed}`

---

## Communication Protocol

See [`tmux-protocol`](.agents/skills/tmux-protocol/SKILL.md) for the tmux signal protocol; this skill's default is in-process — Agent tool return value is the sole completion signal.

## Team Registration

When spawning this team, master writes to `_arcwright/_memory/master-orchestrator-sidecar/session-state.md` under `active_team`:
```yaml
active_team:
  code: ux-qa
  name: "The Atelier"
  spawned_at: {ISO8601}
  panes:
    ux: {pane_id}
    qa: {pane_id}
```

## Team Close Protocol

When master needs to close this team:
1. Read pane IDs from `active_team` in `_arcwright/_memory/master-orchestrator-sidecar/session-state.md`
2. Kill each pane directly: `tmux kill-pane -t {pane_id}` (DO NOT send `/exit`)
3. Clear `active_team` from session-state.md

## Kiro Pipeline

> Note: This pipeline represents one iteration of the UX+QA loop. Re-invoke for additional revision iterations if QA finds failures.

Use the `subagent` tool to run this team as a Kiro pipeline.

```json
{
  "task": "Design and implement a UI task, then validate it with playwright-cli QA: UX Designer implements, QA validates live UI, UX revises on failure.",
  "stages": [
    {
      "name": "ux-impl",
      "role": "arcwright-ux-designer",
      "prompt_template": "Design and implement the UI task. You can write code directly. Implement to meet the acceptance criteria: {task}",
      "depends_on": []
    },
    {
      "name": "qa-validate",
      "role": "arcwright-qa",
      "prompt_template": "Validate the live UI using playwright-cli. Navigate to affected areas and assert visual correctness and functional behavior against acceptance criteria: {task}",
      "depends_on": ["ux-impl"]
    },
    {
      "name": "ux-revise",
      "role": "arcwright-ux-designer",
      "prompt_template": "Revise the UI implementation based on QA findings. Address each failed assertion specifically: {task}",
      "depends_on": ["qa-validate"]
    }
  ]
}
```
