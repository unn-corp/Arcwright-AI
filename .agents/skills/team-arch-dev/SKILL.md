---
name: "team-arch-dev"
description: "The Foundry — in-process Architect designs approach, Dev implements, Architect spot-checks. Spawn-once + SendMessage reuse; sonnet-first with opus permission-gated on Architect."
---

# Agent Team: Arch + Dev — The Foundry

> **Default orchestration:** in-process via the [`claude-subagent-protocol`](../claude-subagent-protocol/SKILL.md) skill. The `Agent` tool + `SendMessage` reuse with a Session Agent Registry is the canonical path. herdr pane variant is offered when `$HERDR_ENV` is set (spawn each role in its own pane in the current session) (see the [herdr](../herdr/SKILL.md) skill).
>
> **Kiro CLI:** this team is available as a Kiro `subagent` pipeline. See `## Kiro Pipeline` at the end of this skill.

## Best Used For

- New subsystems or modules where design decisions will have long-term impact
- Cross-cutting changes (auth, caching, data model, API contracts)
- Refactors where architectural guidance prevents regression into bad patterns
- Integration work where API contracts and data flow need design sign-off
- Tasks where a developer could implement correctly but benefit from architectural guardrails

## Team Composition

| Role | Agent | Skills |
|------|-------|--------|
| Architect | `arcwright-architect` | Architecture design, full dev skill access, spot-checks |
| Dev | `arcwright-dev` | Full implementation per architect's design |

## Purpose

The Foundry pairs an Architect with a Dev to ensure implementation is grounded in sound design. The Architect reviews scope, proposes a design approach, and spot-checks completed work for architectural compliance. The Dev owns the actual implementation. Findings from Architect spot-checks route through master back to Dev. Use this team when the task has non-trivial architectural implications — new subsystems, cross-cutting concerns, data model changes, or integration patterns that need design validation before and after implementation.

## Agent Registry

The Session Agent Registry replaces the old `session-state.md` pane-ID table. Record every role that has a live agent so subsequent tasks reuse the same agent via `SendMessage` (full prior context) instead of spawning fresh.

**Registry path:**

```
_arcwright-output/sessions/<session-id>/agent-registry.md
```

**Initial state for this team:**

| Role | Agent ID | Spawned | Last Task | Notes |
|------|----------|---------|-----------|-------|
| architect | *(set on first spawn)* | *(ISO ts)* | architecture design | reused on spot-check + remediation loop |
| dev | *(set on first spawn)* | *(ISO ts)* | implementation | reused on remediation passes |

**Lifecycle:**

- First task for a role → orchestrator spawns via `Agent` tool → captures the returned `agentId` → writes a row to the registry → dispatches the task.
- Subsequent tasks for the same role → orchestrator reads the registry, finds the row, dispatches via `SendMessage(to: agentId, ...)` (the agent resumes with full prior context).
- On session wind-down, the registry may be deleted or renamed to `agent-registry.closed.md`. Live agents are torn down with the session — there is no `kill-pane` analogue.

See [`claude-subagent-protocol`](../claude-subagent-protocol/SKILL.md) §3 for the full format and §3.4 for the spawn-vs-reuse decision rule.

## Spawn-once + Reuse

This team has two roles (architect, dev) and runs a 3–4 step loop. The Architect and Dev agents each spawn **once** at the start; subsequent steps send follow-ups to the same agents.

| Step | Role | Action | Notes |
|------|------|--------|-------|
| 1. Architecture design | architect | **Spawn** (first use) | Spawn via `Agent` tool. Capture `agentId` into the registry. |
| 2. Implementation | dev | **Spawn** (first use) | Spawn via `Agent` tool. Capture `agentId` into the registry. |
| 3. Architect spot-check | architect | **Reuse** — `SendMessage` to the registry's architect ID | The architect retains design context. |
| 4. Remediation (conditional) | dev | **Reuse** — `SendMessage` to the registry's dev ID | The dev retains implementation context. |
| 4a. Re-spot-check (loop) | architect | **Reuse** — `SendMessage` to the registry's architect ID | Loop until clean. |

For full spawn JSON and SendMessage JSON, see `claude-subagent-protocol` §4.

## Model and Mode Strategy

**Sonnet is the default for every role.** The Architect role is the historical reason to consider `opus`; even so, the orchestrator must ask the user before any `opus` spawn (see `claude-subagent-protocol` §6.3 for the permission-before-opus gate).

| Role | Default model | Opus allowed? | Notes |
|------|---------------|---------------|-------|
| `arcwright-architect` | `sonnet` | Yes — with explicit user permission | The historical opus recommendation is preserved as a recommended default in this team. **Ask the user before spawning architect on opus.** |
| `arcwright-dev` | `sonnet` | No | Code execution; cheaper, faster, sufficient. |

Format the permission question as in `claude-subagent-protocol` §6.3:

```
This task may benefit from opus on the Architect spawn (deeper reasoning). Default is sonnet.
Switch this spawn to opus? (yes / no / always-yes-for-this-session)
```

Do not silently escalate. If the user says "no", spawn sonnet.

## Steps

### 1. Architecture Design

**What this step does:** The Architect reviews scope and requirements and proposes a design approach (may include prototype code).
**Inputs:** Scope and requirements from master (none prior)
**Output:** `$STEP_1_OUTPUT` — architecture design proposal
**Spawn vs reuse:** **Spawn** — first use of the architect role in this session.

```json
{
  "name": "Agent",
  "input": {
    "subagent_type": "arcwright-architect",
    "prompt": "Review the following scope and propose a design approach. Include any prototype code needed to validate design assumptions.\n\n## Inputs\n{scope_and_requirements}\n\n## Output\nArchitecture design proposal with approach, rationale, and any prototype code.",
    "model": "sonnet"
  }
}
```

After this call returns, write the architect's `agentId` to the Session Agent Registry at `_arcwright-output/sessions/<session-id>/agent-registry.md` so steps 3 and 4a can reuse the same agent.

> **Permission gate:** if the orchestrator intends to spawn with `model: "opus"`, ask the user first per `claude-subagent-protocol` §6.3. Default is `sonnet`.

Capture result into `$STEP_1_OUTPUT`. Pass to step 2.

---

### 2. Implementation

**What this step does:** The Dev implements the feature according to the Architect's design proposal.
**Inputs:** `$STEP_1_OUTPUT` (architecture design from step 1) + original requirements
**Output:** `$STEP_2_OUTPUT` — implementation completion summary with files changed
**Spawn vs reuse:** **Spawn** — first use of the dev role in this session.

```json
{
  "name": "Agent",
  "input": {
    "subagent_type": "arcwright-dev",
    "prompt": "Implement the feature according to the architecture design provided. Follow the design approach exactly.\n\n## Inputs\nArchitecture design: {$STEP_1_OUTPUT}\nOriginal requirements: {requirements}\n\n## Output\nImplementation complete. List all files changed.",
    "model": "sonnet",
    "permissionMode": "acceptEdits"
  }
}
```

After this call returns, write the dev's `agentId` to the Session Agent Registry.

> **Trust but verify:** after the Agent call returns, run `git diff --stat` to confirm the claimed file changes actually landed before reporting this step complete. See `claude-subagent-protocol` §9.

Capture result into `$STEP_2_OUTPUT`. Pass to step 3.

---

### 3. Architect Spot-Check

**What this step does:** The Architect reviews the completed implementation for architectural compliance and emits findings if any issues exist.
**Inputs:** `$STEP_2_OUTPUT` (implementation summary from step 2) + original design proposal
**Output:** `$STEP_3_OUTPUT` — spot-check result: clean pass or list of findings with severity
**Spawn vs reuse:** **Reuse** — `SendMessage` to the architect's `agentId` in the registry. The architect already holds the design context from step 1.

```json
{
  "name": "SendMessage",
  "input": {
    "to": "<architect agentId from registry>",
    "prompt": "Re-engage the existing Architect agent.\n\n## Inputs\nImplementation summary: {$STEP_2_OUTPUT}\nOriginal design proposal: {$STEP_1_OUTPUT}\n\n## Output\nSpot-check result: clean pass OR list of findings with severity (critical | major | minor). For each finding: severity, description, and the file/area it applies to."
  }
}
```

> **Permission gate:** if reusing with `model: "opus"`, ask the user first per `claude-subagent-protocol` §6.3. The architect role is the historical case for opus.

Capture result into `$STEP_3_OUTPUT`. If findings exist: pass to step 4. If clean: task complete.

---

### 4. Remediation (conditional — only if step 3 found issues)

**What this step does:** The Dev fixes all findings from the Architect's spot-check.
**Inputs:** `$STEP_3_OUTPUT` (findings from spot-check)
**Output:** `$STEP_4_OUTPUT` — remediation complete, files changed
**Spawn vs reuse:** **Reuse** — `SendMessage` to the dev's `agentId` in the registry. The dev already holds the implementation context from step 2.

```json
{
  "name": "SendMessage",
  "input": {
    "to": "<dev agentId from registry>",
    "prompt": "Re-engage the existing Dev agent.\n\n## Inputs\nFindings: {$STEP_3_OUTPUT}\n\n## Output\nRemediation complete. List all files changed and describe each fix."
  }
}
```

> **Trust but verify:** after this call returns, run `git diff --stat` to confirm the fixes actually landed.

Capture result into `$STEP_4_OUTPUT`. Return to step 3 (Architect re-spot-checks via another `SendMessage` to the same architect `agentId`). When Architect confirms clean: task complete. Final output — no next step.

---

## Team Wind-down

There is no pane to close. The in-process wind-down is:

1. Mark each role "done" in the orchestrator's loop — stop dispatching tasks to that role.
2. The agent becomes idle. It is **not** killed; the user can re-engage with `SendMessage` later in the session.
3. On session end, the orchestrator may rename the registry to `agent-registry.closed.md` for the historical record.
4. To inspect what's still alive, run `claude agents` (or `claude agents --json` for parseable output).

See `claude-subagent-protocol` §12 for the full wind-down model.

## Communication Protocol

Default is in-process. The Agent tool return value is the sole completion signal for every step — no `AGENT_SIGNAL`, no `STEP COMPLETE`, no polling. See `claude-subagent-protocol` §11 for the full no-legacy-signals rule.

For opt-in pane visibility (the `herdr` skill's "Watching agents in panes" section), `AGENT_SIGNAL::TASK_DONE::...` is still allowed **inside that opt-in block** for pane-internal signaling — but it does not apply to the default in-process flow.

#### Pane Visibility (opt-in — only when user explicitly requests pane visibility AND $HERDR_ENV is set)

For opt-in pane visibility, see the [`herdr`](../herdr/SKILL.md) skill's "Watching agents in panes (opt-in)" section (spawn with `herdr agent start`, wait with `herdr wait agent-status`). The pane is a viewing surface; the in-process orchestration inside it is still governed by this skill. Do not use this variant by default.

## Kiro Pipeline

> Note: This pipeline represents one iteration of the Architect spot-check loop. Re-invoke with remaining findings for additional iterations.

Use the `subagent` tool to run this team as a Kiro pipeline.

```json
{
  "task": "Design, implement, and architect-spot-check a feature: Architect proposes design, Dev implements, Architect validates compliance.",
  "stages": [
    {
      "name": "architect-design",
      "role": "arcwright-architect",
      "prompt_template": "Review scope and propose a design approach for: {task}. Include any prototype code needed to validate design assumptions.",
      "depends_on": []
    },
    {
      "name": "dev-impl",
      "role": "arcwright-dev",
      "prompt_template": "Implement the feature according to the architecture design. Follow the design approach exactly: {task}",
      "depends_on": ["architect-design"]
    },
    {
      "name": "arch-spot-check",
      "role": "arcwright-architect",
      "prompt_template": "Spot-check the completed implementation for architectural compliance. Check structural correctness, adherence to design, DRY/SOLID violations, integration pattern correctness: {task}",
      "depends_on": ["dev-impl"]
    },
    {
      "name": "dev-remediate",
      "role": "arcwright-dev",
      "prompt_template": "Fix all findings from the Architect spot-check. Address critical first, then major, then minor: {task}",
      "depends_on": ["arch-spot-check"]
    }
  ]
}
```
