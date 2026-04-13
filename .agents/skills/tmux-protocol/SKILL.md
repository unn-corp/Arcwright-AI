# tmux-protocol

**Auto-load trigger:** Load this skill whenever `$TMUX` is set (tmux is active). Skip entirely if tmux is not active — all sections are tmux-only.

---

## Pane Messaging Protocol

**Sending a message to another pane:**

```bash
tmux send-keys -t <pane_id> "<message>" Enter
```

⚠️ **`Enter` is mandatory.** Without it the message is typed but never submitted.

---

### Message Delivery Verification

**Every `tmux send-keys` dispatch MUST be verified.** `send-keys` is fire-and-forget — silent failures (bad pane ID, pane gone, agent crashed) go undetected without this check.

```bash
# 1. Send
tmux send-keys -t <pane_id> "<message>" Enter
sleep 6

# 2. Verify a unique token from the message appears in the pane buffer
DELIVERY=$(tmux capture-pane -t <pane_id> -p 2>/dev/null | tail -15)
if ! echo "$DELIVERY" | grep -q "<unique_token>"; then
  echo "⚠️ Delivery unconfirmed to pane <pane_id> — retrying once..."
  tmux send-keys -t <pane_id> "<message>" Enter
  sleep 6
  DELIVERY2=$(tmux capture-pane -t <pane_id> -p 2>/dev/null | tail -15)
  if ! echo "$DELIVERY2" | grep -q "<unique_token>"; then
    echo "❌ Message not delivered to pane <pane_id> after retry."
    # Surface to user: [retry] [respawn] [skip]
  fi
fi
```

Use the task ID as the token (e.g. `TASK-042`). If `capture-pane` returns non-zero, the pane is gone — skip the grep and go straight to respawn.

**Always confirm delivery before polling for `AGENT_SIGNAL`.** Polling a pane that never received the task will always time out.

---

### Sleep Between tmux Commands

tmux is async — always sleep between consecutive operations:

| After this command | Minimum sleep |
|---|---|
| `split-window` | `sleep 8` |
| `send-keys`, `kill-pane`, `select-layout`, `set-option`, `select-pane -T` | `sleep 6` |

---

## Spawning a Split-Pane Agent

**Mandatory spawn sequence — do not reorder:**

```bash
SPAWNER_PANE=$(tmux display-message -p "#{pane_id}")
sleep 3
tmux split-window -h -c "#{pane_current_path}" \
  "claude --dangerously-skip-permissions --strict-mcp-config --mcp-config '{\"mcpServers\":{}}' \
  'You are the <role> agent. Master pane: $SPAWNER_PANE. <task context>'"
sleep 8
NEW_PANE_ID=$(tmux list-panes -F "#{pane_id}" | tail -1)
tmux list-panes | grep -q "$NEW_PANE_ID" || { echo "ERROR: pane spawn failed"; exit 1; }
sleep 6
tmux set-option -t "$NEW_PANE_ID" -p allow-rename off
sleep 6
tmux select-pane -t "$NEW_PANE_ID" -T "${ROLE}-${NEW_PANE_ID}"
sleep 6
tmux select-layout tiled
```

After spawning:
1. Record pane ID + role + CWD in session file Active Agents table
2. Record `name_source: auto`. If pane had a non-default title before spawn → `name_source: manual` — **NEVER rename a `manual` pane**
3. Pass `$SPAWNER_PANE` to the spawned agent so it knows where to report back

---

## Agent Report-Back Protocol

Every spawned agent MUST send a completion message to the master pane as its final action:

```bash
tmux send-keys -t <master_pane_id> "✅ STEP COMPLETE: <step-name> | result: <pass/fail/summary> | session: <claude_session_id>" Enter
```

This is non-negotiable — master blocks on this signal to advance the pipeline.

**Master on receiving completion:**
1. Parse step name, result, session ID
2. Update session file: set agent row `status: closed`, record `closed_at` + session ID
3. Handle findings/failures per track rules
4. Proceed to next pipeline step

---

## Pane Close Protocol

**Every pipeline pane closes in exactly this order:**

**Step 1 — Send `/exit`:**
```bash
tmux send-keys -t <pane_id> "/exit" Enter
sleep 6
```
Lets Claude flush file writes and exit cleanly. Never skip.

**Step 2 — Kill the pane:**
```bash
tmux kill-pane -t <pane_id>
sleep 6
tmux select-layout tiled
```

⚠️ **Exception — agent team panes:** Team panes (`active_team.panes.*`) are killed directly with `tmux kill-pane` — never send `/exit` to team panes.

**Closing triggers per role:**

| Agent | Closes when |
|---|---|
| `dev-agent` / `quick-flow-solo-dev` | Code committed + report-back sent |
| `qa-agent` | All tests pass or fail report sent + report-back sent |
| `review agent` | All verdicts collected, findings resolved + report-back sent |
| `pm-agent` / `sm-agent` (planning) | Output artifact written + report-back sent |
| `analyst-agent` | Research report written + report-back sent |
| `sm-agent` (epic loop coordinator) | Master sends `/exit` — never self-closes |
| Any agent with 🔴 unresolved | Stays open until user resolves blocker |

**After every pane close**, master MUST update session file before spawning the next pane.

---

## Master Pane Monitoring

After spawning a split-pane agent, master polls pane health every 30s:

```bash
while true; do
  sleep 30
  if ! tmux list-panes -a | grep -q "$AGENT_PANE"; then
    echo "WARN: Agent pane $AGENT_PANE gone — check session file"
    break
  fi
  STATUS=$(tmux capture-pane -t "$AGENT_PANE" -p | tail -3)
  echo "[$(date +%H:%M:%S)] Agent check: $STATUS"
done &
MONITOR_PID=$!
# Kill when done: kill $MONITOR_PID 2>/dev/null
```

For Mode [1] (same-conversation): check session file after each step instead of polling.

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
2. Every 30s: `tmux capture-pane -t {pane_id} -p | tail -30 | grep "AGENT_SIGNAL"`
3. `TASK_DONE` → route next action
4. `TASK_BLOCKED` → surface to user immediately
5. **No signal after 2 min** → send `STATUS_CHECK: Please emit AGENT_SIGNAL with current task status`, wait 15s, poll once more. Still nothing → mark unresponsive, present `[retry] [respawn] [skip]`

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
5. Dispatch with full send + verify protocol
6. **Respond in master pane:** _"→ Dispatched to `{role}` (`{pane_id}`): {task summary}. Polling for TASK_DONE..."_
7. Poll for `AGENT_SIGNAL::TASK_DONE`
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
