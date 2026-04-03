---
name: "team-tdd"
description: "The Forge — TDD pod where QA writes failing tests first, Dev implements to green, QA verifies"
---

# Agent Team: TDD Pod — The Forge

## Team Composition

| Role | Agent | Skills |
|------|-------|--------|
| QA | `bmad-agent-bmm-qa` | Test authoring (failing tests first), playwright-cli, verification |
| Dev | `bmad-agent-bmm-dev` | Implementation to make tests pass |

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

```bash
# 1. Split QA pane (top-right)
tmux split-window -h -c "#{pane_current_path}" "claude --dangerously-skip-permissions 'You are the QA agent in the TDD Pod (The Forge) team managed by Krakken (squid-master). Read and activate: {project-root}/.claude/commands/bmad-agent-bmm-qa.md. In this team you write FAILING tests first from acceptance criteria — do NOT implement. Your task queue comes from the master pane. Before stopping any task output: AGENT_SIGNAL::TASK_DONE::qa::{task_id}::{status}::{summary}. On long tasks emit AGENT_SIGNAL::PROGRESS every 60s. Wait for your first task.'"
sleep 8

# 2. Split Dev pane (bottom-right, below QA)
tmux split-window -v -c "#{pane_current_path}" "claude --dangerously-skip-permissions 'You are the Dev agent in the TDD Pod (The Forge) team managed by Krakken (squid-master). Read and activate: {project-root}/.claude/commands/bmad-agent-bmm-dev.md. In this team you implement ONLY to make QA-authored tests pass — do not add extra functionality. Your task queue comes from the master pane. Before stopping any task output: AGENT_SIGNAL::TASK_DONE::dev::{task_id}::{status}::{summary}. On long tasks emit AGENT_SIGNAL::PROGRESS every 60s. Wait for your first task.'"
sleep 8

# 3. Equalize pane sizes
tmux select-layout tiled
sleep 6
```

## Agent Activation

- **QA**: `Read and activate: {project-root}/.claude/commands/bmad-agent-bmm-qa.md`
  - QA role in this team is test authoring first, verification second. QA does NOT implement features.
- **Dev**: `Read and activate: {project-root}/.claude/commands/bmad-agent-bmm-dev.md`
  - Dev role in this team is implementing only to make QA-authored tests pass — no scope creep.

## Iterative Loop

```
1. Master dispatches spec + acceptance criteria to QA pane
   → tmux send-keys -t {qa_pane_id} "TASK-{id}: Write FAILING tests for: {spec}. Acceptance criteria: {criteria}. Signal TASK_DONE::tests-written with test file paths." Enter

2. QA writes failing tests (they MUST fail before implementation)
   → AGENT_SIGNAL::TASK_DONE::qa::{task_id}::tests-written::{test_file_paths}

3. Master dispatches test files + spec to Dev pane
   → tmux send-keys -t {dev_pane_id} "TASK-{id}: Implement to make these tests pass. Test files: {test_file_paths}. Spec: {spec}. Signal TASK_DONE when all tests green." Enter

4. Dev implements to make tests pass
   → AGENT_SIGNAL::TASK_DONE::dev::{task_id}::implemented::{summary}

5. Master dispatches implementation result back to QA for green verification
   → tmux send-keys -t {qa_pane_id} "TASK-{id}-verify: Verify all tests are now green. Run the test suite. Signal TASK_DONE::pass or TASK_DONE::fail." Enter

6. QA verifies:
   → If all pass: AGENT_SIGNAL::TASK_DONE::qa::{task_id}::pass::All {N} tests green
   → If fail: AGENT_SIGNAL::TASK_DONE::qa::{task_id}::fail::{failing_test_summary}

7a. If PASS: master marks task complete, proceeds to next task

7b. If FAIL: master re-dispatches failing tests to Dev with QA findings
    → tmux send-keys -t {dev_pane_id} "TASK-{id}-fix: Tests still failing. Findings: {qa_summary}. Fix and signal TASK_DONE." Enter
    → Repeat from step 4
```

## Communication Protocol

### Signal Format
```
AGENT_SIGNAL::{TYPE}::{FROM_ROLE}::{TASK_ID}::{STATUS}::{DETAIL}
```
Types: `READY` | `TASK_START` | `PROGRESS` | `TASK_DONE` | `TASK_BLOCKED` | `FINDING` | `ERROR`

Examples:
- `AGENT_SIGNAL::TASK_DONE::qa::task-005::tests-written::frontend/tests/auth.spec.ts, frontend/tests/session.spec.ts`
- `AGENT_SIGNAL::TASK_DONE::dev::task-005::implemented::Auth middleware added, session handling refactored`
- `AGENT_SIGNAL::TASK_DONE::qa::task-005::pass::All 12 tests green`
- `AGENT_SIGNAL::TASK_DONE::qa::task-005::fail::3 tests failing in auth.spec.ts — redirect assertion`

### Master Polling Protocol
After dispatching any task to a pane:
1. `sleep 8` then begin polling
2. Every 30s: `tmux capture-pane -t {pane_id} -p | tail -30 | grep "AGENT_SIGNAL"`
3. On `TASK_DONE`: route next action per Iterative Loop above
4. On `TASK_BLOCKED`: surface to user immediately
5. No signal after 2 min: send `tmux send-keys -t {pane_id} "STATUS_CHECK" Enter`, wait 15s, poll once more
6. Still no signal: mark pane as unresponsive in session file, present recovery options to user

### Heartbeat Rule
Agents on tasks expected to take >90s MUST emit `AGENT_SIGNAL::PROGRESS::{role}::{task_id}::running::{brief_status}` every 60s.

## Team Registration

When spawning this team, master writes to `_bmad/_memory/squid-master-sidecar/session-state.md` under `active_team`:
```yaml
active_team:
  code: tdd
  name: "The Forge"
  spawned_at: {ISO8601}
  panes:
    qa: {pane_id}
    dev: {pane_id}
```

## In-Process Fallback

When `$TMUX` is not set, run agents sequentially using the Agent tool:

1. Spawn QA agent (Agent tool) with spec + acceptance criteria → wait for test files
2. Spawn Dev agent (Agent tool) with test files + spec → wait for implementation
3. Spawn QA agent again (Agent tool) with implementation context → verify tests green
4. If fail: spawn Dev again with QA findings → repeat from step 3
5. When QA signals pass: mark task complete

## Team Close Protocol

When master needs to close this team:
1. Read pane IDs from `active_team` in `_bmad/_memory/squid-master-sidecar/session-state.md`
2. Kill each pane directly: `tmux kill-pane -t {pane_id}` (DO NOT send `/exit`)
3. Clear `active_team` from session-state.md

## Best Used For

- Critical path features (auth, payments, core data flows) where regressions are costly
- New APIs or services where the interface contract needs to be locked in via tests
- Refactors where the existing behavior must be fully preserved and verifiable
- Features with complex acceptance criteria that benefit from being encoded as executable tests
- Situations where the team wants the test suite to serve as living documentation of intent
