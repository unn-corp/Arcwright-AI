---
name: "track-nano"
description: "Nano track workflow -- 1-2 files, <=20 lines, straight to dev, no spec overhead"
---

> **Default orchestration:** in-process via [`claude-subagent-protocol`](.agents/skills/claude-subagent-protocol/SKILL.md). tmux split-pane variant is opt-in (see step blocks).

# Track: Nano

## Scope

| Criterion       | Threshold                          |
|-----------------|------------------------------------|
| Files touched   | 1-2                                |
| Lines changed   | <=20                               |
| New imports     | None                               |
| Undo complexity | One-commit revert                  |
| Examples        | Typo fix, label change, single CSS tweak |

If scope exceeds 20 lines OR requires new imports during dev -> upgrade to Small.

## Workflow Chain

```
Quick Dev -> DRY+UV Gate (in-process) -> USER APPROVAL -> PTM
```

## Steps

### 0. Project Context Scan

Load the `project-context` skill (`.agents/skills/project-context/SKILL.md`) and run the full scan inline. This runs before Quick Dev — no code is written before context is gathered. If existing plan artifacts are found in `_arcwright-output/`, present to user (resume vs. start fresh). Pass the `## Project Context` block to the Quick Dev agent as background context.

### 1. Quick Dev

**What this step does:** The quick-flow-solo-dev agent implements the targeted change (1-2 files, <=20 lines). Signals upgrade to track-small if scope is exceeded.
**Inputs:** `$STEP_0_OUTPUT` (project context block from step 0)
**Output:** `$STEP_1_OUTPUT` — implementation complete signal or scope-exceeded escalation

---

#### Default: In-Process (Agent tool)

```json
{
  "name": "Agent",
  "input": {
    "subagent_type": "arcwright-quick-flow-solo-dev",
    "prompt": "Implement the requested change. Scope: 1-2 files, <=20 lines, no new imports. If scope exceeds threshold, halt and signal upgrade to track-small.\n\n## Inputs\n{$STEP_0_OUTPUT}\n\n## Output\nComplete the code change in the working tree.",
    "model": "sonnet"
  }
}
```

Capture result into `$STEP_1_OUTPUT`. Pass to step 2.
On scope-exceeds-threshold signal: halt and recommend upgrade to track-small.

---

#### tmux Variant (when $TMUX is set and user wants visibility)

Load `.agents/skills/tmux-protocol/SKILL.md` before spawning.

```bash
tmux split-window -h -c "#{pane_current_path}" "claude --dangerously-skip-permissions 'Implement the requested change. Scope: 1-2 files, <=20 lines, no new imports. If scope exceeds threshold, halt and signal upgrade to track-small. Context: {$STEP_0_OUTPUT}'"
```

Completion signal: `AGENT_SIGNAL::TASK_DONE::quick-flow-solo-dev::step-1::done::implementation complete`

---

#### Kiro CLI Variant — Stage Fragment

```json
{ "name": "dev", "role": "arcwright-quick-flow-solo-dev", "prompt_template": "Implement: {task}. Scope: 1-2 files, <=20 lines. If scope exceeds, signal upgrade to track-small.", "depends_on": [] }
```

### 2. DRY+UV Gate

**What this step does:** The review-orchestrator runs a 2-sub review — DRY only (no AR at nano scale) and UV (auto-pass for pure backend changes). Each sub-agent fixes its own findings inline.
**Inputs:** `$STEP_1_OUTPUT` (implementation from step 1)
**Output:** `$STEP_2_OUTPUT` — gate pass or escalation signal

---

#### Default: In-Process (Agent tool)

```json
{
  "name": "Agent",
  "input": {
    "subagent_type": "arcwright-review-orchestrator",
    "prompt": "Run a 2-sub DRY+UV review gate. Sub-1: DRY only (no AR at nano scale). Sub-2: UV — auto-pass for pure backend changes. Each sub-agent fixes its own findings inline.\n\n## Inputs\n{$STEP_1_OUTPUT}\n\n## Output\nGate result: pass or escalation summary.",
    "model": "opus"
  }
}
```

Capture result into `$STEP_2_OUTPUT`. Pass to step 3 (USER APPROVAL).

---

#### tmux Variant (when $TMUX is set and user wants visibility)

Load `.agents/skills/tmux-protocol/SKILL.md` before spawning.

```bash
tmux split-window -h -c "#{pane_current_path}" "claude --dangerously-skip-permissions 'Run 2-sub DRY+UV review. DRY only (no AR at nano scale). UV auto-pass for pure backend. Fix findings inline. Context: {$STEP_1_OUTPUT}'"
```

Completion signal: `AGENT_SIGNAL::TASK_DONE::review-orchestrator::step-2::done::dry-uv gate passed`

---

#### Kiro CLI Variant — Stage Fragment

```json
{ "name": "dry-uv-gate", "role": "arcwright-review-orchestrator", "prompt_template": "DRY+UV review of changes for: {task}. DRY only (no AR at nano scale). UV auto-pass for pure backend.", "depends_on": ["dev"] }
```

### 3. USER APPROVAL

Present summary block and wait for `[approve]`:

```
DRY+UV gate passed. Ready to merge `{branch}`.

Change summary:
  Files: {N} ({lines} lines changed)
  DRY: passed
  UV:  passed

[approve] Proceed to /prepare-to-merge
[review]  I want to check something first
```

Wait for explicit `[approve]` before running PTM. Do NOT auto-proceed.

### 4. PTM

Run `/prepare-to-merge` in-process.

## Skipped Stages

| Stage        | Reason                               |
|--------------|--------------------------------------|
| AR           | Overhead exceeds value at this scale |
| SR           | Auto-pass                            |
| QA spec file | Inline assertions only               |

Exception: if critical path is touched (auth, payments), add inline assertions and escalate to Small.

## QA Note

Load the `playwright-cli` skill if any UI is touched. Verify the change works through the UI programmatically — navigate to the affected element and assert the expected behaviour. No `.spec.ts` file required unless the change touches critical path logic (auth, payments, core data flows).

## Kiro Pipeline

Use the `subagent` tool to run the full track as a Kiro pipeline. Assemble all stage fragments from the steps above into a single `stages` array.

```json
{
  "task": "Run a nano-track workflow: quick dev and DRY+UV gate for a small targeted change.",
  "stages": [
    {
      "name": "dev",
      "role": "arcwright-quick-flow-solo-dev",
      "prompt_template": "Implement: {task}. Scope: 1-2 files, <=20 lines. If scope exceeds, signal upgrade to track-small.",
      "depends_on": []
    },
    {
      "name": "dry-uv-gate",
      "role": "arcwright-review-orchestrator",
      "prompt_template": "DRY+UV review of changes for: {task}. DRY only (no AR at nano scale). UV auto-pass for pure backend.",
      "depends_on": ["dev"]
    }
  ]
}
```
