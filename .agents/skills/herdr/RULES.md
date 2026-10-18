---
name: "herdr rules"
description: "Quick-ref for Herdr workspace mechanics and the opt-in 'watching agents in panes' section."
---

# Herdr — Quick Rules

**Load SKILL.md** when you need full Herdr command coverage. This sidecar is
context-only.

## Non-Negotiables

1. **Default orchestration is in-process.** Use the `subagent-protocol` skill
   (the current host's task tools and lifecycle). Herdr is a workspace mechanics reference, not a
   spawn method for Arcwright work.
2. **Pane-based agent visibility is opt-in.** Only follow the "Watching agents in
   panes (opt-in)" section if the user explicitly requested visible panes AND
   `$HERDR_ENV` is set.
3. **`herdr pane run` presses Enter; `herdr agent send` does NOT.** Port every tmux
   `send-keys ... Enter` to `herdr pane run <id> '<cmd>'`. `agent send` and
   `pane send-text` write literal text with no submit.
4. **Never poll pane output in a loop.** Use `herdr wait agent-status <pane> --status
   done` or `herdr wait output <pane> --match TEXT`. No AGENT_SIGNAL, no grep loops.
5. **Inherit the selected model and permissions.** Include a small capability brief
   and finder; follow actual host delegation and T3 review-round semantics.
6. **Remote-control plugins are opt-in and dangerous.** collie and herdr-push type
   keystrokes into live panes from a phone. Never a default. Set `COLLIE_TRUSTED_USER`,
   never `tailscale funnel`.

## Most-Used Commands

| Action | Command |
|--------|---------|
| Split right | `herdr pane split --direction right` |
| List panes | `herdr pane list` |
| Send text + Enter | `herdr pane run <id> '<cmd>'` |
| Read pane output | `herdr pane read <id> --source recent` |
| Wait on agent | `herdr wait agent-status <id> --status done --timeout 600000` |
| Spawn visible agent | `herdr agent start <role> --split right -- <argv>` |
| Close pane | `herdr pane close <id>` |
| Reload config | `herdr server reload-config` |

## Pane Visibility Decision

```
Need to run an agent?
  ├─ User explicitly requested visible panes AND $HERDR_ENV is set?
  │    └─ YES → herdr agent start (opt-in section of SKILL.md), agent still
  │            uses subagent-protocol internally
  └─ Otherwise → supported host task tools (subagent-protocol)
```
