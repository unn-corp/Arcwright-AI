---
name: "team-dev-qa"
description: "Dev + QA iterative loop — Dev implements, QA validates with playwright-cli, failures loop back to Dev"
---

# Agent Team: Dev + QA

## Team Composition

| Role | Agent | Skills |
|------|-------|--------|
| Dev | `bmad-agent-bmm-dev` | Full implementation, bug fixes, refactoring |
| QA | `bmad-agent-bmm-qa` | playwright-cli, spec tests, regression testing |

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

```bash
# 1. Split Dev pane (top-right)
tmux split-window -h -c "#{pane_current_path}" "claude --dangerously-skip-permissions 'You are the Dev agent in the Dev+QA team managed by Krakken (squid-master). Read and activate: {project-root}/.claude/commands/bmad-agent-bmm-dev.md. Your task queue comes from the master pane. Before stopping any task output: AGENT_SIGNAL::TASK_DONE::dev::{task_id}::{status}::{summary}. On long tasks emit AGENT_SIGNAL::PROGRESS every 60s. Wait for your first task.'"
sleep 8

# 2. Split QA pane (bottom-right, below Dev)
tmux split-window -v -c "#{pane_current_path}" "claude --dangerously-skip-permissions 'You are the QA agent in the Dev+QA team managed by Krakken (squid-master). Read and activate: {project-root}/.claude/commands/bmad-agent-bmm-qa.md. Your task queue comes from the master pane. Before stopping any task output: AGENT_SIGNAL::TASK_DONE::qa::{task_id}::{pass|fail}::{summary}. On long tasks emit AGENT_SIGNAL::PROGRESS every 60s. Wait for your first task.'"
sleep 8

# 3. Equalize pane sizes
tmux select-layout tiled
sleep 6
```

## Agent Activation

- **Dev**: `Read and activate: {project-root}/.claude/commands/bmad-agent-bmm-dev.md`
- **QA**: `Read and activate: {project-root}/.claude/commands/bmad-agent-bmm-qa.md`

## Task Routing Protocol

No task goes to QA until Dev has signaled completion. No next task goes to Dev until QA has signaled pass.

## Iterative Loop

```
1. Master dispatches implementation task to Dev pane
   → tmux send-keys -t {dev_pane_id} "TASK-{id}: {description}. Signal TASK_DONE when complete." Enter

2. Dev implements
   → AGENT_SIGNAL::TASK_DONE::dev::{task_id}::done::{summary}

3. Master receives Dev TASK_DONE signal
   → Dispatches QA verification task to QA pane with Dev's summary as context
   → tmux send-keys -t {qa_pane_id} "TASK-{id}-qa: Verify implementation. Context: {dev_summary}. Run playwright-cli tests. Signal TASK_DONE with pass or fail." Enter

4. QA runs playwright-cli + spec tests
   → AGENT_SIGNAL::TASK_DONE::qa::{task_id}::{pass|fail}::{summary}

5a. If PASS:
    → Master marks task complete, proceeds to next task (back to step 1)

5b. If FAIL:
    → Master re-dispatches fix task to Dev with QA findings attached
    → tmux send-keys -t {dev_pane_id} "TASK-{id}-fix: QA found failures. Findings: {qa_summary}. Fix and signal TASK_DONE." Enter
    → Repeat from step 2
```

## Communication Protocol

### Signal Format
```
AGENT_SIGNAL::{TYPE}::{FROM_ROLE}::{TASK_ID}::{STATUS}::{DETAIL}
```
Types: `READY` | `TASK_START` | `PROGRESS` | `TASK_DONE` | `TASK_BLOCKED` | `FINDING` | `ERROR`

Examples:
- `AGENT_SIGNAL::TASK_DONE::dev::task-003::done::Auth middleware fixed, 2 files changed`
- `AGENT_SIGNAL::TASK_DONE::qa::task-003::pass::All 8 playwright assertions green`
- `AGENT_SIGNAL::TASK_DONE::qa::task-003::fail::Login redirect broken, assertion failed on /dashboard`

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
  code: dev-qa
  name: "Dev + QA"
  spawned_at: {ISO8601}
  panes:
    dev: {pane_id}
    qa: {pane_id}
```

## In-Process Fallback

When `$TMUX` is not set, run agents sequentially using the Agent tool:

1. Spawn Dev agent (Agent tool) with task → wait for full completion → capture output
2. Spawn QA agent (Agent tool) with task + dev output → wait for full completion → capture result
3. If QA result is fail: spawn Dev again with QA findings → repeat from step 2
4. When QA passes: mark task complete and move to next

## Team Close Protocol

When master needs to close this team:
1. Read pane IDs from `active_team` in `_bmad/_memory/squid-master-sidecar/session-state.md`
2. Kill each pane directly: `tmux kill-pane -t {pane_id}` (DO NOT send `/exit`)
3. Clear `active_team` from session-state.md

## Best Used For

- Standard feature implementation with deterministic pass/fail validation
- Bug fixes that need regression verification
- Any task where QA must confirm correctness before master can proceed
- Sprint execution where each story needs a clean QA sign-off
- UI changes that need playwright-cli navigation and assertion testing
