# Tmux Commands — Verified Command Library

Verified, tested tmux command templates for agent orchestration. Every command includes mandatory 10-second sleep guards to prevent race conditions.

**CRITICAL RULES:**
1. `sleep 10` before AND after every tmux command — no exceptions
2. Always append `Enter` to every `tmux send-keys` call
3. Verify pane exists before any operation targeting it
4. Use `/rename` and `/color` Claude Code commands (not OSC 2 or `select-pane -T`) for agent identity

---

## Role-to-Color Mapping

Every agent role maps to both a Claude Code `/color` value (prompt bar) and a tmux pane border hex color.

| Role | `/color` value | Pane border hex | Notes |
|------|---------------|-----------------|-------|
| master / coordinator | `blue` | `#3d6095` | Always pane index 1 |
| dev | `green` | `#4a6e38` | Primary dev agent |
| qa / review | `red` | `#783a3c` | QA and review agents |
| architect / pm | `purple` | `#5c3c78` | Planning roles |
| analyst / research | `orange` | `#784828` | Research-only agents |
| sm / ux | `cyan` | `#2a6e6e` | Scrum master, UX designer |
| tech-writer | `yellow` | `#6e6e2a` | Documentation agents |
| fallback (5+ agents) | `pink` | `#784848` | Overflow agents |

**To get the color for a role in bash:**
```bash
get_role_color() {
  case "$1" in
    master|coordinator) echo "blue" ;;
    dev)                echo "green" ;;
    qa|review)          echo "red" ;;
    architect|pm)       echo "purple" ;;
    analyst|research)   echo "orange" ;;
    sm|ux)              echo "cyan" ;;
    tech-writer)        echo "yellow" ;;
    *)                  echo "pink" ;;
  esac
}
```

---

## Verified Commands

### 1. `tmux_spawn_agent` — Split pane and initialize a new agent

Spawns a new Claude agent in a split pane, waits for it to initialize, sets identity via `/rename` and `/color`, and registers it.

```bash
# Inputs: ROLE, TASK_CONTEXT, SESSION_FILE, PROJECT_ROOT, MASTER_PANE
ROLE="dev"
ROLE_COLOR=$(get_role_color "$ROLE")
SPAWNER_PANE=$(tmux display-message -p "#{pane_id}")

# 1. Split the pane
sleep 10
tmux split-window -h -c "$PROJECT_ROOT" \
  "claude --dangerously-skip-permissions 'You are the $ROLE agent. \
FIRST: run /color $ROLE_COLOR then /rename $ROLE-agent. \
Spawner pane: $SPAWNER_PANE. Session file: $SESSION_FILE. \
Always sleep 10 before and after every tmux command. \
Always append Enter to every tmux send-keys call. \
Always verify pane exists before targeting it. \
$TASK_CONTEXT'"
sleep 10

# 2. Capture new pane ID
NEW_PANE_ID=$(tmux list-panes -F "#{pane_id}" | tail -1)
sleep 10

# 3. Disable OSC 2 auto-rename (we use /rename instead)
tmux set-option -t "$NEW_PANE_ID" -p allow-rename off
sleep 10

# 4. Set pane border title (visible in tmux, separate from /rename)
tmux select-pane -t "$NEW_PANE_ID" -T "${ROLE}-${NEW_PANE_ID}"
sleep 10

# 5. Rebalance layout with master awareness
tmux select-pane -t "$MASTER_PANE"
sleep 10
tmux select-layout main-vertical
sleep 10

echo "Spawned $ROLE agent in pane $NEW_PANE_ID"
```

### 2. `tmux_send_message` — Send a message to another pane with delivery verification

```bash
# Inputs: TARGET_PANE_ID, MESSAGE
TARGET_PANE_ID="%31"
MESSAGE="Please handle TASK-001 from the session file"

# 1. Verify pane exists
sleep 10
PANE_EXISTS=$(tmux list-panes -a -F "#{pane_id}" | grep -Fx "$TARGET_PANE_ID")
if [ -z "$PANE_EXISTS" ]; then
  echo "ERROR: pane $TARGET_PANE_ID does not exist"
  exit 1
fi

# 2. Send the message (ALWAYS with Enter)
sleep 10
tmux send-keys -t "$TARGET_PANE_ID" "$MESSAGE" Enter
sleep 10

# 3. Verify delivery — grep for first 2 words of message in pane buffer
GREP_TOKEN=$(echo "$MESSAGE" | awk '{print $1, $2}')
DELIVERED=$(tmux capture-pane -t "$TARGET_PANE_ID" -p -S - | tail -30 | grep -F "$GREP_TOKEN")
if [ -z "$DELIVERED" ]; then
  # Retry once
  echo "WARN: message not found in buffer, retrying..."
  sleep 10
  tmux send-keys -t "$TARGET_PANE_ID" "$MESSAGE" Enter
  sleep 10
fi
```

### 3. `tmux_kill_agent` — Gracefully close an agent pane

```bash
# Inputs: TARGET_PANE_ID, MASTER_PANE, SESSION_NAME, WINDOW_ID
TARGET_PANE_ID="%31"
MASTER_PANE="%0"

# 1. Verify pane exists in expected context
sleep 10
VERIFIED=$(tmux list-panes -a -F "#{pane_id} #{session_name} #{window_id}" \
  | grep "^$TARGET_PANE_ID ")
if [ -z "$VERIFIED" ]; then
  echo "ERROR: pane $TARGET_PANE_ID not found — aborting kill"
  exit 1
fi

# 2. Send /exit (lets Claude flush writes and exit cleanly)
sleep 10
tmux send-keys -t "$TARGET_PANE_ID" "/exit" Enter
sleep 10

# 3. Kill the pane
tmux kill-pane -t "$TARGET_PANE_ID"
sleep 10

# 4. Rebalance remaining panes
tmux select-pane -t "$MASTER_PANE"
sleep 10
tmux select-layout main-vertical
sleep 10

echo "Killed pane $TARGET_PANE_ID and rebalanced"
```

### 4. `tmux_rebalance` — Equalize pane sizes with master awareness

```bash
# Inputs: MASTER_PANE, MASTER_POS (left|right|top|bottom)
MASTER_PANE="%0"
MASTER_POS="left"

sleep 10
tmux select-pane -t "$MASTER_PANE"
sleep 10

case "$MASTER_POS" in
  left|right)
    tmux select-layout main-vertical
    ;;
  top|bottom)
    tmux select-layout main-horizontal
    ;;
  *)
    tmux select-layout tiled
    ;;
esac
sleep 10

echo "Rebalanced with master at $MASTER_POS"
```

### 5. `tmux_verify_pane` — Check if a pane exists and is valid

```bash
# Inputs: TARGET_PANE_ID
TARGET_PANE_ID="%31"

sleep 10
PANE_INFO=$(tmux list-panes -a -F "#{pane_id} #{session_name} #{window_id} #{pane_title}" \
  | grep "^$TARGET_PANE_ID ")

if [ -z "$PANE_INFO" ]; then
  echo "INVALID: pane $TARGET_PANE_ID does not exist"
  exit 1
else
  echo "VALID: $PANE_INFO"
  exit 0
fi
```

### 6. `tmux_register_agent` — Agent startup: find session, register, set identity

Every agent — including the master/coordinator conversation — runs this on startup BEFORE doing any work. The master conversation always runs `/color blue` + `/rename master-agent` first.

```bash
# Inputs: ROLE, SESSION_FILE (passed in spawn context)

# 1. Capture own identifiers
PANE_ID=$(tmux display-message -p "#{pane_id}")
SESSION_NAME=$(tmux display-message -p "#{session_name}")
WINDOW_ID=$(tmux display-message -p "#{window_id}")
PROJECT_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || echo "$PWD")

# 2. Set own identity via Claude Code commands
# (These are sent as slash commands in the Claude conversation, not bash)
# /color <role_color>
# /rename <role>-agent

# 3. Find session file
if [ -n "$BMAD_SESSION_ID" ]; then
  SESSION_FILE="$PROJECT_ROOT/_bmad-output/sessions/$BMAD_SESSION_ID/agent-sessions.md"
else
  ORCH_DIR="$PROJECT_ROOT/.agents/orchestration"
  mkdir -p "$ORCH_DIR"
  SESSION_FILE=$(ls -t "$ORCH_DIR"/session-*.md 2>/dev/null | head -1)
fi

# 4. Register in session file Active Agents table
# Use Edit tool to insert row — NOT raw echo-append
# | $PANE_ID | $SESSION_NAME | $WINDOW_ID | $ROLE | busy | $PROJECT_ROOT | ${ROLE}-${PANE_ID} | auto | — |

# 5. Check for pending tasks assigned to this role
# Scan Tasks section for: ### TASK-NNN · pending · $ROLE
# Claim oldest by changing status to in-progress and adding claimed:$PANE_ID
```

### 7. `tmux_complete_task` — Mark task done and check for more

```bash
# After completing a task:

# 1. Save Claude session ID to session file
# 2. Mark current task done in session file
# 3. Send report-back to spawner pane:
SPAWNER_PANE="%0"
TASK_ID="TASK-001"
RESULT="pass"
SESSION_ID="<claude_session_id>"

sleep 10
tmux send-keys -t "$SPAWNER_PANE" \
  "STEP COMPLETE: $TASK_ID | result: $RESULT | session: $SESSION_ID" Enter
sleep 10

# 4. Check for more pending tasks for this role
# 5. If found: claim next task
# 6. If none: set status to idle in Active Agents table
```

---

## Agent Spawn Template (Complete)

Use this template for ALL agent spawns. Copy the logic inline — spawned shells have no sourced functions.

```bash
#!/bin/bash
# Full spawn sequence with all guards

PROJECT_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || echo "$PWD")
ROLE="$1"          # e.g. "dev", "qa", "architect"
TASK_CONTEXT="$2"  # The task description
SESSION_FILE="$3"  # Path to session file
MASTER_PANE="$4"   # e.g. "%0"

# Resolve color
case "$ROLE" in
  master|coordinator) ROLE_COLOR="blue" ;;
  dev)                ROLE_COLOR="green" ;;
  qa|review)          ROLE_COLOR="red" ;;
  architect|pm)       ROLE_COLOR="purple" ;;
  analyst|research)   ROLE_COLOR="orange" ;;
  sm|ux)              ROLE_COLOR="cyan" ;;
  tech-writer)        ROLE_COLOR="yellow" ;;
  *)                  ROLE_COLOR="pink" ;;
esac

SPAWNER_PANE=$(tmux display-message -p "#{pane_id}")

# Split
sleep 10
tmux split-window -h -c "$PROJECT_ROOT" \
  "claude --dangerously-skip-permissions 'You are the $ROLE agent. \
FIRST: run /color $ROLE_COLOR then /rename $ROLE-agent. \
Spawner pane: $SPAWNER_PANE. Session file: $SESSION_FILE. \
Always sleep 10 before and after every tmux command. \
Always append Enter to every tmux send-keys call. \
Always verify pane exists before targeting it. \
$TASK_CONTEXT'"
sleep 10

# Capture ID
NEW_PANE_ID=$(tmux list-panes -F "#{pane_id}" | tail -1)
sleep 10

# Set tmux pane title (border label)
tmux set-option -t "$NEW_PANE_ID" -p allow-rename off
sleep 10
tmux select-pane -t "$NEW_PANE_ID" -T "${ROLE}-${NEW_PANE_ID}"
sleep 10

# Rebalance
tmux select-pane -t "$MASTER_PANE"
sleep 10
tmux select-layout main-vertical
sleep 10

echo "$NEW_PANE_ID"
```

---

## Session File Updates with Identity Commands

When a coordinator assigns a new task to an agent, it should also send `/rename` and `/color` if the agent's role changes:

```bash
# After updating session file with new task assignment:
NEW_ROLE="qa"
NEW_COLOR=$(get_role_color "$NEW_ROLE")

sleep 10
tmux send-keys -t "$AGENT_PANE" "/color $NEW_COLOR" Enter
sleep 10
tmux send-keys -t "$AGENT_PANE" "/rename $NEW_ROLE-agent" Enter
sleep 10
tmux send-keys -t "$AGENT_PANE" "Handle TASK-003 from the session file" Enter
sleep 10
```

---

## Common Mistakes (Avoid These)

1. **No `Enter` on send-keys** — message typed but never submitted
2. **No sleep between tmux commands** — race conditions, stale pane lists
3. **Using OSC 2 / `select-pane -T` for naming** — Claude Code overwrites these
4. **Killing pane without `/exit` first** — leaves partial writes, git locks
5. **Using `tiled` layout instead of `main-vertical`/`main-horizontal`** — breaks master position
6. **Reading pane titles for routing** — unreliable; use session file pane IDs
7. **Spawning without `--dangerously-skip-permissions`** — agent halts on every tool use
