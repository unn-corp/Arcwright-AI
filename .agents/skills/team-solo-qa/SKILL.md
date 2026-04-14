---
name: "team-solo-qa"
description: "The Inquisitor — single QA agent for regression runs, playwright-cli sessions, and pass/fail reports"
---

# Agent Team: Solo QA — The Inquisitor

## tmux Protocol

If `$TMUX` is set, load `.agents/skills/tmux-protocol/SKILL.md` before any pane operations.


## Team Composition

| Role | Agent | Skills |
|------|-------|--------|
| QA | `arcwright-agent-awm-qa` | playwright-cli, regression testing, spec tests, pass/fail reporting |

## Purpose

The Inquisitor is a single QA agent for standalone test execution. No Dev, no Architect — just QA running tests and reporting results. Use this team when you want to run regression tests against existing code, validate a deployed environment, or run a targeted playwright-cli session without any implementation work attached. The Inquisitor signals master with structured pass/fail reports that can be fed into a subsequent decision or another team.

## Layout (tmux)

```
┌─────────┬───────────┐
│         │           │
│ Master  │    QA     │
│ (left)  │ (Inq.)    │
└─────────┴───────────┘
```

## Spawn Sequence

```bash
# 1. Split QA pane (right)
tmux split-window -h -c "#{pane_current_path}" "~/.config/tmux/bin/agent_spawn.sh 'You are the QA agent (The Inquisitor) managed by Conductor (master-orchestrator). Read and activate: {project-root}/.claude/commands/arcwright-agent-awm-qa.md. Use playwright-cli for UI/API testing. Your task queue comes from the master pane. Before stopping any task output: AGENT_SIGNAL::TASK_DONE::qa::{task_id}::{pass|fail}::{summary}. On long tasks emit AGENT_SIGNAL::PROGRESS every 60s. Wait for your first task.'"
sleep 8

# 2. Equalize pane sizes
tmux select-layout tiled
sleep 6
```

## Agent Activation

> **Project context**: Master passes the `## Project Context` block (from its activation scan) to each agent in their first task message. Agents receive context from master — they do not re-scan independently.

- **QA**: `Read and activate: {project-root}/.claude/commands/arcwright-agent-awm-qa.md`

## Task Routing Protocol

Single agent, no loop. Master queues test tasks and dispatches one at a time:

1. Master dispatches test task to QA
2. QA runs tests and produces a structured pass/fail report → `TASK_DONE`
3. Master receives report, presents to user or routes findings to a fix team
4. Master dispatches next queued task

```bash
# Dispatch a test task
tmux send-keys -t {qa_pane_id} "TASK-{id}: {test_scope}. Test approach: {playwright-cli|spec-files|both}. Signal TASK_DONE with pass or fail and a structured report." Enter
```

QA report format (emitted before `TASK_DONE`):
```
QA REPORT [{task_id}]
Scope: {areas_tested}
Passed: {N}
Failed: {N}
Failures:
  - {failure_1_description}
  - {failure_2_description}
```

## Communication Protocol

### Signal Format
```
AGENT_SIGNAL::{TYPE}::{FROM_ROLE}::{TASK_ID}::{STATUS}::{DETAIL}
```
Types: `READY` | `TASK_START` | `PROGRESS` | `TASK_DONE` | `TASK_BLOCKED` | `FINDING` | `ERROR`

Examples:
- `AGENT_SIGNAL::TASK_DONE::qa::task-090::pass::All 24 regression assertions green`
- `AGENT_SIGNAL::TASK_DONE::qa::task-091::fail::3 failures — login redirect, pagination, image upload`
- `AGENT_SIGNAL::PROGRESS::qa::task-090::running::Tested auth flows (8/24), proceeding to dashboard flows`

### Master Polling Protocol
After dispatching any task to a pane:
1. `sleep 8` then begin polling
2. Every 30s: `tmux capture-pane -t {pane_id} -p | tail -30 | grep "AGENT_SIGNAL"`
3. On `TASK_DONE::pass`: present report to user, dispatch next queued task
4. On `TASK_DONE::fail`: present report with failures to user for triage decision
5. On `TASK_BLOCKED`: surface to user immediately
6. No signal after 2 min: send `tmux send-keys -t {pane_id} "STATUS_CHECK" Enter`, wait 15s, poll once more
7. Still no signal: mark pane as unresponsive in session file, present recovery options to user

### Heartbeat Rule
Agents on tasks expected to take >90s MUST emit `AGENT_SIGNAL::PROGRESS::qa::{task_id}::running::{brief_status}` every 60s.

## Team Registration

When spawning this team, master writes to `_arcwright/_memory/master-orchestrator-sidecar/session-state.md` under `active_team`:
```yaml
active_team:
  code: solo-qa
  name: "The Inquisitor"
  spawned_at: {ISO8601}
  panes:
    qa: {pane_id}
```

## In-Process Fallback

When `$TMUX` is not set, run the agent using the Agent tool:

1. Spawn QA agent (Agent tool) with test task → wait for pass/fail report
2. Capture report, present to user or route failures to a fix team
3. Spawn again for next queued task if needed

## Team Close Protocol

When master needs to close this team:
1. Read pane ID from `active_team` in `_arcwright/_memory/master-orchestrator-sidecar/session-state.md`
2. Kill the pane directly: `tmux kill-pane -t {pane_id}` (DO NOT send `/exit`)
3. Clear `active_team` from session-state.md

## Best Used For

- Regression test runs against a deployed environment or after a merge
- Validating a specific UI flow or API behavior with playwright-cli without any implementation work
- Pre-release smoke tests to confirm critical paths are intact
- Generating a structured test report to feed into a triage decision or another team
- Standalone QA work that doesn't need to be paired with a Dev agent
