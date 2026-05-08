---
name: "team-tdd"
description: "The Forge — TDD pod where QA writes failing tests first, Dev implements to green, QA verifies"
---

# Agent Team: TDD Pod — The Forge

> **Default orchestration:** in-process via [`claude-subagent-protocol`](.agents/skills/claude-subagent-protocol/SKILL.md). tmux split-pane variant is opt-in (see step blocks).
>
> **Kiro CLI:** this team is not currently available as a Kiro `subagent` pipeline. Track-level workflows have Kiro pipelines; teams remain Claude Code / tmux for now.

## Best Used For

- Critical path features (auth, payments, core data flows) where regressions are costly
- New APIs or services where the interface contract needs to be locked in via tests
- Refactors where the existing behavior must be fully preserved and verifiable
- Features with complex acceptance criteria that benefit from being encoded as executable tests
- Situations where the team wants the test suite to serve as living documentation of intent

## Team Composition

| Role | Agent | Skills |
|------|-------|--------|
| QA | `arcwright-qa` | Test authoring (failing tests first), playwright-cli, verification |
| Dev | `arcwright-dev` | Implementation to make tests pass |

## Purpose

The Forge enforces true test-driven development. QA writes failing tests from acceptance criteria before a single line of implementation exists. Dev implements only to make those tests pass. QA then verifies all tests are green. The discipline of writing tests first drives better acceptance criteria, clearer interfaces, and fewer edge case regressions. Use this team when correctness is critical and you want the test suite to act as a living spec.

## Layout (tmux)

```
┌─────────┬───────────┐
│         │    QA     │
│ Master  ├───────────┤
│ (left)  │    Dev    │
└─────────┴───────────┘
```

## Spawn Sequence

Load `.agents/skills/tmux-protocol/SKILL.md` before running tmux commands. Default path is in-process — no pane operations needed.

#### tmux Variant (when $TMUX is set and user wants visibility)

Load `.agents/skills/tmux-protocol/SKILL.md` before running these commands.

```bash
# 1. Split QA pane (top-right)
tmux split-window -h -c "#{pane_current_path}" "~/.config/tmux/bin/agent_spawn.sh 'You are the QA agent in the TDD Pod (The Forge) team managed by Conductor (master-orchestrator). Read and activate: {project-root}/_arcwright/awm/agents/qa.md. In this team you write FAILING tests first from acceptance criteria — do NOT implement. Your task queue comes from the master pane. Before stopping any task output: AGENT_SIGNAL::TASK_DONE::qa::{task_id}::{status}::{summary}. On long tasks emit AGENT_SIGNAL::PROGRESS every 60s. Wait for your first task.'"
sleep 8

# 2. Split Dev pane (bottom-right, below QA)
tmux split-window -v -c "#{pane_current_path}" "~/.config/tmux/bin/agent_spawn.sh 'You are the Dev agent in the TDD Pod (The Forge) team managed by Conductor (master-orchestrator). Read and activate: {project-root}/_arcwright/awm/agents/dev.md. In this team you implement ONLY to make QA-authored tests pass — do not add extra functionality. Your task queue comes from the master pane. Before stopping any task output: AGENT_SIGNAL::TASK_DONE::dev::{task_id}::{status}::{summary}. On long tasks emit AGENT_SIGNAL::PROGRESS every 60s. Wait for your first task.'"
sleep 8

# 3. Equalize pane sizes
tmux select-layout tiled
sleep 6
```

## Agent Activation

> **Project context**: Master passes the `## Project Context` block (from its activation scan) to each agent in their first task message. Agents receive context from master — they do not re-scan independently.

- **QA**: activate `arcwright-qa`
  - QA role in this team is test authoring first, verification second. QA does NOT implement features.
- **Dev**: activate `arcwright-dev`
  - Dev role in this team is implementing only to make QA-authored tests pass — no scope creep.

## Steps

### 1. Write Failing Tests

**What this step does:** QA writes failing tests from acceptance criteria. Tests MUST fail before implementation exists.
**Inputs:** Spec and acceptance criteria from master
**Output:** `$STEP_1_OUTPUT` — test file paths (tests are failing at this point)

---

#### Default: In-Process (Agent tool)

```json
{
  "name": "Agent",
  "input": {
    "subagent_type": "arcwright-qa",
    "prompt": "Write FAILING tests from the acceptance criteria. Do NOT implement any functionality — tests must fail before implementation. Write tests that completely encode the acceptance criteria as executable assertions.\n\n## Inputs\nSpec: {spec}\nAcceptance criteria: {criteria}\n\n## Output\nTest files written (confirm they are failing). List test file paths.",
    "model": "sonnet"
  }
}
```

Capture result into `$STEP_1_OUTPUT`. Pass test file paths to step 2.

---

#### tmux Variant (when $TMUX is set and user wants visibility)

Load `.agents/skills/tmux-protocol/SKILL.md` before spawning.

```bash
tmux send-keys -t {qa_pane_id} "TASK-{id}: Write FAILING tests for: {spec}. Acceptance criteria: {criteria}. Signal TASK_DONE::tests-written with test file paths." Enter
```

Completion signal: `AGENT_SIGNAL::TASK_DONE::qa::{task_id}::tests-written::{test_file_paths}`

---

### 2. Implement to Green

**What this step does:** Dev implements only what is needed to make the QA-authored tests pass — no extra scope.
**Inputs:** `$STEP_1_OUTPUT` (test file paths) + spec
**Output:** `$STEP_2_OUTPUT` — implementation complete, tests should now pass

---

#### Default: In-Process (Agent tool)

```json
{
  "name": "Agent",
  "input": {
    "subagent_type": "arcwright-dev",
    "prompt": "Implement only what is needed to make the QA-authored tests pass. Do NOT add extra functionality beyond what the tests require.\n\n## Inputs\nTest files: {$STEP_1_OUTPUT}\nSpec: {spec}\n\n## Output\nImplementation complete. List all files changed.",
    "model": "sonnet"
  }
}
```

Capture result into `$STEP_2_OUTPUT`. Pass to step 3.

---

#### tmux Variant (when $TMUX is set and user wants visibility)

Load `.agents/skills/tmux-protocol/SKILL.md` before spawning.

```bash
tmux send-keys -t {dev_pane_id} "TASK-{id}: Implement to make these tests pass. Test files: {$STEP_1_OUTPUT}. Spec: {spec}. Signal TASK_DONE when all tests green." Enter
```

Completion signal: `AGENT_SIGNAL::TASK_DONE::dev::{task_id}::implemented::{summary}`

---

### 3. Green Verification

**What this step does:** QA verifies all tests are now green by running the full test suite.
**Inputs:** `$STEP_2_OUTPUT` (implementation summary) + `$STEP_1_OUTPUT` (test files)
**Output:** `$STEP_3_OUTPUT` — pass (all tests green) or fail (list of still-failing tests)

---

#### Default: In-Process (Agent tool)

```json
{
  "name": "Agent",
  "input": {
    "subagent_type": "arcwright-qa",
    "prompt": "Verify all tests are now green by running the full test suite. Run the test files that were written in step 1.\n\n## Inputs\nTest files: {$STEP_1_OUTPUT}\nImplementation context: {$STEP_2_OUTPUT}\n\n## Output\nPass or fail. If pass: 'All N tests green.' If fail: list each failing test with the failure message.",
    "model": "sonnet"
  }
}
```

Capture result into `$STEP_3_OUTPUT`. If all pass: task complete. If any fail: pass to step 4.

---

#### tmux Variant (when $TMUX is set and user wants visibility)

Load `.agents/skills/tmux-protocol/SKILL.md` before spawning.

```bash
tmux send-keys -t {qa_pane_id} "TASK-{id}-verify: Verify all tests are now green. Run the test suite. Signal TASK_DONE::pass or TASK_DONE::fail." Enter
```

Completion signal: `AGENT_SIGNAL::TASK_DONE::qa::{task_id}::pass::All {N} tests green` or `AGENT_SIGNAL::TASK_DONE::qa::{task_id}::fail::{failing_test_summary}`

---

### 4. Fix Failing Tests (conditional — only if step 3 failed)

**What this step does:** Dev fixes the implementation to make the remaining failing tests pass.
**Inputs:** `$STEP_3_OUTPUT` (failing test summary)
**Output:** `$STEP_4_OUTPUT` — fix complete. Return to step 3.

---

#### Default: In-Process (Agent tool)

```json
{
  "name": "Agent",
  "input": {
    "subagent_type": "arcwright-dev",
    "prompt": "Fix the implementation to make the failing tests pass. Address each failing test specifically.\n\n## Inputs\nFailing tests: {$STEP_3_OUTPUT}\n\n## Output\nFix complete. List all files changed.",
    "model": "sonnet"
  }
}
```

Capture result into `$STEP_4_OUTPUT`. Return to step 3 (QA re-verifies). When all tests pass: task complete. Final output — no next step.

---

#### tmux Variant (when $TMUX is set and user wants visibility)

Load `.agents/skills/tmux-protocol/SKILL.md` before spawning.

```bash
tmux send-keys -t {dev_pane_id} "TASK-{id}-fix: Tests still failing. Findings: {$STEP_3_OUTPUT}. Fix and signal TASK_DONE." Enter
```

Completion signal: `AGENT_SIGNAL::TASK_DONE::dev::{task_id}::fixed::{files_changed}`

---

## Communication Protocol

See [`tmux-protocol`](.agents/skills/tmux-protocol/SKILL.md) for the tmux signal protocol; this skill's default is in-process — Agent tool return value is the sole completion signal.

## Team Registration

When spawning this team, master writes to `_arcwright/_memory/master-orchestrator-sidecar/session-state.md` under `active_team`:
```yaml
active_team:
  code: tdd
  name: "The Forge"
  spawned_at: {ISO8601}
  panes:
    qa: {pane_id}
    dev: {pane_id}
```

## Team Close Protocol

When master needs to close this team:
1. Read pane IDs from `active_team` in `_arcwright/_memory/master-orchestrator-sidecar/session-state.md`
2. Kill each pane directly: `tmux kill-pane -t {pane_id}` (DO NOT send `/exit`)
3. Clear `active_team` from session-state.md

## Kiro CLI

This team is not currently available as a Kiro `subagent` pipeline. Track-level workflows have Kiro pipelines; team orchestration remains Claude Code / tmux for now. A team-level Kiro DAG is planned for a follow-up release.
