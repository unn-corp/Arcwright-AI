---
name: tmux-protocol
description: "tmux pane messaging protocol for multi-agent workflows. Load when $TMUX is set and orchestrating split-pane agents. Covers send-keys, delivery verification, pane spawning, Claude activity detection, polling, cross-pane notification, pane close, AGENT_SIGNAL protocol, and a full command library."
allowed-tools: Bash, Read, Write
---

# tmux-protocol

**Auto-load trigger:** Load this skill whenever `$TMUX` is set (tmux is active). Skip entirely if tmux is not active — all sections are tmux-only.

**Spawned agent rule:** Every split-pane agent spawned by this skill MUST include in its startup prompt:
> "Load `.agents/skills/tmux-protocol/SKILL.md` immediately — you are running inside tmux and must follow the tmux-protocol for messaging, polling, and close."

---

## Command Library

Reference this section as a plug-in template library. Replace `<CAPS>` placeholders with real values.

### Send a Message (with delayed Enter)

```bash
# Pattern: type the message first, sleep, then submit with Enter
# Use this for long prompts so Claude has time to display them before acting
tmux send-keys -t <PANE_ID> "<MESSAGE>"
sleep 3
tmux send-keys -t <PANE_ID> "" Enter
```

### Send a Message (immediate Enter)

```bash
tmux send-keys -t <PANE_ID> "<MESSAGE>" Enter
sleep 6
```

### Capture Pane Buffer (last N lines)

```bash
tmux capture-pane -t <PANE_ID> -p 2>/dev/null | tail -<N>
```

### Check if Pane Exists

```bash
tmux list-panes -a | grep -q "<PANE_ID>" && echo "alive" || echo "gone"
```

### Check if Claude is Idle (waiting for input)

```bash
# Claude shows a prompt marker (❯ or >) when idle/waiting
BUFFER=$(tmux capture-pane -t <PANE_ID> -p 2>/dev/null | tail -5)
echo "$BUFFER" | grep -qE "❯|>\s*$|\$\s*$" && echo "idle" || echo "working"
```

### Check if Claude is Working (active output)

```bash
BEFORE=$(tmux capture-pane -t <PANE_ID> -p 2>/dev/null | tail -5)
sleep 10
AFTER=$(tmux capture-pane -t <PANE_ID> -p 2>/dev/null | tail -5)
[ "$BEFORE" = "$AFTER" ] && echo "idle/stuck" || echo "working"
```

### Spawn a Split-Pane Agent (vertical split)

```bash
SPAWNER_PANE=$(tmux display-message -p "#{pane_id}")
sleep 3
tmux split-window -h -c "#{pane_current_path}" \
  "claude --dangerously-skip-permissions \
  'You are the <ROLE> agent. Master pane: $SPAWNER_PANE. Load .agents/skills/tmux-protocol/SKILL.md immediately. <TASK_CONTEXT>'"
sleep 8
NEW_PANE_ID=$(tmux list-panes -F "#{pane_id}" | tail -1)
tmux list-panes | grep -q "$NEW_PANE_ID" || { echo "ERROR: pane spawn failed"; exit 1; }
sleep 6
tmux set-option -t "$NEW_PANE_ID" -p allow-rename off
sleep 6
tmux select-pane -t "$NEW_PANE_ID" -T "<ROLE>-${NEW_PANE_ID}"
sleep 6
tmux select-layout tiled
```

### Spawn a Split-Pane Agent (horizontal split)

```bash
SPAWNER_PANE=$(tmux display-message -p "#{pane_id}")
sleep 3
tmux split-window -v -c "#{pane_current_path}" \
  "claude --dangerously-skip-permissions \
  'You are the <ROLE> agent. Master pane: $SPAWNER_PANE. Load .agents/skills/tmux-protocol/SKILL.md immediately. <TASK_CONTEXT>'"
sleep 8
NEW_PANE_ID=$(tmux list-panes -F "#{pane_id}" | tail -1)
sleep 6
tmux set-option -t "$NEW_PANE_ID" -p allow-rename off
sleep 6
tmux select-pane -t "$NEW_PANE_ID" -T "<ROLE>-${NEW_PANE_ID}"
sleep 6
tmux select-layout tiled
```

### Send Report-Back to Master

```bash
# Spawned agent sends this as its FINAL action before closing
tmux send-keys -t <MASTER_PANE_ID> "" Enter
sleep 2
tmux send-keys -t <MASTER_PANE_ID> "AGENT_SIGNAL::TASK_DONE::<ROLE>::<TASK_ID>::done::<SUMMARY>" Enter
sleep 6
```

### Close a Pipeline Pane (standard)

```bash
tmux send-keys -t <PANE_ID> "/exit" Enter
sleep 6
tmux kill-pane -t <PANE_ID>
sleep 6
tmux select-layout tiled
```

### Close a Team Pane (skip /exit)

```bash
tmux kill-pane -t <PANE_ID>
sleep 6
tmux select-layout tiled
```

### Poll for AGENT_SIGNAL (one check)

```bash
tmux capture-pane -t <PANE_ID> -p 2>/dev/null | tail -30 | grep "AGENT_SIGNAL"
```

### Send a Status Check Prompt

```bash
tmux send-keys -t <PANE_ID> "STATUS_CHECK: Please emit AGENT_SIGNAL with your current task status."
sleep 3
tmux send-keys -t <PANE_ID> "" Enter
sleep 15
tmux capture-pane -t <PANE_ID> -p 2>/dev/null | tail -30 | grep "AGENT_SIGNAL"
```

### Cross-Pane Notification Before Closing

```bash
# Use when you share a codebase with other panes — notify before stopping
for PEER_PANE in <PEER_PANE_1> <PEER_PANE_2>; do
  tmux list-panes -a | grep -q "$PEER_PANE" && \
    tmux send-keys -t "$PEER_PANE" \
      "PEER_SIGNAL::<YOUR_ROLE>::<PANE_ID>::closing::Finished <TASK_SUMMARY>. Files changed: <FILES>. No merge conflicts expected." Enter
  sleep 6
done
```

### Rebalance Layout

```bash
tmux select-layout tiled
```

---

## Sleep Timing Reference

| After this command | Minimum sleep |
|---|---|
| `split-window` | `sleep 8` |
| `send-keys`, `kill-pane`, `select-layout`, `set-option`, `select-pane -T` | `sleep 6` |
| Delayed-Enter pattern (type then Enter separately) | `sleep 3` between type and Enter |
| After sending a status check prompt | `sleep 15` before reading response |

---

## Pane Messaging Protocol

**Preferred pattern — type then Enter separately:**

```bash
# For any non-trivial message, prefer this over the inline-Enter form.
# It lets the pane render the full text before Claude processes it.
tmux send-keys -t <PANE_ID> "<MESSAGE>"
sleep 3
tmux send-keys -t <PANE_ID> "" Enter
sleep 6
```

**Short messages — inline Enter is fine:**

```bash
tmux send-keys -t <PANE_ID> "<SHORT_MESSAGE>" Enter
sleep 6
```

⚠️ **`Enter` is always mandatory.** Without it the message is typed but never submitted.

---

## Message Delivery Verification

Every `tmux send-keys` dispatch MUST be verified. `send-keys` is fire-and-forget — silent failures (bad pane ID, pane gone, agent crashed) go undetected without this check.

```bash
# 1. Send (use the delayed-Enter pattern for reliability)
tmux send-keys -t <PANE_ID> "<MESSAGE>"
sleep 3
tmux send-keys -t <PANE_ID> "" Enter
sleep 6

# 2. Verify a unique token from the message appears in the pane buffer
DELIVERY=$(tmux capture-pane -t <PANE_ID> -p 2>/dev/null | tail -15)
if ! echo "$DELIVERY" | grep -q "<UNIQUE_TOKEN>"; then
  echo "⚠️ Delivery unconfirmed to pane <PANE_ID> — retrying once..."
  tmux send-keys -t <PANE_ID> "<MESSAGE>"
  sleep 3
  tmux send-keys -t <PANE_ID> "" Enter
  sleep 6
  DELIVERY2=$(tmux capture-pane -t <PANE_ID> -p 2>/dev/null | tail -15)
  if ! echo "$DELIVERY2" | grep -q "<UNIQUE_TOKEN>"; then
    echo "❌ Message not delivered to pane <PANE_ID> after retry."
    # Surface to user: [retry] [respawn] [skip]
  fi
fi
```

Use the task ID as the unique token (e.g. `TASK-042`). If `capture-pane` returns non-zero, the pane is gone — skip the grep and go straight to respawn.

**Always confirm delivery before polling for `AGENT_SIGNAL`.** Polling a pane that never received the task will always time out.

---

## Detecting Claude's State

Use these checks to determine whether Claude is working, idle, or stuck before sending more messages.

### Is Claude idle (awaiting input)?

```bash
BUFFER=$(tmux capture-pane -t <PANE_ID> -p 2>/dev/null | tail -5)
if echo "$BUFFER" | grep -qE "❯\s*$|>\s*$|\$\s*$"; then
  echo "Claude is idle — safe to send a new message"
else
  echo "Claude may be working — wait before sending"
fi
```

### Is Claude still making progress?

```bash
SNAP1=$(tmux capture-pane -t <PANE_ID> -p 2>/dev/null | md5sum)
sleep 30
SNAP2=$(tmux capture-pane -t <PANE_ID> -p 2>/dev/null | md5sum)
if [ "$SNAP1" = "$SNAP2" ]; then
  echo "No change in 30s — possibly stuck or waiting"
else
  echo "Output is changing — Claude is working"
fi
```

### Full activity check (2-snapshot with longer interval)

```bash
SNAP1=$(tmux capture-pane -t <PANE_ID> -p 2>/dev/null | tail -10)
sleep 120   # wait 2 minutes
SNAP2=$(tmux capture-pane -t <PANE_ID> -p 2>/dev/null | tail -10)
if [ "$SNAP1" = "$SNAP2" ]; then
  echo "Idle or stuck after 2 min — send STATUS_CHECK"
else
  echo "Still working"
fi
```

---

## Polling Loop — Wait for Task Completion

Poll every 2–3 minutes, not continuously. Continuous polling wastes context and floods the buffer.

```bash
MAX_POLLS=15          # 15 × 2min = 30min max wait
POLL_COUNT=0
AGENT_DONE=false

while [ $POLL_COUNT -lt $MAX_POLLS ]; do
  sleep 120   # wait 2 minutes between checks

  # Check pane still alive
  if ! tmux list-panes -a | grep -q "<PANE_ID>"; then
    echo "❌ Pane <PANE_ID> gone — check session file and respawn"
    break
  fi

  # Check for completion signal
  SIG=$(tmux capture-pane -t <PANE_ID> -p 2>/dev/null | tail -30 | grep "AGENT_SIGNAL")
  if echo "$SIG" | grep -q "TASK_DONE\|TASK_BLOCKED\|ERROR"; then
    echo "✅ Signal received: $SIG"
    AGENT_DONE=true
    break
  fi

  # Check for activity (is Claude still working?)
  SNAP=$(tmux capture-pane -t <PANE_ID> -p 2>/dev/null | md5sum)
  if [ -n "$LAST_SNAP" ] && [ "$SNAP" = "$LAST_SNAP" ]; then
    STALL_COUNT=$((STALL_COUNT + 1))
    if [ "$STALL_COUNT" -ge 2 ]; then
      echo "⚠️ No activity for $(( STALL_COUNT * 2 )) minutes — sending STATUS_CHECK"
      tmux send-keys -t <PANE_ID> "STATUS_CHECK: Please emit AGENT_SIGNAL with current task status."
      sleep 3
      tmux send-keys -t <PANE_ID> "" Enter
      STALL_COUNT=0
    fi
  else
    STALL_COUNT=0
  fi
  LAST_SNAP="$SNAP"

  POLL_COUNT=$((POLL_COUNT + 1))
  echo "[poll $POLL_COUNT/$MAX_POLLS] Still waiting on <PANE_ID>..."
done

if [ "$AGENT_DONE" = false ]; then
  echo "❌ Timed out waiting for <PANE_ID> — present [retry] [respawn] [skip] to user"
fi
```

---

## Spawning a Split-Pane Agent

**Mandatory spawn sequence — do not reorder:**

```bash
SPAWNER_PANE=$(tmux display-message -p "#{pane_id}")
sleep 3
tmux split-window -h -c "#{pane_current_path}" \
  "claude --dangerously-skip-permissions \
  'You are the <ROLE> agent. Master pane: $SPAWNER_PANE. \
  FIRST ACTION: Load .agents/skills/tmux-protocol/SKILL.md. \
  <TASK_CONTEXT>'"
sleep 8
NEW_PANE_ID=$(tmux list-panes -F "#{pane_id}" | tail -1)
tmux list-panes | grep -q "$NEW_PANE_ID" || { echo "ERROR: pane spawn failed"; exit 1; }
sleep 6
tmux set-option -t "$NEW_PANE_ID" -p allow-rename off
sleep 6
tmux select-pane -t "$NEW_PANE_ID" -T "<ROLE>-${NEW_PANE_ID}"
sleep 6
tmux select-layout tiled
```

After spawning:
1. Record pane ID + role + CWD in session file Active Agents table
2. Record `name_source: auto`. If pane had a non-default title before spawn → `name_source: manual` — **NEVER rename a `manual` pane**
3. Pass `$SPAWNER_PANE` to the spawned agent so it knows where to report back

---

## Cross-Pane Notification Before Stopping

**Every spawned pane that touches shared files MUST notify peer panes before closing.** This prevents merge conflicts and silent overwrites when multiple agents work in the same codebase.

**Before closing, each agent MUST:**

1. Check the session file (`_arcwright/_memory/master-orchestrator-sidecar/session-state.md`) for other active panes
2. For each peer pane sharing the same working directory, send a `PEER_SIGNAL`
3. Wait briefly for acknowledgement, then close

```bash
# Read peer pane IDs from session state (master provides these at spawn time)
PEER_PANES="<PEER_PANE_1> <PEER_PANE_2>"   # space-separated

for PEER_PANE in $PEER_PANES; do
  if tmux list-panes -a | grep -q "$PEER_PANE"; then
    tmux send-keys -t "$PEER_PANE" \
      "PEER_SIGNAL::<YOUR_ROLE>::<YOUR_PANE_ID>::closing::Task complete. Files modified: <FILE_LIST>. Closing now."
    sleep 3
    tmux send-keys -t "$PEER_PANE" "" Enter
    sleep 6
  fi
done
```

**Receiving agent** — on seeing a `PEER_SIGNAL`:
- Log it to session state
- If files in `<FILE_LIST>` overlap with current work: pause and git-pull or stash before proceeding
- No reply required unless you have a conflict to flag

---

## Agent Report-Back Protocol

Every spawned agent MUST send a completion message to the master pane as its **final action** before closing:

```bash
tmux send-keys -t <MASTER_PANE_ID> "" Enter
sleep 2
tmux send-keys -t <MASTER_PANE_ID> \
  "AGENT_SIGNAL::TASK_DONE::<ROLE>::<TASK_ID>::done::<ONE_LINE_SUMMARY>" Enter
sleep 6
```

Master on receiving completion:
1. Parse step name, result, session ID
2. Update session file: set agent row `status: closed`, record `closed_at`
3. Handle findings/failures per track rules
4. Proceed to next pipeline step

---

## Pane Close Protocol

**Every pipeline pane closes in exactly this order:**

**Step 1 — Notify peers (if shared codebase):**
Send `PEER_SIGNAL` to all active peer panes that share the working directory (see Cross-Pane Notification section above).

**Step 2 — Send report-back to master:**
```bash
tmux send-keys -t <MASTER_PANE_ID> \
  "AGENT_SIGNAL::TASK_DONE::<ROLE>::<TASK_ID>::done::<SUMMARY>" Enter
sleep 6
```

**Step 3 — Send `/exit`:**
```bash
tmux send-keys -t <PANE_ID> "/exit" Enter
sleep 6
```
Lets Claude flush file writes and exit cleanly. Never skip.

**Step 4 — Kill the pane:**
```bash
tmux kill-pane -t <PANE_ID>
sleep 6
tmux select-layout tiled
```

⚠️ **Exception — agent team panes:** Team panes (`active_team.panes.*`) are killed directly with `tmux kill-pane` — never send `/exit` to team panes.

**Closing triggers per role:**

| Agent | Closes when |
|---|---|
| `dev-agent` / `quick-flow-solo-dev` | Code committed + PEER_SIGNAL sent + report-back sent |
| `qa-agent` | All tests pass or fail report sent + report-back sent |
| `review agent` | All verdicts collected, findings resolved + report-back sent |
| `pm-agent` / `sm-agent` (planning) | Output artifact written + report-back sent |
| `analyst-agent` | Research report written + report-back sent |
| `sm-agent` (epic loop coordinator) | Master sends `/exit` — never self-closes |
| Any agent with 🔴 unresolved | Stays open until user resolves blocker |

**After every pane close**, master MUST update session file before spawning the next pane.

---

## AGENT_SIGNAL Protocol

All agents in a team MUST emit structured signals:

```
AGENT_SIGNAL::{TYPE}::{FROM_ROLE}::{TASK_ID}::{STATUS}::{DETAIL}
```

| Type | When |
|------|------|
| `READY` | Agent activated and waiting |
| `TASK_START` | Task claimed |
| `PROGRESS` | Heartbeat every 60s for tasks > 90s |
| `TASK_DONE` | Task complete — always emit before stopping |
| `TASK_BLOCKED` | Needs human decision |
| `FINDING` | Issue found (precedes TASK_DONE) |
| `ERROR` | Unrecoverable error |

**Master polling after dispatch:**
1. `sleep 8` — let pane process task
2. Every 2 minutes: `tmux capture-pane -t {pane_id} -p | tail -30 | grep "AGENT_SIGNAL"`
3. `TASK_DONE` → route next action
4. `TASK_BLOCKED` → surface to user immediately
5. **No signal after 4 min** → send STATUS_CHECK prompt (delayed-Enter pattern), wait 15s, poll once more. Still nothing → mark unresponsive, present `[retry] [respawn] [skip]`

---

## Follow-up Task Routing with Active Teams

**This rule applies to EVERY user message while a team is active.** Active team = `active_team.panes` populated in `_arcwright/_memory/master-orchestrator-sidecar/session-state.md`.

**Master NEVER handles follow-up tasks inline when a team is active.**

**On every incoming user message:**

1. Read `session-state.md` — check `active_team.panes`
2. Triage (3 questions) to determine the owning role
3. Resolve pane ID from `active_team.panes.{role}` — never guess
4. Verify pane alive: `tmux list-panes -a | grep -q "<pane_id>"`
   - If gone: remove from session-state, respawn, re-register, then dispatch
5. Dispatch with full send + verify protocol (use delayed-Enter pattern)
6. **Respond in master pane:** _"→ Dispatched to `{role}` (`{pane_id}`): {task summary}. Polling for TASK_DONE..."_
7. Poll using the polling loop (every 2 min)
8. **Report back in master pane:** _"✅ `{role}` completed: {signal detail}"_

**Role routing for follow-ups:**

| Request type | Route to |
|---|---|
| Code change, bug fix, feature | `dev` |
| Tests, test failures | `qa` |
| Architecture, design decision | `architect` |
| Story breakdown, sprint management | `sm` |
| Security review | `sec` (if present) |
| Unclear | Ask user before dispatching |

**If needed role has no pane:** Tell the user which role is missing, offer to spawn it or handle inline.

**Queue multiple follow-ups.** Dispatch to different role panes in parallel if independent. Dispatch to the same pane sequentially — wait for `TASK_DONE` between each.

---

## In-Process Fallback (no tmux)

When `$TMUX` is not set, this entire skill is skipped. All agent work runs via the Agent tool sequentially. Master tracks loop state and passes completed agent output as structured handoff context to the next agent.
