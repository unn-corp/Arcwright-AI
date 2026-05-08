---
name: "track-extended"
description: "Extended track workflow -- 10-16 files with PRD, arch notes, 2 review gates, no epic loop"
---

> **Default orchestration:** in-process via [`claude-subagent-protocol`](.agents/skills/claude-subagent-protocol/SKILL.md). tmux split-pane variant is opt-in (see step blocks).

# Track: Extended

## Scope

| Criterion     | Threshold                                                  |
|---------------|------------------------------------------------------------|
| Files touched | 10-16                                                      |
| Complexity    | Significant feature, cross-cutting concerns, new subsystem |
| Examples      | New module with DB schema, multi-page feature, API redesign |

## Workflow Chain

```
Quick Spec
  -> Research x2 (in-process)
  -> PRD
  -> UX Design + Arch Notes + Sprint Plan (sequential)
  -> Review Gate 1 (3-sub)
  -> Dev
  -> Review Gate 2 (3-sub)
  -> QA Tests
  -> USER APPROVAL
  -> PTM
```

## Steps

### 0. Project Context Scan

Load the `project-context` skill (`.agents/skills/project-context/SKILL.md`) and run the full scan inline. This runs before Quick Spec — no planning starts before context is gathered. If existing plan artifacts are found in `_arcwright-output/`, present to user (resume vs. start fresh). Pass the `## Project Context` block to Quick Spec, Research, PRD, and all subsequent steps.

### 1. Quick Spec

**What this step does:** The quick-flow-solo-dev agent produces a concise task definition to seed the full planning pipeline.
**Inputs:** `$STEP_0_OUTPUT` (project context from step 0)
**Output:** `$STEP_1_OUTPUT` — task definition written to spec.md

---

#### Default: In-Process (Agent tool)

```json
{
  "name": "Agent",
  "input": {
    "subagent_type": "arcwright-quick-flow-solo-dev",
    "prompt": "Write a quick spec for the requested change. This seeds the full planning pipeline.\n\n## Inputs\n{$STEP_0_OUTPUT}\n\n## Output\nSpec written to _arcwright-output/features/{slug}/planning/spec.md",
    "model": "sonnet"
  }
}
```

Capture result into `$STEP_1_OUTPUT`. Pass to step 2.

---

#### tmux Variant (when $TMUX is set and user wants visibility)

Load `.agents/skills/tmux-protocol/SKILL.md` before spawning.

```bash
tmux split-window -h -c "#{pane_current_path}" "claude --dangerously-skip-permissions 'Write quick spec. Context: {$STEP_0_OUTPUT}. Write spec.md to _arcwright-output/features/{slug}/planning/'"
```

Completion signal: `AGENT_SIGNAL::TASK_DONE::quick-flow-solo-dev::step-1::done::spec written`

---

#### Kiro CLI Variant — Stage Fragment

```json
{ "name": "spec", "role": "arcwright-quick-flow-solo-dev", "prompt_template": "Quick spec for: {task}", "depends_on": [] }
```

### 2. Research (always 2 agents)

**What this step does:** Two analyst agents run sequentially — Agent 1 performs codebase exploration, Agent 2 performs domain/technical research. Both write research reports.
**Inputs:** `$STEP_1_OUTPUT` (spec from step 1)
**Output:** `$STEP_2_OUTPUT` — two research reports (r1-codebase.md and r2-domain.md)

---

#### Default: In-Process (Agent tool)

Issue sequentially (Agent 1 completes before Agent 2 starts):

Agent 1 — codebase exploration:

```json
{
  "name": "Agent",
  "input": {
    "subagent_type": "arcwright-analyst",
    "prompt": "Codebase exploration for the requested change. Identify existing patterns, affected modules, and implementation entry points.\n\n## Inputs\nSee _arcwright-output/features/{slug}/planning/spec.md\n\n## Output\nWrite r1-codebase.md to _arcwright-output/features/{slug}/planning/",
    "model": "sonnet"
  }
}
```

Agent 2 — domain/technical research:

```json
{
  "name": "Agent",
  "input": {
    "subagent_type": "arcwright-analyst",
    "prompt": "Domain and technical research for the requested change. Cover external dependencies, technical risks, and relevant patterns.\n\n## Inputs\nSee _arcwright-output/features/{slug}/planning/spec.md\nSee _arcwright-output/features/{slug}/planning/r1-codebase.md\n\n## Output\nWrite r2-domain.md to _arcwright-output/features/{slug}/planning/",
    "model": "sonnet"
  }
}
```

Capture results into `$RESEARCH_R1_OUTPUT` and `$RESEARCH_R2_OUTPUT`. Combine as `$STEP_2_OUTPUT`. Pass to step 3.

---

#### tmux Variant (when $TMUX is set and user wants visibility)

Load `.agents/skills/tmux-protocol/SKILL.md` before spawning. Run Agent 1 in a pane, await completion, then run Agent 2:

Completion signals:
```
AGENT_SIGNAL::TASK_DONE::analyst::research-r1::done::r1-codebase written
AGENT_SIGNAL::TASK_DONE::analyst::research-r2::done::r2-domain written
```

---

#### Kiro CLI Variant — Stage Fragment

Both research agents run in parallel (no `depends_on` from each other, only from spec):

```json
{ "name": "research-1", "role": "arcwright-analyst", "prompt_template": "Codebase exploration for: {task}", "depends_on": ["spec"] }
```

```json
{ "name": "research-2", "role": "arcwright-analyst", "prompt_template": "Domain/technical research for: {task}", "depends_on": ["spec"] }
```

### 3. PRD

**What this step does:** The PM agent writes a full Product Requirements Document from the spec and both research reports.
**Inputs:** `$STEP_2_OUTPUT` (research reports), `$STEP_1_OUTPUT` (spec)
**Output:** `$STEP_3_OUTPUT` — prd.md written to planning folder

---

#### Default: In-Process (Agent tool)

```json
{
  "name": "Agent",
  "input": {
    "subagent_type": "arcwright-pm",
    "prompt": "Write a Product Requirements Document for the requested change.\n\n## Inputs\nSee _arcwright-output/features/{slug}/planning/spec.md\nSee _arcwright-output/features/{slug}/planning/r1-codebase.md\nSee _arcwright-output/features/{slug}/planning/r2-domain.md\n\n## Output\nWrite prd.md to _arcwright-output/features/{slug}/planning/",
    "model": "sonnet"
  }
}
```

Capture result into `$STEP_3_OUTPUT`. Pass to step 4.

---

#### tmux Variant (when $TMUX is set and user wants visibility)

Load `.agents/skills/tmux-protocol/SKILL.md` before spawning.

```bash
tmux split-window -h -c "#{pane_current_path}" "claude --dangerously-skip-permissions 'Write PRD for the change. Spec at _arcwright-output/features/{slug}/planning/spec.md. Research at _arcwright-output/features/{slug}/planning/. Write prd.md to _arcwright-output/features/{slug}/planning/'"
```

Completion signal: `AGENT_SIGNAL::TASK_DONE::pm::step-3::done::prd written`

---

#### Kiro CLI Variant — Stage Fragment

```json
{ "name": "prd", "role": "arcwright-pm", "prompt_template": "Write PRD for: {task}", "depends_on": ["research-1", "research-2"] }
```

### 4. UX Design + Architecture Notes + Sprint Plan

**What this step does:** Three sequential agent calls produce ux-design.md, architecture-notes.md, and sprint-plan.md. Run sequentially in the same conversation — do NOT spawn three separate panes.
**Inputs:** `$STEP_3_OUTPUT` (PRD from step 3)
**Output:** `$STEP_4_OUTPUT` — all three planning artifacts written

---

#### Default: In-Process (Agent tool)

Issue three sequential Agent calls:

Sub-step 4a — UX Design:

```json
{
  "name": "Agent",
  "input": {
    "subagent_type": "arcwright-ux-designer",
    "prompt": "Produce the UX design for the requested change. Include wireframes or flow descriptions and component decisions.\n\n## Inputs\nSee _arcwright-output/features/{slug}/planning/prd.md\n\n## Output\nWrite ux-design.md to _arcwright-output/features/{slug}/planning/",
    "model": "sonnet"
  }
}
```

Sub-step 4b — Architecture Notes:

```json
{
  "name": "Agent",
  "input": {
    "subagent_type": "arcwright-architect",
    "prompt": "Produce architecture notes for the requested change. Format: key tech decisions (<=5 bullets), data model changes, API contract changes, dependencies, risk flags. Max 2 pages.\n\n## Inputs\nSee _arcwright-output/features/{slug}/planning/prd.md\nSee _arcwright-output/features/{slug}/planning/ux-design.md\n\n## Output\nWrite architecture-notes.md to _arcwright-output/features/{slug}/planning/",
    "model": "opus"
  }
}
```

Sub-step 4c — Sprint Plan:

```json
{
  "name": "Agent",
  "input": {
    "subagent_type": "arcwright-pm",
    "prompt": "Produce an ordered sprint plan for the requested change. Format: ordered task checklist (NOT epic/story decomposition).\n\n## Inputs\nSee _arcwright-output/features/{slug}/planning/prd.md\nSee _arcwright-output/features/{slug}/planning/architecture-notes.md\n\n## Output\nWrite sprint-plan.md to _arcwright-output/features/{slug}/planning/",
    "model": "sonnet"
  }
}
```

Capture all three results. Combine as `$STEP_4_OUTPUT`. Pass to step 5.

---

#### tmux Variant (when $TMUX is set and user wants visibility)

Load `.agents/skills/tmux-protocol/SKILL.md` before spawning. All 3 sub-steps run in ONE split pane session sequentially. Do NOT spawn 3 separate panes.

Completion signals (all three before proceeding):
```
AGENT_SIGNAL::TASK_DONE::ux-designer::step-4a::done::ux-design written
AGENT_SIGNAL::TASK_DONE::architect::step-4b::done::architecture-notes written
AGENT_SIGNAL::TASK_DONE::pm::step-4c::done::sprint-plan written
```

---

#### Kiro CLI Variant — Stage Fragment

Three parallel stages (all depend on prd, not on each other):

```json
{ "name": "ux", "role": "arcwright-ux-designer", "prompt_template": "UX design for: {task}", "depends_on": ["prd"] }
```

```json
{ "name": "arch", "role": "arcwright-architect", "prompt_template": "Architecture notes for: {task}", "depends_on": ["prd"] }
```

```json
{ "name": "sprint-plan", "role": "arcwright-pm", "prompt_template": "Sprint plan for: {task}", "depends_on": ["prd"] }
```

### 5. Review Gate 1

**What this step does:** The review-orchestrator runs 3 concurrent sub-agents reviewing the PRD, UX design, architecture notes, and sprint plan before dev starts. If critical issues found, route back to the relevant planning step.
**Inputs:** `$STEP_4_OUTPUT` (all planning artifacts)
**Output:** `$STEP_5_OUTPUT` — collated pre-dev review result (pass or route-back)

---

#### Default: In-Process (Agent tool)

Issue all three Agent calls in a single assistant message (parallel fan-out):

```json
[
  { "name": "Agent", "input": { "subagent_type": "arcwright-review-orchestrator", "prompt": "Review gate 1: AR + DRY review of PRD, arch notes, and sprint plan. Fix findings inline.\n\n## Inputs\nSee _arcwright-output/features/{slug}/planning/\n\n## Output\nWrite review-g1-ar-dry.md to _arcwright-output/features/{slug}/review/", "model": "opus" } },
  { "name": "Agent", "input": { "subagent_type": "arcwright-review-orchestrator", "prompt": "Review gate 1: UV review of UX design. Fix findings inline.\n\n## Inputs\nSee _arcwright-output/features/{slug}/planning/ux-design.md\n\n## Output\nWrite review-g1-uv.md to _arcwright-output/features/{slug}/review/", "model": "opus" } },
  { "name": "Agent", "input": { "subagent_type": "arcwright-review-orchestrator", "prompt": "Review gate 1: SR review of proposed approach. Fix findings inline.\n\n## Inputs\nSee _arcwright-output/features/{slug}/planning/\n\n## Output\nWrite review-g1-sr.md to _arcwright-output/features/{slug}/review/", "model": "opus" } }
]
```

Capture results into `$REVIEW_G1_AR_OUTPUT`, `$REVIEW_G1_UV_OUTPUT`, `$REVIEW_G1_SR_OUTPUT`. Collate into `$STEP_5_OUTPUT`. Pass to step 6.
If critical issues: route back to the relevant planning step.

---

#### tmux Variant (when $TMUX is set and user wants visibility)

Load `.agents/skills/tmux-protocol/SKILL.md` before spawning. Spawn three panes; poll for all three completion signals:

```
AGENT_SIGNAL::TASK_DONE::review-orchestrator::review-g1-ar::done::ar-dry review written
AGENT_SIGNAL::TASK_DONE::review-orchestrator::review-g1-uv::done::uv review written
AGENT_SIGNAL::TASK_DONE::review-orchestrator::review-g1-sr::done::sr review written
```

---

#### Kiro CLI Variant — Stage Fragment

```json
{ "name": "review-1", "role": "arcwright-review-orchestrator", "prompt_template": "Review gate 1 (3-sub) for: {task}", "depends_on": ["ux", "arch", "sprint-plan"] }
```

### 6. Dev

**What this step does:** The dev agent implements the full change based on all planning artifacts. No epic loop — single dev agent for the full implementation.
**Inputs:** `$STEP_5_OUTPUT` (review gate 1 result and all planning artifacts)
**Output:** `$STEP_6_OUTPUT` — implementation complete signal

---

#### Default: In-Process (Agent tool)

```json
{
  "name": "Agent",
  "input": {
    "subagent_type": "arcwright-dev",
    "prompt": "Implement the full requested change per the PRD, UX design, architecture notes, sprint plan, and review gate 1 findings. No epic loop — implement the full change.\n\n## Inputs\nSee _arcwright-output/features/{slug}/planning/\nSee _arcwright-output/features/{slug}/review/ for review gate 1 findings\n\n## Output\nComplete the code change in the working tree.",
    "model": "sonnet"
  }
}
```

Capture result into `$STEP_6_OUTPUT`. Pass to step 7.

---

#### tmux Variant (when $TMUX is set and user wants visibility)

Load `.agents/skills/tmux-protocol/SKILL.md` before spawning.

```bash
tmux split-window -h -c "#{pane_current_path}" "claude --dangerously-skip-permissions 'Implement the change per all planning artifacts at _arcwright-output/features/{slug}/planning/ and review findings at _arcwright-output/features/{slug}/review/. No epic loop.'"
```

Completion signal: `AGENT_SIGNAL::TASK_DONE::dev::step-6::done::implementation complete`

---

#### Kiro CLI Variant — Stage Fragment

```json
{ "name": "dev", "role": "arcwright-dev", "prompt_template": "Implement per PRD, UX, arch notes, sprint plan: {task}", "depends_on": ["review-1"] }
```

### 7. Review Gate 2

**What this step does:** The review-orchestrator runs 3 concurrent sub-agents for a final post-dev review. 1 pass per sub-agent. If critical finding: route back to Dev once.
**Inputs:** `$STEP_6_OUTPUT` (implementation from step 6)
**Output:** `$STEP_7_OUTPUT` — final review result (pass or route-back)

---

#### Default: In-Process (Agent tool)

Issue all three Agent calls in a single assistant message (parallel fan-out):

```json
[
  { "name": "Agent", "input": { "subagent_type": "arcwright-review-orchestrator", "prompt": "Review gate 2: AR + DRY review. 1 pass only. Fix findings inline.\n\n## Inputs\n{$STEP_6_OUTPUT}\n\n## Output\nWrite review-g2-ar-dry.md to _arcwright-output/features/{slug}/review/", "model": "opus" } },
  { "name": "Agent", "input": { "subagent_type": "arcwright-review-orchestrator", "prompt": "Review gate 2: UV review. 1 pass only. Fix findings inline.\n\n## Inputs\n{$STEP_6_OUTPUT}\n\n## Output\nWrite review-g2-uv.md to _arcwright-output/features/{slug}/review/", "model": "opus" } },
  { "name": "Agent", "input": { "subagent_type": "arcwright-review-orchestrator", "prompt": "Review gate 2: SR review. 1 pass only. Fix findings inline.\n\n## Inputs\n{$STEP_6_OUTPUT}\n\n## Output\nWrite review-g2-sr.md to _arcwright-output/features/{slug}/review/", "model": "opus" } }
]
```

Capture results into `$REVIEW_G2_AR_OUTPUT`, `$REVIEW_G2_UV_OUTPUT`, `$REVIEW_G2_SR_OUTPUT`. Collate into `$STEP_7_OUTPUT`. Pass to step 8.
If critical finding: route back to step 6 (Dev) once.

---

#### tmux Variant (when $TMUX is set and user wants visibility)

Load `.agents/skills/tmux-protocol/SKILL.md` before spawning. Spawn three panes; poll for all three completion signals:

```
AGENT_SIGNAL::TASK_DONE::review-orchestrator::review-g2-ar::done::ar-dry review written
AGENT_SIGNAL::TASK_DONE::review-orchestrator::review-g2-uv::done::uv review written
AGENT_SIGNAL::TASK_DONE::review-orchestrator::review-g2-sr::done::sr review written
```

---

#### Kiro CLI Variant — Stage Fragment

```json
{ "name": "review-2", "role": "arcwright-review-orchestrator", "prompt_template": "Review gate 2 (3-sub, 1 pass) for: {task}", "depends_on": ["dev"] }
```

### 8. QA Tests

**What this step does:** The QA agent runs full validation using playwright-cli for UI and assertions for critical path logic.
**Inputs:** `$STEP_7_OUTPUT` (final review result), `$STEP_3_OUTPUT` (PRD for acceptance criteria)
**Output:** `$STEP_8_OUTPUT` — QA pass or fail signal

---

#### Default: In-Process (Agent tool)

```json
{
  "name": "Agent",
  "input": {
    "subagent_type": "arcwright-qa",
    "prompt": "Run QA validation. Load the `playwright-cli` skill. Primary: drive tests through the UI programmatically. `npx playwright test` with `.spec.ts` files is secondary, only for critical path logic (auth, payments, core data flows).\n\n## Inputs\nSee _arcwright-output/features/{slug}/planning/prd.md for acceptance criteria\nSee _arcwright-output/features/{slug}/review/ for final review findings\n\n## Output\nQA result: pass or fail with details.",
    "model": "sonnet"
  }
}
```

Capture result into `$STEP_8_OUTPUT`. Pass to step 9 (USER APPROVAL).

---

#### tmux Variant (when $TMUX is set and user wants visibility)

Load `.agents/skills/tmux-protocol/SKILL.md` before spawning.

```bash
tmux split-window -h -c "#{pane_current_path}" "claude --dangerously-skip-permissions 'Run QA validation. Load playwright-cli skill. Drive tests through UI programmatically. PRD at _arcwright-output/features/{slug}/planning/prd.md. Report pass or fail.'"
```

Completion signal: `AGENT_SIGNAL::TASK_DONE::qa::step-8::done::qa passed`

---

#### Kiro CLI Variant — Stage Fragment

```json
{ "name": "qa", "role": "arcwright-qa", "prompt_template": "QA validation for: {task}", "depends_on": ["review-2"] }
```

### 9. USER APPROVAL

Present summary block and wait for explicit `[approve]`:

```
Ready to merge `{branch}`.

Change summary:
  Files: {N}
  DRY: passed  UV: passed  SR: passed
  QA:  passed

[approve] Proceed to /prepare-to-merge
[review]  I want to check something first
```

Wait for explicit `[approve]` before running PTM. Do NOT auto-proceed.

### 10. PTM

Run `/prepare-to-merge` in-process.

## Kiro Pipeline

Use the `subagent` tool to run the full track as a Kiro pipeline. Assemble all stage fragments from the steps above into a single `stages` array.

Note: the two research stages run in parallel (both depend only on `spec`). The three planning stages (ux, arch, sprint-plan) run in parallel (all depend only on `prd`).

```json
{
  "task": "Run an extended-track workflow: spec, 2 research, PRD, UX+arch+sprint-plan, 2 review gates, dev, and QA for a 10-16 file change.",
  "stages": [
    {
      "name": "spec",
      "role": "arcwright-quick-flow-solo-dev",
      "prompt_template": "Quick spec for: {task}",
      "depends_on": []
    },
    {
      "name": "research-1",
      "role": "arcwright-analyst",
      "prompt_template": "Codebase exploration for: {task}",
      "depends_on": ["spec"]
    },
    {
      "name": "research-2",
      "role": "arcwright-analyst",
      "prompt_template": "Domain/technical research for: {task}",
      "depends_on": ["spec"]
    },
    {
      "name": "prd",
      "role": "arcwright-pm",
      "prompt_template": "Write PRD for: {task}",
      "depends_on": ["research-1", "research-2"]
    },
    {
      "name": "ux",
      "role": "arcwright-ux-designer",
      "prompt_template": "UX design for: {task}",
      "depends_on": ["prd"]
    },
    {
      "name": "arch",
      "role": "arcwright-architect",
      "prompt_template": "Architecture notes for: {task}",
      "depends_on": ["prd"]
    },
    {
      "name": "sprint-plan",
      "role": "arcwright-pm",
      "prompt_template": "Sprint plan for: {task}",
      "depends_on": ["prd"]
    },
    {
      "name": "review-1",
      "role": "arcwright-review-orchestrator",
      "prompt_template": "Review gate 1 (3-sub) for: {task}",
      "depends_on": ["ux", "arch", "sprint-plan"]
    },
    {
      "name": "dev",
      "role": "arcwright-dev",
      "prompt_template": "Implement per PRD, UX, arch notes, sprint plan: {task}",
      "depends_on": ["review-1"]
    },
    {
      "name": "review-2",
      "role": "arcwright-review-orchestrator",
      "prompt_template": "Review gate 2 (3-sub, 1 pass) for: {task}",
      "depends_on": ["dev"]
    },
    {
      "name": "qa",
      "role": "arcwright-qa",
      "prompt_template": "QA validation for: {task}",
      "depends_on": ["review-2"]
    }
  ]
}
```
