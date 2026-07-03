---
name: "team-tdd"
description: "The Forge — in-process TDD pod. QA writes failing tests first, Dev implements to green, QA verifies (reuses the existing QA agent via SendMessage for re-verification). herdr pane visibility is opt-in only."
allowed-tools: Read, Grep, Glob, Write, Edit, Agent, SendMessage, Bash
---

# Agent Team: TDD Pod — The Forge

> **Default orchestration:** in-process via [`claude-subagent-protocol`](.agents/skills/claude-subagent-protocol/SKILL.md). herdr pane variant is opt-in (see step blocks).
>
> **Kiro CLI:** this team is available as a Kiro `subagent` pipeline. See `## Kiro Pipeline` at the end of this skill.

## Best Used For

- Critical path features (auth, payments, core data flows) where regressions are costly
- New APIs or services where the interface contract needs to be locked in via tests
- Refactors where the existing behavior must be fully preserved and verifiable
- Features with complex acceptance criteria that benefit from being encoded as executable tests
- Situations where the team wants the test suite to serve as living documentation of intent

## Team Composition

| Role | Agent | Default Model |
|------|-------|---------------|
| QA | `arcwright-qa` | sonnet |
| Dev | `arcwright-dev` | sonnet |

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
| qa | `<assigned on first spawn>` | `<ISO>` | write failing tests | reused on step 3 verification and step 4 fix loop |
| dev | `<assigned on first spawn>` | `<ISO>` | implement to green | reused on step 2 ↔ step 4 fix loop |

Registry path, format, and lifecycle follow
[`claude-subagent-protocol` §3](.agents/skills/claude-subagent-protocol/SKILL.md#3-session-agent-registry-the-structural-change).
Roles `qa` and `dev` are the only ones this team uses. `claude agents --json` is the
observability tool; the registry file is the source of truth for SendMessage dispatch.

## Purpose

The Forge enforces true test-driven development. QA writes failing tests from acceptance criteria before a single line of implementation exists. Dev implements only to make those tests pass. QA then verifies all tests are green. The discipline of writing tests first drives better acceptance criteria, clearer interfaces, and fewer edge case regressions. Use this team when correctness is critical and you want the test suite to act as a living spec.

## Spawn-once + Reuse

This is the canonical pattern for this team. Each role is **spawned on first use** and
its `agentId` recorded in the Session Agent Registry. Subsequent steps for the same
role use `SendMessage` to that existing agent — never re-spawn. See
[`claude-subagent-protocol` §4.2](.agents/skills/claude-subagent-protocol/SKILL.md#42-reuse-sendmessage--replaces-re-spawn-for-known-roles)
for the full Reuse (SendMessage) pattern.

**First use → Agent tool + write registry row. Later use → SendMessage to the row's `agentId`.**

### Reuse example (QA re-engagement)

The QA agent in this team is the most-reused role — it authors the tests (step 1),
verifies the implementation (step 3), and re-verifies after a fix (step 3'). For
**step 3' (re-verification), re-engage the existing QA agent with the new test
target via SendMessage** — the QA already wrote the tests, knows the spec, and
knows which assertions the dev cycle is trying to satisfy:

```json
{
  "name": "SendMessage",
  "input": {
    "to": "<qa.agentId from registry>",
    "prompt": "Re-engage the existing QA agent with the new test target.\n\n## Inputs\nNew code under test: the fix from step 4 (see $STEP_4_OUTPUT). Re-run the same test files you authored in step 1. Prior run was a fail (see $STEP_3_OUTPUT). We need a re-verify against the same surface, not a re-spawn.\n\n## Output\nPass or fail. If pass: 'All N tests green.' If fail: list each failing test with the failure message."
  }
}
```

The receiving QA agent retains all prior context — it already wrote the tests, knows
the spec, and knows which acceptance criteria drove each assertion. Do not re-feed
prior context into the prompt; reference it via `## Inputs` only.

## Agent Activation

> **Project context**: Master passes the `## Project Context` block (from its activation scan) to each agent in their first task message. Agents receive context from master — they do not re-scan independently.

- **QA**: activate `arcwright-qa`
  - QA role in this team is test authoring first, verification second. QA does NOT implement features.
- **Dev**: activate `arcwright-dev`
  - Dev role in this team is implementing only to make QA-authored tests pass — no scope creep.

## Steps

### 1. Write Failing Tests

**What this step does:** QA writes failing tests from acceptance criteria. Tests MUST fail before implementation exists.
**Inputs:** Spec and acceptance criteria from master
**Output:** `$STEP_1_OUTPUT` — test file paths (tests are failing at this point)

**First QA use:** spawn via Agent tool. Capture the returned `agentId` into the
registry `qa` row. The same QA is reused on step 3 verification and step 3' re-verify.

```json
{
  "name": "Agent",
  "input": {
    "subagent_type": "arcwright-qa",
    "prompt": "Write FAILING tests from the acceptance criteria. Do NOT implement any functionality — tests must fail before implementation. Write tests that completely encode the acceptance criteria as executable assertions.\n\n## Inputs\nSpec: {spec}\nAcceptance criteria: {criteria}\n\n## Output\nTest files written (confirm they are failing). List test file paths.",
    "model": "sonnet"
  }
}
```

Capture result into `$STEP_1_OUTPUT`. Pass test file paths to step 2.

> For opt-in pane visibility, see the `herdr` skill's "Watching agents in panes (opt-in)" section (spawn with `herdr agent start`, wait with `herdr wait agent-status`). The pane is a viewing surface; the in-process orchestration inside it still uses Agent tool + SendMessage.

---

### 2. Implement to Green

**What this step does:** Dev implements only what is needed to make the QA-authored tests pass — no extra scope.
**Inputs:** `$STEP_1_OUTPUT` (test file paths) + spec
**Output:** `$STEP_2_OUTPUT` — implementation complete, tests should now pass

**First Dev use:** spawn via Agent tool. Capture the returned `agentId` into the
registry `dev` row. The fix-pass loop in step 4 reuses this row via `SendMessage`.

```json
{
  "name": "Agent",
  "input": {
    "subagent_type": "arcwright-dev",
    "prompt": "Implement only what is needed to make the QA-authored tests pass. Do NOT add extra functionality beyond what the tests require.\n\n## Inputs\nTest files: {$STEP_1_OUTPUT}\nSpec: {spec}\n\n## Output\nImplementation complete. List all files changed.",
    "model": "sonnet"
  }
}
```

Capture result into `$STEP_2_OUTPUT`. Pass to step 3.

> For opt-in pane visibility, see the `herdr` skill's "Watching agents in panes (opt-in)" section (spawn with `herdr agent start`, wait with `herdr wait agent-status`). The pane is a viewing surface; the in-process orchestration inside it still uses Agent tool + SendMessage.

---

### 3. Green Verification

**What this step does:** QA verifies all tests are now green by running the full test suite.
**Inputs:** `$STEP_2_OUTPUT` (implementation summary) + `$STEP_1_OUTPUT` (test files)
**Output:** `$STEP_3_OUTPUT` — pass (all tests green) or fail (list of still-failing tests)

The QA agent already exists in the registry from step 1. **SendMessage** to its
existing `agentId` — do not re-spawn QA.

```json
{
  "name": "SendMessage",
  "input": {
    "to": "<qa.agentId from registry>",
    "prompt": "Verify all tests are now green by running the full test suite. Run the test files that were written in step 1.\n\n## Inputs\nTest files: {$STEP_1_OUTPUT}\nImplementation context: {$STEP_2_OUTPUT}\n\n## Output\nPass or fail. If pass: 'All N tests green.' If fail: list each failing test with the failure message."
  }
}
```

Capture result into `$STEP_3_OUTPUT`. If all pass: task complete. If any fail: pass to step 4.

> For opt-in pane visibility, see the `herdr` skill's "Watching agents in panes (opt-in)" section (spawn with `herdr agent start`, wait with `herdr wait agent-status`). The pane is a viewing surface; the in-process orchestration inside it still uses Agent tool + SendMessage.

---

### 4. Fix Failing Tests (conditional — only if step 3 failed)

**What this step does:** Dev fixes the implementation to make the remaining failing tests pass.
**Inputs:** `$STEP_3_OUTPUT` (failing test summary)
**Output:** `$STEP_4_OUTPUT` — fix complete. Return to step 3.

The Dev agent already exists in the registry from step 2. **SendMessage** to its
existing `agentId` — do not re-spawn Dev.

```json
{
  "name": "SendMessage",
  "input": {
    "to": "<dev.agentId from registry>",
    "prompt": "Fix the implementation to make the failing tests pass. Address each failing test specifically.\n\n## Inputs\nFailing tests: {$STEP_3_OUTPUT}\n\n## Output\nFix complete. List all files changed."
  }
}
```

Capture result into `$STEP_4_OUTPUT`. **Re-engage the existing QA agent with the
new test target via SendMessage** — return to step 3 using the QA reuse example.
When all tests pass: task complete. Final output — no next step.

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

> Note: This pipeline represents one iteration of the TDD loop. Re-invoke for additional fix iterations if tests remain failing after the initial implementation.

Use the `subagent` tool to run this team as a Kiro pipeline.

```json
{
  "task": "TDD workflow: QA writes failing tests from acceptance criteria, Dev implements to green, QA verifies all tests pass.",
  "stages": [
    {
      "name": "write-failing-tests",
      "role": "arcwright-qa",
      "prompt_template": "Write FAILING tests from the acceptance criteria. Do NOT implement any functionality — tests must fail before implementation. Completely encode the acceptance criteria as executable assertions: {task}",
      "depends_on": []
    },
    {
      "name": "implement-to-green",
      "role": "arcwright-dev",
      "prompt_template": "Implement only what is needed to make the QA-authored tests pass. Do NOT add extra functionality beyond what the tests require: {task}",
      "depends_on": ["write-failing-tests"]
    },
    {
      "name": "verify-green",
      "role": "arcwright-qa",
      "prompt_template": "Verify all tests are now green by running the full test suite. Report pass if all tests pass, or list each failing test with the failure message: {task}",
      "depends_on": ["implement-to-green"]
    },
    {
      "name": "fix-failing",
      "role": "arcwright-dev",
      "prompt_template": "Fix the implementation to make any remaining failing tests pass. Address each failing test specifically: {task}",
      "depends_on": ["verify-green"]
    }
  ]
}
```
