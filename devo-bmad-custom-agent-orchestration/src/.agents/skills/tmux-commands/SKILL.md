# Tmux Commands — Verified Command Library

Verified, tested tmux command templates for agent orchestration. Every command includes mandatory 10-second sleep guards to prevent race conditions.

**CRITICAL RULES:**
1. `sleep 10` before AND after every tmux command — no exceptions
2. Always append `Enter` to every `tmux send-keys` call
3. **Use `-l` (literal) flag for all free-form message content** — prevents `|`, `:`, and other chars being interpreted as tmux key sequences. Send `Enter` as a separate call after. Do NOT use `-l` for slash commands (`/color`, `/rename`, `/exit`) — those must be interpreted.
4. Verify pane exists before any operation targeting it
5. **`/color` and `/rename` are sent by the spawner** via separate `tmux send-keys` calls after the agent starts — never rely on the agent's prompt to self-invoke them. Each command is its own `send-keys` call with `Enter`, with `sleep 10` between.

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

# 1. Split the pane — wait 15s for WSL bash + Claude to initialize before sending commands
sleep 10
tmux split-window -h -c "$PROJECT_ROOT" \
  "claude --dangerously-skip-permissions 'You are the $ROLE agent. \
Your spawner pane is $SPAWNER_PANE. Session file: $SESSION_FILE. \
Always use -l flag for message content in tmux send-keys. \
Always sleep 10 before and after every tmux command. \
Always append Enter to every tmux send-keys call. \
Always verify pane exists before targeting it. \
$TASK_CONTEXT'"
sleep 15

# 2. Capture new pane ID
NEW_PANE_ID=$(tmux list-panes -F "#{pane_id}" | tail -1)

# 3. Set agent identity — spawner sends /color and /rename as separate commands.
#    Do NOT combine into one send-keys call; each must be submitted individually.
sleep 10
tmux send-keys -t "$NEW_PANE_ID" "/color $ROLE_COLOR" Enter
sleep 10
tmux send-keys -t "$NEW_PANE_ID" "/rename ${ROLE}-agent" Enter
sleep 10

# 4. Disable OSC 2 auto-rename (we use /rename instead)
tmux set-option -t "$NEW_PANE_ID" -p allow-rename off
sleep 10

# 5. Set pane border title (visible in tmux, separate from /rename)
tmux select-pane -t "$NEW_PANE_ID" -T "${ROLE}-${NEW_PANE_ID}"
sleep 10

# 6. Rebalance layout with master awareness
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

# 2. Send the message — use -l (literal) to prevent | : and other chars being
#    interpreted as tmux key sequences. ALWAYS append Enter separately.
sleep 10
tmux send-keys -t "$TARGET_PANE_ID" -l "$MESSAGE"
tmux send-keys -t "$TARGET_PANE_ID" Enter
sleep 10

# 3. Verify delivery — grep for first 2 words of message in pane buffer
GREP_TOKEN=$(echo "$MESSAGE" | awk '{print $1, $2}')
DELIVERED=$(tmux capture-pane -t "$TARGET_PANE_ID" -p -S - | tail -30 | grep -F "$GREP_TOKEN")
if [ -z "$DELIVERED" ]; then
  # Retry once
  echo "WARN: message not found in buffer, retrying..."
  sleep 10
  tmux send-keys -t "$TARGET_PANE_ID" -l "$MESSAGE"
  tmux send-keys -t "$TARGET_PANE_ID" Enter
  sleep 10
fi
```

### 3. `tmux_kill_agent` — Gracefully close an agent pane

**Trigger:** Coordinator sees a pane with status `ready-to-close` in the session file Pane Lifecycle table.

**Pre-conditions (verify all before killing):**
- [ ] Agent's report-back received (STEP COMPLETE message seen in this pane or session file updated)
- [ ] Task marked `done` in session file Tasks section
- [ ] Claude session ID saved to session file

```bash
# Inputs: TARGET_PANE_ID, MASTER_PANE, SESSION_FILE
TARGET_PANE_ID="%31"
MASTER_PANE="%0"

# 0. SELF-KILL GUARD — never kill your own pane
OWN_PANE=$(tmux display-message -p "#{pane_id}")
if [ "$TARGET_PANE_ID" = "$OWN_PANE" ]; then
  echo "ERROR: refusing to kill own pane $OWN_PANE — coordinator cannot kill itself"
  echo "If you need to exit, use /exit manually."
  exit 1
fi

# Also guard against killing the master pane (unless caller explicitly overrides)
if [ "$TARGET_PANE_ID" = "$MASTER_PANE" ]; then
  echo "ERROR: refusing to kill master pane $MASTER_PANE"
  exit 1
fi

# 1. Verify pane exists
sleep 10
VERIFIED=$(tmux list-panes -a -F "#{pane_id}" | grep -Fx "$TARGET_PANE_ID")
if [ -z "$VERIFIED" ]; then
  echo "WARN: pane $TARGET_PANE_ID already gone — marking closed in session file"
  # Update session file Pane Lifecycle row: status → closed
  exit 0
fi

# 2. Send /exit (lets Claude flush writes and exit cleanly)
sleep 10
tmux send-keys -t "$TARGET_PANE_ID" "/exit" Enter
sleep 10

# 3. Verify pane closed on its own (Claude exits after /exit)
STILL_ALIVE=$(tmux list-panes -a -F "#{pane_id}" | grep -Fx "$TARGET_PANE_ID")
if [ -n "$STILL_ALIVE" ]; then
  # Force kill if still up after /exit
  tmux kill-pane -t "$TARGET_PANE_ID"
  sleep 10
fi

# 4. Update session file — mark pane as closed in Pane Lifecycle table
# Edit row: status → closed, check coord ✓ boxes

# 5. Rebalance remaining panes
tmux select-pane -t "$MASTER_PANE"
sleep 10
tmux select-layout main-vertical
sleep 10

echo "Closed pane $TARGET_PANE_ID — session file updated, layout rebalanced"
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
    tmux select-layout main-vertical
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

### 6. `tmux_register_agent` — Agent startup: find session, register

Spawned agents do NOT self-invoke `/color` or `/rename` — the spawner sends those via `tmux send-keys` before handing off the task. This template handles session registration only.

The master/coordinator conversation is the exception: it runs `/color blue` and `/rename master-agent` manually as its first two actions since there is no spawner above it.

```bash
# Inputs: ROLE, SESSION_FILE (passed in spawn context)

# 1. Capture own identifiers
PANE_ID=$(tmux display-message -p "#{pane_id}")
SESSION_NAME=$(tmux display-message -p "#{session_name}")
WINDOW_ID=$(tmux display-message -p "#{window_id}")
PROJECT_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || echo "$PWD")

# 2. Determine role (passed via spawn context — $ROLE should be set)
ROLE="${ROLE:-unknown}"

# 3. Find session file — SESSION_FILE should be passed explicitly in spawn context.
#    Fall back to most recent only if not provided (fragile — prefer explicit pass).
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
# Use -l (literal) so | and : are not interpreted as tmux key sequences
tmux send-keys -t "$SPAWNER_PANE" -l \
  "STEP COMPLETE: $TASK_ID | result: $RESULT | session: $SESSION_ID"
tmux send-keys -t "$SPAWNER_PANE" Enter
sleep 10

# 4. Check for more pending tasks for this role
# 5. If found: claim next task and continue
# 6. If none:
#    a. Set status to `ready-to-close` in Pane Lifecycle table (NOT Active Agents)
#    b. Check all close-down boxes in Pane Lifecycle row:
#       ☑ report-back sent · ☑ session ID saved · ☑ task marked done · ☑ ready-to-close set
#    c. The COORDINATOR is responsible for executing /exit + kill-pane.
#       Do NOT self-exit unless you are the coordinator or explicitly told to.
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
Spawner pane: $SPAWNER_PANE. Session file: $SESSION_FILE. \
Always use -l flag for message content in tmux send-keys. \
Always sleep 10 before and after every tmux command. \
Always append Enter to every tmux send-keys call. \
Always verify pane exists before targeting it. \
$TASK_CONTEXT'"
sleep 15

# Capture ID
NEW_PANE_ID=$(tmux list-panes -F "#{pane_id}" | tail -1)

# Set agent identity — spawner sends /color and /rename as separate commands
sleep 10
tmux send-keys -t "$NEW_PANE_ID" "/color $ROLE_COLOR" Enter
sleep 10
tmux send-keys -t "$NEW_PANE_ID" "/rename ${ROLE}-agent" Enter
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
tmux send-keys -t "$AGENT_PANE" -l "Handle TASK-003 from the session file"
tmux send-keys -t "$AGENT_PANE" Enter
sleep 10
```

---

## Verification & Retry Protocol

Every tmux operation must be verified after execution. Never assume a command worked.

### Verifying `/color` and `/rename` applied

After the spawner sends identity commands, verify the pane is alive and responsive:

```bash
# After sending /color and /rename, verify pane is still active (not crashed)
sleep 10
PANE_ALIVE=$(tmux list-panes -a -F "#{pane_id}" | grep -Fx "$NEW_PANE_ID")
if [ -z "$PANE_ALIVE" ]; then
  echo "ERROR: agent pane $NEW_PANE_ID died after identity commands"
  exit 1
fi
# Note: /color and /rename visual effects are immediate in Claude Code.
# If the pane is alive, the commands were received.
```

### Verifying message delivery

Always capture the pane buffer after sending a message and grep for the key token:

```bash
tmux_verify_delivery() {
  local PANE="$1"
  local TOKEN="$2"   # unique substring from the message
  local RETRIES=3

  for i in $(seq 1 $RETRIES); do
    sleep 10
    FOUND=$(tmux capture-pane -t "$PANE" -p -S - | grep -F "$TOKEN")
    if [ -n "$FOUND" ]; then
      echo "OK: message confirmed in pane $PANE (attempt $i)"
      return 0
    fi
    if [ $i -lt $RETRIES ]; then
      echo "WARN: '$TOKEN' not found in pane $PANE, retrying ($i/$RETRIES)..."
    fi
  done

  echo "ERROR: message '$TOKEN' never confirmed in pane $PANE after $RETRIES attempts"
  return 1
}

# Usage after sending a message:
tmux send-keys -t "$TARGET_PANE" -l "$MESSAGE"
tmux send-keys -t "$TARGET_PANE" Enter
tmux_verify_delivery "$TARGET_PANE" "TASK-001"  # use a unique token from the message
```

### Verifying agent spawned and initialized

After splitting, confirm the pane exists and Claude has started (prompt visible):

```bash
# Wait for Claude prompt to appear in new pane (up to 30s)
READY=0
for i in 1 2 3; do
  sleep 10
  PROMPT=$(tmux capture-pane -t "$NEW_PANE_ID" -p -S - | grep -c "❯\|>\|Claude\|Human")
  if [ "$PROMPT" -gt 0 ]; then
    READY=1
    break
  fi
  echo "Waiting for agent to initialize (attempt $i)..."
done
if [ "$READY" -eq 0 ]; then
  echo "ERROR: agent pane $NEW_PANE_ID did not show prompt after 30s"
  exit 1
fi
```

### Retry rules

| Operation | Verify by | Max retries | On failure |
|---|---|---|---|
| Message send | grep token in pane buffer | 3 | Log error, write to session file |
| `/color` / `/rename` | pane still alive | 1 | Re-send both commands |
| Pane spawn | pane ID in list + prompt visible | 3 | Kill and re-spawn |
| Layout rebalance | `tmux list-panes` shows expected count | 1 | Re-run `select-layout` |

---

## Common Mistakes (Avoid These)

1. **Killing own pane** — always check `TARGET_PANE_ID != $(tmux display-message -p "#{pane_id}")` AND `TARGET_PANE_ID != MASTER_PANE` before `kill-pane`
2. **No `Enter` on send-keys** — message typed but never submitted
3. **No sleep between tmux commands** — race conditions, stale pane lists
3. **Combining `/color` and `/rename` in one send-keys call** — only the first command runs; send each as a separate call with `sleep 10` between
4. **Using OSC 2 / `select-pane -T` for naming** — Claude Code overwrites these
5. **Killing pane without `/exit` first** — leaves partial writes, git locks
6. **Using `tiled` layout instead of `main-vertical`/`main-horizontal`** — breaks master position
7. **Reading pane titles for routing** — unreliable; use session file pane IDs
8. **Spawning without `--dangerously-skip-permissions`** — agent halts on every tool use
9. **No `-l` flag on message content** — `|` and `:` get interpreted as key sequences, message is garbled
10. **Agent self-invoking `/color`+`/rename`** — unreliable; spawner sends these via `tmux send-keys` after the agent starts
