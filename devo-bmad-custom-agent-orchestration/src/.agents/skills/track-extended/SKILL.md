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

| Sub-step      | Agent           | Output file                        |
|---------------|-----------------|------------------------------------|
| UX Design     | ux-designer     | ux-design.md                       |
| Arch Notes    | architect-agent | architecture-notes.md              |
| Sprint Plan   | pm-agent        | sprint-plan.md                     |

Architecture Notes format (<=2 pages):
- Key tech decisions (<=5 bullets)
- Data model changes
- API contract changes
- Dependencies
- Risk flags

Sprint Plan format: ordered task checklist. NOT epic/story decomposition.

Output path: `_bmad-output/features/{slug}/planning/`

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
Wait for [approve].

### 10. PTM
- `/prepare-to-merge` in-process
