---
description: tmux pane and session reference — splits, navigation, layouts, resizing, and agent workflow commands
---

# tmux Quick Reference

## Pane Splits

| Action | Command |
|--------|---------|
| Split vertical (side by side) | `tmux split-window -h` |
| Split horizontal (top/bottom) | `tmux split-window -v` |
| Split in current path | `tmux split-window -h -c "#{pane_current_path}"` |
| Split and run command | `tmux split-window -h "command"` |

## Pane Navigation

| Action | Command |
|--------|---------|
| Select pane by ID | `tmux select-pane -t %<id>` |
| Select pane left/right/up/down | `tmux select-pane -L/R/U/D` |
| List all panes | `tmux list-panes -a -F "#{session_name}:#{window_index}.#{pane_index} %#{pane_id} #{pane_title}"` |

## Pane Sizing & Layout

| Action | Command |
|--------|---------|
| Even horizontal layout | `tmux select-layout even-horizontal` |
| Even vertical layout | `tmux select-layout even-vertical` |
| Tiled (auto-balance all) | `tmux select-layout tiled` |
| Resize pane (pixels) | `tmux resize-pane -t %<id> -x <cols> -y <rows>` |

## Sending Keys to Panes

| Action | Command |
|--------|---------|
| Send text + Enter | `tmux send-keys -t %<id> "text" Enter` |
| Send without Enter | `tmux send-keys -t %<id> "text"` |
| Send to pane by index | `tmux send-keys -t <session>:<window>.<pane> "text" Enter` |

## Sessions & Windows

| Action | Command |
|--------|---------|
| New session | `tmux new-session -s <name>` |
| List sessions | `tmux list-sessions` |
| Switch session | `tmux switch-client -t <name>` |
| New window | `tmux new-window -c "#{pane_current_path}"` |
| Rename window | `tmux rename-window <name>` |
| Kill pane | `tmux kill-pane -t %<id>` |
| Kill session | `tmux kill-session -t <name>` |

## Pane Titles & IDs

| Action | Command |
|--------|---------|
| Get active pane ID | `tmux display-message -p "#{pane_id}"` |
| Set pane title | `printf '\033]2;%s\033\\' "title"` |
| Get pane title | `tmux display-message -p -t %<id> "#{pane_title}"` |
| List panes with IDs | `tmux list-panes -F "%#{pane_id} #{pane_index} #{pane_title}"` |

## Agent Workflow Pattern

Spawn a split-pane agent and communicate back to the spawner:

```bash
# 1. Capture spawner pane ID first
SPAWNER_PANE=$(tmux display-message -p "#{pane_id}")

# 2. Spawn agent in new pane
tmux split-window -h -c "#{pane_current_path}" \
  "claude --dangerously-skip-permissions '<task>'"

# 3. Agent signals completion back to spawner
tmux send-keys -t $SPAWNER_PANE "AGENT_SIGNAL::TASK_DONE::agent-name::done" Enter
```

## Pane Close Sequence (agents)

```bash
# Always send /exit first — lets the agent finish and save state
tmux send-keys -t %<id> "/exit" Enter
# Then kill the pane
tmux kill-pane -t %<id>
```

## Useful Inspection Commands

```bash
# All panes across all sessions with IDs and titles
tmux list-panes -a -F "#{session_name}:#{window_index} %#{pane_id} [#{pane_width}x#{pane_height}] #{pane_title}"

# Current pane info
tmux display-message -p "pane_id=#{pane_id} pane_index=#{pane_index} window=#{window_index}"

# Check if inside tmux
[ -n "$TMUX" ] && echo "in tmux" || echo "not in tmux"
```
