---
name: "team-dev-qa"
description: "Dev + QA iterative loop in-process — Dev implements, QA validates with playwright-cli, failures loop back to Dev. Re-engages the existing QA agent via SendMessage for re-validation. tmux is opt-in visibility only."
allowed-tools: Read, Grep, Glob, Write, Edit, Agent, SendMessage, Bash
---

# Agent Team: Dev + QA

> **Default orchestration:** in-process via [`claude-subagent-protocol`](.agents/skills/claude-subagent-protocol/SKILL.md). tmux split-pane variant is opt-in (see step blocks).
>
> **Kiro CLI:** this team is available as a Kiro `subagent` pipeline. See `## Kiro Pipeline` at the end of this skill.

## Best Used For

- Standard feature implementation with deterministic pass/fail validation
- Bug fixes that need regression verification
- Any task where QA must confirm correctness before master can proceed
- Sprint execution where each story needs a clean QA sign-off
- UI changes that need playwright-cli navigation and assertion testing

## Team Composition

| Role | Agent | Default Model |
|------|-------|---------------|
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
| dev | `<assigned on first spawn>` | `<ISO>` | first implementation | spawned on step 1 |
| qa | `<assigned on first spawn>` | `<ISO>` | first validation | spawned on step 2; reused on step 2↔3 re-runs |

Registry path, format, and lifecycle follow
[`claude-subagent-protocol` §3](.agents/skills/claude-subagent-protocol/SKILL.md#3-session-agent-registry-the-structural-change).
Roles `dev` and `qa` are the only ones this team uses. `claude agents --json` is the
observability tool; the registry file is the source of truth for SendMessage dispatch.

## Purpose

The standard implementation-and-validation team. Dev implements tasks dispatched by master; QA validates each implementation using playwright-cli and spec tests. If QA finds failures, findings are routed back through master to Dev for a fix pass. The loop continues until QA signals a clean pass. Use this team for any feature work that needs deterministic pass/fail validation before proceeding.

## Spawn-once + Reuse

This is the canonical pattern for this team. Each role is **spawned on first use** and
its `agentId` recorded in the Session Agent Registry. Subsequent steps for the same
role use `SendMessage` to that existing agent — never re-spawn. See
[`claude-subagent-protocol` §4.2](.agents/skills/claude-subagent-protocol/SKILL.md#42-reuse-sendmessage--replaces-re-spawn-for-known-roles)
for the full Reuse (SendMessage) pattern.

**First use → Agent tool + write registry row. Later use → SendMessage to the row's `agentId`.**

### Reuse example (QA re-engagement)

After the first Dev → QA cycle, the QA agent already has full context on the codebase,
the spec, and prior results. The fix-pass loop in step 3 is a textbook reuse scenario.
**Re-engage the existing QA agent with the new test target via SendMessage** — do not
spawn a fresh QA agent for re-validation:

```json
{
  "name": "SendMessage",
  "input": {
    "to": "<qa.agentId from registry>",
    "prompt": "Re-engage the existing QA agent with the new test target.\n\n## Inputs\nNew code under test: the fix from step 3 (see $STEP_3_OUTPUT). Re-run the same acceptance criteria you validated in step 2. Prior run was a fail; we need a re-validate against the same surface, not a re-spawn.\n\n## Output\nPass or fail verdict with: test results summary, specific failures (if any), and affected areas."
  }
}
```

The receiving QA agent retains all prior context — it already knows the codebase, the
acceptance criteria, the prior run's findings, and the user's preferences surfaced in
earlier turns. Do not re-feed prior context into the prompt; reference it via
`## Inputs` only.

## Agent Activation

> **Project context**: Master passes the `## Project Context` block (from its activation scan) to each agent in their first task message. Agents receive context from master — they do not re-scan independently.

- **Dev**: activate `arcwright-dev`
- **QA**: activate `arcwright-qa`

## Steps

No task goes to QA until Dev has signaled completion. No next task goes to Dev until QA has signaled pass.

### 1. Implementation

**What this step does:** Dev implements the task dispatched by master.
**Inputs:** Task description and acceptance criteria from master
**Output:** `$STEP_1_OUTPUT` — implementation complete, files changed

**First Dev use:** spawn via Agent tool. After the Agent tool returns the `agentId`,
write the `dev` row to the registry, then proceed.

```json
{
  "name": "Agent",
  "input": {
    "subagent_type": "arcwright-dev",
    "prompt": "Implement the following task completely.\n\n## Inputs\nTask: {task_description}\nAcceptance criteria: {criteria}\n\n## Output\nImplementation complete. List all files changed.",
    "model": "sonnet"
  }
}
```

Capture result into `$STEP_1_OUTPUT`. Pass to step 2.

> For opt-in pane visibility, see the `tmux` skill's "Watching agents in panes (opt-in)" section. The pane is a viewing surface; the in-process orchestration inside it still uses Agent tool + SendMessage.

---

### 2. QA Validation

**What this step does:** QA validates the implementation using playwright-cli and spec tests, producing a pass or fail result.
**Inputs:** `$STEP_1_OUTPUT` (implementation summary from step 1) + acceptance criteria
**Output:** `$STEP_2_OUTPUT` — pass or fail with findings

**First QA use:** spawn via Agent tool. Capture the returned `agentId` into the
registry `qa` row. Subsequent fix-pass re-validations reuse this row via
`SendMessage` (see "Reuse example" above).

```json
{
  "name": "Agent",
  "input": {
    "subagent_type": "arcwright-qa",
    "prompt": "Verify the implementation against the acceptance criteria. Run playwright-cli tests and spec tests. Produce a pass or fail result with specific findings.\n\n## Inputs\nImplementation context: {$STEP_1_OUTPUT}\nAcceptance criteria: {criteria}\n\n## Output\nPass or fail verdict with: test results summary, specific failures (if any), and affected areas.",
    "model": "sonnet"
  }
}
```

Capture result into `$STEP_2_OUTPUT`. If pass: task complete. If fail: pass to step 3.

> For opt-in pane visibility, see the `tmux` skill's "Watching agents in panes (opt-in)" section. The pane is a viewing surface; the in-process orchestration inside it still uses Agent tool + SendMessage.

---

### 3. Fix Pass (conditional — only if step 2 failed)

**What this step does:** Dev fixes QA failures and signals completion to restart the QA loop.
**Inputs:** `$STEP_2_OUTPUT` (QA findings from step 2)
**Output:** `$STEP_3_OUTPUT` — fix complete, files changed. Return to step 2.

The Dev agent already exists in the registry. **SendMessage** to its existing
`agentId` — do not re-spawn Dev.

```json
{
  "name": "SendMessage",
  "input": {
    "to": "<dev.agentId from registry>",
    "prompt": "Fix all QA failures. Address each failure specifically.\n\n## Inputs\nQA findings: {$STEP_2_OUTPUT}\n\n## Output\nFix complete. List all files changed and describe each fix."
  }
}
```

Capture result into `$STEP_3_OUTPUT`. **Re-engage the existing QA agent with the
new test target via SendMessage** for re-validation — return to step 2 using the
QA reuse example. When QA passes: task complete. Final output — no next step.

> For opt-in pane visibility, see the `tmux` skill's "Watching agents in panes (opt-in)" section. The pane is a viewing surface; the in-process orchestration inside it still uses Agent tool + SendMessage.

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

> Note: This pipeline represents one iteration of the Dev+QA loop. Re-invoke for additional fix iterations if QA finds failures.

Use the `subagent` tool to run this team as a Kiro pipeline.

```json
{
  "task": "Implement a task and validate it with QA: Dev implements, QA validates, Dev fixes failures.",
  "stages": [
    {
      "name": "dev-impl",
      "role": "arcwright-dev",
      "prompt_template": "Implement the following task completely: {task}",
      "depends_on": []
    },
    {
      "name": "qa-validate",
      "role": "arcwright-qa",
      "prompt_template": "Verify the implementation against acceptance criteria. Run playwright-cli tests and spec tests. Produce a pass or fail result: {task}",
      "depends_on": ["dev-impl"]
    },
    {
      "name": "dev-fix",
      "role": "arcwright-dev",
      "prompt_template": "Fix all QA failures found during validation. Address each failure specifically: {task}",
      "depends_on": ["qa-validate"]
    }
  ]
}
```
