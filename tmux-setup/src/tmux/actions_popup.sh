#!/bin/bash
# actions_popup.sh — fzf-powered actions menu
PANE="${1:-}"
FZF="${HOME}/.local/bin/fzf"

ITEMS=(
    "z  │ Zoom / unzoom pane"
    "p  │ Previous window"
    "n  │ Next window"
    "w  │ List windows & sessions"
    "W  │ New window"
    "K  │ Kill window"
    "N  │ Rename session"
    "X  │ Kill session"
    "d  │ Detach"
    "───┼──────────────────────────────────"
    "H  │ Split top / bottom"
    "V  │ Split left / right"
    "k  │ Kill pane"
    ",  │ Rename window"
    "s  │ Session chooser"
    "───┼──────────────────────────────────"
    "u  │ Swap pane up"
    "v  │ Swap pane down"
    "<  │ Swap pane left"
    ">  │ Swap pane right"
    "e  │ Break pane → new window"
    "J  │ Move pane to window…"
    "L  │ Pull pane from window…"
    "───┼──────────────────────────────────"
    "f  │ Float terminal"
    "t  │ Scratch terminal (M-i)"
    "M  │ Share session (Muxile)"
    "S  │ Save session"
    "R  │ Restore session"
    "───┼──────────────────────────────────"
    "r  │ Reload tmux config"
    "c  │ Copy mode  (o=open  S=search)"
    "i  │ Paste image"
    "o  │ Open clipboard URL/file"
    "g  │ Search clipboard in browser"
)

SELECTED=$(printf '%s\n' "${ITEMS[@]}" | "$FZF" \
    --ansi \
    --no-sort \
    --layout=reverse \
    --border=rounded \
    --border-label=" ⚙  Actions " \
    --border-label-pos=3 \
    --color="bg:#303446,bg+:#414559,fg:#c6d0f5,fg+:#c6d0f5" \
    --color="border:#626880,label:#ef9f76,prompt:#8caaee" \
    --color="pointer:#e78284,hl:#8caaee,hl+:#8caaee" \
    --prompt="  " \
    --pointer="▶" \
    --no-info \
    --bind "esc:abort" \
    --bind "left-click:accept" \
    --with-nth=1..2 \
    --delimiter="│")

[ -z "$SELECTED" ] && exit 0

IFS='│' read -r key _ <<< "$SELECTED"
key="${key//[[:space:]]/}"
[[ "$key" == "───" ]] && exit 0

T="${PANE:+-t $PANE}"
case "$key" in
    # ── Window & session ────────────────────────────────────────────────────
    z) tmux resize-pane -Z $T ;;
    p) tmux previous-window ;;
    n) tmux next-window ;;
    w) tmux choose-tree -s ;;
    W) CWD=$(tmux display-message -p ${PANE:+-t "$PANE"} '#{pane_current_path}' 2>/dev/null)
       tmux new-window ${CWD:+-c "$CWD"} ;;
    K) tmux confirm-before -p "Kill window? (y/n)" kill-window ;;
    N) tmux command-prompt -I "#{session_name}" "rename-session -- '%%'" ;;
    X) tmux confirm-before -p "Kill session? (y/n)" kill-session ;;
    d) tmux confirm-before -p "Detach? (y/n)" detach-client ;;
    # ── Pane controls ───────────────────────────────────────────────────────
    H) CWD=$(tmux display-message -p ${PANE:+-t "$PANE"} '#{pane_current_path}' 2>/dev/null)
       tmux split-window -v ${CWD:+-c "$CWD"} ;;
    V) CWD=$(tmux display-message -p ${PANE:+-t "$PANE"} '#{pane_current_path}' 2>/dev/null)
       tmux split-window -h ${CWD:+-c "$CWD"} ;;
    k) tmux confirm-before -p "Kill pane? (y/n)" kill-pane $T ;;
    ,) tmux command-prompt -I "#W" "rename-window -- '%%'" ;;
    s) tmux choose-tree -s ;;
    # ── Pane movement ───────────────────────────────────────────────────────
    u) tmux swap-pane -U $T ;;
    v) tmux swap-pane -D $T ;;
    '<') tmux swap-pane -U $T ;;
    '>') tmux swap-pane -D $T ;;
    e) tmux break-pane $T ;;
    J) tmux run-shell -b "sleep 0.2 && tmux choose-tree -w 'join-pane -t \"%%\"'" ;;
    L) tmux run-shell -b "sleep 0.2 && tmux choose-tree -w 'join-pane -s \"%%\"'" ;;
    # ── Tools ───────────────────────────────────────────────────────────────
    f) tmux run-shell -b "sleep 0.2 && bash ~/.config/tmux/bin/float_term.sh '$PANE'" ;;
    t) CWD=$(tmux display-message -p ${PANE:+-t "$PANE"} '#{pane_current_path}' 2>/dev/null)
       tmux run-shell -b "sleep 0.2 && tmux popup -d '${CWD:-$HOME}' -xC -yC -w70% -h70% -E 'tmux new -A -s floating'" ;;
    M) tmux run-shell -b "~/.tmux/plugins/muxile/scripts/main.sh" ;;
    S) tmux run-shell "~/.tmux/plugins/tmux-resurrect/scripts/save.sh" ;;
    R) tmux run-shell "~/.tmux/plugins/tmux-resurrect/scripts/restore.sh" ;;
    # ── Clipboard & copy ────────────────────────────────────────────────────
    r) tmux source-file ~/.tmux.conf \; display-message "Config reloaded" ;;
    c) tmux copy-mode $T ;;
    i) tmux run-shell -b "bash ~/.config/tmux/bin/paste_image_wrapper.sh '$PANE'" ;;
    o) tmux run-shell -b "bash ~/.config/tmux/bin/open_clip.sh url" ;;
    g) tmux run-shell -b "bash ~/.config/tmux/bin/open_clip.sh search" ;;
esac
