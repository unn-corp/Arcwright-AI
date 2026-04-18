#!/bin/bash
# paste_image_wrapper.sh — paste clipboard (image, file, or text) into a tmux pane.
# Called with run-shell -b so tmux server is never blocked.
#
# Strategy: try wl-paste with a 2s timeout. If WSLg/Wayland is dead, fall through
# to PowerShell (images) or win32yank (text). PowerShell is slow but only used
# for images where win32yank can't help.
#
# $1 = pane_id (e.g. %0)

PANE="${1:-}"
PANE_TTY="${2:-}"
WL_PASTE="/usr/bin/wl-paste"
WL_TIMEOUT=2

# Timestamped filenames — delete any tmux_clip_* files not from today
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
TODAY=$(date +%Y%m%d)
find /tmp -maxdepth 1 -name 'tmux_clip_*' ! -name "tmux_clip_${TODAY}*" -delete 2>/dev/null || true

PNGFILE="/tmp/tmux_clip_${TIMESTAMP}.png"
RAWFILE="/tmp/tmux_clip_${TIMESTAMP}_raw"
SVGFILE="/tmp/tmux_clip_${TIMESTAMP}.svg"
HTMLFILE="/tmp/tmux_clip_${TIMESTAMP}.html"

# Inject text into pane — tries tmux socket first, falls back to TIOCSTI if socket is dead.
# When PANE_TTY is empty (old binding or socket-dead self-discovery), scan /proc for the
# pane shell process by matching TMUX_PANE env var and reading its stdin PTY.
_tmux_server_pid() { echo "$TMUX" | cut -d, -f2; }

_find_pane_tty() {
    local target="$1" spid
    spid=$(_tmux_server_pid)
    [ -z "$spid" ] && return 1
    for dir in /proc/*/; do
        local pid="${dir%/}"; pid="${pid##*/}"
        [[ "$pid" =~ ^[0-9]+$ ]] || continue
        local ppid
        ppid=$(awk '/^PPid:/{print $2}' "$dir/status" 2>/dev/null)
        [ "$ppid" = "$spid" ] || continue
        local pane_env
        pane_env=$(tr '\0' '\n' < "$dir/environ" 2>/dev/null | grep "^TMUX_PANE=$target$")
        [ -n "$pane_env" ] || continue
        local tty
        tty=$(readlink "$dir/fd/0" 2>/dev/null)
        [[ "$tty" == /dev/pts/* ]] && echo "$tty" && return 0
    done
    return 1
}


_send() {
    local text="$1" esc_pre="$2" esc_post="$3"
    [ -z "$text" ] && return 1
    # Try tmux socket
    if [ -n "$PANE" ]; then
        if [ -n "$esc_pre" ]; then
            tmux send-keys -t "$PANE" "$esc_pre$text$esc_post" 2>/dev/null && return 0
        else
            tmux send-keys -t "$PANE" "$text" 2>/dev/null && return 0
        fi
    fi
    # Socket dead — copy to Windows clipboard and show inline notification in the pane
    printf '%s' "$text" | clip.exe 2>/dev/null
    local tty="${PANE_TTY:-$(_find_pane_tty "$PANE")}"
    if [ -n "$tty" ]; then
        printf '\r\n\033[33m[socket dead — path in clipboard, press Ctrl+V: %s]\033[0m\r\n' "$text" > "$tty" 2>/dev/null
    fi
}

send_path() { _send "$1" "" ""; }
send_text() { _send "$1" $'\e[200~' $'\e[201~'; }

# ── Try wl-paste first (fast when WSLg works) ───────────────────────────────
TYPES=$(timeout "$WL_TIMEOUT" "$WL_PASTE" --list-types 2>/dev/null)
WL_OK=$?

if [ $WL_OK -eq 0 ] && [ -n "$TYPES" ]; then
    IMAGE_TYPE=$(echo "$TYPES" | grep -i "^image/" | head -1)

    # ── Image via wl-paste ───────────────────────────────────────────────
    if [ -n "$IMAGE_TYPE" ]; then
        if echo "$TYPES" | grep -qi "image/png"; then
            timeout "$WL_TIMEOUT" "$WL_PASTE" --type image/png > "$PNGFILE" 2>/dev/null
        elif echo "$IMAGE_TYPE" | grep -qi "svg"; then
            timeout "$WL_TIMEOUT" "$WL_PASTE" --type "$IMAGE_TYPE" > "$SVGFILE" 2>/dev/null
            command -v convert &>/dev/null \
                && convert "$SVGFILE" "$PNGFILE" 2>/dev/null \
                || cp "$SVGFILE" "$PNGFILE"
        else
            timeout "$WL_TIMEOUT" "$WL_PASTE" --type "$IMAGE_TYPE" > "$RAWFILE" 2>/dev/null
            command -v convert &>/dev/null \
                && { convert "$RAWFILE" "$PNGFILE" 2>/dev/null && rm -f "$RAWFILE"; } \
                || mv "$RAWFILE" "$PNGFILE"
        fi

        # wl-paste can list image types but write 0 bytes — fall back to Get-Clipboard
        if [ ! -s "$PNGFILE" ]; then
            _WP=$(wslpath -w "$PNGFILE" 2>/dev/null)
            [ -n "$_WP" ] && powershell.exe -NoProfile -STA -Command "
                Add-Type -AssemblyName System.Drawing
                \$img = Get-Clipboard -Format Image -ErrorAction SilentlyContinue
                if (\$img -ne \$null) { \$img.Save('$_WP'); \$img.Dispose() }
            " 2>/dev/null
        fi

        if [ -s "$PNGFILE" ]; then
            send_path "@$PNGFILE"
            timeout "$WL_TIMEOUT" /usr/bin/wl-copy --type image/png < "$PNGFILE" 2>/dev/null || true
            exit 0
        fi
    fi

    # ── Files via wl-paste ───────────────────────────────────────────────
    if echo "$TYPES" | grep -qi "text/uri-list"; then
        URIS=$(timeout "$WL_TIMEOUT" "$WL_PASTE" --type text/uri-list 2>/dev/null)
        ALL_PATHS=""
        while IFS= read -r uri; do
            [ -z "$uri" ] && continue
            fpath=$(printf '%s' "$uri" | sed 's|^file://||' \
                | python3 -c "import sys,urllib.parse; print(urllib.parse.unquote(sys.stdin.read().strip()))" 2>/dev/null)
            [ -n "$fpath" ] && ALL_PATHS="$ALL_PATHS @$fpath"
        done <<< "$URIS"
        [ -n "$ALL_PATHS" ] && send_path "${ALL_PATHS# }" && exit 0
    fi

    # ── HTML via wl-paste ────────────────────────────────────────────────
    if echo "$TYPES" | grep -qi "text/html"; then
        timeout "$WL_TIMEOUT" "$WL_PASTE" --type text/html > "$HTMLFILE" 2>/dev/null
        [ -s "$HTMLFILE" ] && send_path "$HTMLFILE" && exit 0
    fi

    # ── Text via wl-paste ────────────────────────────────────────────────
    TEXT=$(timeout "$WL_TIMEOUT" "$WL_PASTE" 2>/dev/null)
    if [ -n "$TEXT" ]; then
        FIRST_LINE=$(printf '%s' "$TEXT" | head -1 | tr -d ' ')
        if [ -f "$FIRST_LINE" ] || [ -d "$FIRST_LINE" ]; then
            send_path "@$FIRST_LINE"
        else
            send_text "$TEXT"
        fi
        exit 0
    fi
fi

# ── Fallback: wl-paste failed or timed out ───────────────────────────────────

# Try PowerShell: image then file list (Get-Clipboard handles PNG+BITMAP, Windows Forms only handles BITMAP)
WINPATH=$(wslpath -w "$PNGFILE" 2>/dev/null)
if [ -n "$WINPATH" ]; then
    PS_OUT=$(powershell.exe -NoProfile -STA -Command "
        Add-Type -AssemblyName System.Drawing
        \$img = Get-Clipboard -Format Image -ErrorAction SilentlyContinue
        if (\$img -ne \$null) {
            \$img.Save('$WINPATH'); \$img.Dispose()
            Write-Output 'IMAGE'
        } else {
            \$files = Get-Clipboard -Format FileDropList -ErrorAction SilentlyContinue
            if (\$files) { Write-Output ('FILES:' + (\$files -join '|')) }
        }
    " 2>/dev/null | tr -d '\r')

    case "$PS_OUT" in
        IMAGE)
            if [ -s "$PNGFILE" ]; then send_path "@$PNGFILE" && exit 0; fi
            ;;
        FILES:*)
            ALL_PATHS=""
            IFS='|' read -ra WFILES <<< "${PS_OUT#FILES:}"
            for wf in "${WFILES[@]}"; do
                [ -z "$wf" ] && continue
                lf=$(wslpath -u "$wf" 2>/dev/null)
                [ -n "$lf" ] && ALL_PATHS="$ALL_PATHS @$lf"
            done
            [ -n "$ALL_PATHS" ] && send_path "${ALL_PATHS# }" && exit 0
            ;;
    esac
fi

# Last resort: plain text via win32yank (instant, never hangs)
TEXT=$(win32yank.exe -o --lf 2>/dev/null)
if [ -n "$TEXT" ]; then
    FIRST_LINE=$(printf '%s' "$TEXT" | head -1 | tr -d ' ')
    if [ -f "$FIRST_LINE" ] || [ -d "$FIRST_LINE" ]; then
        send_path "@$FIRST_LINE"
    else
        send_text "$TEXT"
    fi
fi
