---
name: "team-blueprint"
description: "War Room — in-process strategic planning council with PM, Analyst, and Architect. Spawn-once + SendMessage reuse; sonnet-first with opus permission-gated on Architect. Produces planning artifacts only — no production code."
---

# Agent Team: Blueprint — The War Room

> **Default orchestration:** in-process via the [`claude-subagent-protocol`](../claude-subagent-protocol/SKILL.md) skill. The `Agent` tool + `SendMessage` reuse with a Session Agent Registry is the canonical path. herdr pane variant is opt-in (see the [herdr](../herdr/SKILL.md) skill).
>
> **Kiro CLI:** this team is available as a Kiro `subagent` pipeline. See `## Kiro Pipeline` at the end of this skill.

## Best Used For

- Kicking off a new feature or product area before any code is written
- Validating technical feasibility of a product idea before committing sprint capacity
- Creating a full planning package: PRD + research report + architecture notes + sprint plan
- Large initiatives where poor upfront planning would be costly to unwind
- Situations where PM, research, and architecture concerns need to be resolved together

## Team Composition

| Role | Agent | Skills |
|------|-------|--------|
| PM | `arcwright-pm` | PRD creation, backlog, sprint planning |
| Analyst | `arcwright-analyst` | Domain research, market research, competitive analysis |
| Architect | `arcwright-architect` | Architecture design, feasibility validation, prototype code |

## Purpose

The War Room assembles before any significant build begins. The PM drives the product specification and acceptance criteria, the Analyst researches domain constraints, user needs, and competitive landscape, and the Architect validates technical feasibility and can write prototype code to pressure-test assumptions. Output is planning artifacts only — no production code is produced by this team.

## Agent Registry

The Session Agent Registry replaces the old `session-state.md` pane-ID table. Record every role that has a live agent so subsequent tasks reuse the same agent via `SendMessage` (full prior context) instead of spawning fresh.

**Registry path:**

```
_arcwright-output/sessions/<session-id>/agent-registry.md
```

**Initial state for this team:**

| Role | Agent ID | Spawned | Last Task | Notes |
|------|----------|---------|-----------|-------|
| pm | *(set on first spawn)* | *(ISO ts)* | research + initial PRD | reused on PRD enrichment + synthesis |
| analyst | *(set on first spawn)* | *(ISO ts)* | domain research | single-shot — no later reuse |
| architect | *(set on first spawn)* | *(ISO ts)* | architecture feasibility | single-shot — no later reuse |

**Lifecycle:**

- First task for a role → orchestrator spawns via `Agent` tool → captures the returned `agentId` → writes a row to the registry → dispatches the task.
- Subsequent tasks for the same role → orchestrator reads the registry, finds the row, dispatches via `SendMessage(to: agentId, ...)`.
- On session wind-down, the registry may be deleted or renamed to `agent-registry.closed.md`.

See [`claude-subagent-protocol`](../claude-subagent-protocol/SKILL.md) §3 for the full format and §3.4 for the spawn-vs-reuse decision rule.

## Spawn-once + Reuse

The PM is the most-reused role — it runs at step 1 (parallel start), step 2 (PRD enrichment), and step 4 (synthesis). The Analyst and Architect each run once. All three are spawned via `Agent` tool on their first appearance; the PM is reused twice via `SendMessage`.

| Step | Role | Action | Notes |
|------|------|--------|-------|
| 1. Research + initial PRD (parallel) | analyst | **Spawn** (first use) | Parallel fan-out with PM. |
| 1. Research + initial PRD (parallel) | pm | **Spawn** (first use) | Parallel fan-out with Analyst. |
| 2. PRD enrichment | pm | **Reuse** — `SendMessage` to the registry's pm ID | The PM retains the initial draft. |
| 3. Architecture feasibility | architect | **Spawn** (first use) | Single-shot. |
| 4. Synthesis | pm | **Reuse** — `SendMessage` to the registry's pm ID | The PM retains PRD + research + arch context. |

For full spawn JSON and SendMessage JSON, see `claude-subagent-protocol` §4. Step 1 issues both Agent calls in a **single assistant message** so they run concurrently as a parallel fan-out (see `claude-subagent-protocol` §5.2).

## Model and Mode Strategy

**Sonnet is the default for every role.** The Architect role is the historical reason to consider `opus`; even so, the orchestrator must ask the user before any `opus` spawn (see `claude-subagent-protocol` §6.3 for the permission-before-opus gate).

| Role | Default model | Opus allowed? | Notes |
|------|---------------|---------------|-------|
| `arcwright-pm` | `sonnet` | No | Planning synthesis; sonnet is sufficient. |
| `arcwright-analyst` | `sonnet` | No | Research, no code writes. |
| `arcwright-architect` | `sonnet` | Yes — with explicit user permission | Feasibility + prototype. **Ask the user before spawning architect on opus.** |

Format the permission question as in `claude-subagent-protocol` §6.3:

```
This task may benefit from opus on the Architect spawn (deeper reasoning). Default is sonnet.
Switch this spawn to opus? (yes / no / always-yes-for-this-session)
```

Do not silently escalate. If the user says "no", spawn sonnet.

## Steps

> **Reminder:** this team produces planning artifacts only — no production code. The Architect's `permissionMode` is `acceptEdits` only for prototype / spike code in step 3; the PM and Analyst write to `_arcwright-output/...` and need no special permission mode.

### 1. Research + Initial PRD (parallel start)

**What this step does:** Analyst conducts domain research while PM drafts the initial PRD stub — both run in parallel since they start from the same brief.
**Inputs:** Feature brief from master
**Output:** `$STEP_1_ANALYST_OUTPUT` — research findings; `$STEP_1_PM_OUTPUT` — initial PRD draft
**Spawn vs reuse:** **Spawn both** — first use of analyst and pm in this session.

Issue both Agent calls in a **single assistant message** (parallel fan-out). Each agent owns a disjoint output path:

```json
[
  {
    "name": "Agent",
    "input": {
      "subagent_type": "arcwright-analyst",
      "prompt": "Conduct domain research for the feature brief. Cover: domain constraints, user needs, competitive landscape, technical feasibility signals, and any relevant prior art.\n\n## Inputs\nFeature brief: {feature_brief}\n\n## Output\nStructured research findings with key insights and recommendations. Write to _arcwright-output/features/{slug}/research/r-domain.md.",
      "model": "sonnet"
    }
  },
  {
    "name": "Agent",
    "input": {
      "subagent_type": "arcwright-pm",
      "prompt": "Draft an initial PRD stub for the feature brief. Cover: goals, user stories, acceptance criteria (draft), out-of-scope items, and open questions.\n\n## Inputs\nFeature brief: {feature_brief}\n\n## Output\nInitial PRD draft. Write to _arcwright-output/features/{slug}/planning/prd-draft.md.",
      "model": "sonnet"
    }
  }
]
```

After both calls return, write the `agentId` for each role to the Session Agent Registry.

> **6 KB guard:** if the brief or research output is large, write the artifact to a file under `_arcwright-output/features/{slug}/...` and pass the path in the next step's `## Inputs` (see `claude-subagent-protocol` §7.3).

Capture results into `$STEP_1_ANALYST_OUTPUT` and `$STEP_1_PM_OUTPUT`. Pass both to step 2.

---

### 2. PRD Enrichment

**What this step does:** PM enriches the PRD draft with the Analyst's research findings, producing a complete PRD.
**Inputs:** `$STEP_1_ANALYST_OUTPUT` (research) + `$STEP_1_PM_OUTPUT` (initial PRD draft)
**Output:** `$STEP_2_OUTPUT` — complete PRD with research-enriched acceptance criteria
**Spawn vs reuse:** **Reuse** — `SendMessage` to the PM's `agentId` in the registry. The PM retains the initial PRD draft context.

```json
{
  "name": "SendMessage",
  "input": {
    "to": "<pm agentId from registry>",
    "prompt": "Re-engage the existing PM agent.\n\n## Inputs\nInitial PRD draft: {$STEP_1_PM_OUTPUT}\nResearch findings: {$STEP_1_ANALYST_OUTPUT}\n\n## Output\nComplete enriched PRD. Write to _arcwright-output/features/{slug}/planning/prd.md."
  }
}
```

> **Note:** when reusing, do not re-feed prior context into the prompt; reference only the new delta (the research findings). The PM already knows the initial draft from step 1.

Capture result into `$STEP_2_OUTPUT`. Pass to step 3.

---

### 3. Architecture Feasibility

**What this step does:** Architect validates technical feasibility of the enriched PRD and produces architecture notes, technical risks, and any prototype code.
**Inputs:** `$STEP_2_OUTPUT` (enriched PRD) + feature brief
**Output:** `$STEP_3_OUTPUT` — architecture notes, technical risks, feasibility assessment, any prototype code
**Spawn vs reuse:** **Spawn** — first use of the architect role in this session.

```json
{
  "name": "Agent",
  "input": {
    "subagent_type": "arcwright-architect",
    "prompt": "Validate technical feasibility of the PRD. Produce: architecture notes, technical risks, feasibility assessment. Write any prototype code needed to validate assumptions.\n\n## Inputs\nEnriched PRD: {$STEP_2_OUTPUT}\nFeature brief: {feature_brief}\n\n## Output\nArchitecture notes with technical risks, feasibility verdict, and any prototype code. Write to _arcwright-output/features/{slug}/planning/architecture.md and prototype code to _arcwright-output/features/{slug}/prototype/.",
    "model": "sonnet",
    "permissionMode": "acceptEdits"
  }
}
```

After this call returns, write the architect's `agentId` to the Session Agent Registry (in case the team is re-invoked for additional planning).

> **Permission gate:** if the orchestrator intends to spawn with `model: "opus"`, ask the user first per `claude-subagent-protocol` §6.3. Default is `sonnet`.

> **Trust but verify:** if the architect writes prototype code under `_arcwright-output/features/{slug}/prototype/`, confirm files exist via `Read` / `Bash` ls before reporting step complete.

Capture result into `$STEP_3_OUTPUT`. Pass to step 4.

---

### 4. Synthesis

**What this step does:** Master (or the PM) collates all planning artifacts and presents the final package to the user.
**Inputs:** `$STEP_1_ANALYST_OUTPUT`, `$STEP_2_OUTPUT` (enriched PRD), `$STEP_3_OUTPUT` (architecture notes)
**Output:** `$STEP_4_OUTPUT` — final planning package. Final output — no next step.
**Spawn vs reuse:** **Reuse** — `SendMessage` to the PM's `agentId` in the registry. The PM retains PRD + research + arch context from steps 1 and 2.

```json
{
  "name": "SendMessage",
  "input": {
    "to": "<pm agentId from registry>",
    "prompt": "Re-engage the existing PM agent.\n\n## Inputs\nResearch findings: {$STEP_1_ANALYST_OUTPUT}\nEnriched PRD: {$STEP_2_OUTPUT}\nArchitecture notes: {$STEP_3_OUTPUT}\n\n## Output\nFinal planning package summary with: key decisions, open risks, recommended next steps, and artifact index. Write to _arcwright-output/features/{slug}/planning/summary.md."
  }
}
```

Capture result into `$STEP_4_OUTPUT`. Final output — no next step. Present to user.

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

Use the `subagent` tool to run this team as a Kiro pipeline.

```json
{
  "task": "Strategic planning: parallel research + initial PRD, enrich PRD with research, validate architecture feasibility, collate final planning package.",
  "stages": [
    {
      "name": "research",
      "role": "arcwright-analyst",
      "prompt_template": "Conduct domain research for the feature brief. Cover domain constraints, user needs, competitive landscape, technical feasibility signals, and prior art: {task}",
      "depends_on": []
    },
    {
      "name": "prd-draft",
      "role": "arcwright-pm",
      "prompt_template": "Draft an initial PRD stub for the feature brief. Cover goals, user stories, acceptance criteria (draft), out-of-scope items, and open questions: {task}",
      "depends_on": []
    },
    {
      "name": "prd-enrich",
      "role": "arcwright-pm",
      "prompt_template": "Enrich the initial PRD draft with the research findings. Update acceptance criteria, resolve open questions, and add research-derived constraints or opportunities: {task}",
      "depends_on": ["research", "prd-draft"]
    },
    {
      "name": "arch-feasibility",
      "role": "arcwright-architect",
      "prompt_template": "Validate technical feasibility of the enriched PRD. Produce architecture notes, technical risks, feasibility assessment, and any prototype code needed to validate assumptions: {task}",
      "depends_on": ["prd-enrich"]
    },
    {
      "name": "synthesis",
      "role": "arcwright-pm",
      "prompt_template": "Collate all planning artifacts into a final planning package. Summarize key decisions, open risks, and recommended next steps: {task}",
      "depends_on": ["arch-feasibility"]
    }
  ]
}
```
