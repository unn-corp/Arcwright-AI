# Arcwright Herdr agent launch policy.
_arcwright_agent_binary() {
  if [[ -n "${BASH_VERSION:-}" ]]; then
    type -P "$1"
  else
    whence -p "$1"
  fi
}

codex() {
  local arg
  for arg in "$@"; do
    [[ "$arg" == --yolo ]] && { command codex "$@"; return; }
  done
  command codex --yolo "$@"
}

claude() {
  local session_id="" arg profile_file profile claude_bin bypass_flag="--dangerously-skip-permissions"
  claude_bin="$(_arcwright_agent_binary claude)"
  for arg in "$@"; do
    [[ "$arg" == --dangerously-skip-permissions ]] && bypass_flag=""
    if [[ "$arg" == --resume=* ]]; then
      session_id="${arg#--resume=}"
    elif [[ "$arg" == --resume ]]; then
      session_id="__next__"
    elif [[ "$session_id" == __next__ ]]; then
      session_id="$arg"
    fi
  done

  profile_file="$HOME/.local/state/herdr/claude-session-profiles/$session_id"
  if [[ -n "$session_id" && -f "$profile_file" ]]; then
    IFS= read -r profile <"$profile_file"
    if [[ "$profile" == "$HOME/.claude" ]]; then
      env -u CLAUDE_CONFIG_DIR "$claude_bin" ${bypass_flag:+"$bypass_flag"} "$@"
    else
      CLAUDE_CONFIG_DIR="$profile" "$claude_bin" ${bypass_flag:+"$bypass_flag"} "$@"
    fi
  else
    "$claude_bin" ${bypass_flag:+"$bypass_flag"} "$@"
  fi
}
