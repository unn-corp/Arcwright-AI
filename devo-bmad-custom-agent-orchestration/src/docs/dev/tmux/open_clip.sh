#!/bin/bash
# open_clip.sh — open clipboard as URL/file or browser search
# Usage: open_clip.sh [url|search]
MODE="${1:-url}"
CLIP=$(powershell.exe -NoProfile -Command \
    "[Console]::OutputEncoding=[System.Text.Encoding]::UTF8; Get-Clipboard" \
    2>/dev/null | tr -d '\r' | head -1)
[ -z "$CLIP" ] && exit 1

case "$MODE" in
    url)    powershell.exe Start "$CLIP" 2>/dev/null ;;
    search) ENC=$(python3 -c "import urllib.parse,sys; print(urllib.parse.quote(sys.argv[1]))" "$CLIP" 2>/dev/null || printf '%s' "$CLIP")
            powershell.exe Start "https://www.google.com/search?q=${ENC}" 2>/dev/null ;;
esac
