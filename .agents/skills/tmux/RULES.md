---
name: "tmux rules"
description: "Quick-ref for tmux pane mechanics and the opt-in 'watching agents in panes' section."
---

# tmux — Quick Rules

**Load SKILL.md** when you need full tmux command coverage. This sidecar is
context-only.

## Non-Negotiables

1. **Default orchestration is in-process.** Use the `claude-subagent-protocol` skill
   (Agent tool + SendMessage reuse). tmux is a pane mechanics reference, not a
   spawn method.
2. **Pane-based agent visibility is opt-in.** Only follow the "Watching agents in
   panes (opt-in)" section if the user said "spawn" / "watch" / "open agent" AND
   `$TMUX` is set.
3. **`send-keys` is fire-and-forget.** Always append `Enter` (or follow up with a
   separate `send-keys "" Enter`); the typed text doesn't submit without it.
4. **No legacy signals.** AGENT_SIGNAL, PEER_SIGNAL, STATUS_CHECK, $SPAWNER_PANE,
   `session-state.md` pane tables, and `tmux-protocol/` are all retired. Do not
   reintroduce them in pane-visible flows either.
5. **Sonnet-first, even for pane-visible agents.** The pane is just a viewing
   surface — the spawned agent still defaults to `sonnet` and must ask the user
   before any `opus` or effort escalation.

## Most-Used Commands

| Action | Command |
|--------|---------|
| Vertical split | `tmux split-window -h` |
| Horizontal split | `tmux split-window -v` |
| List panes with IDs | `tmux list-panes -a -F "#{pane_id} #{pane_title}"` |
| Send text + Enter | `tmux send-keys -t %<id> "text" Enter` |
| Kill pane | `tmux kill-pane -t %<id>` |
| Rebalance to tiled | `tmux select-layout tiled` |

## Pane Visibility Decision

```
Need to run an agent?
  ├─ User asked to "watch" / "spawn" / "open agent" AND $TMUX is set?
  │    └─ YES → spawn pane (opt-in section of SKILL.md), agent still uses
  │            claude-subagent-protocol internally
  └─ Otherwise → in-process Agent tool + SendMessage (claude-subagent-protocol)
```
