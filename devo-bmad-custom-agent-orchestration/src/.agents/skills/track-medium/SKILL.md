---
name: "track-medium"
description: "Medium track workflow -- 6-12 files with full spec, UX design, 2 review gates, QA"
---

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
  -> UX Design (split pane)
  -> Review Gate 1 (3-sub: spec + UX review)
  -> Quick Dev (split pane)
  -> Final Review Gate (3-sub)
  -> QA Tests (split pane)
  -> USER APPROVAL
  -> PTM
```

## Steps

### 1. Quick Spec
- Agent: `bmad-agent-bmm-quick-flow-solo-dev`
- Deployment: in-process
- Output: full task definition, acceptance criteria, research needs

### 2. Research
- Agents: 1-2 analysts, in-process
- If 1 agent: codebase exploration
- If 2 agents: codebase + domain/technical (sequential, not parallel at this scale)
- HALT condition: if research reveals infeasibility, stop and present to user before continuing

### 3. UX Design
- Agent: `ux-designer-agent`
- Deployment: split pane
- Input: Quick Spec + research output
- Output: wireframes/flow description, component decisions

Completion signal:
```
tmux send-keys -t $SPAWNER_PANE "STEP COMPLETE: UX | result: done | session: $CLAUDE_SESSION_ID" Enter
```

### 4. Review Gate 1
- Agent: `review agent`
- Deployment: split pane
- review_type: `3-sub`
- Scope: Quick Spec + UX Design (pre-dev review)
- Sub-1 (architect): spec completeness, DRY concerns
- Sub-2 (ux-designer): UV on UX Design
- Sub-3 (security): SR on proposed approach
- If critical spec issues found: route back to Quick Spec, do not proceed to dev

### 5. Quick Dev
- Agent: `bmad-agent-bmm-quick-flow-solo-dev`
- Deployment: split pane, `--dangerously-skip-permissions`
- Context: Quick Spec + UX Design + Review Gate 1 findings
- No epic loop: single dev agent for full implementation

Completion signal:
```
tmux send-keys -t $SPAWNER_PANE "STEP COMPLETE: QD | result: done | session: $CLAUDE_SESSION_ID" Enter
```

### 6. Final Review Gate
- Agent: `review agent`
- Deployment: split pane
- review_type: `3-sub`
- **1 pass per sub-agent — max-3 general AR loop does NOT apply to Final Review Gate**
- If critical finding: route back to Quick Dev once

### 7. QA Tests
- Agent: `qa-agent`
- Deployment: split pane
- Method: Playwright `.spec.ts` via `npx playwright test`

### 8. USER APPROVAL
Present summary and wait for explicit `[approve]`:
```
✅ Final gate + QA passed. Ready to merge `{branch}`.

  AR+DRY: ✅ passed
  UV:     ✅ passed
  SR:     ✅ passed
  QA:     ✅ {N} tests passing

[approve] Proceed to /prepare-to-merge
[review]  I want to check something first
```

Do NOT auto-proceed.

### 9. PTM
- `/prepare-to-merge` in-process

## QA Enforcement

Load the `playwright-cli` skill. Primary approach: drive tests through the UI programmatically — open the app, navigate to the feature, interact with it as a real user would, verify behaviour via snapshots and assertions. Prioritize UI interaction testing over writing test files.

`npx playwright test` (`.spec.ts` files) is secondary — use for regression suites or when programmatic UI testing is insufficient for the scenario.

## Non-tmux Variant

Mode [1] sequential for all planning steps.
Single split pane for UX Design, then same pane reused for Quick Dev.
