---
name: "team-review"
description: "Review + Fix Loop — in-process Architect and UX Designer run concurrent reviews, findings batch to Dev, targeted re-review until clean. Spawn-once + SendMessage reuse; sonnet-first with opus permission-gated on Architect."
---

# Agent Team: Review + Fix Loop

> **Default orchestration:** in-process via the [`claude-subagent-protocol`](../claude-subagent-protocol/SKILL.md) skill. The `Agent` tool + `SendMessage` reuse with a Session Agent Registry is the canonical path. tmux split-pane is opt-in visibility only (see the [tmux](../tmux/SKILL.md) skill).
>
> **Kiro CLI:** this team is available as a Kiro `subagent` pipeline. See `## Kiro Pipeline` at the end of this skill.

## Best Used For

- Pre-merge quality gates on feature branches
- Periodic code health reviews of a subsystem or component set
- Before a release when both architectural soundness and UX compliance need confirmation
- After a large refactor where design token usage or structural patterns may have drifted
- Any situation where DRY/SOLID + UV both need to pass before proceeding to merge

## Team Composition

| Role | Agent | Skills |
|------|-------|--------|
| Architect | `arcwright-architect` | Architecture review, DRY/SOLID, full dev skill access |
| UX Designer | `arcwright-ux-designer` | UV review, accessibility, design token compliance, full dev skill access |
| Dev | `arcwright-dev` | Fix implementation, can invoke architect and QA skills inline |

## Purpose

The Review + Fix Loop runs concurrent architectural and UX reviews, aggregates all findings by severity, and dispatches a batched fix task to Dev. After Dev fixes, only the affected areas are re-reviewed by the relevant reviewer — not a full re-review of everything. The loop exits when both reviewers signal a clean pass. Use this team when existing code needs a structured quality pass before merge or release, or when a feature needs dual-lens validation.

## Agent Registry

The Session Agent Registry replaces the old `session-state.md` pane-ID table. Record every role that has a live agent so subsequent tasks reuse the same agent via `SendMessage` (full prior context) instead of spawning fresh.

**Registry path:**

```
_arcwright-output/sessions/<session-id>/agent-registry.md
```

**Initial state for this team:**

| Role | Agent ID | Spawned | Last Task | Notes |
|------|----------|---------|-----------|-------|
| architect | *(set on first spawn)* | *(ISO ts)* | concurrent review | reused on targeted re-review (step 3) |
| ux-designer | *(set on first spawn)* | *(ISO ts)* | concurrent review | reused on targeted re-review (step 3) |
| dev | *(set on first spawn)* | *(ISO ts)* | fix batch | reused on subsequent fix passes |

**Lifecycle:**

- First task for a role → orchestrator spawns via `Agent` tool → captures the returned `agentId` → writes a row to the registry → dispatches the task.
- Subsequent tasks for the same role → orchestrator reads the registry, finds the row, dispatches via `SendMessage(to: agentId, ...)`.
- On session wind-down, the registry may be deleted or renamed to `agent-registry.closed.md`.

See [`claude-subagent-protocol`](../claude-subagent-protocol/SKILL.md) §3 for the full format and §3.4 for the spawn-vs-reuse decision rule.

## Spawn-once + Reuse

This team has three roles. Architect and UX Designer spawn once in step 1 (parallel); they're reused via `SendMessage` in step 3 for targeted re-reviews. Dev spawns once in step 2 and is reused on subsequent fix passes (step 2 of the next loop iteration).

| Step | Role | Action | Notes |
|------|------|--------|-------|
| 1. Concurrent review | architect | **Spawn** (first use) | Parallel fan-out with UX Designer. |
| 1. Concurrent review | ux-designer | **Spawn** (first use) | Parallel fan-out with Architect. |
| 2. Fix batch | dev | **Spawn** (first use) | Sequential after step 1's parallel fan-out. |
| 3. Targeted re-review | architect | **Reuse** — `SendMessage` to the registry's architect ID | Only if Architect had findings in step 1. |
| 3. Targeted re-review | ux-designer | **Reuse** — `SendMessage` to the registry's ux-designer ID | Only if UX had findings in step 1. |
| 2'. Fix pass (loop) | dev | **Reuse** — `SendMessage` to the registry's dev ID | Loop until both reviewers give clean pass. |

For full spawn JSON and SendMessage JSON, see `claude-subagent-protocol` §4. Step 1 issues both Agent calls (architect, ux) in a **single assistant message** so they run concurrently as a parallel fan-out (see `claude-subagent-protocol` §5.2).

## Model and Mode Strategy

**Sonnet is the default for every role.** The Architect role is the historical reason to consider `opus`; even so, the orchestrator must ask the user before any `opus` spawn (see `claude-subagent-protocol` §6.3 for the permission-before-opus gate).

| Role | Default model | Opus allowed? | Notes |
|------|---------------|---------------|-------|
| `arcwright-architect` | `sonnet` | Yes — with explicit user permission | Reviewer; deeper reasoning helps. **Ask the user before spawning architect on opus.** |
| `arcwright-ux-designer` | `sonnet` | No | UV review; sonnet is sufficient. |
| `arcwright-dev` | `sonnet` | No | Fix execution; cheaper, faster, sufficient. |

Format the permission question as in `claude-subagent-protocol` §6.3:

```
This task may benefit from opus on the Architect spawn (deeper reasoning). Default is sonnet.
Switch this spawn to opus? (yes / no / always-yes-for-this-session)
```

Do not silently escalate. If the user says "no", spawn sonnet.

## Steps

### 1. Concurrent Review

**What this step does:** Architect and UX Designer run concurrent reviews of the target scope, each producing a list of findings by severity.
**Inputs:** Review scope (files/areas) from master
**Output:** `$STEP_1_AR_OUTPUT`, `$STEP_1_UX_OUTPUT` — findings from each reviewer
**Spawn vs reuse:** **Spawn both** — first use of architect and ux-designer in this session.

Issue both Agent calls in a **single assistant message** (parallel fan-out). Each agent owns a disjoint output path:

```json
[
  {
    "name": "Agent",
    "input": {
      "subagent_type": "arcwright-architect",
      "prompt": "Review the following scope for architectural issues: DRY/SOLID violations, structural problems, integration pattern issues, dead code. List each finding with severity (critical | major | minor) and description.\n\n## Inputs\nReview scope: {review_scope}\n\n## Output\nList of findings with severity, file/area, and short description. If none: 'No findings.' Write to _arcwright-output/features/{slug}/review/ar.md.",
      "model": "sonnet"
    }
  },
  {
    "name": "Agent",
    "input": {
      "subagent_type": "arcwright-ux-designer",
      "prompt": "Review the following scope for UX/UI issues: accessibility violations, design token non-compliance, interaction pattern problems, visual inconsistencies. List each finding with severity (critical | major | minor).\n\n## Inputs\nReview scope: {review_scope}\n\n## Output\nList of findings with severity, file/area, and short description. If none: 'No findings.' Write to _arcwright-output/features/{slug}/review/uv.md.",
      "model": "sonnet"
    }
  }
]
```

After both calls return, write the `agentId` for each role to the Session Agent Registry.

> **Permission gate:** if the orchestrator intends to spawn the architect with `model: "opus"`, ask the user first per `claude-subagent-protocol` §6.3. Default is `sonnet`.

Capture results into `$STEP_1_AR_OUTPUT` and `$STEP_1_UX_OUTPUT`. Merge and sort all findings by severity (critical first, then major, then minor). Tag each finding with its owning reviewer. If both reviewers report "No findings": loop exits, task complete. Otherwise: pass merged findings to step 2.

---

### 2. Fix Batch

**What this step does:** Dev fixes all findings in severity order.
**Inputs:** Merged and sorted findings from step 1
**Output:** `$STEP_2_OUTPUT` — fix complete with files changed
**Spawn vs reuse:** **Spawn** — first use of dev in this session.

```json
{
  "name": "Agent",
  "input": {
    "subagent_type": "arcwright-dev",
    "prompt": "Fix all review findings in priority order (critical first, then major, then minor).\n\n## Inputs\nFindings (sorted by severity, tagged by reviewer): {merged_findings_from_step_1}\n\n## Output\nFix complete. List all files changed and describe each fix. Tag each fix with its finding severity and originating reviewer. Write to _arcwright-output/features/{slug}/review/fixes.md.",
    "model": "sonnet",
    "permissionMode": "acceptEdits"
  }
}
```

After this call returns, write the dev's `agentId` to the Session Agent Registry.

> **Trust but verify:** after the Agent call returns, run `git diff --stat` to confirm the claimed file changes actually landed before reporting this step complete. See `claude-subagent-protocol` §9.

Capture result into `$STEP_2_OUTPUT`. Pass to step 3.

---

### 3. Targeted Re-Review

**What this step does:** Only the reviewers whose findings were addressed re-review only the affected areas (not a full re-review).
**Inputs:** `$STEP_2_OUTPUT` (files changed + fix descriptions) + the original findings from step 1 (filtered to the affected reviewer)
**Output:** `$STEP_3_OUTPUT` — re-review result: clean or new findings. Loop exits when both reviewers give clean pass.
**Spawn vs reuse:** **Reuse** — `SendMessage` to the existing `agentId` in the registry for each reviewer with affected findings. Each reviewer already holds the original scope and findings from step 1.

> **Disjoint re-reviews:** if both reviewers had fixes, issue both `SendMessage` calls in a single assistant message (parallel). Each reviewer reviews only its own affected areas; output paths are disjoint.

**Architect re-review (only if architect had findings in step 1):**

```json
{
  "name": "SendMessage",
  "input": {
    "to": "<architect agentId from registry>",
    "prompt": "Re-engage the existing Architect reviewer.\n\n## Inputs\nFiles changed: {$STEP_2_OUTPUT}\nOriginal AR findings: {$STEP_1_AR_OUTPUT}\n\n## Output\nRe-review result: clean pass OR new/remaining findings with severity, file/area, and description. Write to _arcwright-output/features/{slug}/review/ar-rereview.md."
  }
}
```

**UX re-review (only if UX had findings in step 1):**

```json
{
  "name": "SendMessage",
  "input": {
    "to": "<ux-designer agentId from registry>",
    "prompt": "Re-engage the existing UX reviewer.\n\n## Inputs\nFiles changed: {$STEP_2_OUTPUT}\nOriginal UX findings: {$STEP_1_UX_OUTPUT}\n\n## Output\nRe-review result: clean pass OR new/remaining findings with severity, file/area, and description. Write to _arcwright-output/features/{slug}/review/uv-rereview.md."
  }
}
```

> **Permission gate:** if reusing the architect with `model: "opus"`, ask the user first per `claude-subagent-protocol` §6.3. The architect role is the historical case for opus.

Capture results into `$STEP_3_OUTPUT`. If both reviewers (or the only reviewer with findings) report clean: loop exits, task complete. If new findings: return to step 2 with remaining findings (reuse the dev via `SendMessage`). Final output — no next step.

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

For opt-in pane visibility (the `tmux` skill's "Watching agents in panes" section), `AGENT_SIGNAL::TASK_DONE::...` is still allowed **inside that opt-in block** — but it does not apply to the default in-process flow.

#### tmux Variant (opt-in — only when user explicitly requests pane visibility AND $TMUX is set)

For opt-in pane visibility, see the [`tmux`](../tmux/SKILL.md) skill's "Watching agents in panes (opt-in)" section. The pane is a viewing surface; the in-process orchestration inside it is still governed by this skill. Do not use this variant by default.

## Kiro Pipeline

> Note: This pipeline represents one iteration of the review+fix loop. Re-invoke for additional iterations if re-review finds new findings.

Use the `subagent` tool to run this team as a Kiro pipeline.

```json
{
  "task": "Concurrent architectural and UX review, batched fix, and targeted re-review until both reviewers signal clean.",
  "stages": [
    {
      "name": "review-ar",
      "role": "arcwright-architect",
      "prompt_template": "Review the scope for architectural issues: DRY/SOLID violations, structural problems, integration pattern issues, dead code. List each finding with severity: {task}",
      "depends_on": []
    },
    {
      "name": "review-ux",
      "role": "arcwright-ux-designer",
      "prompt_template": "Review the scope for UX/UI issues: accessibility violations, design token non-compliance, interaction pattern problems, visual inconsistencies. List each finding with severity: {task}",
      "depends_on": []
    },
    {
      "name": "dev-fix",
      "role": "arcwright-dev",
      "prompt_template": "Fix all review findings in priority order (critical first, then major, then minor). Tag each fix with its finding severity and originating reviewer: {task}",
      "depends_on": ["review-ar", "review-ux"]
    },
    {
      "name": "re-review-ar",
      "role": "arcwright-architect",
      "prompt_template": "Re-review ONLY the areas that were just fixed. Confirm architectural findings are resolved and no new issues were introduced: {task}",
      "depends_on": ["dev-fix"]
    },
    {
      "name": "re-review-ux",
      "role": "arcwright-ux-designer",
      "prompt_template": "Re-review ONLY the areas that were just fixed. Confirm UX findings are resolved and no new issues were introduced: {task}",
      "depends_on": ["dev-fix"]
    }
  ]
}
```
