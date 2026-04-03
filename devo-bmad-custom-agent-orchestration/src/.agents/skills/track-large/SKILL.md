---
name: "track-large"
description: "Large track workflow -- 12+ files, full planning pipeline with epic loop, parallel research, and final gates"
---

# Track: Large

## Scope

| Criterion     | Threshold                                              |
|---------------|--------------------------------------------------------|
| Files touched | 12+                                                    |
| Complexity    | Multi-epic feature, new subsystem, significant product change |
| Examples      | Full feature area, platform capability, major refactor |

## Workflow Chain

```
Product Brief (split pane)
  -> Research x3 parallel (in-process)
  -> PRD (split pane)
  -> Planning Gate (2-sub-spec)
  -> [UX Design + Architecture Doc] (2 parallel split panes)
  -> Design Gate (2-sub-spec)
  -> Epics & Stories (split pane)
  -> IR Check (in-process)
  -> Sprint Plan (split pane)
  -> USER APPROVAL
  -> [Per-Epic Loop]
  -> Final Review Gate (3-sub)
  -> Final QA (split pane)
  -> USER APPROVAL
  -> PTM
```

## Planning Phase

### 1. Product Brief
- Deployment: split pane
- Output: `_bmad-output/features/{slug}/planning/product-brief.md`

### 2. Research x3 (parallel, in-process)
- Agent 1: codebase exploration
- Agent 2: domain/technical feasibility
- Agent 3: UX patterns / competitive reference
- All 3 run in-process concurrently

### 3. PRD
- Deployment: split pane
- Input: Product Brief + all 3 research reports
- Output: `_bmad-output/features/{slug}/planning/prd.md`

### 4. Planning Gate
- review_type: `2-sub-spec`
- Sub-1 (architect): spec completeness, feasibility
- Sub-2 (pm): scope, acceptance criteria coverage

### 5. UX Design + Architecture Doc (parallel)
- Spawn 2 split panes simultaneously after Planning Gate passes
- Pane A: `ux-designer-agent` -> `ux-design.md`
- Pane B: `architect-agent` -> `architecture.md`
- Both must complete before Design Gate

### 6. Design Gate
- review_type: `2-sub-spec`
- Sub-1: UX Design review
- Sub-2: Architecture review

### 7. Epics & Stories
- Deployment: split pane
- MANDATORY context: product-brief.md, prd.md, all 3 research reports, ux-design.md, architecture.md, design-gate findings
- Output: epic and story files in `_bmad-output/features/{slug}/`

### 8. IR Check (in-process)
- Validate story files for completeness before sprint planning

### 9. Sprint Plan
- Deployment: split pane
- Output: ordered sprint plan with epic sequencing

### 10. USER APPROVAL
Wait for [approve] before entering epic loop.

## Per-Epic Loop

Repeat for each epic in sequence:

```
Create Story -> Dev Story (split pane) -> Review Gate (3-sub) -> QA Sub-agent (split pane)
```

### Loop Step A: Create Story
- 3-4 researcher agents, 2 docs each
- Deployment: split pane
- Gather all context the dev agent will need

### Loop Step B: Dev Story
- New dedicated dev agent per story (not per epic)
- Deployment: split pane, `--dangerously-skip-permissions`
- Context: story file + research context + ux-design.md (if UI story)
- Pass ONLY what the story needs -- no full planning dump

**VERTICAL PLANNING RULE:**
Each dev agent owns one full epic end-to-end (frontend + backend + tests).
Do NOT split an epic into separate frontend/backend agents.
New dev agent only for the NEXT epic.

Completion signal:
```
tmux send-keys -t $SPAWNER_PANE "STEP COMPLETE: DEV:{epic_id} | result: done | session: $CLAUDE_SESSION_ID" Enter
```

### Loop Step C: Review Gate
- review_type: `3-sub`, 3 concurrent sub-agents
- Sub-1 (architect): AR + DRY, up to 3 AR iterations
- Sub-2 (ux-designer): UV
- Sub-3 (security): SR
- Auto-escalate via [CC] if 3 AR passes fail

### Loop Step D: QA Sub-agent
- Auto-spawned on story-done signal
- Playwright `.spec.ts` via `npx playwright test`
- Pass -> next story in epic
- Fail -> back to Dev Story for this story

## Final Phase

### Final Review Gate
- review_type: `3-sub`
- Full codebase review after all epics complete

### Final QA
- Full regression run across all new `.spec.ts` files

### USER APPROVAL + PTM
- Wait for [approve], then `/prepare-to-merge` in-process
