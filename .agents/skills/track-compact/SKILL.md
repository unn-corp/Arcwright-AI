---
name: "track-compact"
description: "Compact track workflow -- 4-8 files with optional research, one review cycle"
---

> **Default orchestration:** in-process via [`claude-subagent-protocol`](.agents/skills/claude-subagent-protocol/SKILL.md). tmux split-pane variant is opt-in (see step blocks).

# Track: Compact

## Scope

| Criterion     | Threshold                                      |
|---------------|------------------------------------------------|
| Files touched | 4-8                                            |
| Complexity    | May touch unfamiliar area or external API      |
| Examples      | Feature with new service call, multi-component update |

## Workflow Chain

```
Quick Spec -> [Quick Research?] -> Quick Dev -> Review Gate (3-sub) -> QA Tests -> USER APPROVAL -> PTM
```

## Steps

### 0. Project Context Scan

Load the `project-context` skill (`.agents/skills/project-context/SKILL.md`) and run the full scan inline. This runs before Quick Spec — no planning starts before context is gathered. If existing plan artifacts are found in `_arcwright-output/`, present to user (resume vs. start fresh). Pass the `## Project Context` block to Quick Spec, Research, and all subsequent steps as background context.

### 1. Quick Spec

**What this step does:** The quick-flow-solo-dev agent produces a task definition, acceptance criteria, and a research trigger decision.
**Inputs:** `$STEP_0_OUTPUT` (project context from step 0)
**Output:** `$STEP_1_OUTPUT` — task definition, acceptance criteria, research trigger decision

---

#### Default: In-Process (Agent tool)

```json
{
  "name": "Agent",
  "input": {
    "subagent_type": "arcwright-quick-flow-solo-dev",
    "prompt": "Write a quick spec for the requested change. Include: task definition, acceptance criteria, and a research trigger decision (is research needed for unfamiliar area or external API?).\n\n## Inputs\n{$STEP_0_OUTPUT}\n\n## Output\nSpec written to _arcwright-output/features/{slug}/planning/spec.md",
    "model": "sonnet"
  }
}
```

Capture result into `$STEP_1_OUTPUT`. Pass to step 2.

---

#### tmux Variant (when $TMUX is set and user wants visibility)

Load `.agents/skills/tmux-protocol/SKILL.md` before spawning.

```bash
tmux split-window -h -c "#{pane_current_path}" "claude --dangerously-skip-permissions 'Write a quick spec for the requested change. Include research needs. Context: {$STEP_0_OUTPUT}. Write spec.md to _arcwright-output/features/{slug}/planning/'"
```

Completion signal: `AGENT_SIGNAL::TASK_DONE::quick-flow-solo-dev::step-1::done::spec written`

---

#### Kiro CLI Variant — Stage Fragment

```json
{ "name": "spec", "role": "arcwright-quick-flow-solo-dev", "prompt_template": "Quick spec for: {task}. Include research needs.", "depends_on": [] }
```

### 2. Quick Research (optional)

**What this step does:** An analyst agent produces a concise findings doc when the spec triggers research (unfamiliar area, external API, uncertain data model impact). Skip if the change is self-contained with clear spec output.
**Inputs:** `$STEP_1_OUTPUT` (spec + research trigger decision from step 1)
**Output:** `$STEP_2_OUTPUT` — research findings doc (<=1 page), or skip signal

---

#### Default: In-Process (Agent tool)

Trigger if spec flagged a research need. Skip otherwise.

```json
{
  "name": "Agent",
  "input": {
    "subagent_type": "arcwright-analyst",
    "prompt": "Perform focused codebase research for the change. Produce a concise findings doc (<=1 page) covering relevant patterns, dependencies, and risks.\n\n## Inputs\nSee _arcwright-output/features/{slug}/planning/spec.md\n\n## Output\nWrite research.md to _arcwright-output/features/{slug}/planning/",
    "model": "sonnet"
  }
}
```

Capture result into `$STEP_2_OUTPUT`. Pass to step 3.

---

#### tmux Variant (when $TMUX is set and user wants visibility)

Load `.agents/skills/tmux-protocol/SKILL.md` before spawning.

```bash
tmux split-window -h -c "#{pane_current_path}" "claude --dangerously-skip-permissions 'Codebase research for the change. Produce concise findings doc (<=1 page). Spec at _arcwright-output/features/{slug}/planning/spec.md. Write research.md to _arcwright-output/features/{slug}/planning/'"
```

Completion signal: `AGENT_SIGNAL::TASK_DONE::analyst::step-2::done::research written`

---

#### Kiro CLI Variant — Stage Fragment

```json
{ "name": "research", "role": "arcwright-analyst", "prompt_template": "Codebase research for: {task}", "depends_on": ["spec"] }
```

### 3. Quick Dev

**What this step does:** The quick-flow-solo-dev agent implements the change using the spec and optional research output, writing code directly to the working tree.
**Inputs:** `$STEP_1_OUTPUT` (spec), `$STEP_2_OUTPUT` (research, if run)
**Output:** `$STEP_3_OUTPUT` — implementation complete signal

---

#### Default: In-Process (Agent tool)

```json
{
  "name": "Agent",
  "input": {
    "subagent_type": "arcwright-quick-flow-solo-dev",
    "prompt": "Implement the requested change per the spec and research.\n\n## Inputs\nSee _arcwright-output/features/{slug}/planning/spec.md\nSee _arcwright-output/features/{slug}/planning/research.md (if present)\n\n## Output\nComplete the code change in the working tree.",
    "model": "sonnet"
  }
}
```

Capture result into `$STEP_3_OUTPUT`. Pass to step 4.

---

#### tmux Variant (when $TMUX is set and user wants visibility)

Load `.agents/skills/tmux-protocol/SKILL.md` before spawning.

```bash
tmux split-window -h -c "#{pane_current_path}" "claude --dangerously-skip-permissions 'Implement per spec and research. Spec at _arcwright-output/features/{slug}/planning/spec.md. Research at _arcwright-output/features/{slug}/planning/research.md (if present).'"
```

Completion signal: `AGENT_SIGNAL::TASK_DONE::quick-flow-solo-dev::step-3::done::implementation complete`

---

#### Kiro CLI Variant — Stage Fragment

```json
{ "name": "dev", "role": "arcwright-dev", "prompt_template": "Implement per spec and research: {task}", "depends_on": ["research"] }
```

### 4. Review Gate

**What this step does:** The review-orchestrator runs 3 concurrent sub-agents — AR+DRY (architect), UV (ux-designer), and SR (security). 1 pass per sub-agent (Compact does not use the AR retry loop). Each sub-agent fixes its own findings inline.
**Inputs:** `$STEP_3_OUTPUT` (implementation from step 3)
**Output:** `$STEP_4_OUTPUT` — collated review result (pass or escalate)

---

#### Default: In-Process (Agent tool)

Issue all three Agent calls in a single assistant message (parallel fan-out):

```json
[
  { "name": "Agent", "input": { "subagent_type": "arcwright-review-orchestrator", "prompt": "Run AR + DRY review. 1 pass (Compact track — no retry loop). Fix findings inline.\n\n## Inputs\n{$STEP_3_OUTPUT}\n\n## Output\nWrite review-ar-dry.md to _arcwright-output/features/{slug}/review/", "model": "opus" } },
  { "name": "Agent", "input": { "subagent_type": "arcwright-review-orchestrator", "prompt": "Run UV (UX/visual) review. Fix findings inline.\n\n## Inputs\n{$STEP_3_OUTPUT}\n\n## Output\nWrite review-uv.md to _arcwright-output/features/{slug}/review/", "model": "opus" } },
  { "name": "Agent", "input": { "subagent_type": "arcwright-review-orchestrator", "prompt": "Run SR (security) review. Fix findings inline.\n\n## Inputs\n{$STEP_3_OUTPUT}\n\n## Output\nWrite review-sr.md to _arcwright-output/features/{slug}/review/", "model": "opus" } }
]
```

Capture results into `$REVIEW_AR_OUTPUT`, `$REVIEW_UV_OUTPUT`, `$REVIEW_SR_OUTPUT`. Then issue a sequential collation Agent call; capture its result into `$STEP_4_OUTPUT`. Pass to step 5.

---

#### tmux Variant (when $TMUX is set and user wants visibility)

Load `.agents/skills/tmux-protocol/SKILL.md` before spawning. Spawn three panes; poll for all three completion signals:

```
AGENT_SIGNAL::TASK_DONE::review-orchestrator::review-ar::done::ar-dry review written
AGENT_SIGNAL::TASK_DONE::review-orchestrator::review-uv::done::uv review written
AGENT_SIGNAL::TASK_DONE::review-orchestrator::review-sr::done::sr review written
```

---

#### Kiro CLI Variant — Stage Fragment

```json
{ "name": "review", "role": "arcwright-review-orchestrator", "prompt_template": "3-sub review (AR+DRY, UV, SR) for: {task}", "depends_on": ["dev"] }
```

### 5. QA Tests

**What this step does:** The QA agent validates the implementation against the spec's acceptance criteria using playwright-cli for UI and assertions for logic.
**Inputs:** `$STEP_4_OUTPUT` (review result), `$STEP_1_OUTPUT` (spec for acceptance criteria)
**Output:** `$STEP_5_OUTPUT` — QA pass or fail signal

---

#### Default: In-Process (Agent tool)

```json
{
  "name": "Agent",
  "input": {
    "subagent_type": "arcwright-qa",
    "prompt": "Run QA validation against the acceptance criteria. Load the `playwright-cli` skill. Primary: drive tests through the UI programmatically. `npx playwright test` with `.spec.ts` files is secondary, only for critical path logic (auth, payments, core data flows).\n\n## Inputs\nSee _arcwright-output/features/{slug}/planning/spec.md for acceptance criteria\nSee _arcwright-output/features/{slug}/review/ for review findings\n\n## Output\nQA result: pass or fail with details.",
    "model": "sonnet"
  }
}
```

Capture result into `$STEP_5_OUTPUT`. Pass to step 6 (USER APPROVAL).

---

#### tmux Variant (when $TMUX is set and user wants visibility)

Load `.agents/skills/tmux-protocol/SKILL.md` before spawning.

```bash
tmux split-window -h -c "#{pane_current_path}" "claude --dangerously-skip-permissions 'Run QA validation. Load playwright-cli skill. Drive tests through UI programmatically. Spec at _arcwright-output/features/{slug}/planning/spec.md. Report pass or fail.'"
```

Completion signal: `AGENT_SIGNAL::TASK_DONE::qa::step-5::done::qa passed`

---

#### Kiro CLI Variant — Stage Fragment

```json
{ "name": "qa", "role": "arcwright-qa", "prompt_template": "QA validation for: {task}", "depends_on": ["review"] }
```

### 6. USER APPROVAL

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

### 7. PTM

Run `/prepare-to-merge` in-process.

## Kiro Pipeline

Use the `subagent` tool to run the full track as a Kiro pipeline. Assemble all stage fragments from the steps above into a single `stages` array.

```json
{
  "task": "Run a compact-track workflow: spec, optional research, dev, 3-sub review, and QA for a 4-8 file change.",
  "stages": [
    {
      "name": "spec",
      "role": "arcwright-quick-flow-solo-dev",
      "prompt_template": "Quick spec for: {task}. Include research needs.",
      "depends_on": []
    },
    {
      "name": "research",
      "role": "arcwright-analyst",
      "prompt_template": "Codebase research for: {task}",
      "depends_on": ["spec"]
    },
    {
      "name": "dev",
      "role": "arcwright-dev",
      "prompt_template": "Implement per spec and research: {task}",
      "depends_on": ["research"]
    },
    {
      "name": "review",
      "role": "arcwright-review-orchestrator",
      "prompt_template": "3-sub review (AR+DRY, UV, SR) for: {task}",
      "depends_on": ["dev"]
    },
    {
      "name": "qa",
      "role": "arcwright-qa",
      "prompt_template": "QA validation for: {task}",
      "depends_on": ["review"]
    }
  ]
}
```
