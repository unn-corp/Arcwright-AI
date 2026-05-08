---
name: "track-small"
description: "Small track workflow -- 2-4 files, quick fix with spec+dev+review+QA"
---

> **Default orchestration:** in-process via [`claude-subagent-protocol`](.agents/skills/claude-subagent-protocol/SKILL.md). tmux split-pane variant is opt-in (see step blocks).

# Track: Small

## Scope

| Criterion     | Threshold                                  |
|---------------|--------------------------------------------|
| Files touched | 2-4                                        |
| Complexity    | Single concern, clear acceptance criteria  |
| Examples      | Bug fix with test, small feature addition  |

## Workflow Chain

```
Quick Spec -> Quick Dev -> Review Gate (3-sub) -> QA Tests -> USER APPROVAL -> PTM
```

## Steps

### 0. Project Context Scan

Load the `project-context` skill (`.agents/skills/project-context/SKILL.md`) and run the full scan inline. This runs before Quick Spec — no planning starts before context is gathered. If existing plan artifacts are found in `_arcwright-output/`, present to user (resume vs. start fresh). Pass the `## Project Context` block to Quick Spec and all subsequent steps as background context.

### 1. Quick Spec

**What this step does:** The quick-flow-solo-dev agent produces a concise task definition and acceptance criteria for the change.
**Inputs:** `$STEP_0_OUTPUT` (project context from step 0)
**Output:** `$STEP_1_OUTPUT` — task definition and acceptance criteria

---

#### Default: In-Process (Agent tool)

```json
{
  "name": "Agent",
  "input": {
    "subagent_type": "arcwright-quick-flow-solo-dev",
    "prompt": "Write a quick spec for the requested change. Output: concise task definition and acceptance criteria.\n\n## Inputs\n{$STEP_0_OUTPUT}\n\n## Output\nSpec written to _arcwright-output/features/{slug}/planning/spec.md",
    "model": "sonnet"
  }
}
```

Capture result into `$STEP_1_OUTPUT`. Pass to step 2.

---

#### tmux Variant (when $TMUX is set and user wants visibility)

Load `.agents/skills/tmux-protocol/SKILL.md` before spawning.

```bash
tmux split-window -h -c "#{pane_current_path}" "claude --dangerously-skip-permissions 'Write a quick spec for the requested change. Output: concise task definition and acceptance criteria. Context: {$STEP_0_OUTPUT}. Write spec.md to _arcwright-output/features/{slug}/planning/'"
```

Completion signal: `AGENT_SIGNAL::TASK_DONE::quick-flow-solo-dev::step-1::done::spec written`

---

#### Kiro CLI Variant — Stage Fragment

```json
{ "name": "spec", "role": "arcwright-quick-flow-solo-dev", "prompt_template": "Write a quick spec for: {task}. Output: task definition + acceptance criteria.", "depends_on": [] }
```

### 2. Quick Dev

**What this step does:** The quick-flow-solo-dev agent implements the change based on the spec, writing code directly to the working tree.
**Inputs:** `$STEP_1_OUTPUT` (spec from step 1)
**Output:** `$STEP_2_OUTPUT` — implementation complete signal

---

#### Default: In-Process (Agent tool)

```json
{
  "name": "Agent",
  "input": {
    "subagent_type": "arcwright-quick-flow-solo-dev",
    "prompt": "Implement the requested change per the spec.\n\n## Inputs\nSee _arcwright-output/features/{slug}/planning/spec.md\n\n## Output\nComplete the code change in the working tree.",
    "model": "sonnet"
  }
}
```

Capture result into `$STEP_2_OUTPUT`. Pass to step 3.

---

#### tmux Variant (when $TMUX is set and user wants visibility)

Load `.agents/skills/tmux-protocol/SKILL.md` before spawning.

```bash
tmux split-window -h -c "#{pane_current_path}" "claude --dangerously-skip-permissions 'Implement the requested change per the spec at _arcwright-output/features/{slug}/planning/spec.md. Context: {$STEP_1_OUTPUT}'"
```

Completion signal: `AGENT_SIGNAL::TASK_DONE::quick-flow-solo-dev::step-2::done::implementation complete`

---

#### Kiro CLI Variant — Stage Fragment

```json
{ "name": "dev", "role": "arcwright-dev", "prompt_template": "Implement per spec: {task}", "depends_on": ["spec"] }
```

### 3. Review Gate

**What this step does:** The review-orchestrator runs 3 concurrent sub-agents — AR+DRY (architect, 1 pass max), UV (ux-designer), and SR (security). Each sub-agent fixes its own findings. If a critical finding persists after 1 pass, escalate to user.
**Inputs:** `$STEP_2_OUTPUT` (implementation from step 2)
**Output:** `$STEP_3_OUTPUT` — collated review result (pass or escalate)

---

#### Default: In-Process (Agent tool)

Issue all three Agent calls in a single assistant message (parallel fan-out):

```json
[
  { "name": "Agent", "input": { "subagent_type": "arcwright-review-orchestrator", "prompt": "Run AR + DRY review. 1 pass max (Small track override). Fix findings inline.\n\n## Inputs\n{$STEP_2_OUTPUT}\n\n## Output\nWrite review-ar-dry.md to _arcwright-output/features/{slug}/review/", "model": "opus" } },
  { "name": "Agent", "input": { "subagent_type": "arcwright-review-orchestrator", "prompt": "Run UV (UX/visual) review. Fix findings inline.\n\n## Inputs\n{$STEP_2_OUTPUT}\n\n## Output\nWrite review-uv.md to _arcwright-output/features/{slug}/review/", "model": "opus" } },
  { "name": "Agent", "input": { "subagent_type": "arcwright-review-orchestrator", "prompt": "Run SR (security) review. Fix findings inline.\n\n## Inputs\n{$STEP_2_OUTPUT}\n\n## Output\nWrite review-sr.md to _arcwright-output/features/{slug}/review/", "model": "opus" } }
]
```

Capture results into `$REVIEW_AR_OUTPUT`, `$REVIEW_UV_OUTPUT`, `$REVIEW_SR_OUTPUT`. Then issue a sequential collation Agent call; capture its result into `$STEP_3_OUTPUT`. Pass to step 4.
AR rule for Small: 1 pass only — overrides the general AR max-3 rule. If critical finding persists: escalate to user, do not loop.

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
{ "name": "review", "role": "arcwright-review-orchestrator", "prompt_template": "3-sub review (AR+DRY, UV, SR) of implementation for: {task}", "depends_on": ["dev"] }
```

### 4. QA Tests

**What this step does:** The QA agent validates the implementation against acceptance criteria from the spec, using playwright-cli for UI testing and assertions for logic.
**Inputs:** `$STEP_3_OUTPUT` (review gate result), `$STEP_1_OUTPUT` (spec for acceptance criteria)
**Output:** `$STEP_4_OUTPUT` — QA pass or fail signal

---

#### Default: In-Process (Agent tool)

```json
{
  "name": "Agent",
  "input": {
    "subagent_type": "arcwright-qa",
    "prompt": "Run QA validation against the acceptance criteria from the spec. Load the `playwright-cli` skill. Primary: drive tests through the UI programmatically. `npx playwright test` with `.spec.ts` files is secondary, only for critical path logic (auth, payments, core data flows).\n\n## Inputs\nSee _arcwright-output/features/{slug}/planning/spec.md for acceptance criteria\nSee _arcwright-output/features/{slug}/review/ for review findings\n\n## Output\nQA result: pass or fail with details.",
    "model": "sonnet"
  }
}
```

Capture result into `$STEP_4_OUTPUT`. Pass to step 5 (USER APPROVAL).

---

#### tmux Variant (when $TMUX is set and user wants visibility)

Load `.agents/skills/tmux-protocol/SKILL.md` before spawning.

```bash
tmux split-window -h -c "#{pane_current_path}" "claude --dangerously-skip-permissions 'Run QA validation for the change. Load playwright-cli skill. Drive tests through UI programmatically. Spec at _arcwright-output/features/{slug}/planning/spec.md. Report pass or fail.'"
```

Completion signal: `AGENT_SIGNAL::TASK_DONE::qa::step-4::done::qa passed`

---

#### Kiro CLI Variant — Stage Fragment

```json
{ "name": "qa", "role": "arcwright-qa", "prompt_template": "QA validation for: {task}. Use playwright-cli for UI, assertions for logic.", "depends_on": ["review"] }
```

### 5. USER APPROVAL

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

### 6. PTM

Run `/prepare-to-merge` in-process.

## Kiro Pipeline

Use the `subagent` tool to run the full track as a Kiro pipeline. Assemble all stage fragments from the steps above into a single `stages` array.

```json
{
  "task": "Run a small-track workflow: spec, dev, 3-sub review, and QA for a 2-4 file change.",
  "stages": [
    {
      "name": "spec",
      "role": "arcwright-quick-flow-solo-dev",
      "prompt_template": "Write a quick spec for: {task}. Output: task definition + acceptance criteria.",
      "depends_on": []
    },
    {
      "name": "dev",
      "role": "arcwright-dev",
      "prompt_template": "Implement per spec: {task}",
      "depends_on": ["spec"]
    },
    {
      "name": "review",
      "role": "arcwright-review-orchestrator",
      "prompt_template": "3-sub review (AR+DRY, UV, SR) of implementation for: {task}",
      "depends_on": ["dev"]
    },
    {
      "name": "qa",
      "role": "arcwright-qa",
      "prompt_template": "QA validation for: {task}. Use playwright-cli for UI, assertions for logic.",
      "depends_on": ["review"]
    }
  ]
}
```
