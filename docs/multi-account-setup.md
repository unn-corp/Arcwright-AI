# Multi-Account Claude Code Setup

Run several Claude Code accounts (e.g. Personal / Work / Alt) on one machine, each
with its own login and billing, while **sharing one Arcwright install and one set of
conversation transcripts** across all of them.

This guide covers both **native Linux/macOS** and **WSL2/Windows**.

> **Platform note.** The sharing mechanism is 100% Unix-shell — `CLAUDE_CONFIG_DIR`,
> symlinks, and the transcript merge are identical on native Linux, macOS, and WSL2
> (WSL2 *is* Linux). The **only** Windows-specific piece is the convenience launcher
> (`claude-wsl.ps1`), which exists purely to hop from PowerShell into WSL. On native
> Linux/macOS you don't need it — you replace it with a one-line shell function (shown
> below). Nothing about the setup requires Windows.

---

## How Claude Code separates accounts

Claude Code stores everything for an account under a config directory, chosen by the
`CLAUDE_CONFIG_DIR` environment variable:

| Account  | `CLAUDE_CONFIG_DIR`   | Notes                                  |
|----------|-----------------------|----------------------------------------|
| Personal | *(unset)*             | Defaults to `~/.claude`                |
| Work     | `~/.claude-work`      | Separate login, history, settings      |
| Alt      | `~/.claude-alt`       | Separate login, history, settings      |

Each config dir holds auth (`.credentials.json`, `.claude.json`), `settings.json`,
prompt history (`history.jsonl`), conversation transcripts (`projects/`), and — for a
global Arcwright install — `skills/`, `commands/`, `agents/`, and `CLAUDE.md`.

The Arcwright installer's `--global` mode always writes to the **default** `~/.claude`
(it does not read `CLAUDE_CONFIG_DIR`). So the trick is: install once into `~/.claude`,
then **symlink** the shareable pieces into the other config dirs.

### What's safe to share vs. keep separate

| Item                                  | Share? | Why                                              |
|---------------------------------------|:------:|--------------------------------------------------|
| `skills/` `commands/` `agents/` `CLAUDE.md` | ✅ | Read-only Arcwright content — identical for all   |
| `projects/` (transcripts)             | ✅     | Each session is its own file → no write conflicts |
| `~/.arcwright/` (core modules)        | ✅ (already) | Referenced by absolute path; nothing to link |
| `history.jsonl` (prompt history)      | ⚠️ optional | Single append-only file → tiny corruption risk if two accounts write at once |
| `.credentials.json` `.claude.json` `settings.json` | ❌ | Auth/config is per-account — never share |

---

## Setup

### 1. Install Arcwright globally (once, as the default account)

```bash
arcwright --global
# or to update an existing install:
arcwright update --global
```

This populates `~/.claude/{skills,commands,agents,CLAUDE.md}` and `~/.arcwright/`.

### 2. Link the shareable pieces into the other accounts

This is identical on Linux, macOS, and WSL2 — it's all done from the Linux/Unix shell.

```bash
# Merge any existing transcripts from the other accounts into the canonical
# ~/.claude/projects first, so nothing is lost, then back up the originals.
ts=$(date +%Y%m%d-%H%M%S)
bk=~/.claude-account-link-backup-$ts
mkdir -p "$bk"

for acct in work alt; do
  src=~/.claude-$acct/projects
  if [ -d "$src" ] && [ ! -L "$src" ]; then
    rsync -a --ignore-existing "$src"/ ~/.claude/projects/
    mv "$src" "$bk/projects-$acct"
  fi
done

# Create the symlinks.
for acct in work alt; do
  d=~/.claude-$acct
  mkdir -p "$d"
  for item in skills commands agents CLAUDE.md; do
    [ -e "$d/$item" ] && [ ! -L "$d/$item" ] && mv "$d/$item" "$d/$item.pre-link-bak"
    ln -sfn ~/.claude/"$item" "$d/$item"
  done
  ln -sfn ~/.claude/projects "$d/projects"
done
```

Adjust the `for acct in work alt` list to match your own config-dir suffixes.

### 3. (Optional) Also share prompt history

```bash
for acct in work alt; do
  ln -sfn ~/.claude/history.jsonl ~/.claude-$acct/history.jsonl
done
```

Only do this if you want one unified up-arrow / `Ctrl-R` history. Skip it if you ever
run two accounts simultaneously and care about avoiding the (small) append-race risk.

### 4. Verify

```bash
ls -la ~/.claude-work | grep -E 'skills|commands|agents|CLAUDE.md|projects'
# each should show ' -> /home/<you>/.claude/...'
```

---

## Launching each account

You need to set `CLAUDE_CONFIG_DIR` before starting `claude`.

### Native Linux / macOS — shell function

Add to `~/.bashrc` / `~/.zshrc`:

```bash
claude-acct() {
  case "$1" in
    work) export CLAUDE_CONFIG_DIR="$HOME/.claude-work" ;;
    alt)  export CLAUDE_CONFIG_DIR="$HOME/.claude-alt" ;;
    *)    unset CLAUDE_CONFIG_DIR ;;  # personal / default
  esac
  shift 2>/dev/null
  claude "$@"
}
# Usage:  claude-acct work       |  claude-acct alt       |  claude-acct personal
```

Or, for a numbered picker like the Windows launcher:

```bash
claude-pick() {
  printf 'Select account:\n  [1] Personal\n  [2] Work\n  [3] Alt\n'
  read -rp 'Account (1-3): ' n
  case "$n" in
    2) export CLAUDE_CONFIG_DIR="$HOME/.claude-work" ;;
    3) export CLAUDE_CONFIG_DIR="$HOME/.claude-alt" ;;
    *) unset CLAUDE_CONFIG_DIR ;;
  esac
  claude --dangerously-skip-permissions "$@"
}
```

### Native Linux / macOS — fzf picker (accounts and providers in one menu)

If you also installed the Arcwright model launchers (`--model-launchers`, which sources `~/.config/openrouter/claude-or.sh` and defines `claude-glm`, `claude-minimax`, `claude-qwen`, `claude-sub`), you can drive both the Anthropic account switch and the alternate providers from a single fuzzy menu. Requires `fzf`.

```bash
# Add to ~/.bashrc / ~/.zshrc, below the claude-or.sh source line.
claude-devo() {
  local choice
  choice=$(printf '%s\n' \
    "personal : default ~/.claude (Anthropic)" \
    "work     : ~/.claude-work (Anthropic)" \
    "alt      : ~/.claude-alt (Anthropic)" \
    "glm      : Z.ai GLM (direct)" \
    "minimax  : MiniMax (direct)" \
    "qwen     : Qwen via OpenRouter" \
    "sub      : plain Anthropic subscription" \
    | fzf --prompt='claude > ' --height=10 --border --no-sort) || return

  case "${choice%% *}" in
    personal) unset CLAUDE_CONFIG_DIR;                       claude --dangerously-skip-permissions "$@" ;;
    work)     export CLAUDE_CONFIG_DIR="$HOME/.claude-work"; claude --dangerously-skip-permissions "$@" ;;
    alt)      export CLAUDE_CONFIG_DIR="$HOME/.claude-alt";  claude --dangerously-skip-permissions "$@" ;;
    glm)      unset CLAUDE_CONFIG_DIR; claude-glm     "$@" ;;
    minimax)  unset CLAUDE_CONFIG_DIR; claude-minimax "$@" ;;
    qwen)     unset CLAUDE_CONFIG_DIR; claude-qwen    "$@" ;;
    sub)      unset CLAUDE_CONFIG_DIR; claude-sub     "$@" ;;
  esac
}
# Usage: run `claude-devo`, then fuzzy-pick an account or provider.
```

Add or remove rows to match the accounts you created in the Setup steps and the providers you enabled. The Anthropic rows switch `CLAUDE_CONFIG_DIR` (a separate login, history, and settings per account); the provider rows call the Arcwright model launchers, which route to Z.ai, MiniMax, or OpenRouter using the keys in `~/.config/{zai,minimax,openrouter}/`. Each account still shares the same skills/commands/agents via the symlinks from the Setup steps, so switching account never changes your Arcwright tooling.

You can also auto-select by directory (e.g. work account anywhere under
`~/Projects/Work`) via `PROMPT_COMMAND` — see the bashrc snippet at the end.

### WSL2 / Windows — PowerShell launcher

On Windows the convenience is a PowerShell script (`claude-wsl.ps1` on your `PATH`,
e.g. `~/.local/bin/`) that translates the current Windows dir to a WSL path, shows a
numbered account menu, and launches `claude` inside WSL via a named [Herdr](https://herdr.dev)
session:

```powershell
[CmdletBinding()]
param(
    [string]$Path    = (Get-Location).Path,
    [string]$Session,
    [string]$Distro,
    [ValidateSet('Personal','Work','Alt')]
    [string]$Account
)

# ... resolve $Path -> $wslPath (D:\foo -> /mnt/d/foo) ...

if (-not $Account) {
    Write-Host "Select Claude account:" -ForegroundColor Cyan
    Write-Host "  [1] Personal`n  [2] Work`n  [3] Alt"
    do { $choice = Read-Host "Account (1-3)" } until ($choice -match '^[123]$')
    $Account = @{ '1'='Personal'; '2'='Work'; '3'='Alt' }[$choice]
}

switch ($Account) {
    'Work' { $envArg = '--env CLAUDE_CONFIG_DIR=$HOME/.claude-work' }
    'Alt'  { $envArg = '--env CLAUDE_CONFIG_DIR=$HOME/.claude-alt' }
    default { $envArg = '' }
}

# Per-account herdr session so accounts don't reattach to each other's session.
$Session = "$Session-$($Account.ToLower())"
$bashCmd = "cd '$wslPath' && herdr --session '$Session' agent start claude $envArg -- claude --dangerously-skip-permissions && herdr --session '$Session'"
& wsl @(if ($Distro) {'-d',$Distro}) bash -lc $bashCmd
```

Herdr has first-class named sessions (`herdr --session <name>` creates or attaches one
directly, no wrapper script needed). `herdr agent start ... --env KEY=VALUE -- <argv>`
spawns `claude` inside that session with the account's `CLAUDE_CONFIG_DIR` passed
explicitly, which is what guarantees the right account even if the Herdr **server**
already has a stale value cached from an earlier session — the second `herdr --session`
call then attaches you to watch it. See [Herdr documentation](https://herdr.dev) for the full command
reference.

---

## Updating

Because the assets are symlinked, **update once** as the default account:

```bash
arcwright update --global
```

All linked accounts see the new skills/commands/agents immediately. Do **not** run the
updater per-account — it would just rewrite the same `~/.claude` files.

---

## Reverting

Replace any symlink with a real copy (or restore from the backup dir):

```bash
for acct in work alt; do
  d=~/.claude-$acct
  for item in skills commands agents CLAUDE.md projects history.jsonl; do
    [ -L "$d/$item" ] && rm "$d/$item"
  done
done
# Restore original transcripts if desired:
#   mv ~/.claude-account-link-backup-<ts>/projects-work ~/.claude-work/projects
```

---

## Appendix — directory-based auto-switch (bashrc)

For non-interactive launches (e.g. the PowerShell launcher jumps straight into
`claude`), you can pick the account from the working directory at shell start:

```bash
_claude_config_switch() {
  case "$PWD" in
    "$HOME"/Projects/Work|"$HOME"/Projects/Work/*)
      export CLAUDE_CONFIG_DIR="$HOME/.claude-work" ;;
    *) unset CLAUDE_CONFIG_DIR ;;
  esac
}
_claude_config_switch
case ";${PROMPT_COMMAND:-};" in
  *";_claude_config_switch;"*) ;;
  *) PROMPT_COMMAND="_claude_config_switch${PROMPT_COMMAND:+;$PROMPT_COMMAND}" ;;
esac
```
