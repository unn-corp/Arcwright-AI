---
name: "team-sprint"
description: "The Strike Team — SM manages sprint queue, Dev implements stories in sequence, QA validates each before SM marks done"
---

# Agent Team: Sprint — The Strike Team

## tmux Protocol

If `$TMUX` is set, load `.agents/skills/tmux-protocol/SKILL.md` before any pane operations.


## Team Composition

| Role | Agent | Skills |
|------|-------|--------|
| SM | `arcwright-agent-awm-sm` | Sprint task queue, story management, progress tracking |
| Dev | `arcwright-agent-awm-dev` | Story implementation |
| QA | `arcwright-agent-awm-qa` | playwright-cli, story acceptance criteria validation |

## Purpose

The Strike Team runs a full sprint execution cycle with an SM coordinating the queue. The SM manages stories from the sprint plan, ensuring they are dispatched to Dev in the correct order and marked complete only after QA validation. Dev implements each story. QA validates against acceptance criteria before the SM marks the story done and moves to the next. Use this team when you have a sprint plan ready and want structured, sequential story execution with tracking.

## Layout (tmux)

```
┌─────────┬───────────┐
│         │    SM     │
│ Master  ├───────────┤
│ (left)  │    Dev    │
│         ├───────────┤
│         │    QA     │
└─────────┴───────────┘
```

## Spawn Sequence

```bash
# 1. Split SM pane (top-right)
tmux split-window -h -c "#{pane_current_path}" "~/.config/tmux/bin/agent_spawn.sh 'You are the SM (Scrum Master) agent in The Strike Team managed by Conductor (master-orchestrator). Read and activate: {project-root}/.claude/commands/arcwright-agent-awm-sm.md. You manage the sprint story queue and track completion. Stories are marked done only after QA validation. Your task queue comes from the master pane. Before stopping any task output: AGENT_SIGNAL::TASK_DONE::sm::{task_id}::{status}::{summary}. On long tasks emit AGENT_SIGNAL::PROGRESS every 60s. Wait for your first task.'"
sleep 8

# 2. Split Dev pane (mid-right)
tmux split-window -v -c "#{pane_current_path}" "~/.config/tmux/bin/agent_spawn.sh 'You are the Dev agent in The Strike Team managed by Conductor (master-orchestrator). Read and activate: {project-root}/.claude/commands/arcwright-agent-awm-dev.md. Your task queue comes from the master pane. Before stopping any task output: AGENT_SIGNAL::TASK_DONE::dev::{task_id}::{status}::{summary}. On long tasks emit AGENT_SIGNAL::PROGRESS every 60s. Wait for your first task.'"
sleep 8

# 3. Split QA pane (bottom-right)
tmux split-window -v -c "#{pane_current_path}" "~/.config/tmux/bin/agent_spawn.sh 'You are the QA agent in The Strike Team managed by Conductor (master-orchestrator). Read and activate: {project-root}/.claude/commands/arcwright-agent-awm-qa.md. Validate each story against its acceptance criteria using playwright-cli. Your task queue comes from the master pane. Before stopping any task output: AGENT_SIGNAL::TASK_DONE::qa::{task_id}::{pass|fail}::{summary}. On long tasks emit AGENT_SIGNAL::PROGRESS every 60s. Wait for your first task.'"
sleep 8

# 4. Equalize pane sizes
tmux select-layout tiled
sleep 6
```

## Agent Activation

- **SM**: `Read and activate: {project-root}/.claude/commands/arcwright-agent-awm-sm.md`
- **Dev**: `Read and activate: {project-root}/.claude/commands/arcwright-agent-awm-dev.md`
- **QA**: `Read and activate: {project-root}/.claude/commands/arcwright-agent-awm-qa.md`

## Task Routing Protocol

Master initializes the sprint by handing the sprint plan to the SM, then the SM drives the sequence through master:

### Initialization
```bash
tmux send-keys -t {sm_pane_id} "TASK-init: Here is the sprint plan. Manage the story queue. Stories: {sprint_plan}. Signal TASK_DONE::next-story with the first story to implement." Enter
```

### Sprint Loop
```
1. SM signals the next story to implement
   → AGENT_SIGNAL::TASK_DONE::sm::queue::next-story::{story_id}::{story_summary}

2. Master dispatches story to Dev
   → tmux send-keys -t {dev_pane_id} "TASK-{story_id}: Implement story: {story_details}. Acceptance criteria: {criteria}. Signal TASK_DONE when complete." Enter

3. Dev implements the story
   → AGENT_SIGNAL::TASK_DONE::dev::{story_id}::done::{summary}

4. Master dispatches to QA for validation against acceptance criteria
   → tmux send-keys -t {qa_pane_id} "TASK-{story_id}-qa: Validate story implementation. Acceptance criteria: {criteria}. Use playwright-cli to verify. Signal TASK_DONE with pass or fail." Enter

5. QA validates
   → AGENT_SIGNAL::TASK_DONE::qa::{story_id}::pass::All acceptance criteria met
   → OR: AGENT_SIGNAL::TASK_DONE::qa::{story_id}::fail::{failing_criteria}

6a. If QA PASS:
    → Master notifies SM: story {story_id} complete
    → tmux send-keys -t {sm_pane_id} "Story {story_id} passed QA. Mark done and signal next story." Enter
    → Repeat from step 1

6b. If QA FAIL:
    → Master re-dispatches to Dev with QA findings
    → tmux send-keys -t {dev_pane_id} "TASK-{story_id}-fix: QA findings. Fix: {qa_findings}. Signal TASK_DONE." Enter
    → Repeat from step 3

7. When SM signals no more stories:
   → AGENT_SIGNAL::TASK_DONE::sm::sprint::complete::All {N} stories done
   → Master presents sprint completion summary to user
```

## Communication Protocol

### Signal Format
```
AGENT_SIGNAL::{TYPE}::{FROM_ROLE}::{TASK_ID}::{STATUS}::{DETAIL}
```
Types: `READY` | `TASK_START` | `PROGRESS` | `TASK_DONE` | `TASK_BLOCKED` | `FINDING` | `ERROR`

Examples:
- `AGENT_SIGNAL::TASK_DONE::sm::queue::next-story::story-005::Add pagination to user list`
- `AGENT_SIGNAL::TASK_DONE::dev::story-005::done::Pagination implemented, 3 files changed`
- `AGENT_SIGNAL::TASK_DONE::qa::story-005::pass::Pagination verified at 10/25/50 items per page`
- `AGENT_SIGNAL::TASK_DONE::sm::sprint::complete::6/6 stories done`

### Master Polling Protocol
After dispatching any task to a pane:
1. `sleep 8` then begin polling
2. Every 30s: `tmux capture-pane -t {pane_id} -p | tail -30 | grep "AGENT_SIGNAL"`
3. On `TASK_DONE`: route next action per Sprint Loop above
4. On `TASK_BLOCKED`: surface to user immediately
5. No signal after 2 min: send `tmux send-keys -t {pane_id} "STATUS_CHECK" Enter`, wait 15s, poll once more
6. Still no signal: mark pane as unresponsive in session file, present recovery options to user

### Heartbeat Rule
Agents on tasks expected to take >90s MUST emit `AGENT_SIGNAL::PROGRESS::{role}::{task_id}::running::{brief_status}` every 60s.

## Team Registration

When spawning this team, master writes to `_arcwright/_memory/master-orchestrator-sidecar/session-state.md` under `active_team`:
```yaml
active_team:
  code: sprint
  name: "The Strike Team"
  spawned_at: {ISO8601}
  panes:
    sm: {pane_id}
    dev: {pane_id}
    qa: {pane_id}
```

## In-Process Fallback

When `$TMUX` is not set, run agents sequentially using the Agent tool:

1. Spawn SM agent (Agent tool) with sprint plan → get first story
2. Spawn Dev agent (Agent tool) with story → wait for implementation
3. Spawn QA agent (Agent tool) with story + criteria → wait for validation result
4. If QA fail: spawn Dev again with findings → repeat from step 3
5. If QA pass: notify SM, get next story → repeat from step 2
6. When SM signals sprint complete: present summary

## Team Close Protocol

When master needs to close this team:
1. Read pane IDs from `active_team` in `_arcwright/_memory/master-orchestrator-sidecar/session-state.md`
2. Kill each pane directly: `tmux kill-pane -t {pane_id}` (DO NOT send `/exit`)
3. Clear `active_team` from session-state.md

## Best Used For

- Executing a well-defined sprint plan with multiple stories end-to-end
- Any workflow where story sequencing, dependency management, and done criteria need a dedicated coordinator
- Sprint execution where QA validation is required per story before advancing the queue
- Teams that want an SM-level view of sprint progress alongside dev and QA execution
- Multi-story workloads that need tracking visibility, not just raw implementation throughput
