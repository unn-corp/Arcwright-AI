#!/bin/bash
# paste_clipboard.sh — paste text from Windows clipboard into tmux
TMPFILE=$(mktemp /tmp/tmux_paste_XXXXXX.txt)
powershell.exe -NoProfile -Command \
  "[Console]::OutputEncoding=[System.Text.Encoding]::UTF8; Get-Clipboard" \
  2>/dev/null | tr -d '\r' > "$TMPFILE"
BYTE_COUNT=$(wc -c < "$TMPFILE")
PREVIEW=$(head -c 80 "$TMPFILE" | cat -v)
tmux display-message "Clipboard bytes:${BYTE_COUNT} | ${PREVIEW}"
if [ -s "$TMPFILE" ]; then
    tmux load-buffer "$TMPFILE" && tmux paste-buffer -p
fi
rm -f "$TMPFILE"
