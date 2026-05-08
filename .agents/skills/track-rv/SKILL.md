---
name: "track-rv"
description: "Review track -- audit first, then fix path (SMALL or LARGE) based on finding volume"
---

> **Default orchestration:** in-process via [`claude-subagent-protocol`](.agents/skills/claude-subagent-protocol/SKILL.md). tmux split-pane variant is opt-in (see step blocks).

# Track: RV (Review)

## Purpose

Audit an existing area of the codebase, synthesize findings, then route to the appropriate fix path based on finding volume.

## Workflow Chain

```
Target Definition
  -> Complexity Assessment
  -> Research Phase (optional, 2-3 in-process analysts)
  -> Multi-Lens Review (3-sub concurrent)
  -> Findings Synthesis
  -> Sort Artifacts
  -> Volume Gate (branching step)
  -> [SMALL path] OR [LARGE path]
  -> PTM
```

## Steps

### 0. Project Context Scan

Load the `project-context` skill (`.agents/skills/project-context/SKILL.md`) and run the full scan inline. This runs before Target Definition — review agents need full project context to assess correctly. If existing RV findings are found in `_arcwright-output/`, present to user (resume vs. fresh audit). Pass the `## Project Context` block to all review agents and the Findings Synthesis step.

### 1. Target Definition

Ask user for:
- Area: file path, feature name, or module name
- Depth:
  - [A] Targeted — code quality and correctness only
  - [B] Full — with plan files, architecture review
  - [C] Custom — user specifies lens

### 2. Complexity Assessment

**What this step does:** The orchestrator (in-process) estimates file count and cross-cutting surface area, and determines if a research phase is needed.
**Inputs:** Target definition from step 1, `$STEP_0_OUTPUT` (project context)
**Output:** `$STEP_2_OUTPUT` — complexity estimate and research trigger decision

---

#### Default: In-Process (Agent tool)

```json
{
  "name": "Agent",
  "input": {
    "subagent_type": "arcwright-analyst",
    "prompt": "Assess the complexity of the review target. Estimate file count, cross-cutting surface area, and determine if a research phase is needed (trigger if: unclear ownership, external dependencies, or >8 files in scope).\n\n## Inputs\nTarget: {target_area}\n{$STEP_0_OUTPUT}\n\n## Output\nComplexity estimate and research trigger decision.",
    "model": "sonnet"
  }
}
```

Capture result into `$STEP_2_OUTPUT`. Pass to step 3.

---

#### tmux Variant (when $TMUX is set and user wants visibility)

Load `.agents/skills/tmux-protocol/SKILL.md` before spawning.

```bash
tmux split-window -h -c "#{pane_current_path}" "claude --dangerously-skip-permissions 'Assess complexity of the review target: {target_area}. Estimate file count and surface area. Determine if research is needed. Context: {$STEP_0_OUTPUT}'"
```

Completion signal: `AGENT_SIGNAL::TASK_DONE::analyst::step-2::done::complexity assessed`

---

#### Kiro CLI Variant — Stage Fragment

```json
{ "name": "complexity-assessment", "role": "arcwright-analyst", "prompt_template": "Assess complexity of review target: {task}", "depends_on": [] }
```

### 3. Research Phase (optional)

**What this step does:** 2-3 analyst agents run in-process to produce focused findings briefs. Triggered when the area has unclear ownership, external dependencies, or >8 files in scope. Skip if not triggered.
**Inputs:** `$STEP_2_OUTPUT` (complexity assessment with research trigger decision)
**Output:** `$STEP_3_OUTPUT` — research findings briefs (2-3 docs), or skip signal

---

#### Default: In-Process (Agent tool)

Trigger only if step 2 flagged research as needed. Issue 2-3 sequential Agent calls:

```json
{
  "name": "Agent",
  "input": {
    "subagent_type": "arcwright-analyst",
    "prompt": "Research phase for review target. Produce a focused findings brief covering ownership, dependencies, and relevant context.\n\n## Inputs\nTarget: {target_area}\n{$STEP_2_OUTPUT}\n\n## Output\nWrite research-{n}.md to _arcwright-output/features/{slug}/planning/",
    "model": "sonnet"
  }
}
```

Capture results into `$STEP_3_OUTPUT`. Pass to step 4.

---

#### tmux Variant (when $TMUX is set and user wants visibility)

Load `.agents/skills/tmux-protocol/SKILL.md` before spawning.

```bash
tmux split-window -h -c "#{pane_current_path}" "claude --dangerously-skip-permissions 'Research phase for review target: {target_area}. Produce focused findings brief. Write research-1.md to _arcwright-output/features/{slug}/planning/'"
```

Completion signal: `AGENT_SIGNAL::TASK_DONE::analyst::step-3::done::research written`

---

#### Kiro CLI Variant — Stage Fragment

```json
{ "name": "research", "role": "arcwright-analyst", "prompt_template": "Research phase for review target: {task}", "depends_on": ["complexity-assessment"] }
```

### 4. Multi-Lens Review

**What this step does:** The review-orchestrator runs 3 concurrent sub-agents — AR+DRY, UV, and SR — all against the target area simultaneously.
**Inputs:** `$STEP_3_OUTPUT` (research if run), `$STEP_0_OUTPUT` (project context)
**Output:** `$STEP_4_OUTPUT` — three review reports (ar-dry, uv, sr)

---

#### Default: In-Process (Agent tool)

Issue all three Agent calls in a single assistant message (parallel fan-out):

```json
[
  { "name": "Agent", "input": { "subagent_type": "arcwright-review-orchestrator", "prompt": "AR + DRY review of the target area. Full review — flag all findings.\n\n## Inputs\nTarget: {target_area}\nSee _arcwright-output/features/{slug}/planning/ for research context (if present)\n\n## Output\nWrite rv-review-ar-dry.md to _arcwright-output/features/{slug}/review/", "model": "opus" } },
  { "name": "Agent", "input": { "subagent_type": "arcwright-review-orchestrator", "prompt": "UV review of the target area. Full review — flag all findings.\n\n## Inputs\nTarget: {target_area}\nSee _arcwright-output/features/{slug}/planning/ for research context (if present)\n\n## Output\nWrite rv-review-uv.md to _arcwright-output/features/{slug}/review/", "model": "opus" } },
  { "name": "Agent", "input": { "subagent_type": "arcwright-review-orchestrator", "prompt": "SR (security) review of the target area. Full review — flag all findings.\n\n## Inputs\nTarget: {target_area}\nSee _arcwright-output/features/{slug}/planning/ for research context (if present)\n\n## Output\nWrite rv-review-sr.md to _arcwright-output/features/{slug}/review/", "model": "opus" } }
]
```

Capture results into `$REVIEW_AR_OUTPUT`, `$REVIEW_UV_OUTPUT`, `$REVIEW_SR_OUTPUT`. Collate into `$STEP_4_OUTPUT`. Pass to step 5.

---

#### tmux Variant (when $TMUX is set and user wants visibility)

Load `.agents/skills/tmux-protocol/SKILL.md` before spawning. Spawn three panes concurrently; poll for all three completion signals:

```
AGENT_SIGNAL::TASK_DONE::review-orchestrator::rv-review-ar::done::ar-dry review written
AGENT_SIGNAL::TASK_DONE::review-orchestrator::rv-review-uv::done::uv review written
AGENT_SIGNAL::TASK_DONE::review-orchestrator::rv-review-sr::done::sr review written
```

---

#### Kiro CLI Variant — Stage Fragment

Three parallel stages (all depend on research, independent of each other):

```json
{ "name": "review-ar", "role": "arcwright-review-orchestrator", "prompt_template": "AR + DRY review of: {task}", "depends_on": ["research"] }
```

```json
{ "name": "review-uv", "role": "arcwright-review-orchestrator", "prompt_template": "UV review of: {task}", "depends_on": ["research"] }
```

```json
{ "name": "review-sr", "role": "arcwright-review-orchestrator", "prompt_template": "Security review of: {task}", "depends_on": ["research"] }
```

### 5. Findings Synthesis

**What this step does:** The orchestrator consolidates findings from all 3 sub-agents in-process — categorizes by severity (critical/major/minor/informational) and counts actionable items.
**Inputs:** `$STEP_4_OUTPUT` (all three review reports)
**Output:** `$STEP_5_OUTPUT` — synthesized findings with severity counts

---

#### Default: In-Process (Agent tool)

```json
{
  "name": "Agent",
  "input": {
    "subagent_type": "arcwright-analyst",
    "prompt": "Synthesize all review findings. Consolidate from AR+DRY, UV, and SR reports. Categorize: critical / major / minor / informational. Count actionable items per category.\n\n## Inputs\nSee _arcwright-output/features/{slug}/review/rv-review-ar-dry.md\nSee _arcwright-output/features/{slug}/review/rv-review-uv.md\nSee _arcwright-output/features/{slug}/review/rv-review-sr.md\n\n## Output\nWrite rv-synthesis-{artifact_id}.md to _arcwright-output/features/{slug}/planning/",
    "model": "sonnet"
  }
}
```

Capture result into `$STEP_5_OUTPUT`. Pass to step 6.

---

#### tmux Variant (when $TMUX is set and user wants visibility)

Load `.agents/skills/tmux-protocol/SKILL.md` before spawning.

```bash
tmux split-window -h -c "#{pane_current_path}" "claude --dangerously-skip-permissions 'Synthesize review findings. Reviews at _arcwright-output/features/{slug}/review/. Categorize and count actionable items. Write rv-synthesis-{artifact_id}.md to _arcwright-output/features/{slug}/planning/'"
```

Completion signal: `AGENT_SIGNAL::TASK_DONE::analyst::step-5::done::findings synthesized`

---

#### Kiro CLI Variant — Stage Fragment

```json
{ "name": "synthesis", "role": "arcwright-analyst", "prompt_template": "Synthesize review findings for: {task}", "depends_on": ["review-ar", "review-uv", "review-sr"] }
```

### 6. Sort Artifacts

Write findings to `_arcwright-output/features/{feature-slug}/planning/rv-findings-{artifact_id}.md`. Format: severity table, grouped by sub-agent lens.

Artifact naming: all files use `{artifact_id}` suffix. `{artifact_id}` derivation: `{YYYYMMDD}-{feature-slug}` (e.g. `20260403-auth-refactor`). Output path: `_arcwright-output/features/{feature-slug}/planning/`

| Artifact | Filename pattern |
|---|---|
| RV Findings | `rv-findings-{artifact_id}.md` |
| Synthesis | `rv-synthesis-{artifact_id}.md` |
| SMALL fix brief | `rv-fix-brief-{artifact_id}.md` |
| LARGE epics | standard epic files, tagged `rv-{artifact_id}` |

### 7. Volume Gate (branching step)

| Condition                                           | Path  |
|-----------------------------------------------------|-------|
| >20 actionable items                                | LARGE |
| Cross-cutting architectural or product gaps found   | LARGE |
| <=20 actionable items, contained scope              | SMALL |
| User override                                       | User choice |

Present gate decision to user with summary before proceeding.

**What this step does:** The orchestrator evaluates the finding count and presents the routing decision to the user before branching.
**Inputs:** `$STEP_5_OUTPUT` (synthesized findings with counts)
**Output:** `$STEP_7_OUTPUT` — branch decision: `"SMALL"` or `"LARGE"`

---

#### Default: In-Process (Agent tool)

```json
{
  "name": "Agent",
  "input": {
    "subagent_type": "arcwright-analyst",
    "prompt": "Evaluate the volume gate. Read the synthesis findings and determine the fix path: LARGE if >20 actionable items OR cross-cutting architectural/product gaps; SMALL if <=20 items with contained scope. Present the decision with summary to the user before finalizing.\n\n## Inputs\nSee _arcwright-output/features/{slug}/planning/rv-synthesis-{artifact_id}.md\n\n## Output\nBranch decision: SMALL or LARGE with justification.",
    "model": "sonnet"
  }
}
```

Capture result into `$STEP_7_OUTPUT`. Pass to the selected branch.

On `$STEP_7_OUTPUT == "SMALL"`: continue to SMALL fix path (Quick Dev → Review Gate → QA → USER APPROVAL → PTM).
On `$STEP_7_OUTPUT == "LARGE"`: continue to LARGE fix path (Epics & Stories → IR Check → Sprint Plan → Per-Epic Loop → Final Review Gate → QA → Epic Retro → USER APPROVAL → PTM).

---

#### tmux Variant (when $TMUX is set and user wants visibility)

Load `.agents/skills/tmux-protocol/SKILL.md` before spawning.

```bash
tmux split-window -h -c "#{pane_current_path}" "claude --dangerously-skip-permissions 'Evaluate volume gate from synthesis at _arcwright-output/features/{slug}/planning/rv-synthesis-{artifact_id}.md. Determine SMALL or LARGE path. Present decision to user.'"
```

Completion signal: `AGENT_SIGNAL::TASK_DONE::analyst::step-7::done::volume gate decision made`

---

#### Kiro CLI Variant — Stage Fragment

```json
{ "name": "volume-gate", "role": "arcwright-analyst", "prompt_template": "Volume gate decision (SMALL or LARGE) for: {task}", "depends_on": ["synthesis"] }
```

## SMALL Fix Path

```
Quick Dev -> Review Gate (3-sub) -> QA Tests -> USER APPROVAL -> PTM
```

Follow track-small steps for dev, review, and QA. Context: rv-findings doc passed to dev agent.

## LARGE Fix Path

```
Epics & Stories
  -> IR Check (in-process)
  -> Sprint Plan
  -> Per-Epic Dev Loop (see track-large)
  -> Final Review Gate (3-sub)
  -> QA
  -> Epic Retro (in-process)
  -> USER APPROVAL
  -> PTM
```

Follow track-large epic loop for dev execution. Epics derived from findings synthesis, not from a PRD. Epic Retro: brief in-process step confirming all critical/major findings are resolved.

## PTM

Run `/prepare-to-merge` in-process (both paths).

## Kiro Pipeline

Kiro cannot express runtime conditional branches as a static DAG — build two separate pipelines (Pipeline A: SMALL path, Pipeline B: LARGE path). After running the audit pipeline and determining the branch via volume gate, invoke the appropriate fix pipeline.

### Audit Pipeline (runs first, always)

```json
{
  "task": "Run RV track audit: complexity assessment, optional research, multi-lens review, synthesis, and volume gate.",
  "stages": [
    {
      "name": "complexity-assessment",
      "role": "arcwright-analyst",
      "prompt_template": "Assess complexity of review target: {task}",
      "depends_on": []
    },
    {
      "name": "research",
      "role": "arcwright-analyst",
      "prompt_template": "Research phase for review target: {task}",
      "depends_on": ["complexity-assessment"]
    },
    {
      "name": "review-ar",
      "role": "arcwright-review-orchestrator",
      "prompt_template": "AR + DRY review of: {task}",
      "depends_on": ["research"]
    },
    {
      "name": "review-uv",
      "role": "arcwright-review-orchestrator",
      "prompt_template": "UV review of: {task}",
      "depends_on": ["research"]
    },
    {
      "name": "review-sr",
      "role": "arcwright-review-orchestrator",
      "prompt_template": "Security review of: {task}",
      "depends_on": ["research"]
    },
    {
      "name": "synthesis",
      "role": "arcwright-analyst",
      "prompt_template": "Synthesize review findings for: {task}",
      "depends_on": ["review-ar", "review-uv", "review-sr"]
    },
    {
      "name": "volume-gate",
      "role": "arcwright-analyst",
      "prompt_template": "Volume gate decision (SMALL or LARGE) for: {task}",
      "depends_on": ["synthesis"]
    }
  ]
}
```

### Pipeline A — SMALL Fix Path

Invoke after volume gate returns SMALL. Follows track-small dev/review/QA pattern with rv-findings as context.

```json
{
  "task": "RV SMALL fix path: dev, 3-sub review, QA for contained finding set.",
  "stages": [
    {
      "name": "dev",
      "role": "arcwright-dev",
      "prompt_template": "Implement fixes from rv-findings for: {task}",
      "depends_on": []
    },
    {
      "name": "review",
      "role": "arcwright-review-orchestrator",
      "prompt_template": "3-sub review (AR+DRY, UV, SR) of fixes for: {task}",
      "depends_on": ["dev"]
    },
    {
      "name": "qa",
      "role": "arcwright-qa",
      "prompt_template": "QA validation of fixes for: {task}",
      "depends_on": ["review"]
    }
  ]
}
```

### Pipeline B — LARGE Fix Path

Invoke after volume gate returns LARGE. Follows track-large epic loop pattern with epics derived from findings synthesis.

```json
{
  "task": "RV LARGE fix path: epics from findings, sprint plan, per-epic dev loop, final review, QA.",
  "stages": [
    {
      "name": "epics",
      "role": "arcwright-pm",
      "prompt_template": "Derive epics and stories from rv-findings synthesis for: {task}",
      "depends_on": []
    },
    {
      "name": "sprint-plan",
      "role": "arcwright-sm",
      "prompt_template": "Sprint plan with epic sequencing for RV fix: {task}",
      "depends_on": ["epics"]
    },
    {
      "name": "dev-epic",
      "role": "arcwright-dev",
      "prompt_template": "Implement epic end-to-end for RV fix: {task}",
      "depends_on": ["sprint-plan"]
    },
    {
      "name": "review-epic",
      "role": "arcwright-review-orchestrator",
      "prompt_template": "3-sub review of epic implementation for: {task}",
      "depends_on": ["dev-epic"]
    },
    {
      "name": "qa-epic",
      "role": "arcwright-qa",
      "prompt_template": "QA for epic: {task}",
      "depends_on": ["review-epic"]
    },
    {
      "name": "final-review",
      "role": "arcwright-review-orchestrator",
      "prompt_template": "Final 3-sub review after all epics for RV fix: {task}",
      "depends_on": ["qa-epic"]
    },
    {
      "name": "final-qa",
      "role": "arcwright-qa",
      "prompt_template": "Full regression QA for RV fix: {task}",
      "depends_on": ["final-review"]
    }
  ]
}
```
