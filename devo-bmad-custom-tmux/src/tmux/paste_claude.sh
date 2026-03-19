#!/bin/bash
# paste_claude.sh — paste Windows clipboard into any tmux pane with bracketed paste support
#
# Claude Code (and most modern TUI apps) use bracketed paste mode (\e[200~ ... \e[201~).
# Raw tmux paste-buffer -p bypasses these wrappers — Claude drops the input entirely.
# This script wraps the clipboard content in the correct bracketed paste escape sequences
# using tmux send-keys, which passes literal bytes directly to the pane's stdin.
#
# Usage (called from tmux binding):
#   bash ~/.config/tmux/bin/paste_claude.sh '#{pane_id}'
#
# Bound to C-v in tmux.conf (replaces the old paste-buffer -p binding).

PANE="${1:-}"

# Get clipboard content from Windows
CONTENT=$(powershell.exe -NoProfile -Command \
  "[Console]::OutputEncoding=[System.Text.Encoding]::UTF8; Get-Clipboard" \
  2>/dev/null | tr -d '\r')

[ -z "$CONTENT" ] && exit 0

# Send with bracketed paste sequences so Claude Code (and readline/readline-like TUIs) accept it.
# \e[200~ = paste start, \e[201~ = paste end
# send-keys without -l interprets the escape sequences correctly as terminal control codes.
tmux send-keys -t "$PANE" $'\e[200~'"${CONTENT}"$'\e[201~'
