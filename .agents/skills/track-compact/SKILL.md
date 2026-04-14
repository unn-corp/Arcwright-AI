---
name: "track-compact"
description: "Compact track workflow -- 4-8 files with optional research, one review cycle"
---

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

### 1. Quick Spec
- Agent: `arcwright-agent-awm-quick-flow-solo-dev`
- Deployment: in-process
- Output: task definition, acceptance criteria, research trigger decision

### 2. Quick Research (optional)
- Trigger if: unfamiliar codebase area, external API dependency, uncertain data model impact
- Skip if: self-contained change with clear QS output
- Agent: 1 analyst, in-process
- Output: concise findings doc (<=1 page), passed to QD context

### 3. Quick Dev
- Agent: `arcwright-agent-awm-quick-flow-solo-dev`
- Deployment: split pane, `--dangerously-skip-permissions`
- tmux: `tmux split-window -h`
- Context: Quick Spec + research output (if any)

Completion signal:
```
tmux send-keys -t $SPAWNER_PANE "STEP COMPLETE: QD | result: done | session: $CLAUDE_SESSION_ID" Enter
```

### 4. Review Gate
- Agent: `review agent`
- Deployment: split pane
- review_type: `3-sub`
- 3 concurrent sub-agents:
  - Sub-1 (architect): AR + DRY
  - Sub-2 (ux-designer): UV
  - Sub-3 (security): SR
- Each sub-agent fixes its own findings
- 1 pass per sub-agent (Compact does not use AR retry loop)

Completion signal:
```
tmux send-keys -t $SPAWNER_PANE "STEP COMPLETE: REVIEW | result: {pass|escalate} | session: $CLAUDE_SESSION_ID" Enter
```

### 5. QA Tests
- Agent: `qa-agent`
- Deployment: split pane
- Method: Load the `playwright-cli` skill. Primary approach: drive tests through the UI programmatically — navigate, interact, assert. `npx playwright test` with `.spec.ts` files is secondary, only when critical path logic (auth, payments, core data flows) is touched.

Completion signal:
```
tmux send-keys -t $SPAWNER_PANE "STEP COMPLETE: QA | result: {pass|fail} | session: $CLAUDE_SESSION_ID" Enter
```

### 6. USER APPROVAL
Present summary block and wait for explicit `[approve]`:
```
✅ Ready to merge `{branch}`.

Change summary:
  Files: {N}
  DRY: ✅  UV: ✅  SR: ✅
  QA:  ✅ passed

[approve] Proceed to /prepare-to-merge
[review]  I want to check something first
```

Wait for explicit `[approve]` before running PTM. Do NOT auto-proceed.

### 7. PTM
- `/prepare-to-merge` in-process

## Non-tmux Variant

**Claude Code:** Mode [1] same-conversation for Quick Spec and Research. Split pane (single) for Quick Dev — DRY+UV in same conversation after dev completes.

**Kiro CLI:** Use the `subagent` tool to run the pipeline:
```json
{
  "task": "Compact track: [task description]",
  "stages": [
    {
      "name": "spec",
      "role": "arcwright-quick-flow-solo-dev",
      "prompt_template": "Quick spec for: {task}. Include research needs."
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
