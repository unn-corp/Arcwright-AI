#!/bin/sh
set -eu

input="$(mktemp "${TMPDIR:-/tmp}/herdr-claude-session.XXXXXX")" || exit 0
trap 'rm -f "$input"' EXIT HUP INT TERM
cat >"$input" 2>/dev/null || true

if [ "${HERDR_ENV:-}" = "1" ]; then
  CLAUDE_SESSION_PROFILE="${CLAUDE_CONFIG_DIR:-$HOME/.claude}" \
    python3 - "$input" <<'PY' || true
import json
import os
import pathlib
import re
import sys

try:
    payload = json.loads(pathlib.Path(sys.argv[1]).read_text(encoding="utf-8"))
    session_id = payload.get("session_id", "")
    if not isinstance(session_id, str) or not re.fullmatch(r"[A-Za-z0-9-]+", session_id):
        raise ValueError("invalid session id")
    profile = pathlib.Path(os.environ["CLAUDE_SESSION_PROFILE"]).expanduser().resolve()
    state = pathlib.Path.home() / ".local/state/herdr/claude-session-profiles"
    state.mkdir(parents=True, exist_ok=True)
    destination = state / session_id
    temporary = destination.with_suffix(".tmp")
    temporary.write_text(str(profile) + "\n", encoding="utf-8")
    temporary.replace(destination)
except Exception:
    pass
PY
fi

[ -x "$HOME/.claude/hooks/herdr-agent-state.sh" ] || exit 0
exec "$HOME/.claude/hooks/herdr-agent-state.sh" session <"$input"
