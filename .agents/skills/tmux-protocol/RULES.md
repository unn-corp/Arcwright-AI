---
name: tmux-protocol rules
description: "Quick-ref sidecar for tmux-protocol skill. Load this before any multi-pane work when $TMUX is set."
---

# tmux-protocol — Quick Rules

**Load SKILL.md** when executing multi-pane work. This sidecar is context only.

## Non-Negotiables

1. **Every spawned agent must load this skill first** — include in startup prompt: `"Load .agents/skills/tmux-protocol/SKILL.md immediately."`
2. **Delayed-Enter pattern for all non-trivial messages** — `send-keys "<msg>"` → `sleep 3` → `send-keys "" Enter`
3. **Verify every message delivery** — capture-pane after send, grep for unique token, retry once on miss
4. **Poll every 2 minutes**, not continuously — use md5sum snapshots to detect activity vs. stuck
5. **Cross-pane PEER_SIGNAL before close** — any pane touching shared files must notify peers before shutting down
6. **Report-back before /exit** — `AGENT_SIGNAL::TASK_DONE` to master pane, then `/exit`, then `kill-pane`
7. **Never skip sleeps** — tmux is async; see timing table in SKILL.md

## Sleep Quick-Ref

| Command | Sleep after |
|---|---|
| `split-window` | 8s |
| `send-keys` / `kill-pane` / `select-*` | 6s |
| Type → Enter (delayed pattern) | 3s between type and Enter |
| STATUS_CHECK prompt | 15s before reading response |

## Detect Claude State

- **Idle:** pane buffer ends with `❯`, `>`, or `$`
- **Working:** buffer changes between two snapshots taken 30s apart
- **Stuck:** no change across two 2-minute snapshots → send STATUS_CHECK
