#!/bin/bash
# paste_clipboard.sh — Cross-platform clipboard paste for tmux
PLATFORM_FILE="$HOME/.config/tmux/platform"

if [ -f "$PLATFORM_FILE" ] && grep -q "linux" "$PLATFORM_FILE"; then
  # Native Linux: try Wayland first, fall back to X11
  wl-paste 2>/dev/null || xclip -selection clipboard -o 2>/dev/null || echo ""
else
  # Windows WSL: use PowerShell to read Windows clipboard
  powershell.exe -NoProfile -NonInteractive -Command \
    "[Console]::OutputEncoding = [System.Text.Encoding]::UTF8; (Get-Clipboard)" \
    2>/dev/null || echo ""
fi
