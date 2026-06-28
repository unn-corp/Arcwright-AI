# Vendored: tmux-claude-usage

These scripts render live Claude Code usage (5-hour + weekly rate-limit windows,
progress bar, percent, reset time) in the tmux status bar. They are vendored
unmodified from the upstream project.

- **Upstream:** https://github.com/docker-run/tmux-claude-usage
- **License:** MIT (see `LICENSE` in this directory)
- **Pinned commit:** `09f7c8f26d8310b664352c04671e1d1e9996c402`
- **Vendored:** 2026-06-28

## What each file does

| File | Role |
|------|------|
| `statusline.sh` | Claude Code statusLine "harvester" — Claude passes session JSON (incl. `rate_limits`) on every render; this writes usage to `~/.cache/claude-usage/usage` and prints nothing (no line in the pane). |
| `segment.sh` | tmux status segment — reads the cache and renders the bar. Pure bash, no network, no jq. Configurable via `@claude_usage_*` tmux options. |
| `helpers.sh` | Shared bash helpers (cache path, bar render, reset formatting, color thresholds). Sourced, not executed. |
| `chain.sh` | Passthrough wrapper used when the user already has a Claude statusLine — runs the harvester *and* the user's original line from the single statusLine slot. |
| `init.sh` | One-step wiring: adds the harvester to Claude's `settings.json` (backup first; chains an existing statusLine). `--uninstall` restores the original; `--check` diagnoses a blank bar. |

## Requirements

`tmux` 3.0+, `jq`, and a Claude Code session signed in with **Pro or Max** (the
`rate_limits` payload is only sent to Pro/Max sessions).

## Arcwright modifications (divergence from upstream)

These files are **patched** for multi-account support (look for
`# [arcwright multi-account]` markers). Upstream writes one shared cache
(`~/.cache/claude-usage/usage`), so running several logged-in Claude accounts at
once makes the last render win and the bar shows the wrong account.

The patch:
- `statusline.sh` keys the cache by account — `usage-<account>` derived from the
  harvester's `CLAUDE_CONFIG_DIR` (`~/.claude` → `default`, `~/.claude-work` →
  `claude-work`). Still refreshes the legacy `usage` file for the `--check` doctor.
- `helpers.sh` adds `claude_account_key()` and `active_pane_account()` (resolves
  the account of the tmux active pane via `/proc`, Linux-only, best-effort).
- `segment.sh` shows the account of the active pane (or the `@claude_usage_account`
  tmux option if set), falling back to the legacy/newest cache.

The Arcwright installer wires the harvester into **every** detected account
config dir. Worth upstreaming; until then, re-vendoring must re-apply these.

### Per-pane account signal (most reliable)

`status-right` is a single global `#()` whose output tmux shares across all
clients, so the segment must be told *which pane* it is rendering for. It is
wired as `#(segment.sh #{pane_pid} #{@claude_usage_account})` — tmux expands both
formats per client (its active pane), so every session resolves its own account.

Account precedence in `segment.sh`:
1. `@claude_usage_account` pane option (set by `set-account.sh`) — explicit, instant;
2. global `@claude_usage_account` (pin a whole session);
3. `/proc` auto-detect of the pane's claude `CLAUDE_CONFIG_DIR` (Linux-only);
4. legacy / newest cache.

`set-account.sh` (arcwright addition) sets the pane option from a launcher. Add
to a personal `claude-devo`-style wrapper, after choosing the account:

```sh
export CLAUDE_CONFIG_DIR="$HOME/.claude-work"   # whatever the user picked
bash ~/.config/tmux/bin/claude-usage/set-account.sh   # pins this pane to it
exec claude "$@"
```

## Updating

Re-vendor from upstream and bump the pinned commit above:

```sh
git clone --depth 1 https://github.com/docker-run/tmux-claude-usage /tmp/tcu
cp /tmp/tcu/scripts/{segment,statusline,helpers,chain,init}.sh \
   /tmp/tcu/LICENSE  <this dir>/
```

The Arcwright installer wires these in via `claude-usage/init.sh`, so no upstream
behavior is reimplemented here — only vendored.
