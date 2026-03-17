#!/bin/bash
# paste_image_wrapper.sh — reads clipboard via wl-paste, types path into pane.
#
# Requires: wl-clipboard (sudo apt-get install -y wl-clipboard)
# Optional: imagemagick for BMP/non-PNG conversion
#
# $1 = pane_id (e.g. %0)

PANE="${1:-}"
WL_PASTE="/usr/bin/wl-paste"

# Timestamped filenames — delete any tmux_clip_* files not from today
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
TODAY=$(date +%Y%m%d)
find /tmp -maxdepth 1 -name 'tmux_clip_*' ! -name "tmux_clip_${TODAY}*" -delete 2>/dev/null || true

PNGFILE="/tmp/tmux_clip_${TIMESTAMP}.png"
RAWFILE="/tmp/tmux_clip_${TIMESTAMP}_raw"
SVGFILE="/tmp/tmux_clip_${TIMESTAMP}.svg"
HTMLFILE="/tmp/tmux_clip_${TIMESTAMP}.html"
TXTFILE="/tmp/tmux_clip_${TIMESTAMP}.txt"

send_path() {
    [ -n "$1" ] && [ -n "$PANE" ] && tmux send-keys -t "$PANE" "$1"
}

TYPES=$("$WL_PASTE" --list-types 2>/dev/null)
[ -z "$TYPES" ] && exit 0

IMAGE_TYPE=$(echo "$TYPES" | grep -i "^image/" | head -1)

# ── Image ─────────────────────────────────────────────────────────────────────
if [ -n "$IMAGE_TYPE" ]; then
    if echo "$TYPES" | grep -qi "image/png"; then
        "$WL_PASTE" --type image/png > "$PNGFILE" 2>/dev/null
    elif echo "$IMAGE_TYPE" | grep -qi "svg"; then
        "$WL_PASTE" --type "$IMAGE_TYPE" > "$SVGFILE" 2>/dev/null
        command -v convert &>/dev/null \
            && convert "$SVGFILE" "$PNGFILE" 2>/dev/null \
            || cp "$SVGFILE" "$PNGFILE"
    else
        "$WL_PASTE" --type "$IMAGE_TYPE" > "$RAWFILE" 2>/dev/null
        command -v convert &>/dev/null \
            && { convert "$RAWFILE" "$PNGFILE" 2>/dev/null && rm -f "$RAWFILE"; } \
            || mv "$RAWFILE" "$PNGFILE"
    fi

    [ -s "$PNGFILE" ] || exit 1
    send_path "@$PNGFILE"
    /usr/bin/wl-copy --type image/png < "$PNGFILE" 2>/dev/null || true
    exit 0
fi

# ── Files from file manager ───────────────────────────────────────────────────
if echo "$TYPES" | grep -qi "text/uri-list"; then
    URIS=$("$WL_PASTE" --type text/uri-list 2>/dev/null)
    ALL_PATHS=""
    while IFS= read -r uri; do
        [ -z "$uri" ] && continue
        fpath=$(printf '%s' "$uri" | sed 's|^file://||' \
            | python3 -c "import sys,urllib.parse; print(urllib.parse.unquote(sys.stdin.read().strip()))" 2>/dev/null)
        [ -n "$fpath" ] && ALL_PATHS="$ALL_PATHS @$fpath"
    done <<< "$URIS"
    [ -n "$ALL_PATHS" ] && send_path "${ALL_PATHS# }"
    exit 0
fi

# ── HTML ──────────────────────────────────────────────────────────────────────
if echo "$TYPES" | grep -qi "text/html"; then
    "$WL_PASTE" --type text/html > "$HTMLFILE" 2>/dev/null
    send_path "$HTMLFILE"
    exit 0
fi

# ── Plain text ────────────────────────────────────────────────────────────────
TEXT=$("$WL_PASTE" 2>/dev/null)
FIRST_LINE=$(printf '%s' "$TEXT" | head -1 | tr -d ' ')
if [ -f "$FIRST_LINE" ] || [ -d "$FIRST_LINE" ]; then
    send_path "@$FIRST_LINE"
else
    printf '%s' "$TEXT" > "$TXTFILE"
    send_path "$TXTFILE"
fi
