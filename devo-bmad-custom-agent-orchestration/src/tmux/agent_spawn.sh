#!/bin/bash
# agent_spawn.sh — BMAD agent pane wrapper
# Spawns a claude agent and auto-kills the pane when it exits.
# Prevents dead panes accumulating and cleans up orphaned subprocesses.
# Safe to run in parallel — each instance is fully isolated by PID and pane ID.
#
# Usage (from tmux split-window):
#   tmux split-window -h "~/.config/tmux/bin/agent_spawn.sh 'agent prompt here'"

set -uo pipefail

# Capture this pane's ID immediately — must run inside the pane, not the spawner
PANE_ID=$(tmux display-message -p "#{pane_id}" 2>/dev/null || echo "")

# Claude's PID — set once it starts, used by cleanup
CLAUDE_PID=""

# Cleanup: terminate claude's subprocess tree, then self-destruct the pane
_cleanup() {
  local exit_code=$?
  if [ -n "$CLAUDE_PID" ]; then
    # SIGTERM first — gives claude a chance to flush/save state
    kill "$CLAUDE_PID" 2>/dev/null || true
    # Kill any child processes claude spawned (node workers, tool procs)
    pkill -TERM -P "$CLAUDE_PID" 2>/dev/null || true
    sleep 0.5
    # Force-kill anything still alive
    kill -9 "$CLAUDE_PID" 2>/dev/null || true
    pkill -KILL -P "$CLAUDE_PID" 2>/dev/null || true
  fi
  # Brief pause so final output is visible before pane disappears
  sleep 1
  # Self-destruct the pane — safe to call even if master already ran kill-pane
  if [ -n "$PANE_ID" ]; then
    tmux kill-pane -t "$PANE_ID" 2>/dev/null || true
  fi
  exit "$exit_code"
}

trap _cleanup EXIT INT TERM

# Run claude in the background so we can track its PID
# Do NOT use exec — the shell must stay alive for the trap to fire
claude --dangerously-skip-permissions "$@" &
CLAUDE_PID=$!

# Wait for claude to finish — exits with claude's exit code
wait "$CLAUDE_PID"
