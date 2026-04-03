---
name: "track-small"
description: "Small track workflow -- 2-4 files, quick fix with spec+dev+review+QA"
---

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

### 1. Quick Spec
- Agent: `bmad-agent-bmm-quick-flow-solo-dev`
- Deployment: in-process (or split pane if user requests visibility)
- Output: concise task definition, acceptance criteria

### 2. Quick Dev
- Agent: `bmad-agent-bmm-quick-flow-solo-dev`
- Deployment: split pane, `--dangerously-skip-permissions`
- tmux: `tmux split-window -h`
- Context: Quick Spec output

Completion signal:
```
tmux send-keys -t $SPAWNER_PANE "STEP COMPLETE: QD | result: done | session: $CLAUDE_SESSION_ID" Enter
```

### 3. Review Gate
- Agent: `review agent`
- Deployment: split pane
- review_type: `3-sub`
- 3 concurrent sub-agents:
  - Sub-1 (architect): AR + DRY -- **1 pass max** (Small override, no retry loop)
  - Sub-2 (ux-designer): UV
  - Sub-3 (security): SR
- Each sub-agent fixes its own findings
- If critical finding persists after 1 pass: escalate to user, do not loop

AR rule for Small: 1 pass only. Overrides general AR max-3 rule.

Completion signal:
```
tmux send-keys -t $SPAWNER_PANE "STEP COMPLETE: REVIEW | result: {pass|escalate} | session: $CLAUDE_SESSION_ID" Enter
```

### 4. QA Tests
- Agent: `qa-agent`
- Deployment: split pane
- Method: Playwright `.spec.ts` via `npx playwright test`
- Scope: acceptance criteria from Quick Spec

Completion signal:
```
tmux send-keys -t $SPAWNER_PANE "STEP COMPLETE: QA | result: {pass|fail} | session: $CLAUDE_SESSION_ID" Enter
```

### 5. USER APPROVAL
Wait for [approve] before PTM.

### 6. PTM
- `/prepare-to-merge` in-process

## Non-tmux Variant

Mode [1] sequential steps in same conversation.
Mode [2] command blocks for dev and QA steps.
