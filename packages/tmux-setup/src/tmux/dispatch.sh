#!/bin/bash
# dispatch.sh — handles status bar button clicks
# $1 = mouse_status_range (button tag), $2 = pane_id
PANE="${2:-}"

case "$1" in
  reload)  tmux source-file ~/.config/tmux/tmux.conf && tmux display-message "Config reloaded" ;;
  actions) ;; # handled inline in tmux.conf MouseDown1Status binding
  *)  exit 0 ;;
esac
