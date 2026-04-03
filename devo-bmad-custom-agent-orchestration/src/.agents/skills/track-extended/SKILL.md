---
name: "track-extended"
description: "Extended track workflow -- 10-16 files with PRD, arch notes, 2 review gates, no epic loop"
---

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
  -> PRD (split pane)
  -> UX Design + Arch Notes + Sprint Plan (same split pane, sequential)
  -> Review Gate 1 (3-sub)
  -> Dev (split pane)
  -> Review Gate 2 (3-sub)
  -> QA Tests (split pane)
  -> USER APPROVAL
  -> PTM
```

## Steps

### 1. Quick Spec
- Agent: `bmad-agent-bmm-quick-flow-solo-dev`
- Deployment: in-process

### 2. Research (always 2 agents)
- Agent 1: codebase exploration (in-process)
- Agent 2: domain/technical research (in-process, sequential after Agent 1)
- Output: 2 research reports in `_bmad-output/features/{slug}/planning/`

### 3. PRD
- Agent: `pm-agent`
- Deployment: split pane
- Input: Quick Spec + both research reports
- Output: `_bmad-output/features/{slug}/planning/prd.md`

Completion signal:
```
tmux send-keys -t $SPAWNER_PANE "STEP COMPLETE: PRD | result: done | session: $CLAUDE_SESSION_ID" Enter
```

### 4. UX Design + Architecture Notes + Sprint Plan
- All 3 in ONE split pane session, run sequentially
- Do NOT spawn 3 separate panes for this step
- Agent closes ONLY after all three docs are written

| Sub-step    | Agent           | Output file             |
|-------------|-----------------|-------------------------|
| UX Design   | ux-designer     | ux-design.md            |
| Arch Notes  | architect-agent | architecture-notes.md   |
| Sprint Plan | (same session)  | sprint-plan.md          |

Execution order:
1. Produce UX design doc (invoking `/bmad-bmm-create-ux-design` inline)
2. Produce Architecture Notes (invoking `/bmad-bmm-create-architecture` in brief mode) in the same conversation
3. Run Sprint Planning: 2 parallel in-process sub-agents (backend planner + frontend planner) → synthesise into `sprint-plan.md`
4. Write all three docs to output path before closing

Architecture Notes format (≤2 pages):
- Key tech decisions (≤5 bullets)
- Data model changes
- API contract changes
- Dependencies
- Risk flags

Sprint Plan format: ordered task checklist. NOT epic/story decomposition.

Output path: `_bmad-output/features/{slug}/planning/`
Context passed: PRD + research reports. Handoff: UX doc path, Arch Notes path, Sprint Plan path → Dev agent.

Completion signal:
```
tmux send-keys -t $SPAWNER_PANE "STEP COMPLETE: PLAN | result: done | session: $CLAUDE_SESSION_ID" Enter
```

### 5. Review Gate 1
- Agent: `review agent`
- Deployment: split pane
- review_type: `3-sub`
- Scope: PRD + UX Design + Arch Notes + Sprint Plan
- If critical issues: route back to relevant planning step

### 6. Dev
- Agent: `bmad-agent-bmm-quick-flow-solo-dev`
- Deployment: split pane, `--dangerously-skip-permissions`
- No epic loop: single dev agent for full implementation
- Context: PRD + UX Design + Arch Notes + Sprint Plan + Review Gate 1 findings

Completion signal:
```
tmux send-keys -t $SPAWNER_PANE "STEP COMPLETE: DEV | result: done | session: $CLAUDE_SESSION_ID" Enter
```

### 7. Review Gate 2
- Agent: `review agent`
- Deployment: split pane
- review_type: `3-sub`
- 1 pass only per sub-agent
- If critical: route back to Dev once

### 8. QA Tests
- Agent: `qa-agent`
- Deployment: split pane
- Method: Playwright `.spec.ts` via `npx playwright test`

### 9. USER APPROVAL
Present summary and wait for explicit `[approve]`:
```
✅ All review gates passed. Ready to merge `{branch}`.

Planning summary:
  PRD: ✅ written
  UX: ✅ written
  Arch Notes: ✅ written
  Sprint Plan: ✅ written
  AR+DRY: ✅ passed
  UV:     ✅ passed
  SR:     ✅ passed
  QA:     ✅ {N} tests passing

[approve] Proceed to /prepare-to-merge
[review]  I want to check something first
```

Do NOT auto-proceed.

### 10. PTM
- `/prepare-to-merge` in-process

## QA Enforcement

Load the `playwright-cli` skill. Primary approach: drive tests through the UI programmatically — open the app, navigate to the feature, interact with it as a real user would, verify behaviour via snapshots and assertions. Prioritize UI interaction testing over writing test files.

`npx playwright test` (`.spec.ts` files) is secondary — use for regression suites or when programmatic UI testing is insufficient for the scenario.
