---
name: "team-ux-qa"
description: "The Atelier — UX Designer implements (can write code), QA validates live UI with playwright-cli, loop until clean"
---

# Agent Team: UX + QA — The Atelier

## tmux Protocol

If `$TMUX` is set, load `.agents/skills/tmux-protocol/SKILL.md` before any pane operations.


## Team Composition

| Role | Agent | Skills |
|------|-------|--------|
| UX Designer | `arcwright-agent-awm-ux-designer` | Design, implementation (can write code), full dev skill access |
| QA | `arcwright-agent-awm-qa` | playwright-cli, visual + functional UI validation |

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

```bash
# 1. Split UX Designer pane (top-right)
tmux split-window -h -c "#{pane_current_path}" "~/.config/tmux/bin/agent_spawn.sh 'You are the UX Designer agent in The Atelier team managed by Conductor (master-orchestrator). Read and activate: {project-root}/.claude/commands/arcwright-agent-awm-ux-designer.md. You have full dev skill access and can write code directly — you are not limited to design artifacts. Your task queue comes from the master pane. Before stopping any task output: AGENT_SIGNAL::TASK_DONE::ux::{task_id}::{status}::{summary}. On long tasks emit AGENT_SIGNAL::PROGRESS every 60s. Wait for your first task.'"
sleep 8

# 2. Split QA pane (bottom-right, below UX)
tmux split-window -v -c "#{pane_current_path}" "~/.config/tmux/bin/agent_spawn.sh 'You are the QA agent in The Atelier team managed by Conductor (master-orchestrator). Read and activate: {project-root}/.claude/commands/arcwright-agent-awm-qa.md. Use playwright-cli to navigate the live UI and assert visual correctness and functional behavior. Your task queue comes from the master pane. Before stopping any task output: AGENT_SIGNAL::TASK_DONE::qa::{task_id}::{pass|fail}::{summary}. On long tasks emit AGENT_SIGNAL::PROGRESS every 60s. Wait for your first task.'"
sleep 8

# 3. Equalize pane sizes
tmux select-layout tiled
sleep 6
```

## Agent Activation

> **Project context**: Master passes the `## Project Context` block (from its activation scan) to each agent in their first task message. Agents receive context from master — they do not re-scan independently.

- **UX Designer**: `Read and activate: {project-root}/.claude/commands/arcwright-agent-awm-ux-designer.md`
  - Has **full dev skill access** — can write code directly, not limited to wireframes or specs. Can invoke any skill in `.agents/skills/`.
- **QA**: `Read and activate: {project-root}/.claude/commands/arcwright-agent-awm-qa.md`

## Iterative Loop

```
1. Master dispatches design/implementation task to UX Designer
   → tmux send-keys -t {ux_pane_id} "TASK-{id}: Design and implement: {description}. Acceptance criteria: {criteria}. Signal TASK_DONE when complete." Enter

2. UX Designer designs and/or implements (can write code directly)
   → AGENT_SIGNAL::TASK_DONE::ux::{task_id}::done::{summary_of_changes}

3. Master dispatches QA validation task with acceptance criteria
   → tmux send-keys -t {qa_pane_id} "TASK-{id}-qa: Validate live UI using playwright-cli. Assert: {criteria}. Navigate to affected areas and verify visual + functional correctness. Signal TASK_DONE with pass or fail." Enter

4. QA navigates live UI via playwright-cli
   → AGENT_SIGNAL::TASK_DONE::qa::{task_id}::pass::All visual and functional assertions green
   → OR: AGENT_SIGNAL::TASK_DONE::qa::{task_id}::fail::{failed_assertions}

5a. If PASS: master marks task complete, proceeds to next task

5b. If FAIL:
    → Master re-dispatches QA findings to UX Designer for revision
    → tmux send-keys -t {ux_pane_id} "TASK-{id}-revise: QA found issues. Findings: {qa_summary}. Revise and signal TASK_DONE." Enter
    → Repeat from step 2
```

## Communication Protocol

### Signal Format
```
AGENT_SIGNAL::{TYPE}::{FROM_ROLE}::{TASK_ID}::{STATUS}::{DETAIL}
```
Types: `READY` | `TASK_START` | `PROGRESS` | `TASK_DONE` | `TASK_BLOCKED` | `FINDING` | `ERROR`

Examples:
- `AGENT_SIGNAL::TASK_DONE::ux::task-015::done::Card component redesigned, 2 files changed`
- `AGENT_SIGNAL::TASK_DONE::qa::task-015::pass::Responsive layout verified at 3 breakpoints, all assertions green`
- `AGENT_SIGNAL::TASK_DONE::qa::task-015::fail::Mobile breakpoint collapses incorrectly at 375px`

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

## In-Process Fallback

When `$TMUX` is not set, run agents sequentially using the Agent tool:

1. Spawn UX Designer agent (Agent tool) with task → wait for implementation output
2. Spawn QA agent (Agent tool) with acceptance criteria → wait for validation result
3. If QA fail: spawn UX Designer again with QA findings → repeat from step 2
4. When QA passes: mark task complete

## Team Close Protocol

When master needs to close this team:
1. Read pane IDs from `active_team` in `_arcwright/_memory/master-orchestrator-sidecar/session-state.md`
2. Kill each pane directly: `tmux kill-pane -t {pane_id}` (DO NOT send `/exit`)
3. Clear `active_team` from session-state.md

## Best Used For

- UI feature implementation where design intent must be verified through live browser behavior
- Component redesigns, theming changes, or responsive layout work
- Accessibility improvements where playwright-cli assertions confirm WCAG compliance
- Any task where a UX Designer writing code directly is more efficient than design→dev handoff
- Design system compliance checks that need functional validation, not just visual inspection
