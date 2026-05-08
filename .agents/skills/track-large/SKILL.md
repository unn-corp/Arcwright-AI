---
name: "track-large"
description: "Large track workflow -- 12+ files, full planning pipeline with epic loop, parallel research, and final gates"
---

> **Default orchestration:** in-process via [`claude-subagent-protocol`](.agents/skills/claude-subagent-protocol/SKILL.md). tmux split-pane variant is opt-in (see step blocks).

# Track: Large

## Scope

| Criterion     | Threshold                                              |
|---------------|--------------------------------------------------------|
| Files touched | 12+                                                    |
| Complexity    | Multi-epic feature, new subsystem, significant product change |
| Examples      | Full feature area, platform capability, major refactor |

## Workflow Chain

```
Product Brief
  -> Research x3 (parallel, in-process)
  -> PRD
  -> Planning Gate (2-sub-spec)
  -> [UX Design + Architecture Doc] (parallel)
  -> Design Gate (2-sub-spec)
  -> Epics & Stories
  -> IR Check (in-process)
  -> Sprint Plan
  -> USER APPROVAL
  -> [Per-Epic Loop]
  -> Final Review Gate (3-sub)
  -> Final QA
  -> USER APPROVAL
  -> PTM
```

## Steps

### 0. Project Context Scan

Load the `project-context` skill (`.agents/skills/project-context/SKILL.md`) and run the full scan inline. This runs before Product Brief — no planning starts before context is gathered. If existing plan artifacts are found in `_arcwright-output/`, present to user (resume vs. start fresh). Pass the `## Project Context` block to Product Brief, Research, and all subsequent steps.

## Planning Phase

### 1. Product Brief

**What this step does:** The PM agent produces a product brief document covering goals, scope, and success criteria.
**Inputs:** `$STEP_0_OUTPUT` (project context from step 0)
**Output:** `$STEP_1_OUTPUT` — product-brief.md written to planning folder

---

#### Default: In-Process (Agent tool)

```json
{
  "name": "Agent",
  "input": {
    "subagent_type": "arcwright-pm",
    "prompt": "Write a product brief for the requested feature. Cover goals, scope, success criteria, and key constraints.\n\n## Inputs\n{$STEP_0_OUTPUT}\n\n## Output\nWrite product-brief.md to _arcwright-output/features/{slug}/planning/",
    "model": "sonnet"
  }
}
```

Capture result into `$STEP_1_OUTPUT`. Pass to step 2.

---

#### tmux Variant (when $TMUX is set and user wants visibility)

Load `.agents/skills/tmux-protocol/SKILL.md` before spawning.

```bash
tmux split-window -h -c "#{pane_current_path}" "claude --dangerously-skip-permissions 'Write product brief. Context: {$STEP_0_OUTPUT}. Write product-brief.md to _arcwright-output/features/{slug}/planning/'"
```

Completion signal: `AGENT_SIGNAL::TASK_DONE::pm::step-1::done::product-brief written`

---

#### Kiro CLI Variant — Stage Fragment

```json
{ "name": "brief", "role": "arcwright-pm", "prompt_template": "Write product brief for: {task}", "depends_on": [] }
```

### 2. Research x3 (parallel, in-process)

**What this step does:** Three analyst agents run in parallel — codebase exploration, domain/technical feasibility, and UX patterns/competitive reference. All three run as a concurrent Agent fan-out.
**Inputs:** `$STEP_1_OUTPUT` (product brief)
**Output:** `$RESEARCH_R1_OUTPUT`, `$RESEARCH_R2_OUTPUT`, `$RESEARCH_R3_OUTPUT` — three research reports

---

#### Default: In-Process (Agent tool)

Issue all three Agent calls in a single assistant message (parallel fan-out):

```json
[
  { "name": "Agent", "input": { "subagent_type": "arcwright-analyst", "prompt": "Codebase exploration for the requested feature. Identify existing patterns, affected modules, and implementation entry points.\n\n## Inputs\nSee _arcwright-output/features/{slug}/planning/product-brief.md\n\n## Output\nWrite r1-codebase.md to _arcwright-output/features/{slug}/research/", "model": "sonnet" } },
  { "name": "Agent", "input": { "subagent_type": "arcwright-analyst", "prompt": "Domain and technical feasibility research for the requested feature. Cover external dependencies, technical risks, and relevant patterns.\n\n## Inputs\nSee _arcwright-output/features/{slug}/planning/product-brief.md\n\n## Output\nWrite r2-domain.md to _arcwright-output/features/{slug}/research/", "model": "sonnet" } },
  { "name": "Agent", "input": { "subagent_type": "arcwright-analyst", "prompt": "UX patterns and competitive reference research for the requested feature. Cover existing patterns, interaction conventions, and design precedents.\n\n## Inputs\nSee _arcwright-output/features/{slug}/planning/product-brief.md\n\n## Output\nWrite r3-ux-patterns.md to _arcwright-output/features/{slug}/research/", "model": "sonnet" } }
]
```

Capture results into `$RESEARCH_R1_OUTPUT`, `$RESEARCH_R2_OUTPUT`, `$RESEARCH_R3_OUTPUT`. Pass all three to step 3.

---

#### tmux Variant (when $TMUX is set and user wants visibility)

Load `.agents/skills/tmux-protocol/SKILL.md` before spawning. Spawn three panes concurrently; poll for all three completion signals:

```
AGENT_SIGNAL::TASK_DONE::analyst::research-r1::done::r1-codebase written
AGENT_SIGNAL::TASK_DONE::analyst::research-r2::done::r2-domain written
AGENT_SIGNAL::TASK_DONE::analyst::research-r3::done::r3-ux-patterns written
```

---

#### Kiro CLI Variant — Stage Fragment

Three parallel stages (all depend only on `brief`):

```json
{ "name": "research-codebase", "role": "arcwright-analyst", "prompt_template": "Codebase exploration for: {task}", "depends_on": ["brief"] }
```

```json
{ "name": "research-domain", "role": "arcwright-analyst", "prompt_template": "Domain/technical research for: {task}", "depends_on": ["brief"] }
```

```json
{ "name": "research-ux", "role": "arcwright-analyst", "prompt_template": "UX patterns and competitive research for: {task}", "depends_on": ["brief"] }
```

### 3. PRD

**What this step does:** The PM agent writes a full Product Requirements Document from the product brief and all three research reports.
**Inputs:** `$RESEARCH_R1_OUTPUT`, `$RESEARCH_R2_OUTPUT`, `$RESEARCH_R3_OUTPUT` (research), `$STEP_1_OUTPUT` (brief)
**Output:** `$STEP_3_OUTPUT` — prd.md written to planning folder

---

#### Default: In-Process (Agent tool)

```json
{
  "name": "Agent",
  "input": {
    "subagent_type": "arcwright-pm",
    "prompt": "Write a Product Requirements Document for the requested feature.\n\n## Inputs\nSee _arcwright-output/features/{slug}/planning/product-brief.md\nSee _arcwright-output/features/{slug}/research/r1-codebase.md\nSee _arcwright-output/features/{slug}/research/r2-domain.md\nSee _arcwright-output/features/{slug}/research/r3-ux-patterns.md\n\n## Output\nWrite prd.md to _arcwright-output/features/{slug}/planning/",
    "model": "sonnet"
  }
}
```

Capture result into `$STEP_3_OUTPUT`. Pass to step 4.

---

#### tmux Variant (when $TMUX is set and user wants visibility)

Load `.agents/skills/tmux-protocol/SKILL.md` before spawning.

```bash
tmux split-window -h -c "#{pane_current_path}" "claude --dangerously-skip-permissions 'Write PRD. Brief at _arcwright-output/features/{slug}/planning/product-brief.md. Research at _arcwright-output/features/{slug}/research/. Write prd.md to _arcwright-output/features/{slug}/planning/'"
```

Completion signal: `AGENT_SIGNAL::TASK_DONE::pm::step-3::done::prd written`

---

#### Kiro CLI Variant — Stage Fragment

```json
{ "name": "prd", "role": "arcwright-pm", "prompt_template": "Write PRD from brief + research for: {task}", "depends_on": ["research-codebase", "research-domain", "research-ux"] }
```

### 4. Planning Gate

**What this step does:** A 2-sub-spec review gate — architect checks spec completeness and feasibility; PM checks scope and acceptance criteria coverage. Runs in-process as two sequential Agent calls.
**Inputs:** `$STEP_3_OUTPUT` (PRD)
**Output:** `$STEP_4_OUTPUT` — planning gate result (pass or revision needed)

---

#### Default: In-Process (Agent tool)

Issue both Agent calls in a single assistant message (parallel fan-out):

```json
[
  { "name": "Agent", "input": { "subagent_type": "arcwright-architect", "prompt": "Planning gate review: check spec completeness and feasibility. Identify any blockers or gaps.\n\n## Inputs\nSee _arcwright-output/features/{slug}/planning/prd.md\n\n## Output\nWrite planning-gate-arch.md to _arcwright-output/features/{slug}/review/", "model": "opus" } },
  { "name": "Agent", "input": { "subagent_type": "arcwright-pm", "prompt": "Planning gate review: check scope definition and acceptance criteria coverage.\n\n## Inputs\nSee _arcwright-output/features/{slug}/planning/prd.md\n\n## Output\nWrite planning-gate-pm.md to _arcwright-output/features/{slug}/review/", "model": "sonnet" } }
]
```

Capture results into `$PLANNING_GATE_ARCH_OUTPUT` and `$PLANNING_GATE_PM_OUTPUT`. Collate into `$STEP_4_OUTPUT`. Pass to step 5.

---

#### tmux Variant (when $TMUX is set and user wants visibility)

Load `.agents/skills/tmux-protocol/SKILL.md` before spawning. Spawn two panes; poll for both completion signals:

```
AGENT_SIGNAL::TASK_DONE::architect::planning-gate-arch::done::planning gate arch review written
AGENT_SIGNAL::TASK_DONE::pm::planning-gate-pm::done::planning gate pm review written
```

---

#### Kiro CLI Variant — Stage Fragment

Two parallel stages (both depend on `prd`):

```json
{ "name": "planning-gate-arch", "role": "arcwright-architect", "prompt_template": "Planning gate: spec completeness and feasibility review for: {task}", "depends_on": ["prd"] }
```

```json
{ "name": "planning-gate-pm", "role": "arcwright-pm", "prompt_template": "Planning gate: scope and acceptance criteria review for: {task}", "depends_on": ["prd"] }
```

### 5. UX Design + Architecture Doc (parallel)

**What this step does:** The ux-designer and architect agents run in parallel — UX Design produces ux-design.md; Architecture Doc produces architecture.md. Both must complete before the Design Gate.
**Inputs:** `$STEP_4_OUTPUT` (planning gate pass), `$STEP_3_OUTPUT` (PRD)
**Output:** `$STEP_5_OUTPUT_A` (ux-design.md), `$STEP_5_OUTPUT_B` (architecture.md)

---

#### Default: In-Process (Agent tool)

Issue both Agent calls in a single assistant message (parallel fan-out):

```json
[
  { "name": "Agent", "input": { "subagent_type": "arcwright-ux-designer", "prompt": "Produce the UX design for the requested feature. Include wireframes, flows, and component decisions.\n\n## Inputs\nSee _arcwright-output/features/{slug}/planning/prd.md\n\n## Output\nWrite ux-design.md to _arcwright-output/features/{slug}/planning/", "model": "sonnet" } },
  { "name": "Agent", "input": { "subagent_type": "arcwright-architect", "prompt": "Produce the architecture document for the requested feature. Include tech stack decisions, data model, API contracts, component boundaries, and risk flags.\n\n## Inputs\nSee _arcwright-output/features/{slug}/planning/prd.md\n\n## Output\nWrite architecture.md to _arcwright-output/features/{slug}/planning/", "model": "opus" } }
]
```

Capture results into `$STEP_5_OUTPUT_A` (UX) and `$STEP_5_OUTPUT_B` (Architecture). Both must complete before step 6. Pass to step 6.

---

#### tmux Variant (when $TMUX is set and user wants visibility)

Load `.agents/skills/tmux-protocol/SKILL.md` before spawning. Spawn two panes simultaneously; poll for both completion signals:

```
AGENT_SIGNAL::TASK_DONE::ux-designer::step-5-ux::done::ux-design written
AGENT_SIGNAL::TASK_DONE::architect::step-5-arch::done::architecture written
```

---

#### Kiro CLI Variant — Stage Fragment

Two parallel stages (both depend on planning gate; UX and Arch are independent):

```json
{ "name": "ux", "role": "arcwright-ux-designer", "prompt_template": "UX design for: {task}", "depends_on": ["planning-gate-arch", "planning-gate-pm"] }
```

```json
{ "name": "arch", "role": "arcwright-architect", "prompt_template": "Architecture doc for: {task}", "depends_on": ["planning-gate-arch", "planning-gate-pm"] }
```

### 6. Design Gate

**What this step does:** A 2-sub-spec review — one sub reviews the UX design, one reviews the architecture. Both run in parallel in-process.
**Inputs:** `$STEP_5_OUTPUT_A` (ux-design), `$STEP_5_OUTPUT_B` (architecture)
**Output:** `$STEP_6_OUTPUT` — design gate result (pass or revision needed)

---

#### Default: In-Process (Agent tool)

Issue both Agent calls in a single assistant message (parallel fan-out):

```json
[
  { "name": "Agent", "input": { "subagent_type": "arcwright-review-orchestrator", "prompt": "Design gate: UX design review. Assess usability, consistency, and completeness.\n\n## Inputs\nSee _arcwright-output/features/{slug}/planning/ux-design.md\n\n## Output\nWrite design-gate-ux.md to _arcwright-output/features/{slug}/review/", "model": "opus" } },
  { "name": "Agent", "input": { "subagent_type": "arcwright-review-orchestrator", "prompt": "Design gate: architecture review. Assess soundness, risks, and feasibility.\n\n## Inputs\nSee _arcwright-output/features/{slug}/planning/architecture.md\n\n## Output\nWrite design-gate-arch.md to _arcwright-output/features/{slug}/review/", "model": "opus" } }
]
```

Capture results into `$DESIGN_GATE_UX_OUTPUT` and `$DESIGN_GATE_ARCH_OUTPUT`. Collate into `$STEP_6_OUTPUT`. Pass to step 7.

---

#### tmux Variant (when $TMUX is set and user wants visibility)

Load `.agents/skills/tmux-protocol/SKILL.md` before spawning. Spawn two panes; poll for both completion signals:

```
AGENT_SIGNAL::TASK_DONE::review-orchestrator::design-gate-ux::done::design gate ux review written
AGENT_SIGNAL::TASK_DONE::review-orchestrator::design-gate-arch::done::design gate arch review written
```

---

#### Kiro CLI Variant — Stage Fragment

Two parallel stages (both depend on UX and Arch completing):

```json
{ "name": "design-gate-ux", "role": "arcwright-review-orchestrator", "prompt_template": "Design gate: UX design review for: {task}", "depends_on": ["ux", "arch"] }
```

```json
{ "name": "design-gate-arch", "role": "arcwright-review-orchestrator", "prompt_template": "Design gate: architecture review for: {task}", "depends_on": ["ux", "arch"] }
```

### 7. Epics & Stories

**What this step does:** The PM agent decomposes the feature into epics and story files using all planning context.
**Inputs:** `$STEP_6_OUTPUT` (design gate pass), all planning artifacts
**Output:** `$STEP_7_OUTPUT` — epic and story files written to `_arcwright-output/features/{slug}/`

---

#### Default: In-Process (Agent tool)

```json
{
  "name": "Agent",
  "input": {
    "subagent_type": "arcwright-pm",
    "prompt": "Decompose the feature into epics and stories. Each epic owns a complete vertical slice (frontend + backend + tests).\n\n## Inputs\nSee _arcwright-output/features/{slug}/planning/product-brief.md\nSee _arcwright-output/features/{slug}/planning/prd.md\nSee _arcwright-output/features/{slug}/planning/ux-design.md\nSee _arcwright-output/features/{slug}/planning/architecture.md\nSee _arcwright-output/features/{slug}/review/ for design gate findings\nSee _arcwright-output/features/{slug}/research/\n\n## Output\nWrite epic and story files to _arcwright-output/features/{slug}/",
    "model": "sonnet"
  }
}
```

Capture result into `$STEP_7_OUTPUT`. Pass to step 8.

---

#### tmux Variant (when $TMUX is set and user wants visibility)

Load `.agents/skills/tmux-protocol/SKILL.md` before spawning.

```bash
tmux split-window -h -c "#{pane_current_path}" "claude --dangerously-skip-permissions 'Decompose feature into epics and stories. All planning context at _arcwright-output/features/{slug}/. Write epic and story files to _arcwright-output/features/{slug}/'"
```

Completion signal: `AGENT_SIGNAL::TASK_DONE::pm::step-7::done::epics and stories written`

---

#### Kiro CLI Variant — Stage Fragment

```json
{ "name": "epics", "role": "arcwright-pm", "prompt_template": "Epics and stories for: {task}", "depends_on": ["design-gate-ux", "design-gate-arch"] }
```

### 8. IR Check (in-process)

**(Inline orchestrator action — no agent spawn.)** Validate story files for completeness before sprint planning. Check that each story has: clear acceptance criteria, scoped context references, a dev-ready description. Halt if any story is incomplete.

### 9. Sprint Plan

**What this step does:** The SM agent produces an ordered sprint plan with epic sequencing based on the epics and stories.
**Inputs:** `$STEP_7_OUTPUT` (epics and stories), `$STEP_3_OUTPUT` (PRD)
**Output:** `$STEP_9_OUTPUT` — sprint-plan.md with ordered epic sequence

---

#### Default: In-Process (Agent tool)

```json
{
  "name": "Agent",
  "input": {
    "subagent_type": "arcwright-sm",
    "prompt": "Produce an ordered sprint plan with epic sequencing. Each epic is a complete vertical slice.\n\n## Inputs\nSee _arcwright-output/features/{slug}/ for all epic and story files\nSee _arcwright-output/features/{slug}/planning/prd.md\n\n## Output\nWrite sprint-plan.md to _arcwright-output/features/{slug}/planning/",
    "model": "sonnet"
  }
}
```

Capture result into `$STEP_9_OUTPUT`. Pass to step 10 (USER APPROVAL).

---

#### tmux Variant (when $TMUX is set and user wants visibility)

Load `.agents/skills/tmux-protocol/SKILL.md` before spawning.

```bash
tmux split-window -h -c "#{pane_current_path}" "claude --dangerously-skip-permissions 'Produce sprint plan with epic sequencing. Epics at _arcwright-output/features/{slug}/. Write sprint-plan.md to _arcwright-output/features/{slug}/planning/'"
```

Completion signal: `AGENT_SIGNAL::TASK_DONE::sm::step-9::done::sprint-plan written`

---

#### Kiro CLI Variant — Stage Fragment

```json
{ "name": "sprint-plan", "role": "arcwright-sm", "prompt_template": "Sprint plan with epic sequencing for: {task}", "depends_on": ["epics"] }
```

### 10. USER APPROVAL

**(Inline orchestrator action — no agent spawn.)** Wait for `[approve]` before entering the per-epic loop. Present the full plan summary (epics list, sprint plan, acceptance criteria summary) to the user. Do NOT auto-proceed.

## Per-Epic Loop

Repeat steps 11–14 for each epic in sprint plan sequence.

### 11. Create Story (per epic)

**What this step does:** The SM/analyst agent gathers all context the dev agent will need for the story — story file, research, UX context. Produces a dev-ready context package.
**Inputs:** Epic ID, `$STEP_7_OUTPUT` (story files), `$STEP_5_OUTPUT_A` (UX design for UI stories)
**Output:** `$EPIC_{ID}_STORY_OUTPUT` — dev-ready story context package

---

#### Default: In-Process (Agent tool)

```json
{
  "name": "Agent",
  "input": {
    "subagent_type": "arcwright-sm",
    "prompt": "Prepare the dev-ready context package for this epic. Gather only what the dev agent needs: story file, directly relevant research, UX design (if UI story). Do NOT dump the full planning folder.\n\n## Inputs\nEpic ID: {epic_id}\nSee _arcwright-output/features/{slug}/{epic_id}/ for story files\nSee _arcwright-output/features/{slug}/planning/ux-design.md (if UI story)\n\n## Output\nWrite story-context-{epic_id}.md to _arcwright-output/features/{slug}/dev/",
    "model": "sonnet"
  }
}
```

Capture result into `$EPIC_{ID}_STORY_OUTPUT`. Pass to step 12.

---

#### tmux Variant (when $TMUX is set and user wants visibility)

Load `.agents/skills/tmux-protocol/SKILL.md` before spawning.

```bash
tmux split-window -h -c "#{pane_current_path}" "claude --dangerously-skip-permissions 'Prepare dev context for epic {epic_id}. Story files at _arcwright-output/features/{slug}/{epic_id}/. Write story-context-{epic_id}.md to _arcwright-output/features/{slug}/dev/'"
```

Completion signal: `AGENT_SIGNAL::TASK_DONE::sm::create-story-{epic_id}::done::story context written`

---

#### Kiro CLI Variant — Stage Fragment

```json
{ "name": "create-story", "role": "arcwright-sm", "prompt_template": "Prepare dev-ready story context for epic {epic_id}: {task}", "depends_on": ["sprint-plan"] }
```

### 12. Dev Story (per epic)

**What this step does:** A dedicated dev agent implements the full epic — frontend, backend, and tests. One dev agent per epic. Uses story context package for scoped context.
**Inputs:** `$EPIC_{ID}_STORY_OUTPUT` (story context from step 11)
**Output:** `$EPIC_{ID}_DEV_OUTPUT` — implementation complete signal

**VERTICAL PLANNING RULE:** Each dev agent owns one full epic end-to-end (frontend + backend + tests). Do NOT split an epic into separate frontend/backend agents. New dev agent only for the NEXT epic.

---

#### Default: In-Process (Agent tool)

```json
{
  "name": "Agent",
  "input": {
    "subagent_type": "arcwright-dev",
    "prompt": "Implement the epic end-to-end (frontend + backend + tests). Own the full vertical slice.\n\n## Inputs\nSee _arcwright-output/features/{slug}/dev/story-context-{epic_id}.md\n\n## Output\nComplete the code changes in the working tree. Write dev notes to _arcwright-output/features/{slug}/dev/epic-{epic_id}-notes.md",
    "model": "sonnet"
  }
}
```

Capture result into `$EPIC_{ID}_DEV_OUTPUT`. Pass to step 13.

---

#### tmux Variant (when $TMUX is set and user wants visibility)

Load `.agents/skills/tmux-protocol/SKILL.md` before spawning.

```bash
tmux split-window -h -c "#{pane_current_path}" "claude --dangerously-skip-permissions 'Implement epic {epic_id} end-to-end. Story context at _arcwright-output/features/{slug}/dev/story-context-{epic_id}.md. Write notes to _arcwright-output/features/{slug}/dev/epic-{epic_id}-notes.md'"
```

Completion signal: `AGENT_SIGNAL::TASK_DONE::dev::dev-story-{epic_id}::done::epic implementation complete`

---

#### Kiro CLI Variant — Stage Fragment

```json
{ "name": "dev-story", "role": "arcwright-dev", "prompt_template": "Implement epic {epic_id} end-to-end (frontend+backend+tests): {task}", "depends_on": ["create-story"] }
```

### 13. Review Gate (per epic)

**What this step does:** The review-orchestrator runs 3 concurrent sub-agents — AR+DRY (up to 3 AR iterations), UV, and SR. Auto-escalate via [CC] if 3 AR passes fail. Do NOT loop indefinitely.
**Inputs:** `$EPIC_{ID}_DEV_OUTPUT` (implementation from step 12)
**Output:** `$EPIC_{ID}_REVIEW_OUTPUT` — epic review result (pass or escalate)

---

#### Default: In-Process (Agent tool)

Issue all three Agent calls in a single assistant message (parallel fan-out):

```json
[
  { "name": "Agent", "input": { "subagent_type": "arcwright-review-orchestrator", "prompt": "AR + DRY review for epic {epic_id}. Up to 3 AR iterations. Auto-escalate via [CC] if 3 passes fail.\n\n## Inputs\n{$EPIC_{ID}_DEV_OUTPUT}\n\n## Output\nWrite review-{epic_id}-ar-dry.md to _arcwright-output/features/{slug}/review/", "model": "opus" } },
  { "name": "Agent", "input": { "subagent_type": "arcwright-review-orchestrator", "prompt": "UV review for epic {epic_id}. Fix findings inline.\n\n## Inputs\n{$EPIC_{ID}_DEV_OUTPUT}\n\n## Output\nWrite review-{epic_id}-uv.md to _arcwright-output/features/{slug}/review/", "model": "opus" } },
  { "name": "Agent", "input": { "subagent_type": "arcwright-review-orchestrator", "prompt": "SR review for epic {epic_id}. Fix findings inline.\n\n## Inputs\n{$EPIC_{ID}_DEV_OUTPUT}\n\n## Output\nWrite review-{epic_id}-sr.md to _arcwright-output/features/{slug}/review/", "model": "opus" } }
]
```

Capture results into `$EPIC_{ID}_REVIEW_AR_OUTPUT`, `$EPIC_{ID}_REVIEW_UV_OUTPUT`, `$EPIC_{ID}_REVIEW_SR_OUTPUT`. Collate into `$EPIC_{ID}_REVIEW_OUTPUT`. Pass to step 14.

---

#### tmux Variant (when $TMUX is set and user wants visibility)

Load `.agents/skills/tmux-protocol/SKILL.md` before spawning. Spawn three panes; poll for all three completion signals:

```
AGENT_SIGNAL::TASK_DONE::review-orchestrator::review-{epic_id}-ar::done::ar-dry review written
AGENT_SIGNAL::TASK_DONE::review-orchestrator::review-{epic_id}-uv::done::uv review written
AGENT_SIGNAL::TASK_DONE::review-orchestrator::review-{epic_id}-sr::done::sr review written
```

---

#### Kiro CLI Variant — Stage Fragment

```json
{ "name": "review-epic", "role": "arcwright-review-orchestrator", "prompt_template": "3-sub review (AR+DRY, UV, SR) for epic {epic_id}: {task}", "depends_on": ["dev-story"] }
```

### 14. QA (per epic)

**What this step does:** The QA agent runs per-epic validation using playwright-cli. On pass: proceed to next story in epic. On fail: route back to Dev Story for this story.
**Inputs:** `$EPIC_{ID}_REVIEW_OUTPUT` (review result from step 13)
**Output:** `$EPIC_{ID}_QA_OUTPUT` — QA pass or fail signal

---

#### Default: In-Process (Agent tool)

```json
{
  "name": "Agent",
  "input": {
    "subagent_type": "arcwright-qa",
    "prompt": "Run QA for epic {epic_id}. Load the `playwright-cli` skill. Primary: drive tests through the UI programmatically. `npx playwright test` with `.spec.ts` files is secondary, only for critical path logic.\n\n## Inputs\nSee _arcwright-output/features/{slug}/{epic_id}/ for story acceptance criteria\nSee _arcwright-output/features/{slug}/review/ for epic review findings\n\n## Output\nQA result: pass or fail. On pass: signal ready for next epic. On fail: report which story failed.",
    "model": "sonnet"
  }
}
```

Capture result into `$EPIC_{ID}_QA_OUTPUT`. On pass: proceed to next epic (repeat from step 11). On fail: route back to step 12 (Dev Story) for this story.

---

#### tmux Variant (when $TMUX is set and user wants visibility)

Load `.agents/skills/tmux-protocol/SKILL.md` before spawning.

```bash
tmux split-window -h -c "#{pane_current_path}" "claude --dangerously-skip-permissions 'QA for epic {epic_id}. Load playwright-cli. Story acceptance criteria at _arcwright-output/features/{slug}/{epic_id}/. Report pass or fail.'"
```

Completion signal: `AGENT_SIGNAL::TASK_DONE::qa::qa-{epic_id}::done::qa passed`

---

#### Kiro CLI Variant — Stage Fragment

```json
{ "name": "qa-epic", "role": "arcwright-qa", "prompt_template": "QA for epic {epic_id}: {task}", "depends_on": ["review-epic"] }
```

## Final Phase

### 15. Final Review Gate

**What this step does:** The review-orchestrator runs a full 3-sub review of the entire codebase after all epics complete. This is the final quality gate before user approval.
**Inputs:** All `$EPIC_{ID}_QA_OUTPUT` signals (all epics complete)
**Output:** `$STEP_15_OUTPUT` — final review result (pass or critical escalation)

---

#### Default: In-Process (Agent tool)

Issue all three Agent calls in a single assistant message (parallel fan-out):

```json
[
  { "name": "Agent", "input": { "subagent_type": "arcwright-review-orchestrator", "prompt": "Final AR + DRY review of the full codebase after all epics complete.\n\n## Inputs\nSee _arcwright-output/features/{slug}/ for all implementation artifacts\n\n## Output\nWrite final-review-ar-dry.md to _arcwright-output/features/{slug}/review/", "model": "opus" } },
  { "name": "Agent", "input": { "subagent_type": "arcwright-review-orchestrator", "prompt": "Final UV review of the full codebase after all epics complete.\n\n## Inputs\nSee _arcwright-output/features/{slug}/ for all implementation artifacts\n\n## Output\nWrite final-review-uv.md to _arcwright-output/features/{slug}/review/", "model": "opus" } },
  { "name": "Agent", "input": { "subagent_type": "arcwright-review-orchestrator", "prompt": "Final SR review of the full codebase after all epics complete.\n\n## Inputs\nSee _arcwright-output/features/{slug}/ for all implementation artifacts\n\n## Output\nWrite final-review-sr.md to _arcwright-output/features/{slug}/review/", "model": "opus" } }
]
```

Capture results into `$FINAL_REVIEW_AR_OUTPUT`, `$FINAL_REVIEW_UV_OUTPUT`, `$FINAL_REVIEW_SR_OUTPUT`. Collate into `$STEP_15_OUTPUT`. Pass to step 16.

---

#### tmux Variant (when $TMUX is set and user wants visibility)

Load `.agents/skills/tmux-protocol/SKILL.md` before spawning. Spawn three panes; poll for all three completion signals:

```
AGENT_SIGNAL::TASK_DONE::review-orchestrator::final-review-ar::done::final ar-dry review written
AGENT_SIGNAL::TASK_DONE::review-orchestrator::final-review-uv::done::final uv review written
AGENT_SIGNAL::TASK_DONE::review-orchestrator::final-review-sr::done::final sr review written
```

---

#### Kiro CLI Variant — Stage Fragment

```json
{ "name": "final-review", "role": "arcwright-review-orchestrator", "prompt_template": "Final 3-sub review after all epics for: {task}", "depends_on": ["qa-epic"] }
```

### 16. Final QA

**What this step does:** The QA agent runs a full regression across all new features. Load playwright-cli. Supplement with `.spec.ts` for critical path logic.
**Inputs:** `$STEP_15_OUTPUT` (final review result)
**Output:** `$STEP_16_OUTPUT` — final QA pass or fail signal

---

#### Default: In-Process (Agent tool)

```json
{
  "name": "Agent",
  "input": {
    "subagent_type": "arcwright-qa",
    "prompt": "Run a full regression across all new features. Load the `playwright-cli` skill. Drive full UI regression programmatically across all new feature areas. Supplement with `npx playwright test` for `.spec.ts` files covering critical path logic.\n\n## Inputs\nSee _arcwright-output/features/{slug}/planning/prd.md for full acceptance criteria\nSee _arcwright-output/features/{slug}/review/final-review-*.md for final review findings\n\n## Output\nFinal QA result: pass or fail with full regression summary.",
    "model": "sonnet"
  }
}
```

Capture result into `$STEP_16_OUTPUT`. Pass to step 17 (USER APPROVAL).

---

#### tmux Variant (when $TMUX is set and user wants visibility)

Load `.agents/skills/tmux-protocol/SKILL.md` before spawning.

```bash
tmux split-window -h -c "#{pane_current_path}" "claude --dangerously-skip-permissions 'Full regression QA across all new features. Load playwright-cli. PRD at _arcwright-output/features/{slug}/planning/prd.md. Report pass or fail.'"
```

Completion signal: `AGENT_SIGNAL::TASK_DONE::qa::final-qa::done::full regression passed`

---

#### Kiro CLI Variant — Stage Fragment

```json
{ "name": "final-qa", "role": "arcwright-qa", "prompt_template": "Full regression QA after all epics for: {task}", "depends_on": ["final-review"] }
```

### 17. USER APPROVAL + PTM

**(Inline orchestrator action — no agent spawn.)** Present summary block and wait for explicit `[approve]`:

```
Ready to merge `{branch}`.

Change summary:
  Epics completed: {N}
  DRY: passed  UV: passed  SR: passed
  QA:  passed (full regression)

[approve] Proceed to /prepare-to-merge
[review]  I want to check something first
```

Wait for explicit `[approve]` before running PTM. Do NOT auto-proceed. Then run `/prepare-to-merge` in-process.

## Kiro Pipeline

Use the `subagent` tool to run the full track as a Kiro pipeline. Track-large uses two pipelines due to the per-epic loop.

### Pipeline 1 — Planning

```json
{
  "task": "Run large-track planning: product brief, parallel research, PRD, planning gate, parallel UX+arch, design gate, epics, IR check, sprint plan.",
  "stages": [
    {
      "name": "brief",
      "role": "arcwright-pm",
      "prompt_template": "Write product brief for: {task}",
      "depends_on": []
    },
    {
      "name": "research-codebase",
      "role": "arcwright-analyst",
      "prompt_template": "Codebase exploration for: {task}",
      "depends_on": ["brief"]
    },
    {
      "name": "research-domain",
      "role": "arcwright-analyst",
      "prompt_template": "Domain/technical research for: {task}",
      "depends_on": ["brief"]
    },
    {
      "name": "research-ux",
      "role": "arcwright-analyst",
      "prompt_template": "UX patterns and competitive research for: {task}",
      "depends_on": ["brief"]
    },
    {
      "name": "prd",
      "role": "arcwright-pm",
      "prompt_template": "Write PRD from brief + research for: {task}",
      "depends_on": ["research-codebase", "research-domain", "research-ux"]
    },
    {
      "name": "planning-gate-arch",
      "role": "arcwright-architect",
      "prompt_template": "Planning gate: spec completeness and feasibility review for: {task}",
      "depends_on": ["prd"]
    },
    {
      "name": "planning-gate-pm",
      "role": "arcwright-pm",
      "prompt_template": "Planning gate: scope and acceptance criteria review for: {task}",
      "depends_on": ["prd"]
    },
    {
      "name": "ux",
      "role": "arcwright-ux-designer",
      "prompt_template": "UX design for: {task}",
      "depends_on": ["planning-gate-arch", "planning-gate-pm"]
    },
    {
      "name": "arch",
      "role": "arcwright-architect",
      "prompt_template": "Architecture doc for: {task}",
      "depends_on": ["planning-gate-arch", "planning-gate-pm"]
    },
    {
      "name": "design-gate-ux",
      "role": "arcwright-review-orchestrator",
      "prompt_template": "Design gate: UX design review for: {task}",
      "depends_on": ["ux", "arch"]
    },
    {
      "name": "design-gate-arch",
      "role": "arcwright-review-orchestrator",
      "prompt_template": "Design gate: architecture review for: {task}",
      "depends_on": ["ux", "arch"]
    },
    {
      "name": "epics",
      "role": "arcwright-pm",
      "prompt_template": "Epics and stories for: {task}",
      "depends_on": ["design-gate-ux", "design-gate-arch"]
    },
    {
      "name": "sprint-plan",
      "role": "arcwright-sm",
      "prompt_template": "Sprint plan with epic sequencing for: {task}",
      "depends_on": ["epics"]
    }
  ]
}
```

### Pipeline 2 — Per-Epic Loop

Pipeline 2 cannot be expressed as a static DAG; the orchestrator runs it once per epic by invoking the `subagent` tool with the epic's ID substituted into `{task}`. Run this pipeline once per epic in sprint plan sequence.

```json
{
  "task": "Run per-epic loop for epic {epic_id}: story context, dev, review, QA.",
  "stages": [
    {
      "name": "create-story",
      "role": "arcwright-sm",
      "prompt_template": "Prepare dev-ready story context for epic {epic_id}: {task}",
      "depends_on": []
    },
    {
      "name": "dev-story",
      "role": "arcwright-dev",
      "prompt_template": "Implement epic {epic_id} end-to-end (frontend+backend+tests): {task}",
      "depends_on": ["create-story"]
    },
    {
      "name": "review-epic",
      "role": "arcwright-review-orchestrator",
      "prompt_template": "3-sub review (AR+DRY, UV, SR) for epic {epic_id}: {task}",
      "depends_on": ["dev-story"]
    },
    {
      "name": "qa-epic",
      "role": "arcwright-qa",
      "prompt_template": "QA for epic {epic_id}: {task}",
      "depends_on": ["review-epic"]
    }
  ]
}
```

After all epics complete, run final review and QA before USER APPROVAL.
