#!/bin/bash
# Syncs active pane title → window name and (if window 1) session name.
# Respects @window-name-locked and @session-name-locked flags set by manual renames.
# Called from pane-title-changed hook and fallback hooks (after-select-window, client-focus-in).
#
# All tmux commands use -t PANE_ID so they target the correct session/window
# regardless of which session is "current" for this subprocess.
#
# Args:
#   $1  pane_id        e.g. %17
#   $2  pane_active    1 or 0
#   $3  window_index   e.g. 1
#   $4  pane_title     e.g. "✳ Claude Code"
#   $5  cwd_basename   e.g. "my-project"

PANE_ID="$1"
PANE_ACTIVE="$2"
WINDOW_INDEX="$3"
PANE_TITLE="$4"
CWD="$5"

# Always clear the placeholder hash — pane now has a real title
tmux set-option -pt "$PANE_ID" @pane-hash "" 2>/dev/null || true

# Only the active pane drives window/session naming
[ "$PANE_ACTIVE" = "1" ] || exit 0

# Rename window only if user has not manually locked it
wl=$(tmux show-options -wqv -t "$PANE_ID" @window-name-locked 2>/dev/null)
if [ -z "$wl" ]; then
    tmux rename-window -t "$PANE_ID" -- "$PANE_TITLE" 2>/dev/null || true
fi

# Rename session (with cwd suffix for uniqueness) only if:
#   - this is window 1, AND
#   - user has not manually locked the session name
if [ "$WINDOW_INDEX" = "1" ]; then
    sl=$(tmux show-options -qv -t "$PANE_ID" @session-name-locked 2>/dev/null)
    if [ -z "$sl" ]; then
        TARGET="$PANE_TITLE · $CWD"
        # If another session already has this name, append short pane ID to disambiguate
        EXISTING=$(tmux list-sessions -F "#{session_name}" 2>/dev/null | grep -Fx "$TARGET")
        CURRENT=$(tmux display-message -p -t "$PANE_ID" "#{session_name}" 2>/dev/null)
        if [ -n "$EXISTING" ] && [ "$CURRENT" != "$TARGET" ]; then
            # Strip % from pane ID for a clean suffix e.g. "✳ Claude Code · my-project · 20"
            SUFFIX="${PANE_ID#%}"
            TARGET="$PANE_TITLE · $CWD · $SUFFIX"
        fi
        tmux rename-session -t "$PANE_ID" -- "$TARGET" 2>/dev/null || true
    fi
fi

# Force status bar to repaint immediately
tmux refresh-client -S 2>/dev/null || true
