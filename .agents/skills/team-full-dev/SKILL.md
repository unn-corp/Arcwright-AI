---
name: "team-full-dev"
description: "The Engine Room — in-process Dev + QA + Architect loop. Dev implements, QA validates (reuses the existing QA agent via SendMessage on re-validation), Architect available for inline consultation on complex decisions. herdr pane visibility is opt-in only."
allowed-tools: Read, Grep, Glob, Write, Edit, Agent, SendMessage, Bash
---

# Agent Team: Full Dev — The Engine Room

> **Default orchestration:** in-process via [`claude-subagent-protocol`](.agents/skills/claude-subagent-protocol/SKILL.md). herdr pane variant is opt-in (see step blocks).
>
> **Kiro CLI:** this team is available as a Kiro `subagent` pipeline. See `## Kiro Pipeline` at the end of this skill.

## Best Used For

- Medium-to-large feature implementation where architectural questions are expected but not blocking
- Features touching data models, API contracts, or performance-sensitive paths
- Any task where Dev + QA is not quite enough but full formal AR on every story is overkill
- Situations where having an Architect on standby reduces decision latency without slowing the loop
- Implementation work on systems where architectural expertise needs to be accessible but not prescriptive

## Team Composition

| Role | Agent | Default Model |
|------|-------|---------------|
| Dev | `arcwright-dev` | sonnet |
| QA | `arcwright-qa` | sonnet |
| Architect | `arcwright-architect` | sonnet (opus only with user permission) |

## Model Strategy (sonnet-first + permission gate)

Default model for every spawn in this team is `sonnet`. The Architect may benefit
from `opus` on hard design judgment calls, but the skill **asks the user first**
before any opus spawn or effort upgrade. If the user declines, stay on `sonnet`.
See
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
| qa | `<assigned on first spawn>` | `<ISO>` | first validation | spawned on step 2; reused on fix loop |
| architect | `<assigned on first spawn>` | `<ISO>` | first consultation (if any) | spawned on step 1b if Dev escalates |

Registry path, format, and lifecycle follow
[`claude-subagent-protocol` §3](.agents/skills/claude-subagent-protocol/SKILL.md#3-session-agent-registry-the-structural-change).
Roles `dev`, `qa`, and `architect` are the only ones this team uses. `claude agents
--json` is the observability tool; the registry file is the source of truth for
SendMessage dispatch.

## Purpose

The Engine Room is a full-stack implementation team with an Architect available for consultation rather than as a formal review gatekeeper. Dev implements and QA validates in the standard loop. When Dev encounters a complex architectural decision — a tricky data model choice, an API contract question, a caching strategy — master can route a consultation request to the Architect. The Architect responds with a recommendation and Dev proceeds. This keeps the review lightweight while ensuring expert guidance is available on-demand. Use this team for medium-to-large feature work where architectural questions are expected but don't need to block every task.

## Spawn-once + Reuse

This is the canonical pattern for this team. Each role is **spawned on first use** and
its `agentId` recorded in the Session Agent Registry. Subsequent steps for the same
role use `SendMessage` to that existing agent — never re-spawn. See
[`claude-subagent-protocol` §4.2](.agents/skills/claude-subagent-protocol/SKILL.md#42-reuse-sendmessage--replaces-re-spawn-for-known-roles)
for the full Reuse (SendMessage) pattern.

**First use → Agent tool + write registry row. Later use → SendMessage to the row's `agentId`.**

### Reuse examples

**Dev (step 1 → step 3 fix pass):** after the first Dev spawn records `dev.agentId`,
the fix-pass step 3 sends a follow-up to that same ID — Dev retains full context on
the spec, the architectural decision, and the prior implementation.

**Architect (step 1b consultation chain):** if Dev escalates more than once, the
Architect agent already exists in the registry. Re-engage the same Architect via
`SendMessage` — the receiving agent already knows the task context, the prior
recommendation, and any deviations Dev took.

**QA (fix-pass re-validation) — re-engage the existing QA agent with the new test
target via SendMessage:**

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
- **Architect**: activate `arcwright-architect`
  - Has **full dev skill access** — can invoke any skill in `.agents/skills/` directly.
  - Role is **on-demand consultation**, not a formal review gate on every task.

## Steps

### 1. Implementation

**What this step does:** Dev implements the task. If Dev encounters an architectural decision it cannot resolve, master routes a consultation to the Architect (step 1b) before continuing.
**Inputs:** Task description and acceptance criteria from master
**Output:** `$STEP_1_OUTPUT` — implementation complete, files changed

**First Dev use:** spawn via Agent tool. Capture the returned `agentId` into the
registry `dev` row.

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

> For opt-in pane visibility, see the `herdr` skill's "Watching agents in panes (opt-in)" section (spawn with `herdr agent start`, wait with `herdr wait agent-status`). The pane is a viewing surface; the in-process orchestration inside it still uses Agent tool + SendMessage.

---

### 1b. Architect Consultation (conditional — only when Dev signals arch-question)

**What this step does:** Architect provides a clear recommendation for the architectural question Dev raised.
**Inputs:** Architectural question from `$STEP_1_OUTPUT`
**Output:** `$STEP_1B_OUTPUT` — architectural recommendation with rationale

**First Architect use (or re-engagement of an existing Architect for a follow-up
question):** spawn or `SendMessage` based on the registry. Default model `sonnet`.
The skill must ask the user before any `opus` spawn.

```json
{
  "name": "Agent",
  "input": {
    "subagent_type": "arcwright-architect",
    "prompt": "Dev needs architectural guidance. Provide a clear, actionable recommendation with rationale.\n\n## Inputs\nArchitectural question: {arch_question_from_step_1}\nTask context: {task_description}\n\n## Output\nClear recommendation with rationale. Be specific enough that Dev can proceed without further questions.",
    "model": "sonnet"
  }
}
```

Capture result into `$STEP_1B_OUTPUT`. Pass recommendation back to step 1 (re-engage the existing Dev agent with the recommendation injected).

> For opt-in pane visibility, see the `herdr` skill's "Watching agents in panes (opt-in)" section (spawn with `herdr agent start`, wait with `herdr wait agent-status`). The pane is a viewing surface; the in-process orchestration inside it still uses Agent tool + SendMessage.

---

### 2. QA Validation

**What this step does:** QA validates the implementation against acceptance criteria using playwright-cli.
**Inputs:** `$STEP_1_OUTPUT` (implementation summary) + acceptance criteria
**Output:** `$STEP_2_OUTPUT` — pass or fail with findings

**First QA use:** spawn via Agent tool. Capture the returned `agentId` into the
registry `qa` row. Subsequent fix-pass re-validations reuse this row via
`SendMessage` (see "Reuse examples" above).

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

> For opt-in pane visibility, see the `herdr` skill's "Watching agents in panes (opt-in)" section (spawn with `herdr agent start`, wait with `herdr wait agent-status`). The pane is a viewing surface; the in-process orchestration inside it still uses Agent tool + SendMessage.

---

### 3. Fix Pass (conditional — only if step 2 failed)

**What this step does:** Dev fixes QA failures and restarts the QA loop.
**Inputs:** `$STEP_2_OUTPUT` (QA findings)
**Output:** `$STEP_3_OUTPUT` — fix complete. Return to step 2.

The Dev agent already exists in the registry. **SendMessage** to its existing
`agentId` — do not re-spawn Dev.

```json
{
  "name": "SendMessage",
  "input": {
    "to": "<dev.agentId from registry>",
    "prompt": "Fix all QA failures. Address each failure specifically.\n\n## Inputs\nQA findings: {$STEP_2_OUTPUT}\n\n## Output\nFix complete. List all files changed."
  }
}
```

Capture result into `$STEP_3_OUTPUT`. **Re-engage the existing QA agent with the
new test target via SendMessage** for re-validation — return to step 2 using the
QA reuse example. When QA passes: task complete. Final output — no next step.

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

> Note: The Architect consultation path (step 1b) is a conditional branch that cannot be expressed as a static Kiro DAG. This pipeline models the direct implementation path. If Dev needs architectural guidance during execution, the orchestrator should invoke an additional `arcwright-architect` stage before `dev-impl` completes.

> Note: This pipeline represents one iteration of the Dev+QA loop. Re-invoke for additional fix iterations if QA finds failures.

Use the `subagent` tool to run this team as a Kiro pipeline.

```json
{
  "task": "Full dev workflow with optional Architect consultation: Dev implements, QA validates, Architect available for complex decisions, Dev fixes failures.",
  "stages": [
    {
      "name": "arch-consult",
      "role": "arcwright-architect",
      "prompt_template": "Review the task requirements and provide architectural guidance for any complex decisions (data model, API contract, caching strategy) that Dev may encounter during implementation: {task}",
      "depends_on": []
    },
    {
      "name": "dev-impl",
      "role": "arcwright-dev",
      "prompt_template": "Implement the task completely using the architectural guidance provided. If you encounter a complex decision not covered by the guidance, note it in your output: {task}",
      "depends_on": ["arch-consult"]
    },
    {
      "name": "qa-validate",
      "role": "arcwright-qa",
      "prompt_template": "Verify the implementation against acceptance criteria. Run playwright-cli tests and spec tests: {task}",
      "depends_on": ["dev-impl"]
    },
    {
      "name": "dev-fix",
      "role": "arcwright-dev",
      "prompt_template": "Fix all QA failures. Address each failure specifically: {task}",
      "depends_on": ["qa-validate"]
    }
  ]
}
```
