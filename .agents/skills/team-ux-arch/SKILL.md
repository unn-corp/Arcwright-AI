---
name: "team-ux-arch"
description: "The Blueprint Room — UX and Architect produce design artifacts together; in-process with agent registry reuse, no implementation, no iterative loop"
---

# Agent Team: UX + Architecture — The Blueprint Room

> **Default orchestration:** in-process via [`claude-subagent-protocol`](.agents/skills/claude-subagent-protocol/SKILL.md). Spawn-once + reuse via Session Agent Registry. herdr pane variant is opt-in (see the `herdr` skill).
>
> **Kiro CLI:** this team is available as a Kiro `subagent` pipeline. See `## Kiro Pipeline` at the end of this skill.

## Best Used For

- Feature design phase before any sprint capacity is committed to implementation
- Validating that a UX concept is architecturally feasible and API-compatible
- Designing new API contracts and component specs together so both are coherent
- Large UI reworks where the architecture needs to adapt to new interaction patterns
- Situations where design/architecture conflicts need to be resolved before dev begins rather than during

## Team Composition

| Role | Agent | Skills |
|------|-------|--------|
| UX Designer | `arcwright-ux-designer` | Wireframes, component specs, interaction design, full dev skill access |
| Architect | `arcwright-architect` | API contract validation, data flow design, feasibility, full dev skill access |

## Purpose

The Blueprint Room is a design-only team — no production code is written, no iterative implementation loop runs. The UX Designer produces wireframes and component specifications; the Architect validates API contracts and data flow against the proposed design. Master mediates any design/architecture conflicts. Output is design artifacts only: wireframes, component specs, API contracts, data flow diagrams, and integration notes. Use this team to design a feature fully before handing it off to a dev team, or to validate that a UX design is architecturally feasible before building begins.

## Agent Registry

This team uses a Session Agent Registry (see `claude-subagent-protocol` §3) to record live agent IDs and reuse them across steps. Path:

```
_arcwright-output/sessions/<session-id>/agent-registry.md
```

Roles in this team (one row per role):

| Role | Agent | Notes |
|------|-------|-------|
| ux | `arcwright-ux-designer` | Reused for step 1 design and (conditionally) step 3 conflict resolution |
| architect | `arcwright-architect` | Reused for step 1 API analysis, step 2 validation, and (conditionally) step 3 conflict resolution |

Spawn-once rule: the first time each role is needed, spawn via `Agent` tool and capture `agentId`. On any subsequent task for the same role, look up the row in the registry and dispatch via `SendMessage` to that ID. The agent resumes with full prior context.

## Model Strategy (sonnet-first + permission gate)

| Role | Default | Opus |
|------|---------|------|
| `arcwright-ux-designer` | sonnet | only with explicit user permission |
| `arcwright-architect` | sonnet | only with explicit user permission (deep design judgment) |

**Default is sonnet for every spawn.** Before spawning any agent with `model: "opus"` or raising effort, the orchestrator (or this skill) **must ask the user** first (per `claude-subagent-protocol` §6.3). No silent escalation.

## Spawn-once + Reuse

For each step, before issuing the Agent call, check the registry:

- **Registry miss** (first use of the role in this session) → spawn via `Agent` tool. Capture the returned `agentId` and write a registry row.
- **Registry hit** (same role, same context) → dispatch via `SendMessage(to: <agentId>, ...)`. The agent already holds the prior context — do not re-feed it.

Example SendMessage (re-engage existing architect for step 2 validation):

```json
{
  "name": "SendMessage",
  "input": {
    "to": "agent_<architect-id>",
    "prompt": "Validate the UX design against API and data flow constraints. Produce: final API contracts, data flow diagrams, integration notes. Identify any design/architecture conflicts where the UX requires data or patterns not available in the current architecture.\n\n## Inputs\nUX wireframes and component specs: {$STEP_1_UX_OUTPUT}\nInitial API analysis: {$STEP_1_ARCH_OUTPUT}\nRequirements: {requirements}\n\n## Output\nAPI contracts, data flow specs, integration notes. If conflicts: list each as 'DESIGN_CONFLICT: {description}'."
  }
}
```

For the full spawn / reuse pattern see `claude-subagent-protocol` §4.

## Agent Activation

> **Project context**: Master passes the `## Project Context` block (from its activation scan) to each agent in their first task message. Agents receive context from master — they do not re-scan independently.

- **UX Designer**: activate `arcwright-ux-designer`
  - Has **full dev skill access** — can invoke any skill in `.agents/skills/` directly, including prototyping tools to validate design assumptions.
- **Architect**: activate `arcwright-architect`
  - Has **full dev skill access** — can invoke any skill in `.agents/skills/` directly, including writing prototype code to validate feasibility.

## Steps

No iterative loop. Defined forward flow with a parallel start and a conflict-resolution gate if needed.

### 1. Parallel Design + Requirements Analysis

**What this step does:** UX Designer produces wireframes and component specs while Architect analyzes requirements for API and data flow implications — both start from the same brief.
**Inputs:** Design brief and requirements from master
**Output:** `$STEP_1_UX_OUTPUT` — wireframes + component specs; `$STEP_1_ARCH_OUTPUT` — initial API/data flow analysis

---

#### Default: In-Process (Agent tool)

Check the registry: both `ux` and `architect` are first-time roles. Spawn both in a single assistant message (parallel fan-out):

```json
[
  {
    "name": "Agent",
    "input": {
      "subagent_type": "arcwright-ux-designer",
      "prompt": "Produce wireframes and component specifications for the design brief. This is a DESIGN ARTIFACT ONLY — no production code.\n\n## Inputs\nDesign brief: {design_brief}\n\n## Output\nWireframes (text descriptions or ASCII), component specs, and interaction design notes.",
      "model": "sonnet"
    }
  },
  {
    "name": "Agent",
    "input": {
      "subagent_type": "arcwright-architect",
      "prompt": "Analyze the requirements for API contract and data flow implications. Identify: what data the UX will need, what API endpoints are required, what data flow patterns apply. Write prototype code to validate assumptions if needed.\n\n## Inputs\nRequirements: {requirements}\nDesign brief: {design_brief}\n\n## Output\nInitial API/data flow analysis: required endpoints, data shapes, feasibility assessment.",
      "model": "sonnet"
    }
  }
]
```

Capture the returned `agentId` for each spawn and write rows to the Session Agent Registry. Capture results into `$STEP_1_UX_OUTPUT` and `$STEP_1_ARCH_OUTPUT`. Pass both to step 2.

---

#### Pane Visibility (opt-in)

For opt-in pane visibility, see the `herdr` skill's "Watching agents in panes (opt-in)" section (spawn with `herdr agent start`, wait with `herdr wait agent-status`). The pane is a viewing surface; the in-process Agent tool + SendMessage flow is still governed by `claude-subagent-protocol`.

---

### 2. Architecture Validation of UX Design

**What this step does:** Architect validates the UX design against API/data flow constraints and identifies any design/architecture conflicts.
**Inputs:** `$STEP_1_UX_OUTPUT` (wireframes + component specs) + `$STEP_1_ARCH_OUTPUT` (initial analysis) + requirements
**Output:** `$STEP_2_OUTPUT` — API contracts + data flow specs, approved OR design-conflict signals

---

#### Default: In-Process (Agent tool)

`architect` is already in the registry from step 1 — dispatch via `SendMessage` (re-engage the existing architect with the new validation task). Do not re-spawn.

```json
{
  "name": "SendMessage",
  "input": {
    "to": "agent_<architect-id>",
    "prompt": "Validate the UX design against API and data flow constraints. Produce: final API contracts, data flow diagrams, integration notes. Identify any design/architecture conflicts where the UX requires data or patterns not available in the current architecture.\n\n## Inputs\nUX wireframes and component specs: {$STEP_1_UX_OUTPUT}\nInitial API analysis: {$STEP_1_ARCH_OUTPUT}\nRequirements: {requirements}\n\n## Output\nAPI contracts, data flow specs, integration notes. If conflicts: list each as 'DESIGN_CONFLICT: {description}'."
  }
}
```

Capture the Agent tool return value into `$STEP_2_OUTPUT`. If design conflicts found: pass to step 3. Otherwise pass to step 4.

---

#### Pane Visibility (opt-in)

For opt-in pane visibility, see the `herdr` skill's "Watching agents in panes (opt-in)" section (spawn with `herdr agent start`, wait with `herdr wait agent-status`). The pane is a viewing surface; the in-process Agent tool + SendMessage flow is still governed by `claude-subagent-protocol`.

---

### 3. Conflict Resolution (conditional — only if step 2 found conflicts)

**What this step does:** Master surfaces conflicts to both agents for negotiation. Each proposes a resolution. Master presents options to user if not auto-resolvable.
**Inputs:** `$STEP_2_OUTPUT` (conflict descriptions) + `$STEP_1_UX_OUTPUT`
**Output:** `$STEP_3_OUTPUT` — resolved design adjustments. Return to step 2.

This step may require user judgment if both agents cannot auto-resolve. Master presents the conflict and options to the user before proceeding.

---

#### Default: In-Process (Agent tool)

Both `ux` and `architect` are in the registry from step 1 — dispatch both via `SendMessage` in a single assistant message. Do not re-spawn.

```json
[
  {
    "name": "SendMessage",
    "input": {
      "to": "agent_<ux-id>",
      "prompt": "A design/architecture conflict was identified. Propose a UX-side resolution that addresses the constraint.\n\n## Inputs\nConflict: {design_conflicts_from_step_2}\nOriginal UX design: {$STEP_1_UX_OUTPUT}\n\n## Output\nProposed UX resolution: what UX adjustment would satisfy the architectural constraint."
    }
  },
  {
    "name": "SendMessage",
    "input": {
      "to": "agent_<architect-id>",
      "prompt": "A design/architecture conflict was identified. Propose an architecture-side resolution that satisfies the UX need.\n\n## Inputs\nConflict: {design_conflicts_from_step_2}\nOriginal UX design: {$STEP_1_UX_OUTPUT}\n\n## Output\nProposed architecture resolution: what API/data change would satisfy the UX requirement."
    }
  }
]
```

Capture results into `$STEP_3_OUTPUT`. Present both resolution options to user if auto-resolution is not clear. After user selects direction: return to step 2 with resolved design.

---

#### Pane Visibility (opt-in)

For opt-in pane visibility, see the `herdr` skill's "Watching agents in panes (opt-in)" section (spawn with `herdr agent start`, wait with `herdr wait agent-status`). The pane is a viewing surface; the in-process Agent tool + SendMessage flow is still governed by `claude-subagent-protocol`.

---

### 4. Final Artifact Collation

**What this step does:** Master collates all design outputs and presents the final package to the user.
**Inputs:** `$STEP_1_UX_OUTPUT`, `$STEP_2_OUTPUT` (architecture validation + contracts)
**Output:** `$STEP_4_OUTPUT` — final design package. Final output — no next step.

This step is performed by master directly: collate wireframes, component specs, API contracts, data flow diagrams, and integration notes into a final design package and present to user.

---

## Team Wind-down

In-process wind-down — no pane close:

- Mark a role "done" by stopping further dispatch to that role. The agent becomes idle but is not killed (the user can pick it back up with `SendMessage` later in the session).
- The Session Agent Registry may be deleted or renamed to `agent-registry.closed.md` when the session ends.
- Inspect live agents at any time via `claude agents` (or `claude agents --json` for parseable output).
- There is no `kill-pane` analogue. The wind-down is: stop dispatching, let the session end.

## Kiro Pipeline

> Note: The conflict resolution path (step 3) is conditional on design conflicts being found in step 2. This pipeline models the happy path (no conflicts). If conflicts arise, re-invoke with a conflict-resolution stage inserted between `arch-validate` and `final-collate`.

Use the `subagent` tool to run this team as a Kiro pipeline.

```json
{
  "task": "Design a feature: UX produces wireframes and component specs while Architect analyzes API/data flow, Architect validates compatibility, master collates final design package.",
  "stages": [
    {
      "name": "ux-design",
      "role": "arcwright-ux-designer",
      "prompt_template": "Produce wireframes and component specifications for the design brief. This is a DESIGN ARTIFACT ONLY — no production code: {task}",
      "depends_on": []
    },
    {
      "name": "arch-analysis",
      "role": "arcwright-architect",
      "prompt_template": "Analyze the requirements for API contract and data flow implications. Identify what data the UX will need, what API endpoints are required, what data flow patterns apply: {task}",
      "depends_on": []
    },
    {
      "name": "arch-validate",
      "role": "arcwright-architect",
      "prompt_template": "Validate the UX design against API and data flow constraints. Produce final API contracts, data flow specs, integration notes. Identify any design/architecture conflicts: {task}",
      "depends_on": ["ux-design", "arch-analysis"]
    },
    {
      "name": "ux-conflict-resolve",
      "role": "arcwright-ux-designer",
      "prompt_template": "If any design/architecture conflicts were identified, propose a UX-side resolution that addresses the constraint. Otherwise confirm design is compatible: {task}",
      "depends_on": ["arch-validate"]
    }
  ]
}
```
