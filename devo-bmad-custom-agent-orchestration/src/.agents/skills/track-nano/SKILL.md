---
name: "track-nano"
description: "Nano track workflow -- 1-2 files, <=20 lines, straight to dev, no spec overhead"
---

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
Quick Dev (split pane) -> DRY+UV Gate (in-process) -> USER APPROVAL -> PTM
```

## Steps

### 1. Quick Dev
- Agent: `bmad-agent-bmm-quick-flow-solo-dev`
- Deployment: split pane, `--dangerously-skip-permissions`
- tmux: `tmux split-window -h`
- Scope check: if changes exceed threshold, agent signals upgrade and halts.

Completion signal (agent sends to spawner):
```
tmux send-keys -t $SPAWNER_PANE "STEP COMPLETE: QD | result: done | session: $CLAUDE_SESSION_ID" Enter
```

### 2. DRY+UV Gate
- Agent: `review agent`, in-process
- review_type: `2-sub-spec`
- Sub-1 (architect): DRY only -- no AR at this scale
- Sub-2 (ux-designer): UV -- auto-pass for pure backend changes
- Each sub-agent fixes its own findings inline

### 3. USER APPROVAL
Present summary block and wait for [approve]:
```
OK DRY+UV gate passed. Ready to merge {branch}.
  Files:  {N} ({lines} lines)
  DRY:    passed
  UV:     passed
[approve] -> /prepare-to-merge
[review]  -> inspect first
```

### 4. PTM
- `/prepare-to-merge` in-process

## Skipped Stages

| Stage        | Reason                               |
|--------------|--------------------------------------|
| AR           | Overhead exceeds value at this scale |
| SR           | Auto-pass                            |
| QA spec file | Inline assertions only               |

Exception: if critical path is touched (auth, payments), add inline assertions and escalate to Small.

## Non-tmux Variant

Mode [1] same-conversation for both Quick Dev and DRY+UV gate steps sequentially.
