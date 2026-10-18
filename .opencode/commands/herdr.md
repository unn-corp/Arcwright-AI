---
description: Herdr terminal workspace reference — sessions, workspaces, tabs, panes, agent spawning, wait-on-status, and the plugin catalog
---

# Herdr Quick Reference

Herdr (herdr.dev) is a terminal workspace manager for AI agents. Hierarchy:
**session → workspace → tab → pane**. Stable IDs like `w1`, `w1:t1`, `w1:p1`.
Config: `~/.config/herdr/config.toml` (reload with `herdr server reload-config`).

## Panes

| Action | Command |
|--------|---------|
| Split right / down | `herdr pane split --direction right\|down [--ratio F]` |
| List panes | `herdr pane list` |
| Focus left/right/up/down | `herdr pane focus --direction left\|right\|up\|down` |
| Resize | `herdr pane resize --direction ... [--amount F]` |
| Zoom | `herdr pane zoom [--toggle]` |
| Rename (title) | `herdr pane rename <id> <label>` |
| Close | `herdr pane close <id>` |

## Sending input and reading output

| Action | Command |
|--------|---------|
| Type text + Enter | `herdr pane run <id> '<cmd>'` |
| Type literal, no Enter | `herdr pane send-text <id> '<text>'` |
| Read recent output | `herdr pane read <id> --source recent --lines 200` |

> **Trap:** `herdr pane run` presses Enter (the `send-keys ... Enter` equivalent).
> `herdr agent send` and `herdr pane send-text` do NOT press Enter.

## Waiting (use instead of polling loops)

| Action | Command |
|--------|---------|
| Wait for agent status | `herdr wait agent-status <id> --status idle\|working\|blocked\|done --timeout MS` |
| Wait for output | `herdr wait output <id> --match TEXT [--regex] --timeout MS` |

## Sessions, workspaces, tabs

| Action | Command |
|--------|---------|
| Launch/attach named session | `herdr --session <name>` |
| List sessions | `herdr session list [--json]` |
| New tab | `herdr tab create [--workspace ID] [--cwd] [--label]` |
| Rename tab | `herdr tab rename <id> <label>` |
| Remote (ssh) | `herdr --remote <ssh-target> [--session name]` |
| Git worktree workspace | `herdr worktree create <branch>` |

## Plugins

| Action | Command |
|--------|---------|
| Install from GitHub | `herdr plugin install <owner>/<repo> [--yes]` |
| Link a local dir (needs server) | `herdr plugin link <path>` |
| List | `herdr plugin list [--json]` |
| Enable / disable | `herdr plugin enable\|disable <plugin_id>` |
| Run a plugin action | `herdr plugin action invoke <id> --plugin <plugin_id>` |

## Agent Orchestration

For in-process agent orchestration, see the `subagent-protocol` skill
(`Agent` tool + `SendMessage` reuse via the Session Agent Registry, the default).
Pane-visibility usage is opt-in; see the `herdr` skill's "Watching agents in
panes" section. To spawn a visible agent:

```bash
herdr agent start <role> --split right -- \
  claude --dangerously-skip-permissions '<task>'
# then, when it needs you:
herdr wait agent-status <role> --status blocked --timeout 600000
herdr pane run <role> '<follow-up>'      # types + Enter
herdr pane close <role>
```

## Inspection

```bash
herdr status                    # client + server status
[ "${HERDR_ENV:-}" = "1" ] && echo "in herdr" || echo "not in herdr"
herdr --default-config          # full commented config reference
```
