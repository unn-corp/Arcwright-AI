---
name: "team-dev-qa"
description: "Dev + QA iterative loop — Dev implements, QA validates with playwright-cli, failures loop back to Dev"
---

# Agent Team: Dev + QA

> **Default orchestration:** in-process via [`claude-subagent-protocol`](.agents/skills/claude-subagent-protocol/SKILL.md). tmux split-pane variant is opt-in (see step blocks).
>
> **Kiro CLI:** this team is not currently available as a Kiro `subagent` pipeline. Track-level workflows have Kiro pipelines; teams remain Claude Code / tmux for now.

## Best Used For

- Standard feature implementation with deterministic pass/fail validation
- Bug fixes that need regression verification
- Any task where QA must confirm correctness before master can proceed
- Sprint execution where each story needs a clean QA sign-off
- UI changes that need playwright-cli navigation and assertion testing

## Team Composition

| Role | Agent | Skills |
|------|-------|--------|
| Dev | `arcwright-dev` | Full implementation, bug fixes, refactoring |
| QA | `arcwright-qa` | playwright-cli, spec tests, regression testing |

## Purpose

The standard implementation-and-validation team. Dev implements tasks dispatched by master; QA validates each implementation using playwright-cli and spec tests. If QA finds failures, findings are routed back through master to Dev for a fix pass. The loop continues until QA signals a clean pass. Use this team for any feature work that needs deterministic pass/fail validation before proceeding.

## Layout (tmux)

```
┌─────────┬───────────┐
│         │    Dev    │
│ Master  ├───────────┤
│ (left)  │    QA     │
└─────────┴───────────┘
```

## Spawn Sequence

Load `.agents/skills/tmux-protocol/SKILL.md` before running tmux commands. Default path is in-process — no pane operations needed.

#### tmux Variant (when $TMUX is set and user wants visibility)

Load `.agents/skills/tmux-protocol/SKILL.md` before running these commands.

```bash
# 1. Split Dev pane (top-right)
tmux split-window -h -c "#{pane_current_path}" "~/.config/tmux/bin/agent_spawn.sh 'You are the Dev agent in the Dev+QA team managed by Conductor (master-orchestrator). Read and activate: {project-root}/_arcwright/awm/agents/dev.md. Your task queue comes from the master pane. Before stopping any task output: AGENT_SIGNAL::TASK_DONE::dev::{task_id}::{status}::{summary}. On long tasks emit AGENT_SIGNAL::PROGRESS every 60s. Wait for your first task.'"
sleep 8

# 2. Split QA pane (bottom-right, below Dev)
tmux split-window -v -c "#{pane_current_path}" "~/.config/tmux/bin/agent_spawn.sh 'You are the QA agent in the Dev+QA team managed by Conductor (master-orchestrator). Read and activate: {project-root}/_arcwright/awm/agents/qa.md. Your task queue comes from the master pane. Before stopping any task output: AGENT_SIGNAL::TASK_DONE::qa::{task_id}::{pass|fail}::{summary}. On long tasks emit AGENT_SIGNAL::PROGRESS every 60s. Wait for your first task.'"
sleep 8

# 3. Equalize pane sizes
tmux select-layout tiled
sleep 6
```

## Agent Activation

> **Project context**: Master passes the `## Project Context` block (from its activation scan) to each agent in their first task message. Agents receive context from master — they do not re-scan independently.

- **Dev**: activate `arcwright-dev`
- **QA**: activate `arcwright-qa`

## Steps

No task goes to QA until Dev has signaled completion. No next task goes to Dev until QA has signaled pass.

### 1. Implementation

**What this step does:** Dev implements the task dispatched by master.
**Inputs:** Task description and acceptance criteria from master
**Output:** `$STEP_1_OUTPUT` — implementation complete, files changed

---

#### Default: In-Process (Agent tool)

```json
{
  "name": "Agent",
  "input": {
    "subagent_type": "arcwright-dev",
    "prompt": "Implement the following task completely.\n\n## Inputs\nTask: {task_description}\nAcceptance criteria: {criteria}\n\n## Output\nImplementation complete. List all files changed.",
    "model": "sonnet"
  }
}
```

Capture result into `$STEP_1_OUTPUT`. Pass to step 2.

---

#### tmux Variant (when $TMUX is set and user wants visibility)

Load `.agents/skills/tmux-protocol/SKILL.md` before spawning.

```bash
tmux send-keys -t {dev_pane_id} "TASK-{id}: {task_description}. Acceptance criteria: {criteria}. Signal TASK_DONE when complete." Enter
```

Completion signal: `AGENT_SIGNAL::TASK_DONE::dev::{task_id}::done::{summary}`

---

### 2. QA Validation

**What this step does:** QA validates the implementation using playwright-cli and spec tests, producing a pass or fail result.
**Inputs:** `$STEP_1_OUTPUT` (implementation summary from step 1) + acceptance criteria
**Output:** `$STEP_2_OUTPUT` — pass or fail with findings

---

#### Default: In-Process (Agent tool)

```json
{
  "name": "Agent",
  "input": {
    "subagent_type": "arcwright-qa",
    "prompt": "Verify the implementation against the acceptance criteria. Run playwright-cli tests and spec tests. Produce a pass or fail result with specific findings.\n\n## Inputs\nImplementation context: {$STEP_1_OUTPUT}\nAcceptance criteria: {criteria}\n\n## Output\nPass or fail verdict with: test results summary, specific failures (if any), and affected areas.",
    "model": "sonnet"
  }
}
```

Capture result into `$STEP_2_OUTPUT`. If pass: task complete. If fail: pass to step 3.

---

#### tmux Variant (when $TMUX is set and user wants visibility)

Load `.agents/skills/tmux-protocol/SKILL.md` before spawning.

```bash
tmux send-keys -t {qa_pane_id} "TASK-{id}-qa: Verify implementation. Context: {$STEP_1_OUTPUT}. Run playwright-cli tests. Signal TASK_DONE with pass or fail." Enter
```

Completion signal: `AGENT_SIGNAL::TASK_DONE::qa::{task_id}::{pass|fail}::{summary}`

---

### 3. Fix Pass (conditional — only if step 2 failed)

**What this step does:** Dev fixes QA failures and signals completion to restart the QA loop.
**Inputs:** `$STEP_2_OUTPUT` (QA findings from step 2)
**Output:** `$STEP_3_OUTPUT` — fix complete, files changed. Return to step 2.

---

#### Default: In-Process (Agent tool)

```json
{
  "name": "Agent",
  "input": {
    "subagent_type": "arcwright-dev",
    "prompt": "Fix all QA failures. Address each failure specifically.\n\n## Inputs\nQA findings: {$STEP_2_OUTPUT}\n\n## Output\nFix complete. List all files changed and describe each fix.",
    "model": "sonnet"
  }
}
```

Capture result into `$STEP_3_OUTPUT`. Return to step 2 (QA re-validates). When QA passes: task complete. Final output — no next step.

---

#### tmux Variant (when $TMUX is set and user wants visibility)

Load `.agents/skills/tmux-protocol/SKILL.md` before spawning.

```bash
tmux send-keys -t {dev_pane_id} "TASK-{id}-fix: QA found failures. Findings: {$STEP_2_OUTPUT}. Fix and signal TASK_DONE." Enter
```

Completion signal: `AGENT_SIGNAL::TASK_DONE::dev::{task_id}::fixed::{files_changed}`

---

## Communication Protocol

See [`tmux-protocol`](.agents/skills/tmux-protocol/SKILL.md) for the tmux signal protocol; this skill's default is in-process — Agent tool return value is the sole completion signal.

## Team Registration

When spawning this team, master writes to `_arcwright/_memory/master-orchestrator-sidecar/session-state.md` under `active_team`:
```yaml
active_team:
  code: dev-qa
  name: "Dev + QA"
  spawned_at: {ISO8601}
  panes:
    dev: {pane_id}
    qa: {pane_id}
```

## Team Close Protocol

When master needs to close this team:
1. Read pane IDs from `active_team` in `_arcwright/_memory/master-orchestrator-sidecar/session-state.md`
2. Kill each pane directly: `tmux kill-pane -t {pane_id}` (DO NOT send `/exit`)
3. Clear `active_team` from session-state.md

## Kiro CLI

This team is not currently available as a Kiro `subagent` pipeline. Track-level workflows have Kiro pipelines; team orchestration remains Claude Code / tmux for now. A team-level Kiro DAG is planned for a follow-up release.
