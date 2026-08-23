# Arcwright Herdr agent launch policy.
_arcwright_agent_binary() {
  if [[ -n "${BASH_VERSION:-}" ]]; then
    type -P "$1"
  else
    whence -p "$1"
  fi
}

claude() {
  local session_id="" arg profile_file profile claude_bin
  claude_bin="$(_arcwright_agent_binary claude)"
  for arg in "$@"; do
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
      env -u CLAUDE_CONFIG_DIR "$claude_bin" "$@"
    else
      CLAUDE_CONFIG_DIR="$profile" "$claude_bin" "$@"
    fi
  else
    "$claude_bin" "$@"
  fi
}
