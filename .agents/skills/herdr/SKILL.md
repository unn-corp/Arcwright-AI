---
name: "herdr"
description: "Herdr terminal workspace reference for AI agents — sessions, workspaces, tabs, panes, agent spawning, wait-on-status, the socket API, and the plugin catalog. Includes one optional section on watching in-process agents in panes."
allowed-tools: Bash, Read
---

# Herdr — Terminal Workspace Reference

> **Scope:** This skill is a Herdr **mechanics** reference. It does NOT prescribe how to
> spawn agents for Arcwright work, that is the `subagent-protocol` skill
> (current host task tools and lifecycle), which governs authorized orchestration.
>
> The one optional section at the end, **"Watching agents in panes (opt-in)"**, is the
> only place this skill describes pane-based agent visibility. Load it only if you have
> an explicit reason to spawn agents in split panes. Most users do not need it.

Herdr is a terminal workspace manager built for AI coding agents (herdr.dev). It runs a
persistent headless server plus attachable clients, controlled through a Unix socket API
and the `herdr` CLI. It detects agent state (idle / working / blocked / done) and rolls it
up into a sidebar. Config lives in `~/.config/herdr/config.toml`.

## 1. Hierarchy and IDs

Herdr has one more level than tmux: **session → workspace → tab → pane**. A workspace is a
project or repo; a tab is a layout within it. Stable short IDs: `w1`, `w1:t1`, `w1:p1`.

## 2. tmux → herdr mapping

| tmux | herdr |
|------|-------|
| `tmux new -As foo` / `attach -t foo` | `herdr --session foo` / `herdr session attach foo` |
| `tmux ls` | `herdr session list [--json]` |
| `new-window` | `herdr tab create [--workspace ID] [--cwd] [--label]` |
| `rename-window` | `herdr tab rename <id> <label>` |
| `split-window -h` / `-v` | `herdr pane split --direction right\|down [--ratio F] [--cwd]` |
| `send-keys 'cmd' Enter` | `herdr pane run <id> '<cmd>'` (text + Enter) |
| send text, no Enter | `herdr pane send-text <id> '<text>'` / `herdr agent send` |
| `capture-pane -p` | `herdr pane read <id> [--source visible\|recent] [--lines N]` |
| `select-pane -L/R/U/D` | `herdr pane focus --direction left\|right\|up\|down` |
| `resize-pane` | `herdr pane resize --direction ... [--amount F]` |
| `resize-pane -Z` | `herdr pane zoom [--toggle]` |
| `kill-pane` / `kill-window` | `herdr pane close <id>` / `herdr tab close <id>` |
| `select-pane -T` | `herdr pane rename <id> <label>` |
| `list-panes` / `list-windows` | `herdr pane list` / `herdr tab list` |
| `wait-for` / polling loops | `herdr wait output <pane> --match TEXT [--regex] [--timeout MS]` and `herdr wait agent-status <pane> --status idle\|working\|blocked\|done [--timeout MS]` |
| `display-message` popup | `herdr notification show <title> [--body] [--sound none\|done\|request]` |
| ssh + tmux attach | `herdr --remote <ssh-target> [--session name]` |
| `.tmux.conf` | `~/.config/herdr/config.toml`; reload: `herdr server reload-config` |
| control mode (`tmux -C`) | Unix socket API (the CLI is a client of it) |
| agent spawn wrapper script | `herdr agent start <name> [--split right] -- <argv...>` (first-class) |
| `$TMUX` opt-in gate | `$HERDR_ENV` (set to `1` inside herdr panes) |

**Gaps vs tmux:** no status-bar scripting or widgets (Herdr has a sidebar instead), no
`synchronize-panes` broadcast, no copy-mode scripting, no config hooks (events exist only
via plugin manifests).

## 3. The send/run trap (read this)

`herdr pane run <id> '<cmd>'` types the command AND presses Enter, the equivalent of
`send-keys ... Enter`. `herdr agent send` and `herdr pane send-text` write literal text
**without** Enter. When porting any tmux `send-keys ... Enter` call, use `herdr pane run`,
not `herdr agent send`.

## 4. Waiting on agents (better than tmux)

Do NOT poll pane output in a loop. Herdr blocks for you:

```bash
# Wait until a pane's agent reports done (or blocked), up to 10 minutes
herdr wait agent-status w1:p2 --status done --timeout 600000

# Wait for specific output to appear
herdr wait output w1:p2 --match "Tests passed" --timeout 120000
```

## 5. Reading and driving a pane

```bash
herdr pane read w1:p2 --source recent --lines 200   # capture recent output
herdr pane run  w1:p2 'npm test'                     # type + Enter
herdr pane focus --direction right                   # move focus
herdr pane close w1:p2                               # kill the pane
```

## 6. Sessions, workspaces, worktrees

```bash
herdr --session work                # launch or attach a named session
herdr session list --json
herdr workspace create --cwd ~/proj --label proj
herdr worktree create <branch>      # git worktree bound to a workspace (no tmux analog)
```

## 7. The plugin catalog

Plugins are GitHub repos with a `herdr-plugin.toml` manifest. Install:

```bash
herdr plugin install <owner>/<repo> [--ref REF] [--yes]   # clones + builds + registers
herdr plugin link <path>                                   # register a local dir (needs the server running)
herdr plugin list [--json]
herdr plugin enable|disable <plugin_id>
herdr plugin action list|invoke
```

`herdr plugin install` works without a running server; `herdr plugin link` requires the
server socket.

**Arcwright default plugins** (installed by the installer when herdr is detected):

| Plugin | What it does |
|--------|--------------|
| `persiyanov/herdr-reviewr` | Review an agent's diff in a sidebar, send line comments back into the agent. Prebuilt binary, read-only by construction. |
| `smarzban/herdr-file-viewer` | Git-aware read-only file/diff viewer beside an agent. Hardened for untrusted repos. |
| `JanTvrdik/herdr-command-palette` | fzf palette over every plugin action. Needs `fzf` + `jq`. |
| `lmilojevicc/herdr-tab-rename` | Auto-names tabs from the focused pane's cwd. Zero config; honors manual renames. |
| `x0d7x/herdr-fzf-url` | Grab URLs out of pane output via fzf. Needs Go to build. |

**Personal-only plugins** (NOT defaults, install deliberately):

- `AltanS/collie` and `dcolinmorgan/herdr-push` are **remote control of your machine by
  design** (one bridge call types keystrokes into a live pane). collie is tailnet-only via
  Tailscale (safer); herdr-push uses a public Cloudflare tunnel. Never `tailscale funnel`
  collie. Set `COLLIE_TRUSTED_USER` before activating. Full setup guide:
  `docs/herdr-collie-tailscale-pwa.md`.
- `andrewchng/herdr-sessionizer` is macOS-only today.
- `lmilojevicc/herdr-splits.nvim` is for Neovim users.
- `wyattjoh/herdr-plugin-renamer` conflicts with `herdr-tab-rename` (both rename tabs) and
  needs Apple Intelligence or codex to work well.

## 8. Inspection

```bash
herdr status                          # client + server status
herdr plugin list                     # installed plugins
[ "${HERDR_ENV:-}" = "1" ] && echo "in herdr" || echo "not in herdr"
herdr --default-config                # full commented config reference
```

## 9. Arcwright runtime defaults

Run `arcwright herdr` to install or repair the managed Herdr standard. It enables native
Claude/Codex conversation restoration, profile-aware Claude resume, unrestricted agent launch
flags, and MIME-aware `Ctrl+V` for text and images.

New tabs and panes inherit their space directory:

```toml
[terminal]
new_cwd = "follow"

[ui]
agent_panel_sort = "spaces"
```

Create a space with its default directory using `herdr workspace create --cwd /path/to/project`.
Herdr 0.7.1 groups the agent panel by space but cannot filter out inactive-space agents.

## 10. Troubleshooting: a `type=shell` keybind fires but does nothing

Symptom: `Ctrl+V` MIME paste (or any custom `type=shell` keybind that shells out to `herdr`)
silently stops working. Config looks correct, `herdr server reload-config` returns `applied`,
detach/reattach changes nothing.

Cause: **the herdr binary was rebuilt/replaced on disk while the server kept running.** The
long-lived server still executes the old inode, so `current_exe()` — which herdr injects as
`HERDR_BIN_PATH` into every spawned keybind — resolves to a stale `…/herdr (deleted)` path.
Scripts that call `"$HERDR_BIN_PATH" pane send-text …` then exec a nonexistent binary and fail.
It is **not** the keymap, the config, or the terminal (Konsole etc.). Common right after building
a herdr fork.

Diagnose: `ls -la /proc/<herdr-server-pid>/exe` shows `-> …/herdr (deleted)`. Or point the
binding at a wrapper that logs `HERDR_BIN_PATH` and watch for the ` (deleted)` suffix — one
keypress proves the binding fires with a good env except that path.

Fix: any herdr-invoking keybind script must recover the real path when `HERDR_BIN_PATH` is not
executable — **strip the ` (deleted)` suffix** (`${HERDR% (deleted)}`), don't rely on
`command -v herdr` (the keybind process usually has no `~/.local/bin` on PATH). Arcwright's
shipped `clipboard-paste.sh` does this. Or restart the server (`herdr server stop && herdr`) so
`current_exe()` is valid again. When verifying such a fix, reproduce the *real* invocation
(`/bin/sh -lc` + the server's PATH + the `(deleted)` `HERDR_BIN_PATH`), not a direct run.

---

# Watching agents in panes (opt-in)

> **Stop, read this before using this section.**
>
> Pane-based agent visibility is **opt-in**, not the default. Arcwright's default
> orchestration uses the current host's supported delegation tools; see the
> `subagent-protocol` skill. You do not need panes for that flow.
>
> **Use panes only for an explicit visibility request:** the user asked to watch
> agents or use a visible split workflow, **and** `$HERDR_ENV` is set.
> Otherwise, stay in-process.

Herdr makes visible agents first-class through `herdr agent start`, so no spawn wrapper
script is needed (unlike the old tmux flow).

## Spawning a visible agent pane (only if the user asked)

```bash
# Claude Code agent in a split beside the current pane
herdr agent start <role> --split right -- \
  claude \
  'You are the <ROLE> agent. FIRST ACTION: load .agents/skills/subagent-protocol/SKILL.md. <TASK_CONTEXT>'

# Kiro CLI agent
herdr agent start <role> --split right -- \
  kiro-cli chat --agent <name> '<task>'
```

The visible agent inherits the selected provider, model, permissions, and task
authorization. Give it the shared protocol's small capability brief with actual
installed skill paths and finder. Use the host's supported lifecycle; native reuse
is conditional, and T3 review rounds are fresh delegated tasks. A pane is a viewing
surface, not a reason to duplicate work or bypass permissions.

## Waiting, reading, following up, closing

```bash
herdr wait agent-status <role> --status blocked --timeout 600000   # block until it needs you
herdr pane read <role> --source recent --lines 200                 # read what it produced
herdr pane run  <role> '<follow-up message>'                       # send input (types + Enter)
herdr pane close <role>                                            # close when done
```

Herdr's `wait agent-status` replaces the entire tmux polling and AGENT_SIGNAL machinery,
there is nothing to grep for and no signal strings to maintain.

## See also

- **`subagent-protocol`** — THE orchestration method. Read first.
- **`/triage`** — recommends an execution approach before any heavy orchestration.
