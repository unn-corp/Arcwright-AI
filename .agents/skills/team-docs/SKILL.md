---
name: "team-docs"
description: "The Library — Tech Writer drafts, Architect reviews for technical accuracy, lightweight iterative loop"
---

# Agent Team: Docs + Arch Review — The Library

> **Default orchestration:** in-process via [`claude-subagent-protocol`](.agents/skills/claude-subagent-protocol/SKILL.md). tmux split-pane variant is opt-in (see step blocks).
>
> **Kiro CLI:** this team is not currently available as a Kiro `subagent` pipeline. Track-level workflows have Kiro pipelines; teams remain Claude Code / tmux for now.

## Best Used For

- Writing or updating API reference documentation where accuracy is critical
- Documenting new backend patterns, auth flows, or architectural decisions
- Updating CLAUDE.md or other reference docs after system changes
- Any documentation that non-technical writers might produce but that needs an engineer's accuracy stamp
- Post-sprint documentation of newly built systems before the knowledge fades

## Team Composition

| Role | Agent | Skills |
|------|-------|--------|
| Tech Writer | `arcwright-tech-writer` | Documentation drafting, structuring, clarity editing |
| Architect | `arcwright-architect` | Technical accuracy review, API correctness, full dev skill access |

## Purpose

The Library ensures documentation is both readable and technically accurate. Tech Writer drafts; Architect reviews for technical correctness — wrong API signatures, outdated patterns, missing caveats, or inaccurate descriptions of system behavior. Master routes drafts from Tech Writer to Architect for sign-off. The loop is lightweight: draft → review → revise → approve. Use this team when documentation quality matters enough to have an independent technical accuracy review before publishing.

## Layout (tmux)

```
┌─────────┬───────────┐
│         │  Writer   │
│ Master  ├───────────┤
│ (left)  │ Architect │
└─────────┴───────────┘
```

## Spawn Sequence

Load `.agents/skills/tmux-protocol/SKILL.md` before running tmux commands. Default path is in-process — no pane operations needed.

#### tmux Variant (when $TMUX is set and user wants visibility)

Load `.agents/skills/tmux-protocol/SKILL.md` before running these commands.

```bash
# 1. Split Tech Writer pane (top-right)
tmux split-window -h -c "#{pane_current_path}" "~/.config/tmux/bin/agent_spawn.sh 'You are the Tech Writer agent in The Library team managed by Conductor (master-orchestrator). Read and activate: {project-root}/_arcwright/awm/agents/tech-writer.md. Your task queue comes from the master pane. Before stopping any task output: AGENT_SIGNAL::TASK_DONE::tech-writer::{task_id}::{status}::{summary}. On long tasks emit AGENT_SIGNAL::PROGRESS every 60s. Wait for your first task.'"
sleep 8

# 2. Split Architect pane (bottom-right, below Tech Writer)
tmux split-window -v -c "#{pane_current_path}" "~/.config/tmux/bin/agent_spawn.sh 'You are the Architect agent in The Library team managed by Conductor (master-orchestrator). Read and activate: {project-root}/_arcwright/awm/agents/architect.md. You have full dev skill access and can invoke any skill in .agents/skills/ directly. In this team your role is technical accuracy review of documentation drafts. Your task queue comes from the master pane. Before stopping any task output: AGENT_SIGNAL::TASK_DONE::architect::{task_id}::{status}::{summary}. On long tasks emit AGENT_SIGNAL::PROGRESS every 60s. Wait for your first task.'"
sleep 8

# 3. Equalize pane sizes
tmux select-layout tiled
sleep 6
```

## Agent Activation

> **Project context**: Master passes the `## Project Context` block (from its activation scan) to each agent in their first task message. Agents receive context from master — they do not re-scan independently.

- **Tech Writer**: activate `arcwright-tech-writer`
- **Architect**: activate `arcwright-architect`
  - Has **full dev skill access** — can invoke any skill in `.agents/skills/` directly, including code reading to verify documentation accuracy.

## Steps

Lightweight draft → review → revise → approve cycle.

### 1. Documentation Draft

**What this step does:** Tech Writer produces the initial documentation draft for the topic.
**Inputs:** Documentation topic and source material from master
**Output:** `$STEP_1_OUTPUT` — documentation draft (file path or inline content)

---

#### Default: In-Process (Agent tool)

```json
{
  "name": "Agent",
  "input": {
    "subagent_type": "arcwright-tech-writer",
    "prompt": "Write documentation for the specified topic. Prioritize clarity, completeness, and correct structure. Include all relevant details from the source material.\n\n## Inputs\nTopic: {topic}\nSource material: {source_material}\n\n## Output\nDocumentation draft. Write to file if path specified, otherwise return inline.",
    "model": "sonnet"
  }
}
```

Capture result into `$STEP_1_OUTPUT`. Pass to step 2.

---

#### tmux Variant (when $TMUX is set and user wants visibility)

Load `.agents/skills/tmux-protocol/SKILL.md` before spawning.

```bash
tmux send-keys -t {writer_pane_id} "TASK-{id}: Write documentation for: {topic}. Context: {source_material}. Signal TASK_DONE with draft location." Enter
```

Completion signal: `AGENT_SIGNAL::TASK_DONE::tech-writer::{task_id}::draft::{file_path}`

---

### 2. Technical Accuracy Review

**What this step does:** Architect reviews the draft for technical correctness — wrong API signatures, outdated patterns, missing caveats, inaccurate system behavior descriptions.
**Inputs:** `$STEP_1_OUTPUT` (documentation draft from step 1)
**Output:** `$STEP_2_OUTPUT` — approved, or needs-revision with specific inaccuracies listed

---

#### Default: In-Process (Agent tool)

```json
{
  "name": "Agent",
  "input": {
    "subagent_type": "arcwright-architect",
    "prompt": "Review this documentation draft for technical accuracy. Check for: wrong API signatures, outdated patterns, missing important caveats, inaccurate descriptions of system behavior, and any factual errors.\n\n## Inputs\nDocumentation draft: {$STEP_1_OUTPUT}\n\n## Output\nEither 'Approved: documentation is technically accurate.' OR 'Needs revision: ' followed by a numbered list of inaccuracies with specific corrections.",
    "model": "opus"
  }
}
```

Capture result into `$STEP_2_OUTPUT`. If approved: documentation complete. If needs-revision: pass to step 3.

---

#### tmux Variant (when $TMUX is set and user wants visibility)

Load `.agents/skills/tmux-protocol/SKILL.md` before spawning.

```bash
tmux send-keys -t {architect_pane_id} "TASK-{id}-review: Review documentation draft for technical accuracy. Draft: {$STEP_1_OUTPUT}. Emit FINDING signals for inaccuracies. Signal TASK_DONE::approved or TASK_DONE::needs-revision." Enter
```

Completion signal: `AGENT_SIGNAL::TASK_DONE::architect::{task_id}::approved` or `AGENT_SIGNAL::TASK_DONE::architect::{task_id}::needs-revision::{summary}`

---

### 3. Revision (conditional — only if step 2 returned needs-revision)

**What this step does:** Tech Writer revises the draft based on the Architect's findings.
**Inputs:** `$STEP_2_OUTPUT` (Architect findings) + `$STEP_1_OUTPUT` (original draft)
**Output:** `$STEP_3_OUTPUT` — revised draft. Return to step 2.

---

#### Default: In-Process (Agent tool)

```json
{
  "name": "Agent",
  "input": {
    "subagent_type": "arcwright-tech-writer",
    "prompt": "Revise the documentation draft to fix all technical accuracy issues identified by the Architect. Address each issue specifically.\n\n## Inputs\nArchitect findings: {$STEP_2_OUTPUT}\nOriginal draft: {$STEP_1_OUTPUT}\n\n## Output\nRevised documentation draft.",
    "model": "sonnet"
  }
}
```

Capture result into `$STEP_3_OUTPUT`. Return to step 2 (Architect re-reviews). When Architect approves: documentation complete. Final output — no next step.

---

#### tmux Variant (when $TMUX is set and user wants visibility)

Load `.agents/skills/tmux-protocol/SKILL.md` before spawning.

```bash
tmux send-keys -t {writer_pane_id} "TASK-{id}-revise: Revise draft based on technical review. Issues: {$STEP_2_OUTPUT}. Signal TASK_DONE when revised." Enter
```

Completion signal: `AGENT_SIGNAL::TASK_DONE::tech-writer::{task_id}::revised::{file_path}`

---

## Communication Protocol

See [`tmux-protocol`](.agents/skills/tmux-protocol/SKILL.md) for the tmux signal protocol; this skill's default is in-process — Agent tool return value is the sole completion signal.

## Team Registration

When spawning this team, master writes to `_arcwright/_memory/master-orchestrator-sidecar/session-state.md` under `active_team`:
```yaml
active_team:
  code: docs
  name: "The Library"
  spawned_at: {ISO8601}
  panes:
    tech-writer: {pane_id}
    architect: {pane_id}
```

## Team Close Protocol

When master needs to close this team:
1. Read pane IDs from `active_team` in `_arcwright/_memory/master-orchestrator-sidecar/session-state.md`
2. Kill each pane directly: `tmux kill-pane -t {pane_id}` (DO NOT send `/exit`)
3. Clear `active_team` from session-state.md

## Kiro CLI

This team is not currently available as a Kiro `subagent` pipeline. Track-level workflows have Kiro pipelines; team orchestration remains Claude Code / tmux for now. A team-level Kiro DAG is planned for a follow-up release.
