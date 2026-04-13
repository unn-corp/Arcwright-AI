#!/bin/bash
# float_term.sh — resizable float terminal
# Exit codes from inner shell: 10 = bigger, 11 = smaller, else = close
PANE="${1:-}"
STATE="/tmp/tmux_float_size"
[ -f "$STATE" ] || echo "80" > "$STATE"

while true; do
    W=$(cat "$STATE" 2>/dev/null); W=${W:-80}
    CWD=$(tmux display-message -p ${PANE:+-t "$PANE"} '#{pane_current_path}' 2>/dev/null)

    tmux display-popup -E \
        -d "${CWD:-$HOME}" -xC -yC \
        -w "${W}%" -h "${W}%" \
        "FLOAT_STATE='$STATE' bash --init-file ~/.config/tmux/bin/float_init.sh -i"

    rc=$?
    case $rc in
        10) NEW=$(( W + 10 )); [ $NEW -gt 96 ] && NEW=96; echo "$NEW" > "$STATE" ;;
        11) NEW=$(( W - 10 )); [ $NEW -lt 30 ] && NEW=30; echo "$NEW" > "$STATE" ;;
        *) break ;;
    esac
done
