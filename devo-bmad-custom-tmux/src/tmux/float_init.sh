#!/bin/bash
# Float terminal shell init — sourced via bash --init-file
[ -f ~/.bashrc ] && source ~/.bashrc 2>/dev/null

_float_w() { cat "${FLOAT_STATE:-/tmp/tmux_float_size}" 2>/dev/null || echo 80; }

float_bigger()  { printf $'\n'; exit 10; }
float_smaller() { printf $'\n'; exit 11; }

bind -x '"\e=": float_bigger'  2>/dev/null   # Alt+=
bind -x '"\e-": float_smaller' 2>/dev/null   # Alt+-

printf '  [%s%%]  Alt+= bigger  Alt+- smaller  Ctrl+D close\n' "$(_float_w)"
