---
name: "team-full-dev"
description: "The Engine Room — Dev implements, QA validates, Architect available for inline consultation on complex decisions"
---

# Agent Team: Full Dev — The Engine Room

> **Default orchestration:** in-process via [`claude-subagent-protocol`](.agents/skills/claude-subagent-protocol/SKILL.md). tmux split-pane variant is opt-in (see step blocks).
>
> **Kiro CLI:** this team is not currently available as a Kiro `subagent` pipeline. Track-level workflows have Kiro pipelines; teams remain Claude Code / tmux for now.

## Best Used For

- Medium-to-large feature implementation where architectural questions are expected but not blocking
- Features touching data models, API contracts, or performance-sensitive paths
- Any task where Dev + QA is not quite enough but full formal AR on every story is overkill
- Situations where having an Architect on standby reduces decision latency without slowing the loop
- Implementation work on systems where architectural expertise needs to be accessible but not prescriptive

## Team Composition

| Role | Agent | Skills |
|------|-------|--------|
| Dev | `arcwright-dev` | Full implementation |
| QA | `arcwright-qa` | playwright-cli, spec tests, validation |
| Architect | `arcwright-architect` | Inline consultation, complex decision review, full dev skill access |

## Purpose

The Engine Room is a full-stack implementation team with an Architect available for consultation rather than as a formal review gatekeeper. Dev implements and QA validates in the standard loop. When Dev encounters a complex architectural decision — a tricky data model choice, an API contract question, a caching strategy — master can route a consultation request to the Architect. The Architect responds with a recommendation and Dev proceeds. This keeps the review lightweight while ensuring expert guidance is available on-demand. Use this team for medium-to-large feature work where architectural questions are expected but don't need to block every task.

## Layout (tmux)

```
┌─────────┬───────────┐
│         │    Dev    │
│ Master  ├───────────┤
│ (left)  │    QA     │
│         ├───────────┤
│         │ Architect │
└─────────┴───────────┘
```

## Spawn Sequence

Load `.agents/skills/tmux-protocol/SKILL.md` before running tmux commands. Default path is in-process — no pane operations needed.

#### tmux Variant (when $TMUX is set and user wants visibility)

Load `.agents/skills/tmux-protocol/SKILL.md` before running these commands.

```bash
# 1. Split Dev pane (top-right)
tmux split-window -h -c "#{pane_current_path}" "~/.config/tmux/bin/agent_spawn.sh 'You are the Dev agent in The Engine Room team managed by Conductor (master-orchestrator). Read and activate: {project-root}/_arcwright/awm/agents/dev.md. An Architect is available for consultation on complex decisions — the master will route consultation requests. Your task queue comes from the master pane. Before stopping any task output: AGENT_SIGNAL::TASK_DONE::dev::{task_id}::{status}::{summary}. On long tasks emit AGENT_SIGNAL::PROGRESS every 60s. Wait for your first task.'"
sleep 8

# 2. Split QA pane (mid-right)
tmux split-window -v -c "#{pane_current_path}" "~/.config/tmux/bin/agent_spawn.sh 'You are the QA agent in The Engine Room team managed by Conductor (master-orchestrator). Read and activate: {project-root}/_arcwright/awm/agents/qa.md. Your task queue comes from the master pane. Before stopping any task output: AGENT_SIGNAL::TASK_DONE::qa::{task_id}::{pass|fail}::{summary}. On long tasks emit AGENT_SIGNAL::PROGRESS every 60s. Wait for your first task.'"
sleep 8

# 3. Split Architect pane (bottom-right)
tmux split-window -v -c "#{pane_current_path}" "~/.config/tmux/bin/agent_spawn.sh 'You are the Architect agent in The Engine Room team managed by Conductor (master-orchestrator). Read and activate: {project-root}/_arcwright/awm/agents/architect.md. You have full dev skill access. In this team you are available for ON-DEMAND CONSULTATION — the master will send consultation requests when Dev encounters complex architectural decisions. Respond with a clear recommendation and rationale. Your task queue comes from the master pane. Before stopping any task output: AGENT_SIGNAL::TASK_DONE::architect::{task_id}::{status}::{summary}. On long tasks emit AGENT_SIGNAL::PROGRESS every 60s. Wait for your first task.'"
sleep 8

# 4. Equalize pane sizes
tmux select-layout tiled
sleep 6
```

## Agent Activation

> **Project context**: Master passes the `## Project Context` block (from its activation scan) to each agent in their first task message. Agents receive context from master — they do not re-scan independently.

- **Dev**: activate `arcwright-dev`
- **QA**: activate `arcwright-qa`
- **Architect**: activate `arcwright-architect`
  - Has **full dev skill access** — can invoke any skill in `.agents/skills/` directly.
  - Role is **on-demand consultation**, not a formal review gate on every task.

## Steps

### 1. Implementation

**What this step does:** Dev implements the task. If Dev encounters an architectural decision it cannot resolve, master routes a consultation to the Architect (step 1b) before continuing.
**Inputs:** Task description and acceptance criteria from master
**Output:** `$STEP_1_OUTPUT` — implementation complete, files changed

---

#### Default: In-Process (Agent tool)

```json
{
  "name": "Agent",
  "input": {
    "subagent_type": "arcwright-dev",
    "prompt": "Implement the following task completely. If you encounter a complex architectural decision (data model, API contract, caching strategy) that you cannot resolve with confidence, stop and describe the question clearly rather than guessing.\n\n## Inputs\nTask: {task_description}\nAcceptance criteria: {criteria}\n\n## Output\nImplementation complete with all files changed listed. OR: 'ARCH_QUESTION: {question}' if architectural guidance is needed.",
    "model": "sonnet"
  }
}
```

Capture result into `$STEP_1_OUTPUT`. If result contains `ARCH_QUESTION`: route to step 1b. Otherwise pass to step 2.

---

#### tmux Variant (when $TMUX is set and user wants visibility)

Load `.agents/skills/tmux-protocol/SKILL.md` before spawning.

```bash
tmux send-keys -t {dev_pane_id} "TASK-{id}: {task_description}. Acceptance criteria: {criteria}. Signal TASK_DONE when complete." Enter
```

Completion signal: `AGENT_SIGNAL::TASK_DONE::dev::{task_id}::done::{summary}` or `AGENT_SIGNAL::TASK_BLOCKED::dev::{task_id}::arch-question::{question}`

---

### 1b. Architect Consultation (conditional — only when Dev signals arch-question)

**What this step does:** Architect provides a clear recommendation for the architectural question Dev raised.
**Inputs:** Architectural question from `$STEP_1_OUTPUT`
**Output:** `$STEP_1B_OUTPUT` — architectural recommendation with rationale

---

#### Default: In-Process (Agent tool)

```json
{
  "name": "Agent",
  "input": {
    "subagent_type": "arcwright-architect",
    "prompt": "Dev needs architectural guidance. Provide a clear, actionable recommendation with rationale.\n\n## Inputs\nArchitectural question: {arch_question_from_step_1}\nTask context: {task_description}\n\n## Output\nClear recommendation with rationale. Be specific enough that Dev can proceed without further questions.",
    "model": "opus"
  }
}
```

Capture result into `$STEP_1B_OUTPUT`. Pass recommendation back to step 1 (re-run Dev with recommendation injected).

---

#### tmux Variant (when $TMUX is set and user wants visibility)

Load `.agents/skills/tmux-protocol/SKILL.md` before spawning.

```bash
tmux send-keys -t {architect_pane_id} "CONSULT-{id}: Dev needs architectural guidance. Question: {arch_question}. Context: {task_context}. Provide a clear recommendation." Enter
```

Completion signal: `AGENT_SIGNAL::TASK_DONE::architect::consult-{id}::recommendation::{recommendation_summary}`

---

### 2. QA Validation

**What this step does:** QA validates the implementation against acceptance criteria using playwright-cli.
**Inputs:** `$STEP_1_OUTPUT` (implementation summary) + acceptance criteria
**Output:** `$STEP_2_OUTPUT` — pass or fail with findings

---

#### Default: In-Process (Agent tool)

```json
{
  "name": "Agent",
  "input": {
    "subagent_type": "arcwright-qa",
    "prompt": "Verify the implementation against the acceptance criteria. Run playwright-cli tests and spec tests.\n\n## Inputs\nImplementation context: {$STEP_1_OUTPUT}\nAcceptance criteria: {criteria}\n\n## Output\nPass or fail verdict with: test results summary and specific failures (if any).",
    "model": "sonnet"
  }
}
```

Capture result into `$STEP_2_OUTPUT`. If pass: task complete. If fail: pass to step 3.

---

#### tmux Variant (when $TMUX is set and user wants visibility)

Load `.agents/skills/tmux-protocol/SKILL.md` before spawning.

```bash
tmux send-keys -t {qa_pane_id} "TASK-{id}-qa: Validate implementation. Criteria: {criteria}. Run playwright-cli tests. Signal TASK_DONE with pass or fail." Enter
```

Completion signal: `AGENT_SIGNAL::TASK_DONE::qa::{task_id}::{pass|fail}::{summary}`

---

### 3. Fix Pass (conditional — only if step 2 failed)

**What this step does:** Dev fixes QA failures and restarts the QA loop.
**Inputs:** `$STEP_2_OUTPUT` (QA findings)
**Output:** `$STEP_3_OUTPUT` — fix complete. Return to step 2.

---

#### Default: In-Process (Agent tool)

```json
{
  "name": "Agent",
  "input": {
    "subagent_type": "arcwright-dev",
    "prompt": "Fix all QA failures. Address each failure specifically.\n\n## Inputs\nQA findings: {$STEP_2_OUTPUT}\n\n## Output\nFix complete. List all files changed.",
    "model": "sonnet"
  }
}
```

Capture result into `$STEP_3_OUTPUT`. Return to step 2. When QA passes: task complete. Final output — no next step.

---

#### tmux Variant (when $TMUX is set and user wants visibility)

Load `.agents/skills/tmux-protocol/SKILL.md` before spawning.

```bash
tmux send-keys -t {dev_pane_id} "TASK-{id}-fix: QA findings. Fix: {$STEP_2_OUTPUT}. Signal TASK_DONE." Enter
```

Completion signal: `AGENT_SIGNAL::TASK_DONE::dev::{task_id}::fixed::{files_changed}`

---

## Communication Protocol

See [`tmux-protocol`](.agents/skills/tmux-protocol/SKILL.md) for the tmux signal protocol; this skill's default is in-process — Agent tool return value is the sole completion signal.

## Team Registration

When spawning this team, master writes to `_arcwright/_memory/master-orchestrator-sidecar/session-state.md` under `active_team`:
```yaml
active_team:
  code: full-dev
  name: "The Engine Room"
  spawned_at: {ISO8601}
  panes:
    dev: {pane_id}
    qa: {pane_id}
    architect: {pane_id}
```

## Team Close Protocol

When master needs to close this team:
1. Read pane IDs from `active_team` in `_arcwright/_memory/master-orchestrator-sidecar/session-state.md`
2. Kill each pane directly: `tmux kill-pane -t {pane_id}` (DO NOT send `/exit`)
3. Clear `active_team` from session-state.md

## Kiro CLI

This team is not currently available as a Kiro `subagent` pipeline. Track-level workflows have Kiro pipelines; team orchestration remains Claude Code / tmux for now. A team-level Kiro DAG is planned for a follow-up release.
