---
name: "team-research"
description: "Recon Pod — Analyst researches, PM synthesizes into briefs, Tech Writer documents outputs; in-process with agent registry reuse"
---

# Agent Team: Research — Recon Pod

> **Default orchestration:** in-process via [`claude-subagent-protocol`](.agents/skills/claude-subagent-protocol/SKILL.md). Spawn-once + reuse via Session Agent Registry. herdr pane variant is opt-in (see the `herdr` skill).
>
> **Kiro CLI:** this team is available as a Kiro `subagent` pipeline. See `## Kiro Pipeline` at the end of this skill.

## Best Used For

- Pre-sprint research phases where domain knowledge needs to be gathered and synthesized
- Competitive analysis before a major feature decision
- Market research to validate product direction before committing sprint capacity
- Technical feasibility studies that need to be documented as reference artifacts
- Any research task large enough to benefit from researcher + synthesizer + documenter separation of concerns

## Team Composition

| Role | Agent | Skills |
|------|-------|--------|
| Analyst | `arcwright-analyst` | Domain research, market research, competitive analysis, technical investigation |
| PM | `arcwright-pm` | Synthesis, strategic framing, brief writing |
| Tech Writer | `arcwright-tech-writer` | Documentation, structured output, clarity editing |

## Purpose

The Recon Pod assembles for deep research tasks before strategy or build decisions. The Analyst conducts the primary research — domain analysis, competitive landscape, technical feasibility, user patterns. The PM synthesizes raw findings into actionable product briefs. The Tech Writer then structures and documents the final output for consumption by other teams or stakeholders. Master can spawn a second Analyst in parallel if the research scope demands it. Sequential flow: research → synthesis → documentation.

## Agent Registry

This team uses a Session Agent Registry (see `claude-subagent-protocol` §3) to record live agent IDs and reuse them across steps. Path:

```
_arcwright-output/sessions/<session-id>/agent-registry.md
```

Roles in this team (one row per role):

| Role | Agent | Notes |
|------|-------|-------|
| analyst | `arcwright-analyst` | Optionally two parallel research tracks (analyst + analyst-2) for large scope |
| pm | `arcwright-pm` | Reused for synthesis |
| tech-writer | `arcwright-tech-writer` | Reused for final documentation |

Spawn-once rule: the first time each role is needed, spawn via `Agent` tool and capture `agentId`. On any subsequent task for the same role, look up the row in the registry and dispatch via `SendMessage`. The PM agent keeps full prior context (the research findings) across the synthesis → documentation handoff. The Tech Writer keeps full prior context (the brief and the raw research) for the final document.

## Model Strategy (sonnet-first + permission gate)

| Role | Default | Opus |
|------|---------|------|
| `arcwright-analyst` | sonnet | only with explicit user permission |
| `arcwright-pm` | sonnet | only with explicit user permission |
| `arcwright-tech-writer` | sonnet | only with explicit user permission |

**Default is sonnet for every spawn.** Before spawning any agent with `model: "opus"` or raising effort, the orchestrator (or this skill) **must ask the user** first (per `claude-subagent-protocol` §6.3). No silent escalation.

## Spawn-once + Reuse

For each step, before issuing the Agent call, check the registry:

- **Registry miss** (first use of the role in this session) → spawn via `Agent` tool. Capture the returned `agentId` and write a registry row.
- **Registry hit** (same role, same context) → dispatch via `SendMessage(to: <agentId>, ...)`. The agent already holds the prior context — do not re-feed it.

For the full spawn / reuse pattern see `claude-subagent-protocol` §4.

## Agent Activation

> **Project context**: Master passes the `## Project Context` block (from its activation scan) to each agent in their first task message. Agents receive context from master — they do not re-scan independently.

- **Analyst**: activate `arcwright-analyst`
- **PM**: activate `arcwright-pm`
- **Tech Writer**: activate `arcwright-tech-writer`

## Steps

Sequential flow: research → synthesis → documentation.

### 1. Research

**What this step does:** Analyst conducts primary domain research. If two parallel research tracks are needed, issue two Analyst Agent calls simultaneously.
**Inputs:** Research brief from master
**Output:** `$STEP_1_OUTPUT` — structured research findings (or `$STEP_1_OUTPUT_A` + `$STEP_1_OUTPUT_B` if parallel)

---

#### Default: In-Process (Agent tool)

Single research track:

```json
{
  "name": "Agent",
  "input": {
    "subagent_type": "arcwright-analyst",
    "prompt": "Conduct domain research on the specified topic. Cover all focus areas thoroughly.\n\n## Inputs\nResearch brief: {research_brief}\nFocus areas: {focus_areas}\n\n## Output\nStructured research findings with key insights, patterns identified, and recommendations.",
    "model": "sonnet"
  }
}
```

For parallel research tracks, issue two Agent calls in a single message — assign separate research domains to avoid overlap. Each parallel analyst is a separate first-use spawn (no row in the registry yet, since `analyst` has not been spawned). Capture the returned `agentId` for each and write rows to the registry. Capture results into `$STEP_1_OUTPUT_A` and `$STEP_1_OUTPUT_B`, then merge before passing to step 2.

Capture result into `$STEP_1_OUTPUT`. Pass to step 2.

---

#### Pane Visibility (opt-in)

For opt-in pane visibility, see the `herdr` skill's "Watching agents in panes (opt-in)" section (spawn with `herdr agent start`, wait with `herdr wait agent-status`). The pane is a viewing surface; the in-process Agent tool + SendMessage flow is still governed by `claude-subagent-protocol`.

---

### 2. Synthesis

**What this step does:** PM synthesizes raw research findings into an actionable product brief with insights and recommendations.
**Inputs:** `$STEP_1_OUTPUT` (research findings from step 1)
**Output:** `$STEP_2_OUTPUT` — product brief with strategic insights and recommendations

---

#### Default: In-Process (Agent tool)

`pm` is the first-time role. Spawn via `Agent` tool, capture `agentId`, write the registry row.

```json
{
  "name": "Agent",
  "input": {
    "subagent_type": "arcwright-pm",
    "prompt": "Synthesize the research findings into an actionable product brief. Extract key insights, identify strategic implications, and provide clear recommendations.\n\n## Inputs\nResearch findings: {$STEP_1_OUTPUT}\n\n## Output\nProduct brief with: executive summary, key insights, strategic recommendations, and open questions.",
    "model": "sonnet"
  }
}
```

Capture result into `$STEP_2_OUTPUT`. Pass to step 3.

---

#### Pane Visibility (opt-in)

For opt-in pane visibility, see the `herdr` skill's "Watching agents in panes (opt-in)" section (spawn with `herdr agent start`, wait with `herdr wait agent-status`). The pane is a viewing surface; the in-process Agent tool + SendMessage flow is still governed by `claude-subagent-protocol`.

---

### 3. Documentation

**What this step does:** Tech Writer structures and documents the final research output as a reference artifact.
**Inputs:** `$STEP_2_OUTPUT` (PM brief) + `$STEP_1_OUTPUT` (raw research)
**Output:** `$STEP_3_OUTPUT` — structured reference document. Final output — no next step.

---

#### Default: In-Process (Agent tool)

`tech-writer` is the first-time role. Spawn via `Agent` tool, capture `agentId`, write the registry row.

```json
{
  "name": "Agent",
  "input": {
    "subagent_type": "arcwright-tech-writer",
    "prompt": "Structure and document the research output as a clear reference document for consumption by other teams or stakeholders.\n\n## Inputs\nProduct brief: {$STEP_2_OUTPUT}\nRaw research: {$STEP_1_OUTPUT}\n\n## Output\nStructured reference document with: overview, findings, analysis, recommendations, and artifact index.",
    "model": "sonnet"
  }
}
```

Capture result into `$STEP_3_OUTPUT`. Final output — no next step. Present research package to user.

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

Use the `subagent` tool to run this team as a Kiro pipeline.

```json
{
  "task": "Research, synthesize, and document findings: Analyst researches domain, PM synthesizes into a brief, Tech Writer produces the reference document.",
  "stages": [
    {
      "name": "research",
      "role": "arcwright-analyst",
      "prompt_template": "Conduct domain research on the specified topic. Cover all focus areas thoroughly. Output structured research findings with key insights, patterns, and recommendations: {task}",
      "depends_on": []
    },
    {
      "name": "synthesis",
      "role": "arcwright-pm",
      "prompt_template": "Synthesize the research findings into an actionable product brief. Extract key insights, identify strategic implications, and provide clear recommendations: {task}",
      "depends_on": ["research"]
    },
    {
      "name": "documentation",
      "role": "arcwright-tech-writer",
      "prompt_template": "Structure and document the research output as a clear reference document for consumption by other teams or stakeholders: {task}",
      "depends_on": ["synthesis"]
    }
  ]
}
```
