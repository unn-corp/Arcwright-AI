---
name: "track-medium"
description: "Medium track workflow -- 6-12 files with full spec, UX design, 2 review gates, QA"
---

> **Default orchestration:** in-process via [`claude-subagent-protocol`](.agents/skills/claude-subagent-protocol/SKILL.md). tmux split-pane variant is opt-in (see step blocks).

# Track: Medium

## Scope

| Criterion     | Threshold                                           |
|---------------|-----------------------------------------------------|
| Files touched | 6-12                                                |
| Complexity    | New UI flow or notable backend change               |
| Examples      | New page + API endpoint, settings section, form flow |

## Workflow Chain

```
Quick Spec
  -> Research (1-2 in-process analysts)
  -> UX Design
  -> Review Gate 1 (3-sub: spec + UX review)
  -> Quick Dev
  -> Final Review Gate (3-sub)
  -> QA Tests
  -> USER APPROVAL
  -> PTM
```

## Steps

### 0. Project Context Scan

Load the `project-context` skill (`.agents/skills/project-context/SKILL.md`) and run the full scan inline. This runs before Quick Spec — no planning starts before context is gathered. If existing plan artifacts are found in `_arcwright-output/`, present to user (resume vs. start fresh). Pass the `## Project Context` block to Quick Spec, Research, UX Design, and all subsequent steps.

### 1. Quick Spec

**What this step does:** The quick-flow-solo-dev agent produces a full task definition, acceptance criteria, and research needs for the change.
**Inputs:** `$STEP_0_OUTPUT` (project context from step 0)
**Output:** `$STEP_1_OUTPUT` — task definition, acceptance criteria, research needs

---

#### Default: In-Process (Agent tool)

```json
{
  "name": "Agent",
  "input": {
    "subagent_type": "arcwright-quick-flow-solo-dev",
    "prompt": "Write a full quick spec for the requested change. Include: task definition, acceptance criteria, and research needs.\n\n## Inputs\n{$STEP_0_OUTPUT}\n\n## Output\nSpec written to _arcwright-output/features/{slug}/planning/spec.md",
    "model": "sonnet"
  }
}
```

Capture result into `$STEP_1_OUTPUT`. Pass to step 2.

---

#### tmux Variant (when $TMUX is set and user wants visibility)

Load `.agents/skills/tmux-protocol/SKILL.md` before spawning.

```bash
tmux split-window -h -c "#{pane_current_path}" "claude --dangerously-skip-permissions 'Write a full quick spec. Context: {$STEP_0_OUTPUT}. Write spec.md to _arcwright-output/features/{slug}/planning/'"
```

Completion signal: `AGENT_SIGNAL::TASK_DONE::quick-flow-solo-dev::step-1::done::spec written`

---

#### Kiro CLI Variant — Stage Fragment

```json
{ "name": "spec", "role": "arcwright-quick-flow-solo-dev", "prompt_template": "Quick spec for: {task}", "depends_on": [] }
```

### 2. Research

**What this step does:** 1-2 analyst agents run codebase and/or domain research in-process. If research reveals infeasibility, halt and present to user before continuing.
**Inputs:** `$STEP_1_OUTPUT` (spec from step 1)
**Output:** `$STEP_2_OUTPUT` — research findings

---

#### Default: In-Process (Agent tool)

For 1 agent (codebase only):

```json
{
  "name": "Agent",
  "input": {
    "subagent_type": "arcwright-analyst",
    "prompt": "Perform codebase research for the requested change. Identify relevant patterns, existing code, and implementation risks.\n\n## Inputs\nSee _arcwright-output/features/{slug}/planning/spec.md\n\n## Output\nWrite research.md to _arcwright-output/features/{slug}/planning/",
    "model": "sonnet"
  }
}
```

For 2 agents (codebase + domain), issue both sequentially (codebase first, then domain). Capture results into `$STEP_2_OUTPUT`. Pass to step 3.
HALT condition: if research reveals infeasibility, stop and present to user before continuing.

---

#### tmux Variant (when $TMUX is set and user wants visibility)

Load `.agents/skills/tmux-protocol/SKILL.md` before spawning.

```bash
tmux split-window -h -c "#{pane_current_path}" "claude --dangerously-skip-permissions 'Codebase research for the change. Spec at _arcwright-output/features/{slug}/planning/spec.md. Write research.md to _arcwright-output/features/{slug}/planning/'"
```

Completion signal: `AGENT_SIGNAL::TASK_DONE::analyst::step-2::done::research written`

---

#### Kiro CLI Variant — Stage Fragment

```json
{ "name": "research", "role": "arcwright-analyst", "prompt_template": "Research for: {task}", "depends_on": ["spec"] }
```

### 3. UX Design

**What this step does:** The ux-designer agent produces wireframes/flow descriptions and component decisions based on the spec and research.
**Inputs:** `$STEP_1_OUTPUT` (spec), `$STEP_2_OUTPUT` (research)
**Output:** `$STEP_3_OUTPUT` — ux-design.md with wireframes/flow and component decisions

---

#### Default: In-Process (Agent tool)

```json
{
  "name": "Agent",
  "input": {
    "subagent_type": "arcwright-ux-designer",
    "prompt": "Produce the UX design for the requested change. Include wireframes or flow descriptions and component decisions.\n\n## Inputs\nSee _arcwright-output/features/{slug}/planning/spec.md\nSee _arcwright-output/features/{slug}/planning/research.md\n\n## Output\nWrite ux-design.md to _arcwright-output/features/{slug}/planning/",
    "model": "sonnet"
  }
}
```

Capture result into `$STEP_3_OUTPUT`. Pass to step 4.

---

#### tmux Variant (when $TMUX is set and user wants visibility)

Load `.agents/skills/tmux-protocol/SKILL.md` before spawning.

```bash
tmux split-window -h -c "#{pane_current_path}" "claude --dangerously-skip-permissions 'UX design for the change. Spec at _arcwright-output/features/{slug}/planning/spec.md. Research at _arcwright-output/features/{slug}/planning/research.md. Write ux-design.md to _arcwright-output/features/{slug}/planning/'"
```

Completion signal: `AGENT_SIGNAL::TASK_DONE::ux-designer::step-3::done::ux-design written`

---

#### Kiro CLI Variant — Stage Fragment

```json
{ "name": "ux", "role": "arcwright-ux-designer", "prompt_template": "UX design for: {task}", "depends_on": ["research"] }
```

### 4. Review Gate 1

**What this step does:** The review-orchestrator runs 3 concurrent sub-agents reviewing the spec and UX design before dev starts. If critical spec issues are found, route back to Quick Spec.
**Inputs:** `$STEP_3_OUTPUT` (UX design), `$STEP_1_OUTPUT` (spec)
**Output:** `$STEP_4_OUTPUT` — collated pre-dev review result (pass or route-back)

---

#### Default: In-Process (Agent tool)

Issue all three Agent calls in a single assistant message (parallel fan-out):

```json
[
  { "name": "Agent", "input": { "subagent_type": "arcwright-review-orchestrator", "prompt": "Review spec completeness and DRY concerns (pre-dev). Fix findings inline.\n\n## Inputs\nSee _arcwright-output/features/{slug}/planning/spec.md\n\n## Output\nWrite review-g1-ar-dry.md to _arcwright-output/features/{slug}/review/", "model": "opus" } },
  { "name": "Agent", "input": { "subagent_type": "arcwright-review-orchestrator", "prompt": "UV review of the UX design (pre-dev). Fix findings inline.\n\n## Inputs\nSee _arcwright-output/features/{slug}/planning/ux-design.md\n\n## Output\nWrite review-g1-uv.md to _arcwright-output/features/{slug}/review/", "model": "opus" } },
  { "name": "Agent", "input": { "subagent_type": "arcwright-review-orchestrator", "prompt": "SR (security) review of the proposed approach (pre-dev). Fix findings inline.\n\n## Inputs\nSee _arcwright-output/features/{slug}/planning/spec.md\nSee _arcwright-output/features/{slug}/planning/ux-design.md\n\n## Output\nWrite review-g1-sr.md to _arcwright-output/features/{slug}/review/", "model": "opus" } }
]
```

Capture results into `$REVIEW_G1_AR_OUTPUT`, `$REVIEW_G1_UV_OUTPUT`, `$REVIEW_G1_SR_OUTPUT`. Then collate into `$STEP_4_OUTPUT`. Pass to step 5.
If critical spec issues found: route back to step 1 (Quick Spec). Do not proceed to dev.

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
{ "name": "review-1", "role": "arcwright-review-orchestrator", "prompt_template": "Pre-dev review gate (3-sub: spec+UX) for: {task}", "depends_on": ["ux"] }
```

### 5. Quick Dev

**What this step does:** The quick-flow-solo-dev agent implements the full change based on spec, UX design, and review gate 1 findings. No epic loop — single dev agent for full implementation.
**Inputs:** `$STEP_4_OUTPUT` (review gate 1 result), `$STEP_1_OUTPUT` (spec), `$STEP_3_OUTPUT` (UX design)
**Output:** `$STEP_5_OUTPUT` — implementation complete signal

---

#### Default: In-Process (Agent tool)

```json
{
  "name": "Agent",
  "input": {
    "subagent_type": "arcwright-quick-flow-solo-dev",
    "prompt": "Implement the full requested change per the spec, UX design, and review gate 1 findings.\n\n## Inputs\nSee _arcwright-output/features/{slug}/planning/spec.md\nSee _arcwright-output/features/{slug}/planning/ux-design.md\nSee _arcwright-output/features/{slug}/review/ for review gate 1 findings\n\n## Output\nComplete the code change in the working tree.",
    "model": "sonnet"
  }
}
```

Capture result into `$STEP_5_OUTPUT`. Pass to step 6.

---

#### tmux Variant (when $TMUX is set and user wants visibility)

Load `.agents/skills/tmux-protocol/SKILL.md` before spawning.

```bash
tmux split-window -h -c "#{pane_current_path}" "claude --dangerously-skip-permissions 'Implement the change per spec, UX design, and review findings. Spec at _arcwright-output/features/{slug}/planning/spec.md. UX at _arcwright-output/features/{slug}/planning/ux-design.md. Review at _arcwright-output/features/{slug}/review/'"
```

Completion signal: `AGENT_SIGNAL::TASK_DONE::quick-flow-solo-dev::step-5::done::implementation complete`

---

#### Kiro CLI Variant — Stage Fragment

```json
{ "name": "dev", "role": "arcwright-dev", "prompt_template": "Implement per spec, UX design, and review findings: {task}", "depends_on": ["review-1"] }
```

### 6. Final Review Gate

**What this step does:** The review-orchestrator runs 3 concurrent sub-agents for a final post-dev review. 1 pass per sub-agent — the max-3 general AR loop does NOT apply to the Final Review Gate. If critical finding: route back to Quick Dev once.
**Inputs:** `$STEP_5_OUTPUT` (implementation from step 5)
**Output:** `$STEP_6_OUTPUT` — final review result (pass or route-back)

---

#### Default: In-Process (Agent tool)

Issue all three Agent calls in a single assistant message (parallel fan-out):

```json
[
  { "name": "Agent", "input": { "subagent_type": "arcwright-review-orchestrator", "prompt": "Run final AR + DRY review. 1 pass only. Fix findings inline.\n\n## Inputs\n{$STEP_5_OUTPUT}\n\n## Output\nWrite review-final-ar-dry.md to _arcwright-output/features/{slug}/review/", "model": "opus" } },
  { "name": "Agent", "input": { "subagent_type": "arcwright-review-orchestrator", "prompt": "Run final UV review. 1 pass only. Fix findings inline.\n\n## Inputs\n{$STEP_5_OUTPUT}\n\n## Output\nWrite review-final-uv.md to _arcwright-output/features/{slug}/review/", "model": "opus" } },
  { "name": "Agent", "input": { "subagent_type": "arcwright-review-orchestrator", "prompt": "Run final SR review. 1 pass only. Fix findings inline.\n\n## Inputs\n{$STEP_5_OUTPUT}\n\n## Output\nWrite review-final-sr.md to _arcwright-output/features/{slug}/review/", "model": "opus" } }
]
```

Capture results into `$REVIEW_FINAL_AR_OUTPUT`, `$REVIEW_FINAL_UV_OUTPUT`, `$REVIEW_FINAL_SR_OUTPUT`. Collate into `$STEP_6_OUTPUT`. Pass to step 7.
If critical finding: route back to step 5 (Quick Dev) once.

---

#### tmux Variant (when $TMUX is set and user wants visibility)

Load `.agents/skills/tmux-protocol/SKILL.md` before spawning. Spawn three panes; poll for all three completion signals:

```
AGENT_SIGNAL::TASK_DONE::review-orchestrator::review-final-ar::done::ar-dry review written
AGENT_SIGNAL::TASK_DONE::review-orchestrator::review-final-uv::done::uv review written
AGENT_SIGNAL::TASK_DONE::review-orchestrator::review-final-sr::done::sr review written
```

---

#### Kiro CLI Variant — Stage Fragment

```json
{ "name": "review-2", "role": "arcwright-review-orchestrator", "prompt_template": "Final review gate (3-sub) for: {task}", "depends_on": ["dev"] }
```

### 7. QA Tests

**What this step does:** The QA agent validates the implementation against acceptance criteria using playwright-cli for UI and assertions for critical path logic.
**Inputs:** `$STEP_6_OUTPUT` (final review result), `$STEP_1_OUTPUT` (spec for acceptance criteria)
**Output:** `$STEP_7_OUTPUT` — QA pass or fail signal

---

#### Default: In-Process (Agent tool)

```json
{
  "name": "Agent",
  "input": {
    "subagent_type": "arcwright-qa",
    "prompt": "Run QA validation against the acceptance criteria. Load the `playwright-cli` skill. Primary: drive tests through the UI programmatically. `npx playwright test` with `.spec.ts` files is secondary, only for critical path logic (auth, payments, core data flows).\n\n## Inputs\nSee _arcwright-output/features/{slug}/planning/spec.md for acceptance criteria\nSee _arcwright-output/features/{slug}/review/ for final review findings\n\n## Output\nQA result: pass or fail with details.",
    "model": "sonnet"
  }
}
```

Capture result into `$STEP_7_OUTPUT`. Pass to step 8 (USER APPROVAL).

---

#### tmux Variant (when $TMUX is set and user wants visibility)

Load `.agents/skills/tmux-protocol/SKILL.md` before spawning.

```bash
tmux split-window -h -c "#{pane_current_path}" "claude --dangerously-skip-permissions 'Run QA validation. Load playwright-cli skill. Drive tests through UI programmatically. Spec at _arcwright-output/features/{slug}/planning/spec.md. Report pass or fail.'"
```

Completion signal: `AGENT_SIGNAL::TASK_DONE::qa::step-7::done::qa passed`

---

#### Kiro CLI Variant — Stage Fragment

```json
{ "name": "qa", "role": "arcwright-qa", "prompt_template": "QA validation for: {task}", "depends_on": ["review-2"] }
```

### 8. USER APPROVAL

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

### 9. PTM

Run `/prepare-to-merge` in-process.

## Kiro Pipeline

Use the `subagent` tool to run the full track as a Kiro pipeline. Assemble all stage fragments from the steps above into a single `stages` array.

```json
{
  "task": "Run a medium-track workflow: spec, research, UX design, 2 review gates, dev, and QA for a 6-12 file change.",
  "stages": [
    {
      "name": "spec",
      "role": "arcwright-quick-flow-solo-dev",
      "prompt_template": "Quick spec for: {task}",
      "depends_on": []
    },
    {
      "name": "research",
      "role": "arcwright-analyst",
      "prompt_template": "Research for: {task}",
      "depends_on": ["spec"]
    },
    {
      "name": "ux",
      "role": "arcwright-ux-designer",
      "prompt_template": "UX design for: {task}",
      "depends_on": ["research"]
    },
    {
      "name": "review-1",
      "role": "arcwright-review-orchestrator",
      "prompt_template": "Pre-dev review gate (3-sub: spec+UX) for: {task}",
      "depends_on": ["ux"]
    },
    {
      "name": "dev",
      "role": "arcwright-dev",
      "prompt_template": "Implement per spec, UX design, and review findings: {task}",
      "depends_on": ["review-1"]
    },
    {
      "name": "review-2",
      "role": "arcwright-review-orchestrator",
      "prompt_template": "Final review gate (3-sub) for: {task}",
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
