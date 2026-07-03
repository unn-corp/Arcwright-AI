---
name: "team-docs"
description: "The Library — in-process Tech Writer drafts, Architect reviews for technical accuracy, lightweight revise loop. Spawn-once + SendMessage reuse; sonnet-first with opus permission-gated on Architect."
---

# Agent Team: Docs + Arch Review — The Library

> **Default orchestration:** in-process via the [`claude-subagent-protocol`](../claude-subagent-protocol/SKILL.md) skill. The `Agent` tool + `SendMessage` reuse with a Session Agent Registry is the canonical path. herdr pane variant is offered when `$HERDR_ENV` is set (spawn each role in its own pane in the current session) (see the [herdr](../herdr/SKILL.md) skill).
>
> **Kiro CLI:** this team is available as a Kiro `subagent` pipeline. See `## Kiro Pipeline` at the end of this skill.

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

## Agent Registry

The Session Agent Registry replaces the old `session-state.md` pane-ID table. Record every role that has a live agent so subsequent tasks reuse the same agent via `SendMessage` (full prior context) instead of spawning fresh.

**Registry path:**

```
_arcwright-output/sessions/<session-id>/agent-registry.md
```

**Initial state for this team:**

| Role | Agent ID | Spawned | Last Task | Notes |
|------|----------|---------|-----------|-------|
| tech-writer | *(set on first spawn)* | *(ISO ts)* | documentation draft | reused on revision (step 3) |
| architect | *(set on first spawn)* | *(ISO ts)* | technical accuracy review | reused on re-review loops |

**Lifecycle:**

- First task for a role → orchestrator spawns via `Agent` tool → captures the returned `agentId` → writes a row to the registry → dispatches the task.
- Subsequent tasks for the same role → orchestrator reads the registry, finds the row, dispatches via `SendMessage(to: agentId, ...)`.
- On session wind-down, the registry may be deleted or renamed to `agent-registry.closed.md`.

See [`claude-subagent-protocol`](../claude-subagent-protocol/SKILL.md) §3 for the full format and §3.4 for the spawn-vs-reuse decision rule.

## Spawn-once + Reuse

Two roles, lightweight loop. Tech Writer spawns once and is reused on each revision; Architect spawns once and is reused on each re-review. No third role.

| Step | Role | Action | Notes |
|------|------|--------|-------|
| 1. Documentation draft | tech-writer | **Spawn** (first use) | Sequential start. |
| 2. Technical accuracy review | architect | **Spawn** (first use) | Sequential after draft. |
| 3. Revision (conditional) | tech-writer | **Reuse** — `SendMessage` to the registry's tech-writer ID | Only if step 2 returned needs-revision. |
| 2'. Re-review (loop) | architect | **Reuse** — `SendMessage` to the registry's architect ID | Loop until approved. |

For full spawn JSON and SendMessage JSON, see `claude-subagent-protocol` §4.

## Model and Mode Strategy

**Sonnet is the default for every role.** The Architect role is the historical reason to consider `opus`; even so, the orchestrator must ask the user before any `opus` spawn (see `claude-subagent-protocol` §6.3 for the permission-before-opus gate).

| Role | Default model | Opus allowed? | Notes |
|------|---------------|---------------|-------|
| `arcwright-tech-writer` | `sonnet` | No | Drafting + revision; sonnet is sufficient. |
| `arcwright-architect` | `sonnet` | Yes — with explicit user permission | Technical accuracy review; deeper reasoning helps. **Ask the user before spawning architect on opus.** |

Format the permission question as in `claude-subagent-protocol` §6.3:

```
This task may benefit from opus on the Architect spawn (deeper reasoning). Default is sonnet.
Switch this spawn to opus? (yes / no / always-yes-for-this-session)
```

Do not silently escalate. If the user says "no", spawn sonnet.

## Steps

Lightweight draft → review → revise → approve cycle.

### 1. Documentation Draft

**What this step does:** Tech Writer produces the initial documentation draft for the topic.
**Inputs:** Documentation topic and source material from master
**Output:** `$STEP_1_OUTPUT` — documentation draft (file path or inline content)
**Spawn vs reuse:** **Spawn** — first use of the tech-writer role in this session.

```json
{
  "name": "Agent",
  "input": {
    "subagent_type": "arcwright-tech-writer",
    "prompt": "Write documentation for the specified topic. Prioritize clarity, completeness, and correct structure. Include all relevant details from the source material.\n\n## Inputs\nTopic: {topic}\nSource material: {source_material}\n\n## Output\nDocumentation draft. Write to _arcwright-output/features/{slug}/docs/draft.md (or as otherwise specified).",
    "model": "sonnet"
  }
}
```

After this call returns, write the tech-writer's `agentId` to the Session Agent Registry.

> **6 KB guard:** if the source material is large, write it to a file under `_arcwright-output/features/{slug}/...` and pass the path in `## Inputs` (see `claude-subagent-protocol` §7.3).

Capture result into `$STEP_1_OUTPUT`. Pass to step 2.

---

### 2. Technical Accuracy Review

**What this step does:** Architect reviews the draft for technical correctness — wrong API signatures, outdated patterns, missing caveats, inaccurate system behavior descriptions.
**Inputs:** `$STEP_1_OUTPUT` (documentation draft from step 1)
**Output:** `$STEP_2_OUTPUT` — approved, or needs-revision with specific inaccuracies listed
**Spawn vs reuse:** **Spawn** — first use of the architect role in this session.

```json
{
  "name": "Agent",
  "input": {
    "subagent_type": "arcwright-architect",
    "prompt": "Review this documentation draft for technical accuracy. Check for: wrong API signatures, outdated patterns, missing important caveats, inaccurate descriptions of system behavior, and any factual errors.\n\n## Inputs\nDocumentation draft: {$STEP_1_OUTPUT}\n\n## Output\nEither 'Approved: documentation is technically accurate.' OR 'Needs revision: ' followed by a numbered list of inaccuracies with specific corrections. Write to _arcwright-output/features/{slug}/docs/review.md.",
    "model": "sonnet"
  }
}
```

After this call returns, write the architect's `agentId` to the Session Agent Registry.

> **Permission gate:** if the orchestrator intends to spawn with `model: "opus"`, ask the user first per `claude-subagent-protocol` §6.3. Default is `sonnet`.

Capture result into `$STEP_2_OUTPUT`. If approved: documentation complete. If needs-revision: pass to step 3.

---

### 3. Revision (conditional — only if step 2 returned needs-revision)

**What this step does:** Tech Writer revises the draft based on the Architect's findings.
**Inputs:** `$STEP_2_OUTPUT` (Architect findings) + `$STEP_1_OUTPUT` (original draft)
**Output:** `$STEP_3_OUTPUT` — revised draft
**Spawn vs reuse:** **Reuse** — `SendMessage` to the tech-writer's `agentId` in the registry. The tech-writer retains the original draft context.

```json
{
  "name": "SendMessage",
  "input": {
    "to": "<tech-writer agentId from registry>",
    "prompt": "Re-engage the existing Tech Writer agent.\n\n## Inputs\nArchitect findings: {$STEP_2_OUTPUT}\nOriginal draft: {$STEP_1_OUTPUT}\n\n## Output\nRevised documentation draft. Write to _arcwright-output/features/{slug}/docs/draft-v{n}.md (or as otherwise specified)."
  }
}
```

> **Note:** when reusing, do not re-feed prior context into the prompt; reference only the new delta (the Architect's findings). The tech-writer already knows the original draft from step 1.

Capture result into `$STEP_3_OUTPUT`. Return to step 2 (Architect re-reviews via another `SendMessage` to the same architect `agentId`). When Architect approves: documentation complete. Final output — no next step.

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

> Note: This pipeline represents one iteration of the draft→review→revise loop. Re-invoke for additional revision iterations if the Architect returns needs-revision.

Use the `subagent` tool to run this team as a Kiro pipeline.

```json
{
  "task": "Write and technically review documentation: Tech Writer drafts, Architect reviews for accuracy, Tech Writer revises.",
  "stages": [
    {
      "name": "doc-draft",
      "role": "arcwright-tech-writer",
      "prompt_template": "Write documentation for the specified topic. Prioritize clarity, completeness, and correct structure: {task}",
      "depends_on": []
    },
    {
      "name": "arch-review",
      "role": "arcwright-architect",
      "prompt_template": "Review the documentation draft for technical accuracy. Check for wrong API signatures, outdated patterns, missing caveats, inaccurate system behavior descriptions: {task}",
      "depends_on": ["doc-draft"]
    },
    {
      "name": "doc-revise",
      "role": "arcwright-tech-writer",
      "prompt_template": "Revise the documentation draft to fix all technical accuracy issues identified by the Architect. Address each issue specifically: {task}",
      "depends_on": ["arch-review"]
    }
  ]
}
```
