---
name: "team-sprint"
description: "The Strike Team — in-process SM + Dev + QA loop. SM manages sprint queue (reused across stories), Dev implements each story, QA validates, SM marks done. herdr pane visibility is opt-in only."
allowed-tools: Read, Grep, Glob, Write, Edit, Agent, SendMessage, Bash
---

# Agent Team: Sprint — The Strike Team

> **Default orchestration:** in-process via [`claude-subagent-protocol`](.agents/skills/claude-subagent-protocol/SKILL.md). herdr pane variant is offered when `$HERDR_ENV` is set (spawn each role in its own pane in the current session) (see step blocks).
>
> **Kiro CLI:** this team is available as a Kiro `subagent` pipeline. See `## Kiro Pipeline` at the end of this skill.

## Best Used For

- Executing a well-defined sprint plan with multiple stories end-to-end
- Any workflow where story sequencing, dependency management, and done criteria need a dedicated coordinator
- Sprint execution where QA validation is required per story before advancing the queue
- Teams that want an SM-level view of sprint progress alongside dev and QA execution
- Multi-story workloads that need tracking visibility, not just raw implementation throughput

## Team Composition

| Role | Agent | Default Model |
|------|-------|---------------|
| SM | `arcwright-sm` | sonnet |
| Dev | `arcwright-dev` | sonnet |
| QA | `arcwright-qa` | sonnet |

## Model Strategy (sonnet-first + permission gate)

Default model for every spawn in this team is `sonnet`. Use `opus` only when the user
explicitly approves an upgrade; otherwise stay on `sonnet`. The skill asks the user
before any opus spawn or effort upgrade. See
[`claude-subagent-protocol` §6.3](.agents/skills/claude-subagent-protocol/SKILL.md#63-permission-before-opus--permission-before-effort-upgrade-mandatory)
for the full rule and the question format.

## Agent Registry

When this team is spawned, master creates the Session Agent Registry at:

```
_arcwright-output/sessions/<session-id>/agent-registry.md
```

| Role | Agent ID | Spawned | Last Task | Notes |
|------|----------|---------|-----------|-------|
| sm | `<assigned on first spawn>` | `<ISO>` | sprint init | reused on every step 4 (next-story) |
| dev | `<assigned on first spawn>` | `<ISO>` | first story implementation | reused on step 2 ↔ 3b fix loop |
| qa | `<assigned on first spawn>` | `<ISO>` | first story validation | reused on step 3 ↔ 3b fix loop |

Registry path, format, and lifecycle follow
[`claude-subagent-protocol` §3](.agents/skills/claude-subagent-protocol/SKILL.md#3-session-agent-registry-the-structural-change).
Roles `sm`, `dev`, and `qa` are the only ones this team uses. `claude agents --json`
is the observability tool; the registry file is the source of truth for SendMessage
dispatch.

## Purpose

The Strike Team runs a full sprint execution cycle with an SM coordinating the queue. The SM manages stories from the sprint plan, ensuring they are dispatched to Dev in the correct order and marked complete only after QA validation. Dev implements each story. QA validates against acceptance criteria before the SM marks the story done and moves to the next. Use this team when you have a sprint plan ready and want structured, sequential story execution with tracking.

## Spawn-once + Reuse

This is the canonical pattern for this team. Each role is **spawned on first use** and
its `agentId` recorded in the Session Agent Registry. Subsequent steps for the same
role use `SendMessage` to that existing agent — never re-spawn. See
[`claude-subagent-protocol` §4.2](.agents/skills/claude-subagent-protocol/SKILL.md#42-reuse-sendmessage--replaces-re-spawn-for-known-roles)
for the full Reuse (SendMessage) pattern.

**First use → Agent tool + write registry row. Later use → SendMessage to the row's `agentId`.**

### Reuse pattern for the sprint loop

The SM agent is the most-reused role in this team — it is dispatched at the start
(step 1) and at the end of every story (step 4) to mark done and surface the next
story. **Reuse the existing SM agent via SendMessage** for every step 4; the SM
already holds the sprint plan, the queue state, and the done/remaining counts.

Dev and QA reuse follows the standard pattern: first spawn per role records the
`agentId`; the fix-pass loop in step 3 ↔ 3b uses `SendMessage` to the existing IDs.
QA reuse on the fix pass re-validates the same story with the same acceptance
criteria — re-engage the existing QA agent with the new test target via
`SendMessage`.

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

**First SM use:** spawn via Agent tool. Capture the returned `agentId` into the
registry `sm` row. The same SM is reused at step 4 (next-story) for the rest of
the sprint.

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

> For opt-in pane visibility, see the `herdr` skill's "Watching agents in panes (opt-in)" section (spawn with `herdr agent start`, wait with `herdr wait agent-status`). The pane is a viewing surface; the in-process orchestration inside it still uses Agent tool + SendMessage.

---

### 2. Story Implementation

**What this step does:** Dev implements the current story from the sprint queue.
**Inputs:** `$STEP_1_OUTPUT` or previous SM `$STEP_N_SM_OUTPUT` (story details + acceptance criteria)
**Output:** `$STEP_2_OUTPUT` — implementation complete, files changed

**First Dev use:** spawn via Agent tool. Capture the returned `agentId` into the
registry `dev` row. Subsequent stories and the fix-pass loop reuse this row via
`SendMessage`.

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

> For opt-in pane visibility, see the `herdr` skill's "Watching agents in panes (opt-in)" section (spawn with `herdr agent start`, wait with `herdr wait agent-status`). The pane is a viewing surface; the in-process orchestration inside it still uses Agent tool + SendMessage.

---

### 3. Story QA Validation

**What this step does:** QA validates the story implementation against acceptance criteria using playwright-cli.
**Inputs:** `$STEP_2_OUTPUT` (implementation summary) + acceptance criteria
**Output:** `$STEP_3_OUTPUT` — pass or fail with findings

**First QA use:** spawn via Agent tool. Capture the returned `agentId` into the
registry `qa` row. Subsequent stories and the fix-pass loop reuse this row via
`SendMessage` — re-engage the existing QA agent with the new test target.

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

> For opt-in pane visibility, see the `herdr` skill's "Watching agents in panes (opt-in)" section (spawn with `herdr agent start`, wait with `herdr wait agent-status`). The pane is a viewing surface; the in-process orchestration inside it still uses Agent tool + SendMessage.

---

### 3b. Story Fix (conditional — only if step 3 failed)

**What this step does:** Dev fixes QA failures and restarts the QA loop for this story.
**Inputs:** `$STEP_3_OUTPUT` (QA findings)
**Output:** `$STEP_3B_OUTPUT` — fix complete. Return to step 3.

The Dev agent already exists in the registry. **SendMessage** to its existing
`agentId` — do not re-spawn Dev.

```json
{
  "name": "SendMessage",
  "input": {
    "to": "<dev.agentId from registry>",
    "prompt": "Fix the QA failures for this story.\n\n## Inputs\nQA findings: {$STEP_3_OUTPUT}\n\n## Output\nFix complete. List all files changed."
  }
}
```

Capture result into `$STEP_3B_OUTPUT`. Return to step 3 (re-engage the existing QA agent via `SendMessage` to re-validate). When QA passes: proceed to step 4.

> For opt-in pane visibility, see the `herdr` skill's "Watching agents in panes (opt-in)" section (spawn with `herdr agent start`, wait with `herdr wait agent-status`). The pane is a viewing surface; the in-process orchestration inside it still uses Agent tool + SendMessage.

---

### 4. Story Completion + Next Story

**What this step does:** SM marks the story done and signals the next story (or sprint complete if queue is empty).
**Inputs:** QA pass signal from step 3 + story ID
**Output:** `$STEP_4_OUTPUT` — next story details OR sprint complete signal

The SM agent already exists in the registry from step 1. **Reuse it via
SendMessage** — the SM still holds the sprint plan, the queue state, and the
done/remaining counts.

```json
{
  "name": "SendMessage",
  "input": {
    "to": "<sm.agentId from registry>",
    "prompt": "Story {story_id} passed QA. Mark it done and provide the next story from the queue, or signal sprint complete if all stories are done.\n\n## Inputs\nCompleted story: {story_id}\nRemaining queue: {queue_state}\n\n## Output\nNext story details: story ID, description, acceptance criteria. OR: 'Sprint complete: all N stories done.'"
  }
}
```

Capture result into `$STEP_4_OUTPUT`. If next story: return to step 2 with new story (Dev/QA may also be reused). If sprint complete: present summary to user. Final output — no next step.

> For opt-in pane visibility, see the `herdr` skill's "Watching agents in panes (opt-in)" section (spawn with `herdr agent start`, wait with `herdr wait agent-status`). The pane is a viewing surface; the in-process orchestration inside it still uses Agent tool + SendMessage.

---

## Team Wind-down

This team has no pane to close. Agents end when no longer messaged; the orchestrator's
`claude agents` inspection tells the user what's still alive.

| Action | What happens |
|--------|--------------|
| Mark role "done" in the orchestrator's loop | Orchestrator stops sending tasks to that role. |
| No more tasks for a role | The agent becomes idle. It is **not** killed — the user can pick it back up with `SendMessage` later in the session. |
| Session ending | The orchestrator may delete the registry file or rename to `agent-registry.closed.md`. Live agents are torn down with the session. |
| User wants to inspect live agents | `claude agents` (or `claude agents --json` for parseable output). |

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
