---
name: "team-sprint"
description: "The Strike Team — SM manages sprint queue, Dev implements stories in sequence, QA validates each before SM marks done"
---

# Agent Team: Sprint — The Strike Team

> **Default orchestration:** in-process via [`claude-subagent-protocol`](.agents/skills/claude-subagent-protocol/SKILL.md). tmux split-pane variant is opt-in (see step blocks).
>
> **Kiro CLI:** this team is available as a Kiro `subagent` pipeline. See `## Kiro Pipeline` at the end of this skill.

## Best Used For

- Executing a well-defined sprint plan with multiple stories end-to-end
- Any workflow where story sequencing, dependency management, and done criteria need a dedicated coordinator
- Sprint execution where QA validation is required per story before advancing the queue
- Teams that want an SM-level view of sprint progress alongside dev and QA execution
- Multi-story workloads that need tracking visibility, not just raw implementation throughput

## Team Composition

| Role | Agent | Skills |
|------|-------|--------|
| SM | `arcwright-sm` | Sprint task queue, story management, progress tracking |
| Dev | `arcwright-dev` | Story implementation |
| QA | `arcwright-qa` | playwright-cli, story acceptance criteria validation |

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

Load `.agents/skills/tmux-protocol/SKILL.md` before running tmux commands. Default path is in-process — no pane operations needed.

#### tmux Variant (when $TMUX is set and user wants visibility)

Load `.agents/skills/tmux-protocol/SKILL.md` before running these commands.

```bash
# 1. Split SM pane (top-right)
tmux split-window -h -c "#{pane_current_path}" "~/.config/tmux/bin/agent_spawn.sh 'You are the SM (Scrum Master) agent in The Strike Team managed by Conductor (master-orchestrator). Read and activate: {project-root}/_arcwright/awm/agents/sm.md. You manage the sprint story queue and track completion. Stories are marked done only after QA validation. Your task queue comes from the master pane. Before stopping any task output: AGENT_SIGNAL::TASK_DONE::sm::{task_id}::{status}::{summary}. On long tasks emit AGENT_SIGNAL::PROGRESS every 60s. Wait for your first task.'"
sleep 8

# 2. Split Dev pane (mid-right)
tmux split-window -v -c "#{pane_current_path}" "~/.config/tmux/bin/agent_spawn.sh 'You are the Dev agent in The Strike Team managed by Conductor (master-orchestrator). Read and activate: {project-root}/_arcwright/awm/agents/dev.md. Your task queue comes from the master pane. Before stopping any task output: AGENT_SIGNAL::TASK_DONE::dev::{task_id}::{status}::{summary}. On long tasks emit AGENT_SIGNAL::PROGRESS every 60s. Wait for your first task.'"
sleep 8

# 3. Split QA pane (bottom-right)
tmux split-window -v -c "#{pane_current_path}" "~/.config/tmux/bin/agent_spawn.sh 'You are the QA agent in The Strike Team managed by Conductor (master-orchestrator). Read and activate: {project-root}/_arcwright/awm/agents/qa.md. Validate each story against its acceptance criteria using playwright-cli. Your task queue comes from the master pane. Before stopping any task output: AGENT_SIGNAL::TASK_DONE::qa::{task_id}::{pass|fail}::{summary}. On long tasks emit AGENT_SIGNAL::PROGRESS every 60s. Wait for your first task.'"
sleep 8

# 4. Equalize pane sizes
tmux select-layout tiled
sleep 6
```

## Agent Activation

> **Project context**: Master passes the `## Project Context` block (from its activation scan) to each agent in their first task message. Agents receive context from master — they do not re-scan independently.

- **SM**: activate `arcwright-sm`
- **Dev**: activate `arcwright-dev`
- **QA**: activate `arcwright-qa`

## Steps

Master initializes the sprint by handing the sprint plan to SM, then the SM drives the sequence through master.

### 1. Sprint Initialization

**What this step does:** SM receives the sprint plan, organizes the story queue, and signals the first story to implement.
**Inputs:** Sprint plan from master
**Output:** `$STEP_1_OUTPUT` — first story details and queue order

---

#### Default: In-Process (Agent tool)

```json
{
  "name": "Agent",
  "input": {
    "subagent_type": "arcwright-sm",
    "prompt": "Initialize the sprint. Review the sprint plan, organize the story queue by priority and dependencies, and identify the first story to implement.\n\n## Inputs\nSprint plan: {sprint_plan}\n\n## Output\nFirst story details: story ID, description, acceptance criteria. Queue order for remaining stories.",
    "model": "sonnet"
  }
}
```

Capture result into `$STEP_1_OUTPUT`. Pass first story details to step 2.

---

#### tmux Variant (when $TMUX is set and user wants visibility)

Load `.agents/skills/tmux-protocol/SKILL.md` before spawning.

```bash
tmux send-keys -t {sm_pane_id} "TASK-init: Here is the sprint plan. Manage the story queue. Stories: {sprint_plan}. Signal TASK_DONE::next-story with the first story to implement." Enter
```

Completion signal: `AGENT_SIGNAL::TASK_DONE::sm::queue::next-story::{story_id}::{story_summary}`

---

### 2. Story Implementation

**What this step does:** Dev implements the current story from the sprint queue.
**Inputs:** `$STEP_1_OUTPUT` or previous SM `$STEP_N_SM_OUTPUT` (story details + acceptance criteria)
**Output:** `$STEP_2_OUTPUT` — implementation complete, files changed

---

#### Default: In-Process (Agent tool)

```json
{
  "name": "Agent",
  "input": {
    "subagent_type": "arcwright-dev",
    "prompt": "Implement the sprint story completely.\n\n## Inputs\nStory: {story_details}\nAcceptance criteria: {criteria}\n\n## Output\nImplementation complete. List all files changed.",
    "model": "sonnet"
  }
}
```

Capture result into `$STEP_2_OUTPUT`. Pass to step 3.

---

#### tmux Variant (when $TMUX is set and user wants visibility)

Load `.agents/skills/tmux-protocol/SKILL.md` before spawning.

```bash
tmux send-keys -t {dev_pane_id} "TASK-{story_id}: Implement story: {story_details}. Acceptance criteria: {criteria}. Signal TASK_DONE when complete." Enter
```

Completion signal: `AGENT_SIGNAL::TASK_DONE::dev::{story_id}::done::{summary}`

---

### 3. Story QA Validation

**What this step does:** QA validates the story implementation against acceptance criteria using playwright-cli.
**Inputs:** `$STEP_2_OUTPUT` (implementation summary) + acceptance criteria
**Output:** `$STEP_3_OUTPUT` — pass or fail with findings

---

#### Default: In-Process (Agent tool)

```json
{
  "name": "Agent",
  "input": {
    "subagent_type": "arcwright-qa",
    "prompt": "Validate this story implementation against its acceptance criteria. Use playwright-cli to verify functional behavior.\n\n## Inputs\nImplementation: {$STEP_2_OUTPUT}\nAcceptance criteria: {criteria}\n\n## Output\nPass or fail verdict with test results summary and specific failures (if any).",
    "model": "sonnet"
  }
}
```

Capture result into `$STEP_3_OUTPUT`. If pass: proceed to step 4. If fail: pass to step 3b.

---

#### tmux Variant (when $TMUX is set and user wants visibility)

Load `.agents/skills/tmux-protocol/SKILL.md` before spawning.

```bash
tmux send-keys -t {qa_pane_id} "TASK-{story_id}-qa: Validate story implementation. Acceptance criteria: {criteria}. Use playwright-cli to verify. Signal TASK_DONE with pass or fail." Enter
```

Completion signal: `AGENT_SIGNAL::TASK_DONE::qa::{story_id}::{pass|fail}::{summary}`

---

### 3b. Story Fix (conditional — only if step 3 failed)

**What this step does:** Dev fixes QA failures and restarts the QA loop for this story.
**Inputs:** `$STEP_3_OUTPUT` (QA findings)
**Output:** `$STEP_3B_OUTPUT` — fix complete. Return to step 3.

---

#### Default: In-Process (Agent tool)

```json
{
  "name": "Agent",
  "input": {
    "subagent_type": "arcwright-dev",
    "prompt": "Fix the QA failures for this story.\n\n## Inputs\nQA findings: {$STEP_3_OUTPUT}\n\n## Output\nFix complete. List all files changed.",
    "model": "sonnet"
  }
}
```

Capture result into `$STEP_3B_OUTPUT`. Return to step 3 (QA re-validates). When QA passes: proceed to step 4.

---

#### tmux Variant (when $TMUX is set and user wants visibility)

Load `.agents/skills/tmux-protocol/SKILL.md` before spawning.

```bash
tmux send-keys -t {dev_pane_id} "TASK-{story_id}-fix: QA findings. Fix: {$STEP_3_OUTPUT}. Signal TASK_DONE." Enter
```

Completion signal: `AGENT_SIGNAL::TASK_DONE::dev::{story_id}::fixed::{files_changed}`

---

### 4. Story Completion + Next Story

**What this step does:** SM marks the story done and signals the next story (or sprint complete if queue is empty).
**Inputs:** QA pass signal from step 3 + story ID
**Output:** `$STEP_4_OUTPUT` — next story details OR sprint complete signal

---

#### Default: In-Process (Agent tool)

```json
{
  "name": "Agent",
  "input": {
    "subagent_type": "arcwright-sm",
    "prompt": "Story {story_id} passed QA. Mark it done and provide the next story from the queue, or signal sprint complete if all stories are done.\n\n## Inputs\nCompleted story: {story_id}\nRemaining queue: {queue_state}\n\n## Output\nNext story details: story ID, description, acceptance criteria. OR: 'Sprint complete: all N stories done.'",
    "model": "sonnet"
  }
}
```

Capture result into `$STEP_4_OUTPUT`. If next story: return to step 2 with new story. If sprint complete: present summary to user. Final output — no next step.

---

#### tmux Variant (when $TMUX is set and user wants visibility)

Load `.agents/skills/tmux-protocol/SKILL.md` before spawning.

```bash
tmux send-keys -t {sm_pane_id} "Story {story_id} passed QA. Mark done and signal next story." Enter
```

Completion signal: `AGENT_SIGNAL::TASK_DONE::sm::queue::next-story::{story_id}::{summary}` or `AGENT_SIGNAL::TASK_DONE::sm::sprint::complete::All {N} stories done`

---

## Communication Protocol

See [`tmux-protocol`](.agents/skills/tmux-protocol/SKILL.md) for the tmux signal protocol; this skill's default is in-process — Agent tool return value is the sole completion signal.

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

## Team Close Protocol

When master needs to close this team:
1. Read pane IDs from `active_team` in `_arcwright/_memory/master-orchestrator-sidecar/session-state.md`
2. Kill each pane directly: `tmux kill-pane -t {pane_id}` (DO NOT send `/exit`)
3. Clear `active_team` from session-state.md

## Kiro Pipeline

> Note: This pipeline represents one story iteration of the sprint loop (initialize queue, implement one story, QA validate, SM mark done). Re-invoke for each subsequent story in the sprint queue.

Use the `subagent` tool to run this team as a Kiro pipeline.

```json
{
  "task": "Execute one sprint story: SM initializes and identifies the story, Dev implements, QA validates, Dev fixes failures, SM marks done.",
  "stages": [
    {
      "name": "sprint-init",
      "role": "arcwright-sm",
      "prompt_template": "Initialize the sprint. Review the sprint plan, organize the story queue by priority and dependencies, and identify the first story to implement: {task}",
      "depends_on": []
    },
    {
      "name": "dev-impl",
      "role": "arcwright-dev",
      "prompt_template": "Implement the sprint story completely per the acceptance criteria: {task}",
      "depends_on": ["sprint-init"]
    },
    {
      "name": "qa-validate",
      "role": "arcwright-qa",
      "prompt_template": "Validate the story implementation against acceptance criteria. Use playwright-cli to verify functional behavior: {task}",
      "depends_on": ["dev-impl"]
    },
    {
      "name": "dev-fix",
      "role": "arcwright-dev",
      "prompt_template": "Fix the QA failures for this story: {task}",
      "depends_on": ["qa-validate"]
    },
    {
      "name": "sm-mark-done",
      "role": "arcwright-sm",
      "prompt_template": "Story passed QA. Mark it done and provide the next story from the queue, or signal sprint complete if all stories are done: {task}",
      "depends_on": ["dev-fix"]
    }
  ]
}
```
