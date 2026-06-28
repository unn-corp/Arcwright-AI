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

## Updating

Re-vendor from upstream and bump the pinned commit above:

```sh
git clone --depth 1 https://github.com/docker-run/tmux-claude-usage /tmp/tcu
cp /tmp/tcu/scripts/{segment,statusline,helpers,chain,init}.sh \
   /tmp/tcu/LICENSE  <this dir>/
```

The Arcwright installer wires these in via `claude-usage/init.sh`, so no upstream
behavior is reimplemented here — only vendored.
