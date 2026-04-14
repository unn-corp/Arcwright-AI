#!/bin/bash
# open_path.sh — open file path or URL under double-click in tmux pane
# Args: pane_id  mouse_x  mouse_row_in_pane  pane_cwd
PANE="$1"
MX="${2:-0}"
MY="${3:-0}"
CWD="${4:-$HOME}"

# Capture visible pane content and extract the clicked line (MY is 0-indexed)
LINE=$(tmux capture-pane -p -t "$PANE" 2>/dev/null | sed -n "$(( MY + 1 ))p")
[ -z "$LINE" ] && exit 0

# Extract file path / URL at cursor column x
TARGET=$(python3 - "$LINE" "$MX" << 'PYEOF'
import re, sys

line, x = sys.argv[1], int(sys.argv[2])

PATS = [
    r'https?://[^\s`\'"<>\)\]]+',      # URLs
    r'(?:~|\.\.?)?/[^\s`\'"<>\)\]]+',  # /absolute, ./relative, ../parent
]
result = ''
for pat in PATS:
    for m in re.finditer(pat, line):
        if m.start() <= x < m.end():
            result = m.group().rstrip('.,;:)')
            break
    if result:
        break

# Fallback: plain word at x that looks like a filename (has dot extension or slash)
if not result:
    seps = set(' \t`\'"[](){}|<>#')
    s, e = x, x
    while s > 0 and line[s-1] not in seps: s -= 1
    while e < len(line) and line[e] not in seps: e += 1
    word = line[s:e].strip('.,;:')
    EXTS = {'.py','.js','.ts','.tsx','.jsx','.md','.json','.yaml','.yml',
            '.sh','.bash','.zsh','.txt','.go','.rs','.java','.c','.h',
            '.cpp','.css','.html','.toml','.env','.conf','.cfg','.ini',
            '.sql','.graphql','.proto','.dockerfile'}
    if '/' in word or any(word.lower().endswith(ext) for ext in EXTS):
        result = word

print(result)
PYEOF
)

[ -z "$TARGET" ] && exit 0

# Strip :line[:col] suffix to get the bare file path for existence check
FILE="${TARGET%%:*}"

# Expand ~
FILE="${FILE/#\~/$HOME}"

# Resolve relative paths against the pane's working directory
if [[ "$FILE" != /* && "$FILE" != http* && "$FILE" != ftp* ]]; then
    FILE="$CWD/$FILE"
fi

# ── Opener ──────────────────────────────────────────────────────────────────

is_wsl() { grep -qi microsoft /proc/version 2>/dev/null; }

open_it() {
    local t="$1"
    if is_wsl; then
        # wslview converts Linux paths to Windows paths and uses ShellExecute,
        # which shows the "Open with" dialog if no default is registered.
        wslview "$t" 2>/dev/null \
            || powershell.exe -NoProfile -Command "Start-Process $(printf '%q' "$t")" 2>/dev/null
    elif command -v xdg-open &>/dev/null; then
        xdg-open "$t" 2>/dev/null &
    elif command -v open &>/dev/null; then
        open "$t" 2>/dev/null &
    else
        tmux display-message "No file opener found (install xdg-utils or wslu)"
    fi
}

# URLs — open directly
if [[ "$TARGET" == http* || "$TARGET" == ftp* ]]; then
    open_it "$TARGET"
    exit 0
fi

# File / directory — verify existence first
if [ -f "$FILE" ] || [ -d "$FILE" ]; then
    open_it "$FILE"
else
    tmux display-message "Not found: ${FILE/$HOME/\~}"
fi
