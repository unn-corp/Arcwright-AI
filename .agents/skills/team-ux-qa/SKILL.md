---
name: "team-ux-qa"
description: "The Atelier — UX Designer implements (can write code), QA validates live UI with playwright-cli, loop until clean; in-process with agent registry reuse"
---

# Agent Team: UX + QA — The Atelier

> **Default orchestration:** in-process via [`claude-subagent-protocol`](.agents/skills/claude-subagent-protocol/SKILL.md). Spawn-once + reuse via Session Agent Registry. herdr pane variant is opt-in (see the `herdr` skill).
>
> **Kiro CLI:** this team is available as a Kiro `subagent` pipeline. See `## Kiro Pipeline` at the end of this skill.

## Best Used For

- UI feature implementation where design intent must be verified through live browser behavior
- Component redesigns, theming changes, or responsive layout work
- Accessibility improvements where playwright-cli assertions confirm WCAG compliance
- Any task where a UX Designer writing code directly is more efficient than design→dev handoff
- Design system compliance checks that need functional validation, not just visual inspection

## Team Composition

| Role | Agent | Skills |
|------|-------|--------|
| UX Designer | `arcwright-ux-designer` | Design, implementation (can write code), full dev skill access |
| QA | `arcwright-qa` | playwright-cli, visual + functional UI validation |

## Purpose

The Atelier pairs a UX Designer who can write code directly with a QA agent that validates the live UI. The UX Designer handles both the design and the implementation — they are not limited to wireframes. After each implementation pass, QA navigates the live application with playwright-cli, asserts visual correctness and functional behavior, and signals pass or fail. Failures loop back to UX for revision. Use this team for UI feature work, component redesigns, or accessibility improvements where design intent must be validated through actual browser behavior.

## Agent Registry

This team uses a Session Agent Registry (see `claude-subagent-protocol` §3) to record live agent IDs and reuse them across steps — and critically, **across loop iterations** of the UX-implement → QA-validate cycle. Path:

```
_arcwright-output/sessions/<session-id>/agent-registry.md
```

Roles in this team (one row per role):

| Role | Agent | Notes |
|------|-------|-------|
| ux | `arcwright-ux-designer` | Reused on every revision pass — knows the implementation history |
| qa | `arcwright-qa` | Reused on every validation pass — knows prior test results, last run state |

Spawn-once rule: the first time each role is needed, spawn via `Agent` tool and capture `agentId`. On any subsequent task for the same role (including the next iteration of the revision loop), look up the row in the registry and dispatch via `SendMessage`. The QA agent keeps full prior context (last run, prior failures, codebase knowledge) — this is the load-bearing reuse case for this team.

## Model Strategy (sonnet-first + permission gate)

| Role | Default | Opus |
|------|---------|------|
| `arcwright-ux-designer` | sonnet | only with explicit user permission |
| `arcwright-qa` | sonnet | only with explicit user permission |

**Default is sonnet for every spawn.** Before spawning any agent with `model: "opus"` or raising effort, the orchestrator (or this skill) **must ask the user** first (per `claude-subagent-protocol` §6.3). No silent escalation.

## Spawn-once + Reuse

For each step (and each loop iteration), before issuing the Agent call, check the registry:

- **Registry miss** (first use of the role in this session) → spawn via `Agent` tool. Capture the returned `agentId` and write a registry row.
- **Registry hit** (same role, same context) → dispatch via `SendMessage(to: <agentId>, ...)`. The agent already holds the prior context — do not re-feed it.

### Worked example: re-engage the existing QA agent with the new test target

The QA agent already ran the suite for the prior implementation pass and knows the codebase, prior failures, and the playwright-cli setup. After step 3 (UX revises), dispatch the next validation via `SendMessage` to the existing `qa` agent — do not spawn a fresh one:

```json
{
  "name": "SendMessage",
  "input": {
    "to": "agent_<qa-id>",
    "prompt": "Re-engage the existing QA agent with the new test target.\n\n## Inputs\nNew test target: the revised implementation from step 3 (the UX Designer just patched the failed assertions from your last run).\nPrior run: {$STEP_2_OUTPUT} (your last pass/fail report).\nAcceptance criteria: {criteria}\n\n## Output\nPass or fail verdict against the acceptance criteria. If pass: 'All visual and functional assertions green.' If fail: list each failed assertion with description, focused on what changed since your last run."
  }
}
```

The receiving QA agent retains all prior context — it already knows the codebase, the prior test results, the playwright-cli setup, and the user's preferences. Do not re-feed prior context; reference only the new delta.

For the full spawn / reuse pattern see `claude-subagent-protocol` §4.

## Agent Activation

> **Project context**: Master passes the `## Project Context` block (from its activation scan) to each agent in their first task message. Agents receive context from master — they do not re-scan independently.

- **UX Designer**: activate `arcwright-ux-designer`
  - Has **full dev skill access** — can write code directly, not limited to wireframes or specs. Can invoke any skill in `.agents/skills/`.
- **QA**: activate `arcwright-qa`

## Steps

### 1. Design + Implementation

**What this step does:** UX Designer designs and implements the UI task (can write code directly).
**Inputs:** Task description and acceptance criteria from master
**Output:** `$STEP_1_OUTPUT` — design and implementation complete, files changed

---

#### Default: In-Process (Agent tool)

`ux` is the first-time role. Spawn via `Agent` tool, capture `agentId`, write the registry row.

```json
{
  "name": "Agent",
  "input": {
    "subagent_type": "arcwright-ux-designer",
    "prompt": "Design and implement the UI task. You can write code directly — you are not limited to design artifacts. Implement to meet the acceptance criteria.\n\n## Inputs\nTask: {task_description}\nAcceptance criteria: {criteria}\n\n## Output\nDesign and implementation complete. List all files changed and describe what was done.",
    "model": "sonnet"
  }
}
```

Capture result into `$STEP_1_OUTPUT`. Pass to step 2.

---

#### Pane Visibility (opt-in)

For opt-in pane visibility, see the `herdr` skill's "Watching agents in panes (opt-in)" section (spawn with `herdr agent start`, wait with `herdr wait agent-status`). The pane is a viewing surface; the in-process Agent tool + SendMessage flow is still governed by `claude-subagent-protocol`.

---

### 2. Live UI Validation

**What this step does:** QA navigates the live UI via playwright-cli and asserts visual correctness and functional behavior.
**Inputs:** `$STEP_1_OUTPUT` (implementation summary) + acceptance criteria
**Output:** `$STEP_2_OUTPUT` — pass or fail with specific failed assertions

---

#### Default: In-Process (Agent tool)

`qa` is the first-time role. Spawn via `Agent` tool, capture `agentId`, write the registry row.

```json
{
  "name": "Agent",
  "input": {
    "subagent_type": "arcwright-qa",
    "prompt": "Validate the live UI using playwright-cli. Navigate to the affected areas and assert visual correctness and functional behavior against the acceptance criteria.\n\n## Inputs\nImplementation context: {$STEP_1_OUTPUT}\nAcceptance criteria: {criteria}\n\n## Output\nPass or fail verdict. If pass: 'All visual and functional assertions green.' If fail: list each failed assertion with description.",
    "model": "sonnet"
  }
}
```

Capture result into `$STEP_2_OUTPUT`. If pass: task complete. If fail: pass to step 3.

---

#### Pane Visibility (opt-in)

For opt-in pane visibility, see the `herdr` skill's "Watching agents in panes (opt-in)" section (spawn with `herdr agent start`, wait with `herdr wait agent-status`). The pane is a viewing surface; the in-process Agent tool + SendMessage flow is still governed by `claude-subagent-protocol`.

---

### 3. Revision (conditional — only if step 2 failed)

**What this step does:** UX Designer revises the implementation based on QA findings and restarts the validation loop.
**Inputs:** `$STEP_2_OUTPUT` (QA findings)
**Output:** `$STEP_3_OUTPUT` — revision complete. Return to step 2.

---

#### Default: In-Process (Agent tool)

`ux` is already in the registry from step 1 — reuse via `SendMessage` (re-engage the existing UX Designer with the new revision task). Do not re-spawn.

```json
{
  "name": "SendMessage",
  "input": {
    "to": "agent_<ux-id>",
    "prompt": "Revise the UI implementation based on QA findings. Address each failed assertion specifically.\n\n## Inputs\nQA findings: {$STEP_2_OUTPUT}\n\n## Output\nRevision complete. List all files changed."
  }
}
```

Capture result into `$STEP_3_OUTPUT`. Return to step 2 (re-engage the existing QA agent with the new test target via `SendMessage`). When QA passes: task complete. Final output — no next step.

---

#### Pane Visibility (opt-in)

For opt-in pane visibility, see the `herdr` skill's "Watching agents in panes (opt-in)" section (spawn with `herdr agent start`, wait with `herdr wait agent-status`). The pane is a viewing surface; the in-process Agent tool + SendMessage flow is still governed by `claude-subagent-protocol`.

---

## Team Wind-down

In-process wind-down — no pane close:

- Mark a role "done" by stopping further dispatch to that role. The agent becomes idle but is not killed (the user can pick it back up with `SendMessage` later in the session).
- The Session Agent Registry may be deleted or renamed to `agent-registry.closed.md` when the session ends.
- Inspect live agents at any time via `claude agents` (or `claude agents --json` for parseable output).
- There is no `kill-pane` analogue. The wind-down is: stop dispatching, let the session end.

## Kiro Pipeline

> Note: This pipeline represents one iteration of the UX+QA loop. Re-invoke for additional revision iterations if QA finds failures.

Use the `subagent` tool to run this team as a Kiro pipeline.

```json
{
  "task": "Design and implement a UI task, then validate it with playwright-cli QA: UX Designer implements, QA validates live UI, UX revises on failure.",
  "stages": [
    {
      "name": "ux-impl",
      "role": "arcwright-ux-designer",
      "prompt_template": "Design and implement the UI task. You can write code directly. Implement to meet the acceptance criteria: {task}",
      "depends_on": []
    },
    {
      "name": "qa-validate",
      "role": "arcwright-qa",
      "prompt_template": "Validate the live UI using playwright-cli. Navigate to affected areas and assert visual correctness and functional behavior against acceptance criteria: {task}",
      "depends_on": ["ux-impl"]
    },
    {
      "name": "ux-revise",
      "role": "arcwright-ux-designer",
      "prompt_template": "Revise the UI implementation based on QA findings. Address each failed assertion specifically: {task}",
      "depends_on": ["qa-validate"]
    }
  ]
}
```
