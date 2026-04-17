# TMUX Setup

WSL2 / Windows Terminal tmux config — Catppuccin Frappe theme, color emoji icons,
Powerline-style single status bar with clickable buttons and live stats.

---

## Shell Commands

```bash
tmux-ai       # open a new tmux session in your project directory
tmux-claude   # same, but immediately launches Claude with --dangerously-skip-permissions
```

Defined in `~/.bashrc`:
```bash
alias tmux-ai='tmux new-session -c /path/to/your/project'
alias tmux-claude='tmux new-session -c /path/to/your/project "claude --dangerously-skip-permissions"'
```

---

## Prerequisites (Fresh Machine)

### 1. Enable WSL2 and install Ubuntu

Run in PowerShell (Admin):
```powershell
wsl --install
```
This installs WSL2 and Ubuntu in one step. Reboot when prompted.

On first Ubuntu launch, create a UNIX username and password.

### 2. Update packages

Before installing anything, bring Ubuntu's package index and installed packages up to date. Many packages (especially `wl-clipboard`, `wslu`, and `imagemagick`) will fail or install outdated versions without this step.

```bash
sudo apt-get update && sudo apt-get upgrade -y
```

### 3. Install tmux

```bash
sudo apt-get install -y tmux
```

### 4. Install NVM + Node (required for Node-based MCP servers)

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
source ~/.bashrc
nvm install --lts
```

### 5. Enable Docker Desktop WSL integration (required for docker-exec MCP servers)

Open **Docker Desktop → Settings → Resources → WSL Integration**, toggle on your Ubuntu distro, click **Apply & Restart**.

> ⚠️ Without this, Docker-based MCP servers will fail to connect even though Docker is installed on Windows.

---

## Git Configuration

### Identity

```bash
git config --global user.name "Your Name"
git config --global user.email "you@example.com"
```

### Authentication (recommended — Windows Credential Manager bridge)

This reuses whatever GitHub/Azure auth you already have on Windows. Requires **Git for Windows** installed.

```bash
git config --global credential.helper "/mnt/c/Program Files/Git/mingw64/bin/git-credential-manager.exe"
```

First `git push` or `git pull` to a private repo will open a browser OAuth flow and cache the token permanently — no PAT management needed.

**Verify it works:**
```bash
git fetch origin
```

### SSH alternative

If you prefer SSH keys instead:
```bash
ssh-keygen -t ed25519 -C "you@example.com"
cat ~/.ssh/id_ed25519.pub   # paste this into GitHub → Settings → SSH Keys
git remote set-url origin git@github.com:your-org/your-repo.git
```

---

## Installation

### What Claude can install for you
Tell Claude to "set up my tmux config" and it will:
- Write `~/.tmux.conf` (full config below)
- Write all scripts in `~/.config/tmux/bin/`
- Write the WSL2 `~/.local/bin/xclip` shim
- Update `~/.bashrc` with the `squid` alias
- Download `fzf` binary to `~/.local/bin/fzf`
- Clone TPM if not present
- Create `~/.local/bin/xdg-open` symlink → `wslview`

### What must be done manually (requires sudo or GUI)

| Step | Command / Notes |
|------|-----------------|
| Install JetBrainsMono NFM (see §3) | Windows font install — double-click in Explorer |
| Set font in terminal emulator (see §3) | Edit `settings.json` in Cursor / VS Code / WT |
| `sudo apt-get install -y wl-clipboard` | Wayland clipboard access for `Alt+V` paste (`wl-paste`) |
| `sudo apt-get install -y imagemagick` | BMP/JPEG/WEBP → PNG conversion for `Alt+V` paste |
| `sudo apt-get install -y wslu` | Provides `wslview` — required for tmux-open URL opening in WSL2 |
| Press `Ctrl+B I` inside tmux after first launch | TPM plugin install — requires interactive session |

After installing `wslu`, create the `xdg-open` shim (no sudo):
```bash
ln -sf /usr/bin/wslview ~/.local/bin/xdg-open
```
This is needed because `tmux-open` hard-codes a check for `xdg-open` and errors if not found.

---

## Full `~/.tmux.conf`

See [`tmux.conf`](tmux.conf) in this directory for the exact current config.

> ⚠️ This file contains Unicode emoji (status bar icons). Always write it via Python with
> `open(..., encoding='utf-8', newline='\n')` — standard shell tools strip non-ASCII.

---

## One-Time Setup

### 1. Install TPM
```bash
git clone https://github.com/tmux-plugins/tpm ~/.tmux/plugins/tpm
```
Start tmux, then press `Ctrl+B I` (capital I) to install all plugins.

### 2. Install system packages
```bash
sudo apt-get install -y wl-clipboard imagemagick wslu
ln -sf /usr/bin/wslview ~/.local/bin/xdg-open
```
- `wl-clipboard` — Wayland clipboard access (`wl-paste`) for `Alt+V` paste
- `imagemagick` — converts BMP/JPEG/WEBP → PNG for `Alt+V` paste
- `wslu` / `wslview` — opens URLs/files in Windows from WSL2 (tmux-open)

### 3. Nerd Fonts

Required for Powerline separator characters and icons in the status bar. **Two fonts are needed** — the primary monospace font plus a symbol fallback that fills in icon glyphs the main font omits.

**Step 1 — Install both fonts**

Download from [nerdfonts.com](https://www.nerdfonts.com/). Install both to Windows by double-clicking → "Install for all users":

- `JetBrainsMonoNerdFontMono-Regular.ttf` (and Bold) — primary monospace font. Use the **NFM (Mono)** variant — single-width glyphs required for correct terminal cell alignment.
- `SymbolsNerdFontMono-Regular.ttf` — symbol fallback font. This fills in any icon glyphs that JetBrainsMono does not cover and is required for full icon rendering.

**Step 2 — Set font in your terminal emulator**

> ⚠️ Icons only render if the **terminal emulator** uses the Nerd Font.
> Windows Terminal settings have **no effect** if you are inside Cursor, VS Code, or another editor's integrated terminal.

**Cursor / VS Code** (`Ctrl+Shift+P` → Open User Settings JSON):
```json
"terminal.integrated.fontFamily": "JetBrainsMono NFM, Symbols Nerd Font Mono",
"terminal.integrated.fontSize": 13
```

**Windows Terminal** (each profile in `settings.json`):
```json
"font": {
    "face": "JetBrainsMono NFM",
    "size": 11,
    "builtinGlyphs": false
}
```

### 4. fzf (for Actions menu)
```bash
mkdir -p ~/.local/bin
curl -Lo /tmp/fzf.tar.gz https://github.com/junegunn/fzf/releases/download/v0.54.3/fzf-0.54.3-linux_amd64.tar.gz
tar -xzf /tmp/fzf.tar.gz -C ~/.local/bin
```

---

## Files

| File | Purpose |
|------|---------|
| `~/.tmux.conf` | Main tmux config |
| `~/.config/tmux/colors.conf` | Catppuccin Frappe palette variables |
| `~/.config/tmux/bin/dispatch.sh` | Mouse click handler for status bar buttons |
| `~/.config/tmux/bin/actions_popup.py` | Python Actions popup menu (grid layout, mouse + keyboard) |
| `~/.config/tmux/bin/actions_popup.sh` | Shell fallback for Actions menu (fzf-powered) |
| `~/.config/tmux/bin/title_sync.sh` | Syncs pane title → window/session name; respects manual-rename locks |
| `~/.config/tmux/bin/float_term.sh` | Resizable float terminal wrapper loop |
| `~/.config/tmux/bin/float_init.sh` | Bash init file for float terminal (resize bindings) |
| `~/.config/tmux/bin/open_clip.sh` | Open Windows clipboard content as URL or browser search |
| `~/.config/tmux/bin/paste_image_wrapper.sh` | Reads clipboard via `wl-paste`, saves to `/tmp`, types `@path` into pane instantly |
| `~/.config/tmux/bin/paste_clipboard.sh` | Paste plain text from Windows clipboard into tmux buffer |
| `~/.config/tmux/bin/cpu_usage.sh` | CPU usage % for status bar |
| `~/.config/tmux/bin/ram_usage.sh` | RAM usage % for status bar |
| `~/.config/tmux/bin/claude_usage.sh` | Claude context usage % bar for status bar |
| `~/.local/bin/xclip` | WSL2 shim routing xclip calls to Windows clipboard (text + images) |
| `~/.local/bin/xdg-open` | Symlink → `/usr/bin/wslview` (required by tmux-open) |

---

## Status Bar Layout

Single bar at bottom:

```
+-------------------------------------------------------------------------------------------+
|  terminal content                                                                         |
|                                                                                           |
|  > | Actions | Reload |  session | window | path | CPU | RAM | time |                    |
+-------------------------------------------------------------------------------------------+
```

**Left side** — two clickable pills: Actions (opens full menu) + Reload
**Right side** — Powerline slant segments chained: session ID → window ID → CPU → RAM → time

> ⚠️ The directory/git segment has been intentionally removed. It called `git branch --show-current` on every status refresh, causing `index.lock` collisions when Claude or other tools ran git operations concurrently. Do not re-add any git status display to the status bar.

> Session and window segments show numeric IDs only (e.g. `💻 ID 3`, `🪟 ID 7`) — no names. Pane borders show title + pane ID (e.g. `✳ Claude Code ID 27`).

### Prefix Indicator (far left)
| State | Display |
|-------|---------|
| Idle | `▶` solid triangle in dim pill |
| Prefix active | `⌨ CTRL+B` in red pill |

### Status Bar Color Palette

| Segment | Pill Color | Purpose |
|---------|-----------|---------|
| Actions | `#3d6095` | Navy blue |
| New | `#4a6e38` | Forest green |
| SpH | `#316862` | Dark teal |
| SpV | `#306075` | Slate blue |
| Kill | `#783a3c` | Crimson |
| Name | `#5c3c78` | Purple |
| Sess | `#784828` | Rust |
| Reload | `#685820` | Dark gold |
| Session (right) | `#3d6095` | Navy blue |
| Window (right) | `#685820` | Dark gold |
| CPU (right) | `#784828` | Rust |
| RAM (right) | `#783a3c` | Crimson |
| Clock (right) | `#5c3c78` | Purple |

All pill text uses `#d8ddf0` (light). Bar background is `#232634`.

---

## Status Bar Buttons

| Button | Action |
|--------|--------|
| ⚙ Actions | Opens the full Actions fzf menu |
| 🔄 Reload | Reloads `~/.tmux.conf` |

All window/pane/session operations are inside the Actions menu.

---

## Actions Menu

Opened via the **Actions** button or click. Type to filter, scroll with arrows, click or Enter to select. `Esc` to cancel.

### Window & Session
| Key | Action |
|-----|--------|
| `z` | Zoom / unzoom pane |
| `p` | Previous window |
| `n` | Next window |
| `w` | List windows & sessions |
| `W` | New window (in current directory) |
| `K` | Kill window (confirm) |
| `N` | Rename session |
| `X` | Kill session (confirm) |
| `d` | Detach session (confirm) |

### Pane Controls
| Key | Action |
|-----|--------|
| `H` | Split top / bottom (in current directory) |
| `V` | Split left / right (in current directory) |
| `k` | Kill pane (confirm) |
| `,` | Rename window |
| `s` | Session chooser |

### Pane Movement
| Key | Action |
|-----|--------|
| `u` | Swap pane ↑ (within window) |
| `v` | Swap pane ↓ (within window) |
| `e` | Break pane → new window |
| `J` | Move pane TO a window — opens tmux tree chooser (scrollable, clickable, Enter to confirm) |
| `L` | Pull pane FROM a window — opens tmux tree chooser |

### Tools
| Key | Action |
|-----|--------|
| `f` | Float terminal (resizable) |
| `t` | Scratch terminal — persistent floating session (`M-i`) |
| `M` | Share session via Muxile |
| `S` | Save session (tmux-resurrect) |
| `R` | Restore session (tmux-resurrect) |

### Clipboard & Copy
| Key | Action |
|-----|--------|
| `r` | Reload tmux config |
| `c` | Enter copy mode (`o`=open file/URL, `S`=web search) |
| `i` | Paste image/file from Windows clipboard |
| `o` | Open clipboard content as URL/file (Windows default handler) |
| `g` | Google-search clipboard text in browser |

---

## Float Terminal

Opened via Actions → `f` or `Alt+F`. A resizable popup shell that opens in the current pane's directory.

| Key (inside float) | Action |
|--------------------|--------|
| `Alt+=` | Make terminal bigger (+10%) |
| `Alt+-` | Make terminal smaller (-10%) |
| `Ctrl+D` | Close float terminal |

Size persists in `/tmp/tmux_float_size` (default 80%, range 30–96%).

---

## Keyboard Shortcuts

### Navigation
| Key | Action |
|-----|--------|
| `Ctrl+B c` | New window |
| `Ctrl+B n` / `p` | Next / previous window |
| `Ctrl+B w` | Window list |
| `Ctrl+B s` | Session chooser |
| `Ctrl+B -` | Split horizontal |
| `Ctrl+B \|` | Split vertical |
| `Ctrl+B z` | Zoom pane |
| `Ctrl+B x` | Kill pane |
| `Ctrl+B ,` | Rename window |
| `Ctrl+B d` | Detach |
| `Alt+N` / `Alt+n` | New window |

### Clipboard & Paste
| Key | Action |
|-----|--------|
| `Ctrl+V` | Paste plain text from Windows clipboard into active pane (no trailing newline — uses `paste-buffer -p`) |
| `Alt+V` | Paste image/file/text from Windows clipboard → types path into pane |
| `Alt+F` | Open resizable float terminal |
| `y` | Copy selection to Windows clipboard (copy mode) |
| `C-c` | Copy selection + exit copy mode |
| Mouse drag | Copy to tmux buffer (does NOT go to Windows clipboard) |

### Copy Mode (`Ctrl+B [` to enter, or Actions → `c`)
| Key | Action |
|-----|--------|
| `v` | Begin selection |
| `C-v` | Block/rectangle selection |
| `y` or `C-c` | Copy to Windows clipboard, exit |
| `o` | Open file/URL under cursor (tmux-open) |
| `Ctrl+O` | Open in `$EDITOR` (tmux-open) |
| `S` | Web search selection (tmux-open) |
| `/` / `?` | Search forward / backward |
| `n` / `N` | Next / previous match |
| `q` or `Esc` | Exit copy mode |

### Plugin Keys
| Key | Action |
|-----|--------|
| `Alt+I` | Toggle persistent scratch terminal (tmux-floating-terminal) |
| `Alt+F` | Float terminal (custom, resizable) |
| `Ctrl+B T` | Share session (Muxile) |
| `Ctrl+B I` | Install plugins (TPM) |
| `Ctrl+B U` | Update plugins (TPM) |

### Right-click pane border
Opens a context menu: Split Vertical, Split Horizontal, Break to Window, Swap Up/Down, Kill Pane.

---

## Pane Borders & Agent Labels

Pane borders are **hidden when only one pane is open** and appear automatically when a second pane is created.

### How it works

Hooks in `~/.tmux.conf` manage borders and naming:

```
after-split-window   →  if panes > 1: show top border; set pane hash placeholder
pane-exited          →  if panes ≤ 1: hide border
pane-title-changed   →  runs title_sync.sh: clears hash, renames window + session
session-created      →  rename session to cwd basename as initial placeholder
after-new-window     →  set pane hash (stripped pane_id) as placeholder
```

### Automatic title tracking

Claude Code sets its pane title via OSC 2 (`✳ Claude Code` = busy, `⠂ Claude Code` = idle). The `pane-title-changed` hook fires on every OSC 2 update and calls `title_sync.sh`, which:
1. Clears the placeholder hash from the pane border
2. Renames the **window** to the new pane title
3. Renames the **session** to `"<pane title> · <cwd basename>"` (window 1 only)

This keeps all sessions uniquely named even when multiple Claude instances run in the same directory.

### Manual rename locking

When you rename a session or window via the Actions menu (`s` / `,`), a lock flag is set:
- `@session-name-locked` — prevents `title_sync.sh` from overriding the session name
- `@window-name-locked` — prevents `title_sync.sh` from overriding the window name

To manually clear a lock (re-enable auto-naming):
```bash
tmux set-option -u @session-name-locked       # unlock session
tmux set-option -wu @window-name-locked       # unlock window
```

### Setting a pane label for non-Claude panes

From inside the pane:
```bash
printf '\033]2;My Label\033\\'
```

Or targeting a pane by ID:
```bash
tmux select-pane -t "$TMUX_PANE" -T "My Label"
```

### Spawning agents

When spawning a dedicated agent, pass its role as the task description so the session file registration is clear:
```bash
tmux split-window -h -c "#{pane_current_path}" \
  "claude --dangerously-skip-permissions --strict-mcp-config --mcp-config '{"mcpServers":{}}' 'You are the backend agent. Read .agents/orchestration/ and register yourself, then work through assigned tasks.'"
sleep 8  # ⚠️ REQUIRED — wait for pane to initialize
NEW_PANE_ID=$(tmux list-panes -F "#{pane_id}" | tail -1)
```

The spawned agent registers its own pane ID and role in the orchestration session file on startup — no pane title sniffing needed.

### Sleep between tmux commands

tmux commands execute asynchronously — issuing them back-to-back causes race conditions (pane not yet created, message not yet delivered, layout not yet applied). **Always insert a short `sleep` between consecutive tmux operations:**

| After this command | Minimum sleep |
|---|---|
| `split-window` (before reading pane list or setting options) | `sleep 8` |
| `send-keys` (before verifying delivery or sending another command) | `sleep 6` |
| `kill-pane` (before rebalancing layout) | `sleep 6` |
| `select-layout` / `select-pane` | `sleep 6` |
| `set-option` / `select-pane -T` (title set) | `sleep 6` |

```bash
# ✅ CORRECT — sleep between tmux commands
tmux split-window -h -c "$PROJECT_ROOT" "claude --dangerously-skip-permissions '...'"
sleep 8
NEW_PANE_ID=$(tmux list-panes -F "#{pane_id}" | tail -1)
sleep 6
tmux set-option -t "$NEW_PANE_ID" -p allow-rename off
sleep 6
tmux select-pane -t "$NEW_PANE_ID" -T "dev-${NEW_PANE_ID}"

# ❌ WRONG — no sleep, pane list may be stale
tmux split-window -h -c "$PROJECT_ROOT" "claude ..."
NEW_PANE_ID=$(tmux list-panes -F "#{pane_id}" | tail -1)
```

### Agent MCP Configuration — Token Optimization

Sub-agents spawned from the master orchestrator should run with **all MCP servers disabled**. The orchestrator injects any needed database context (feedback items, roadmap cards) into the handoff context file — sub-agents never need to query MCP directly. This significantly reduces token usage since MCP tool schemas are not loaded into the agent's context.

**Only the master orchestrator conversation needs MCP.** All spawned agents use:
```bash
--strict-mcp-config --mcp-config '{"mcpServers":{}}'
```

| Agent | MCP needed? | Reason |
|---|---|---|
| master-orchestrator | ✅ Yes | Feedback lookup, status updates during triage |
| dev / quick-flow-solo-dev | ❌ No | Reads and writes code only |
| pm-agent (QS/PRD/CB) | ❌ No | Works from handoff context file |
| analyst | ❌ No | Web search + file reads only |
| ux-designer | ❌ No | Works from PRD only |
| architect | ❌ No | Works from PRD/UX only |
| sm-agent | ❌ No | Works from existing artifacts |
| review-orchestrator | ❌ No | Reads code and findings only |
| qa-agent | ⚠️ Conditional | Needs playwright MCP only if `playwright-cli` is not installed |

**QA exception:** The qa-agent checks for `playwright-cli` at startup and uses it as the primary test runner. If playwright-cli is confirmed installed, disable all MCP. If not available, allow playwright MCP only:
```bash
# playwright-cli available (preferred — disable all MCP):
--strict-mcp-config --mcp-config '{"mcpServers":{}}'

# playwright-cli NOT available (allow playwright MCP only):
--strict-mcp-config --mcp-config '{"mcpServers":{"playwright":{"command":"npx","args":["@playwright/mcp"]}}}'
```

**Token savings:** A typical Arcwright pipeline with 4–6 spawned agents saves the MCP tool schema load on each agent (~50–200 tokens per MCP server per agent). With 3 MCP servers and 5 agents, this is ~750–3000 tokens per pipeline run.

### Cap styles

The border title uses **rounded caps** by default. To switch to **pointed caps**, swap the Nerd Font characters in `pane-border-format` in `~/.tmux.conf`:

| Style | Left cap | Right cap |
|-------|----------|-----------|
| Rounded | `\ue0b6` | `\ue0b4` |
| Pointed | `\ue0b2` | `\ue0b0` |

Active pane uses bright border color per pane index; inactive uses dim (`#414559`).

---

## Hot Reload (watch-sync.sh)

The `watch-sync.sh` script syncs file changes from the WSL host into the Docker container with ~2-4s latency.

Start each dev session:
    bash scripts/watch-sync.sh         # foreground (dedicated pane)
    bash scripts/watch-sync.sh &       # background

Monitor:
    tail -f /tmp/watch-sync.log

Stop:
    kill $(cat /tmp/watch-sync.pid)

Configure via env vars:
    WATCH_CONTAINER=app-frontend-1
    WATCH_HOST_DIR=./frontend
    WATCH_CONTAINER_DIR=/app

---

## Agent Orchestration

When coordinating multiple Claude agents, use **orchestration session files** — not pane title sniffing. Pane titles are overwritten by Claude Code and are unreliable for routing.

### Session file location
```
<project_root>/.agents/orchestration/session-YYYYMMDD-HHMMSS-XXXX.md
```

- Created by the **coordinator/master** agent at the start of an orchestration session
- Each file is uniquely named with a timestamp + 4-char random hex suffix
- Files are **project-scoped**: agents only read/write files matching their own project root

### Session file format

```markdown
# Agent Session: 20260313-143022-a4f1
**Project:** /path/to/your/project
**Created:** 2026-03-13T14:30:22

## Active Agents
| Pane ID | Role        | Status | CWD                     |
|---------|-------------|--------|-------------------------|
| %27     | coordinator | idle   | .../my-project          |
| %31     | backend     | busy   | .../my-project          |
| %33     | frontend    | idle   | .../my-project          |

## Tasks
### TASK-001 · pending · backend
- **Description:** Fix the user profile API endpoint
- **Assigned:** backend
- **Status:** pending

### TASK-002 · in-progress · frontend · claimed:%33
- **Description:** Update ProfileCard component
- **Status:** in-progress
```

### Agent startup protocol (MANDATORY)

Every agent spawned in tmux **must** do this on startup:

```bash
PROJECT_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || echo "$PWD")
ORCH_DIR="$PROJECT_ROOT/.agents/Orchestration"
SESSION_FILE=$(ls -t "$ORCH_DIR"/session-*.md 2>/dev/null | head -1)

if [ -n "$SESSION_FILE" ]; then
    # Verify project match
    grep -q "$PROJECT_ROOT" "$SESSION_FILE" && echo "Session found: $SESSION_FILE"
    # 1. Register self in Active Agents table (pane ID, role, CWD)
    # 2. Scan for pending tasks assigned to my role
    # 3. Claim oldest pending task → mark in-progress with my pane ID
fi
```

### Task completion protocol (MANDATORY)

Every agent **must** do this after finishing each task:

1. Mark current task `done` in the session file
2. Scan file for more `pending` tasks for my role
3. If found → claim and start; if none → set status `idle` in Active Agents table

### Routing a task to an existing agent

**Always append `Enter` to every `send-keys` call — without it the message is typed into the pane but never submitted.**

```bash
# Read pane ID from session file, then send:
tmux send-keys -t "%31" "Please handle TASK-003 from the session file" Enter
```

If the agent is `busy` (✳), still write the task to the session file with `pending` status — the agent will pick it up when it calls the task completion protocol.

### Creating a new session (coordinator only)

```bash
PROJECT_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || echo "$PWD")
ORCH_DIR="$PROJECT_ROOT/.agents/Orchestration"
mkdir -p "$ORCH_DIR"
SUFFIX=$(head -c2 /dev/urandom | xxd -p)
SESSION_FILE="$ORCH_DIR/session-$(date +%Y%m%d-%H%M%S)-$SUFFIX.md"
# Write the session file header and initial task list
```

### Project scoping (strict)

Agents **only** interact with session files where `Project:` matches their own project root:

```bash
git rev-parse --show-toplevel  # must match the Project: field in the session file
```

Never route tasks to agents in a different project directory unless the user **explicitly** says so.

### Decision rule

| Situation | Action |
|-----------|--------|
| Session file exists, target role agent is `idle` | `tmux send-keys` to their pane ID |
| Session file exists, target role agent is `busy` | Write task as `pending` — they pick it up |
| No session file exists | Coordinator creates one before spawning sub-agents |
| No agent for target role | Spawn new split-pane agent; it self-registers on startup |

### Closing a split-pane agent — mandatory protocol

Every workflow step that spawns a split-pane agent MUST clearly define when that pane closes. The close sequence is always two steps — in order:

**Step 1 — Send `/exit` into the conversation:**
```bash
tmux send-keys -t <pane_id> "/exit" Enter
```
This lets Claude finish any in-progress output, flush writes, and exit cleanly.

**Step 2 — Kill the pane:**
```bash
tmux kill-pane -t <pane_id>
```

**Never skip Step 1.** Killing the pane without `/exit` first can leave partial file writes, git lock files, or unsaved session state that block the next pipeline step.

**When each pane type closes:**

| Agent type | Closes when |
|---|---|
| Single-step (research, QA, dev-story) | Immediately after sending completion report-back to spawner |
| Multi-step (review agent, sprint planner) | After ALL assigned steps complete and final report-back sent |
| Interactive (sm-agent in sprint loop) | When coordinator explicitly sends `/exit` — never self-closes mid-workflow |
| 🔴 escalation / blocked | Stays open until user resolves blocker, then closes via normal sequence |

**After closing:** Coordinator updates the relevant session file Active Agents table row to `status: closed`. For general multi-agent work this is `.agents/orchestration/session-*.md`; for Arcwright workflows this is `_arcwright-output/parallel/{session_id}/agent-sessions.md`.

---

## Pasting Images into Claude Code

1. Take a screenshot or copy an image/file in Windows
2. Press `Alt+V` in tmux (or Actions → `i`)
3. The `@path` is instantly typed into your terminal — no popup, no delay
4. Claude Code reads the file from the path (attach with `@` prefix if needed)

**Clipboard types handled:**

| Type | Behavior |
|------|----------|
| `image/png` | Saved to `/tmp/tmux_clipboard_image.png`, `@path` typed |
| `image/bmp`, `image/jpeg`, etc. | Converted to PNG via ImageMagick, `@path` typed |
| `image/svg+xml` | Converted to PNG via ImageMagick, `@path` typed |
| `text/uri-list` (files from file manager) | All WSL paths typed as `@path1 @path2 ...` |
| `text/html` | Saved to `/tmp/tmux_clipboard_content.html`, path typed |
| `text/plain` | If it's a valid path: `@path`; otherwise saved to `/tmp/tmux_clipboard_text.txt` |

**Implementation:** `paste_image_wrapper.sh` uses `/usr/bin/wl-paste` (Linux-native Wayland clipboard — no PowerShell/vsock). Files are saved as `/tmp/tmux_clip_YYYYMMDD_HHMMSS.<ext>`. On each run, files from previous days are automatically deleted. The PNG is also copied back to the Wayland clipboard so `Ctrl+V` may also work in Claude Code.

**`Ctrl+V` binding** uses `tmux paste-buffer -p` (no trailing newline). Without `-p`, `paste-buffer` appended a newline that auto-submitted the pasted content — fixed.

---

## Plugins

| Plugin | Purpose | Access |
|--------|---------|--------|
| `tmux-plugins/tpm` | Plugin manager | `Ctrl+B I/U` |
| `tmux-plugins/tmux-sensible` | Sane defaults | automatic |
| `tmux-plugins/tmux-resurrect` | Save/restore sessions | Actions `y`/`r` |
| `tmux-plugins/tmux-continuum` | Auto-save sessions | automatic |
| `tmux-plugins/tmux-yank` | Enhanced copy | copy mode `y` |
| `bjesus/muxile` | Share terminal via web | `Ctrl+B T` |
| `lloydbond/tmux-floating-terminal` | Persistent scratch pad | Actions `t` / `Alt+I` |
| `tmux-plugins/tmux-open` | Open files/URLs from copy mode | copy mode `o`/`S` |

> ⚠️ `ofirgall/tmux-window-name` has been **removed**. It set `automatic-rename on` per-window after every window switch, which overwrote the window names managed by `title_sync.sh`. All window/session naming is now handled exclusively by the `pane-title-changed` hook + `title_sync.sh`.

---

## Architecture Notes

### Mouse bindings split
`MouseDown1Status` handles **Actions only** (opens popup before mouse release, preventing `MouseUp` from leaking into the popup). `MouseUp1Status` handles all other buttons via `dispatch.sh`.

### No nested popups
`display-popup` can't be opened from inside another popup. Any action in the Actions menu that opens a new popup (float terminal, scratch terminal) defers via `tmux run-shell -b "sleep 0.2 && ..."` so the first popup fully closes first.

### Actions popup — popup closes before destructive commands
`execute()` in `actions_popup.py` runs while the `display-popup` overlay is still technically open (closes on script exit). Commands that destroy their own context (`kill-pane`, `kill-window`, `kill-session`) and interactive commands (`choose-tree`, `command-prompt`) use `run-shell -b "sleep 0.1 && ..."` to defer execution until the popup has fully closed.

### allow-passthrough must stay off
`allow-passthrough on` causes OSC 2 escape sequences (which Claude Code uses to set its pane title) to be forwarded directly to Windows Terminal, bypassing tmux entirely. tmux never sees the title change, `pane_title` is never updated, and `pane-title-changed` never fires. **Keep `allow-passthrough off`** — it is commented in `~/.tmux.conf` with an explanation. If a feature requires passthrough, scope it with `set-option -pt <pane_id> allow-passthrough on` rather than setting it globally.

### pane-title-changed is a window-level hook
In tmux 3.4, `pane-title-changed` is a **window-level** event, not a global event. It must be registered with `set-hook -wg` (not `-g`). Using `-g` is silently accepted but never fires.

### tmux-window-name plugin conflict
The `ofirgall/tmux-window-name` plugin calls `set-option -w automatic-rename on` for every window after each window switch. This directly overwrites window names set by `title_sync.sh`. The plugin has been removed. If `automatic-rename` ever reverts to `on` on existing windows, reset it: `tmux list-windows -a -F "#{session_name}:#{window_index}" | xargs -I{} tmux set-option -t {} -w automatic-rename off`

### Manual rename lock mechanism
Actions `s` (rename-session) and `,` (rename-window) chain `\; set-option @session-name-locked 1` or `\; set-option -w @window-name-locked 1` after the `command-prompt` rename. `title_sync.sh` checks these flags before renaming and skips if set. This prevents Claude Code's periodic title updates from overwriting manually-set names.

### Unicode in tmux.conf
The status bar contains emoji (💻 🪟 📁 🧮 💾 ⏰ etc.) and Powerline separator chars (U+E0B2, U+E0B4, U+E0B6). FE0F variation selectors are intentionally stripped — they cause tmux to miscalculate cell widths. All writes to `~/.tmux.conf` that include these chars must be done via Python with `open(..., encoding='utf-8', newline='\n')`.

### xdg-open / tmux-open in WSL2
`tmux-open` hard-codes a check for `xdg-open` and errors on reload if not found. The fix is a symlink: `~/.local/bin/xdg-open → /usr/bin/wslview`. The `@open 'wslview'` config option alone is not sufficient — the plugin ignores it for the binary detection check.

### Split/New inherits current directory
`dispatch.sh` resolves `#{pane_current_path}` from the pane ID before calling `new-window`/`split-window`, since tmux format strings aren't available in shell context.

### Float terminal resize loop
`float_term.sh` runs a loop: opens `display-popup -E`, catches exit code 10 (bigger) or 11 (smaller) from the inner shell, adjusts `/tmp/tmux_float_size`, and reopens. `float_init.sh` is sourced via `bash --init-file` and binds `Alt+=`/`Alt+-` to `exit 10`/`exit 11`.

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `fatal: Unable to create '.git/index.lock': File exists` | VS Code git extension left a stale lock. Run `./scripts/git-unlock.sh` to remove it. Only run when VS Code is idle — if an operation is actively in progress, wait a few seconds first. |
| Branch info in status bar not updating | `status-interval` controls how often `#()` reruns — set to `1` for near-instant updates |
| Icons show as boxes or blank | Install both `JetBrainsMonoNerdFontMono-Regular.ttf` and `SymbolsNerdFontMono-Regular.ttf`; set `"terminal.integrated.fontFamily": "JetBrainsMono NFM, Symbols Nerd Font Mono"` in Cursor/VS Code. Windows Terminal: `font.face`. WT settings have no effect when running inside Cursor. |
| Colors all look the same | Ensure `set -ga terminal-overrides ",*256col*:Tc"` is in config; restart terminal |
| Actions menu goes blank | Confirm `display-popup -E` (capital E flag) in `MouseDown1Status` binding |
| Actions menu shows garbled 2-column layout | Terminal pane is too narrow — the popup was width-capped. Widen your terminal or pane to ≥ 120 cols. Fixed in latest: popup now uses `95%` width and the Python script adapts `W` to terminal size. Reload config: `Reload` button or `Ctrl+B r`. |
| Float terminal does nothing | Check `/tmp/tmux_float_size` exists; try `Alt+F` directly |
| `Alt+V` does nothing / path not typed | Ensure `wl-clipboard` is installed: `sudo apt-get install -y wl-clipboard` |
| `Alt+V` pastes BMP path but image fails to open | Install ImageMagick for conversion: `sudo apt-get install -y imagemagick` |
| Button clicks do nothing | Run `tmux source-file ~/.tmux.conf` to clear stale server bindings |
| fzf not found | Re-download to `~/.local/bin/fzf` and `chmod +x` |
| `xdg-open` error on reload | `sudo apt-get install -y wslu && ln -sf /usr/bin/wslview ~/.local/bin/xdg-open` |
| `bt` error / `bt list` crash on detach | Stale `tmux-browser` plugin hooks. Remove the plugin and clear hooks: `rm -rf ~/.tmux/plugins/tmux-browser && tmux set-hook -gu 'client-detached[8921]' && tmux set-hook -gu 'client-attached[8921]' && tmux source ~/.tmux.conf` |
| Pane titles / session names never update from Claude Code | **`allow-passthrough on`** causes Claude Code's OSC 2 title sequences to pass through to Windows Terminal instead of tmux intercepting them. `pane-title-changed` never fires. Fix: `set -g allow-passthrough off` in `~/.tmux.conf` (must stay off permanently). |
| Window names not updating when Claude changes title | Likely `automatic-rename on` on some windows from the old `tmux-window-name` plugin. Reset: `tmux list-windows -a -F "#{session_name}:#{window_index}" \| xargs -I{} tmux set-option -t {} -w automatic-rename off` |
| `title_sync.sh returned 2` | CRLF line endings. Fix: `sed -i 's/\r//' ~/.config/tmux/bin/title_sync.sh` |
| Session name not updating even though window name does | `title_sync.sh` uses `-t PANE_ID` targeting — verify the pane ID argument is passed correctly in the hook. Check with `tmux show-hooks -wg \| grep pane-title` |
| Manual rename gets overridden by Claude | Lock flag not set. This should happen automatically via Actions `s`/`,`. If using `Ctrl+B $` or `Ctrl+B ,` directly, set lock manually: `tmux set-option @session-name-locked 1` or `tmux set-option -w @window-name-locked 1` |
| `#{session_index}` in hooks expands to empty | `#{session_index}` is not a valid tmux format variable. Use `#{session_name}` or `#{b:pane_current_path}` instead. |
| `Alt+V` types nothing | WSL vsock interop (`powershell.exe`) fails in tmux `run-shell` context. The wrapper uses `/usr/bin/wl-paste` (Wayland, Linux-native). Ensure `wl-clipboard` is installed: `sudo apt-get install -y wl-clipboard`. |
| Right-click opens new pane accidentally | tmux default `MouseDown3Pane` shows a split/kill menu. Fixed with `bind -T root MouseDown3Pane select-pane -t=` in `.tmux.conf`. Do **not** set `rightClickContextMenu: true` in WT — it breaks right-click paste and drag-and-drop. |

## Troubleshooting: Garbled Copy-Paste from tmux

If copied text shows garbage like box-drawing chars (|, -, Unicode squares), the issue is
UTF-8 encoding in Windows Terminal. Fix: use ASCII-only tables and borders in scripts/docs.
Set terminal to UTF-8: Windows Terminal Settings > Profile > Advanced > Text encoding: UTF-8.

---

## MCP Servers — WSL Setup

MCP servers work differently depending on their transport type. The project-committed `.mcp.json` has three servers — each needs a specific setup step in WSL.

---

### Step 1 — Enable Docker Desktop WSL integration

Docker-based MCP servers use `docker exec`. For `docker` to work inside WSL, Docker Desktop must have WSL integration enabled.

1. Open **Docker Desktop → Settings → Resources → WSL Integration**
2. Toggle on **your Ubuntu distro** (e.g. `Ubuntu` or `Ubuntu-24.04`)
3. Click **Apply & Restart**

Verify from WSL:
```bash
docker ps
```
If you see container output (or an empty table), Docker is wired up. If you get `permission denied` or `Cannot connect to the Docker daemon`, WSL integration is not enabled.

---

### Step 2 — HTTP-based MCP servers

If your project exposes an HTTP MCP endpoint, ensure the backend is running and verify:

```bash
curl -s http://localhost:5050/mcp | head -c 100
```

Claude picks this up automatically from `.mcp.json` — no user-scope override needed.

---

### Step 3 — Node-based MCP servers (user-scope override)

If you add a Node.js MCP server (e.g. Acumatica, or any custom server with a `dist/index.js`), the committed `.mcp.json` will reference `node.exe` (Windows path). That fails in WSL. Override it at user scope with a Linux Node binary — this takes precedence over the project config without modifying the committed file.

**One-time: install NVM + Node LTS**
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
source ~/.bashrc
nvm install --lts
```

**Register the server at user scope** (replace `server-name` and path):
```bash
claude mcp add <server-name> -s user -- \
  ~/.nvm/versions/node/v$(node --version | tr -d v)/bin/node \
  "/mnt/c/path/to/dist/index.js"
```

Example — Acumatica server:
```bash
claude mcp add acumatica -s user -- \
  ~/.nvm/versions/node/v24.14.0/bin/node \
  "/mnt/c/Users/White/Documents/Acumatica MCP/dist/index.js"
```

---

### Scope precedence

| Launch context | Config used | Node binary |
|---|---|---|
| WSL terminal | user scope (`~/.claude.json`) | Linux node via NVM |
| PowerShell / Windows | project scope (`.mcp.json`) | Windows `node.exe` |

User-scope entries override project-scope entries for the same server name. The `/mnt/c/...` path works from both sides — Linux node accesses it via the WSL mount, Windows node via `C:\...`.

---

### Verifying all servers in Claude

Start Claude and run:
```
/mcp
```

You should see all three project servers listed as connected:
- `my-server` — connected (HTTP)
- `my-docker-server` — connected (docker exec)

If any server shows as failed, check:

| Server type | Common cause | Fix |
|-------------|-------------|-----|
| HTTP | Backend not running | Start your backend services |
| Docker exec | Docker WSL integration off | Enable in Docker Desktop → WSL Integration |
| Node.js | Wrong node path in user scope | Re-run `claude mcp add` with correct NVM path |
