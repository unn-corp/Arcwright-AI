#!/usr/bin/env bash
#
# [arcwright addition — not from upstream tmux-claude-usage]
#
# Pin the CURRENT tmux pane's claude-usage segment to a specific Claude account.
# Call this from your launcher (e.g. a personal `claude-devo` wrapper) right
# after you choose the account and have exported CLAUDE_CONFIG_DIR, before you
# exec claude. It sets a pane-scoped tmux option that the segment reads as the
# top-priority signal — more reliable than the /proc auto-detection, and instant.
#
# Usage:
#   set-account.sh                 # derive the key from $CLAUDE_CONFIG_DIR (recommended)
#   set-account.sh ~/.claude-work  # derive from an explicit config dir
#   set-account.sh claude-work     # use an explicit account key
#
# The key MUST match the harvester's cache key (statusline.sh): the config dir's
# basename with a leading dot stripped; ~/.claude (or unset) → "default".
set -u

# Not inside tmux → nothing to pin (the env var still drives /proc detection).
[ -n "${TMUX_PANE:-}" ] || exit 0
command -v tmux >/dev/null 2>&1 || exit 0

arg="${1:-${CLAUDE_CONFIG_DIR:-$HOME/.claude}}"
key="$(basename "$arg")"
key="${key#.}" # strip leading dot (.claude-work → claude-work)
case "$key" in claude | '') key=default ;; esac

tmux set-option -p -t "$TMUX_PANE" @claude_usage_account "$key" 2>/dev/null
