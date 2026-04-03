---
name: "track-rv"
description: "Review track -- audit first, then fix path (SMALL or LARGE) based on finding volume"
---

# Track: RV (Review)

## Purpose

Audit an existing area of the codebase, synthesize findings, then route to the appropriate fix path based on finding volume.

## Workflow Chain

```
Target Definition
  -> Complexity Assessment
  -> Research Phase (optional, 2-3 in-process analysts)
  -> Multi-Lens Review (review agent, review_type: full, 3-sub concurrent)
  -> Findings Synthesis
  -> Sort Artifacts
  -> Volume Gate
  -> [SMALL path] OR [LARGE path]
  -> PTM
```

## Steps

### 1. Target Definition
Ask user for:
- Area: file path, feature name, or module name
- Depth:
  - [A] Targeted -- code quality and correctness only
  - [B] Full -- with plan files, architecture review
  - [C] Custom -- user specifies lens

### 2. Complexity Assessment
- In-process
- Estimate file count and cross-cutting surface area
- Determine if research phase is needed

### 3. Research Phase (optional)
- Trigger if: area has unclear ownership, external dependencies, or >8 files in scope
- Agents: 2-3 analysts, in-process
- Each produces a focused findings brief

### 4. Multi-Lens Review
- Agent: `review agent`
- Deployment: split pane
- review_type: `full`
- 3 concurrent sub-agents:
  - Sub-1 (architect): AR + DRY
  - Sub-2 (ux-designer): UV
  - Sub-3 (security): SR
- All run concurrently against the target area

Completion signal:
```
tmux send-keys -t $SPAWNER_PANE "STEP COMPLETE: REVIEW | result: done | session: $CLAUDE_SESSION_ID" Enter
```

### 5. Findings Synthesis
- In-process
- Consolidate findings from all 3 sub-agents
- Categorize: critical / major / minor / informational
- Count actionable items

### 6. Sort Artifacts
- Write findings to `_bmad-output/features/{feature-slug}/planning/rv-findings-{artifact_id}.md`
- Format: severity table, grouped by sub-agent lens

Artifact naming: all files use `{artifact_id}` suffix.
`{artifact_id}` derivation: `{YYYYMMDD}-{feature-slug}` (e.g. `20260403-auth-refactor`).
Output path: `_bmad-output/features/{feature-slug}/planning/`

| Artifact | Filename pattern |
|---|---|
| RV Findings | `rv-findings-{artifact_id}.md` |
| Synthesis | `rv-synthesis-{artifact_id}.md` |
| SMALL fix brief | `rv-fix-brief-{artifact_id}.md` |
| LARGE epics | standard epic files, tagged `rv-{artifact_id}` |

### 7. Volume Gate

| Condition                                           | Path  |
|-----------------------------------------------------|-------|
| >20 actionable items                                | LARGE |
| Cross-cutting architectural or product gaps found   | LARGE |
| <=20 actionable items, contained scope              | SMALL |
| User override                                       | User choice |

Present gate decision to user with summary before proceeding.

## SMALL Fix Path

```
Quick Dev (split pane) -> Review Gate (3-sub) -> QA Tests (split pane) -> USER APPROVAL -> PTM
```

- Follow track-small steps for dev, review, and QA
- Context: rv-findings doc passed to dev agent

## LARGE Fix Path

```
Epics & Stories (split pane)
  -> IR Check (in-process)
  -> Sprint Plan (split pane)
  -> Per-Epic Dev Loop (see track-large)
  -> Final Review Gate (3-sub)
  -> QA (split pane)
  -> Epic Retro (in-process)
  -> USER APPROVAL
  -> PTM
```

- Follow track-large epic loop for dev execution
- Epics derived from findings synthesis, not from a PRD
- Epic Retro: brief in-process step confirming all critical/major findings are resolved

## PTM
- `/prepare-to-merge` in-process (both paths)
