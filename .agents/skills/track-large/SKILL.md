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
- Output: `_arcwright-output/features/{slug}/planning/product-brief.md`

### 2. Research x3 (parallel, in-process)
- Agent 1: codebase exploration
- Agent 2: domain/technical feasibility
- Agent 3: UX patterns / competitive reference
- All 3 run in-process concurrently

### 3. PRD
- Deployment: split pane
- Input: Product Brief + all 3 research reports
- Output: `_arcwright-output/features/{slug}/planning/prd.md`

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
- Output: epic and story files in `_arcwright-output/features/{slug}/`

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
- Context scoping rule: story file + directly referenced docs only. Do NOT dump the entire planning folder into context.

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
- Auto-escalate via [CC] if 3 AR passes fail — do NOT loop indefinitely

### Loop Step D: QA Sub-agent
- Auto-spawned on story-done signal
- Method: Load the `playwright-cli` skill. Primary approach: drive tests through the UI programmatically. `npx playwright test` with `.spec.ts` files is secondary, only for critical path logic.
- Pass -> next story in epic
- Fail -> back to Dev Story for this story

## Final Phase

### Final Review Gate
- review_type: `3-sub`
- Full codebase review after all epics complete

### Final QA
- Full regression run: load `playwright-cli` skill, drive full UI regression programmatically across all new features. Supplement with `npx playwright test` for any `.spec.ts` files covering critical path logic.

### USER APPROVAL + PTM
Present summary block and wait for explicit `[approve]`:
```
✅ Ready to merge `{branch}`.

Change summary:
  Epics completed: {N}
  DRY: ✅  UV: ✅  SR: ✅
  QA:  ✅ passed (full regression)

[approve] Proceed to /prepare-to-merge
[review]  I want to check something first
```

Wait for explicit `[approve]` before running PTM. Do NOT auto-proceed.
- Then `/prepare-to-merge` in-process.

## Non-tmux Variant

**Claude Code:** Mode [1] sequential for all planning. Epic loop uses Agent tool for dev/review/QA per story.

**Kiro CLI:** Use the `subagent` tool. Break into two pipeline invocations:

**Pipeline 1 — Planning:**
```json
{
  "task": "Large track planning: [task description]",
  "stages": [
    {
      "name": "brief",
      "role": "arcwright-pm",
      "prompt_template": "Write product brief for: {task}"
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
      "name": "ux",
      "role": "arcwright-ux-designer",
      "prompt_template": "UX design for: {task}",
      "depends_on": ["prd"]
    },
    {
      "name": "arch",
      "role": "arcwright-architect",
      "prompt_template": "Architecture doc for: {task}",
      "depends_on": ["prd"]
    },
    {
      "name": "epics",
      "role": "arcwright-pm",
      "prompt_template": "Epics and stories for: {task}",
      "depends_on": ["ux", "arch"]
    }
  ]
}
```

**Pipeline 2 — Per-epic dev loop** (run once per epic, sequentially):
```json
{
  "task": "Epic N: [epic description]",
  "stages": [
    {
      "name": "dev",
      "role": "arcwright-dev",
      "prompt_template": "Implement epic: {task}. One dev owns full epic (frontend+backend+tests)."
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
      "prompt_template": "QA for epic: {task}",
      "depends_on": ["review"]
    }
  ]
}
```

After all epics, run a final review + QA pipeline before USER APPROVAL.