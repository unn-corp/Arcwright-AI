---
name: "tmux"
description: "tmux pane and session reference — splits, navigation, layouts, resizing, and clipboard. Includes one optional section on watching in-process agents in panes."
allowed-tools: Bash, Read
---

# tmux — Pane and Session Reference

> **Scope:** This skill is a tmux **mechanics** reference. It does NOT prescribe how to
> spawn agents — for that, use the `claude-subagent-protocol` skill (in-process Agent
> tool + SendMessage reuse), which is the default Arcwright orchestration method.
>
> The one optional section at the end — **"Watching agents in panes (opt-in)"** — is
> the **only** place this skill describes pane-based agent visibility. Load it only
> if you have an explicit reason to spawn agents in split panes. Most users do not
> need it.

---

## 1. Pane Splits

| Action | Command |
|--------|---------|
| Split vertical (side by side) | `tmux split-window -h` |
| Split horizontal (top/bottom) | `tmux split-window -v` |
| Split in current path | `tmux split-window -h -c "#{pane_current_path}"` |
| Split and run command | `tmux split-window -h "command"` |

## 2. Pane Navigation

| Action | Command |
|--------|---------|
| Select pane by ID | `tmux select-pane -t %<id>` |
| Select pane left/right/up/down | `tmux select-pane -L/R/U/D` |
| List all panes (with IDs) | `tmux list-panes -a -F "#{session_name}:#{window_index}.#{pane_index} %#{pane_id} #{pane_title}"` |
| Get current pane ID | `tmux display-message -p "#{pane_id}"` |

## 3. Layouts

| Action | Command |
|--------|---------|
| Tiled (auto-balance all panes) | `tmux select-layout tiled` |
| Even horizontal | `tmux select-layout even-horizontal` |
| Even vertical | `tmux select-layout even-vertical` |
| Main horizontal (one tall, others stacked below) | `tmux select-layout main-horizontal` |
| Main vertical (one wide left, others stacked right) | `tmux select-layout main-vertical` |
| Cycle through preset layouts | `prefix + space` (in tmux) |
| Resize pane (pixels) | `tmux resize-pane -t %<id> -x <cols> -y <rows>` |
| Resize pane (interactively) | `prefix + z` (zoom) or `prefix + arrow keys` (hold) |

## 4. Sessions and Windows

| Action | Command |
|--------|---------|
| New named session | `tmux new-session -s <name>` |
| List sessions | `tmux list-sessions` |
| Switch session (from inside tmux) | `prefix + s` |
| Switch session (from shell) | `tmux switch-client -t <name>` |
| Detach (keep session running) | `prefix + d` |
| Re-attach | `tmux attach-session -t <name>` |
| New window in current path | `tmux new-window -c "#{pane_current_path}"` |
| Rename window | `tmux rename-window <name>` |
| List windows in current session | `tmux list-windows` |
| Kill window | `tmux kill-window -t <name>` |
| Kill session | `tmux kill-session -t <name>` |

## 5. Sending Keys to Panes

| Action | Command |
|--------|---------|
| Send text + Enter (single command) | `tmux send-keys -t %<id> "text" Enter` |
| Send text only (no Enter) | `tmux send-keys -t %<id> "text"` |
| Send Enter to a pane | `tmux send-keys -t %<id> "" Enter` |
| Send to pane by `session:window.pane` | `tmux send-keys -t <session>:<w>.<p> "text" Enter` |
| Send literal control character (e.g. C-c) | `tmux send-keys -t %<id> C-c` |

> **Enter is always required.** `send-keys "text"` types the text but never submits.
> A `send-keys "" Enter` (or `"text" Enter` in one call) is what actually runs it.

## 6. Pane Titles and IDs

| Action | Command |
|--------|---------|
| Set pane title (escape sequence) | `printf '\033]2;%s\033\\' "title"` |
| Get pane title | `tmux display-message -p -t %<id> "#{pane_title}"` |
| Get pane dimensions | `tmux display-message -p -t %<id> "#{pane_width}x#{pane_height}"` |
| List panes with IDs and titles | `tmux list-panes -a -F "%#{pane_id} %#{pane_index} #{pane_title}"` |

## 7. Clipboard Integration

Wired by the `arcwright-tmux` npm package (Catppuccin theme + pane title sync + clipboard).
If you installed Arcwright's tmux setup, system clipboard works out of the box via
`pbcopy` / `xclip` / `wl-copy` (auto-detected per platform).

| Action | Command (from inside tmux) |
|--------|-----------------------------|
| Copy current selection to OS clipboard | select with mouse, then `prefix + ]` to paste OR rely on `set-clipboard on` (default) |
| Copy command output to clipboard | `<command> \| tmux load-buffer - && tmux save-buffer - \| pbcopy` (macOS) / `xclip -selection c` (Linux) |
| Paste OS clipboard into tmux | `prefix + ]` |
| Show current buffer contents | `tmux show-buffer` |

For WSL2, ensure `clip.exe` is on PATH (default) and `set-clipboard on` is set in
`~/.tmux.conf`.

## 8. Inspection and Status

```bash
# All panes across all sessions with IDs and titles
tmux list-panes -a -F "#{session_name}:#{window_index} %#{pane_id} [#{pane_width}x#{pane_height}] #{pane_title}"

# Current pane info
tmux display-message -p "pane_id=#{pane_id} pane_index=#{pane_index} window=#{window_index}"

# Is tmux active in this shell?
[ -n "$TMUX" ] && echo "in tmux" || echo "not in tmux"

# How many panes are in the current window?
tmux list-panes | wc -l
```

---

# Watching agents in panes (opt-in)

> **Stop — read this before using this section.**
>
> Pane-based agent visibility is **opt-in**, not the default. Arcwright's default
> orchestration runs in-process via the `Agent` tool + `SendMessage` reuse — see the
> `claude-subagent-protocol` skill. You do not need panes for that flow.
>
> **Use panes only if you have an explicit reason:** the user said "spawn", "open
> agent", "I want to watch", or asked for a visible split-pane workflow, **and**
> `$TMUX` is set. Otherwise, stay in-process.

If you have a reason to watch agents run in split panes, the snippets below show the
relevant tmux mechanics. They are intentionally minimal — they assume you already
understand the `claude-subagent-protocol` skill's agent-ID model.

## Why opt-in, not default

| Aspect | In-process (default) | Pane-based (opt-in) |
|--------|----------------------|---------------------|
| Spawn | `Agent` tool, returns agentId | `tmux split-window … claude --dangerously-skip-permissions …` |
| Reuse | `SendMessage(to: agentId, …)` | capture pane ID, `send-keys` to it |
| Completion signal | Agent tool return value | pane buffer polling (`capture-pane | grep`) |
| Memory persistence | `memory: project` on agent | none — fresh agent each time |
| State visibility | log / tool result | live pane content |
| Cost (overhead) | low | higher (extra Claude sessions) |
| Coordination | structured handoff contract | AGENT_SIGNAL strings + polling |

## When panes still make sense

- The user explicitly asks to **watch** a long-running agent (visual feedback loop).
- A user has multiple roles they want to **observe simultaneously** (architect + dev
  side by side) and prefers eyeball coordination over an agent registry.
- The user is debugging a multi-pane workflow and needs to inspect pane state.

## Spawning a visible agent pane (only if the user asked)

This is the minimum skeleton. The new agent loads `claude-subagent-protocol` like any
other agent — **NOT** the old `tmux-protocol` (retired in the native-orchestration
migration; pane-based AGENT_SIGNAL/STATUS_CHECK/PEER_SIGNAL polling is no longer
required because the in-process method is the default).

```bash
SPAWNER_PANE=$(tmux display-message -p "#{pane_id}")

tmux split-window -h -c "#{pane_current_path}" \
  "claude --dangerously-skip-permissions \
  'You are the <ROLE> agent. Master pane: $SPAWNER_PANE. \
  FIRST ACTION — load .agents/skills/claude-subagent-protocol/SKILL.md. \
  <TASK_CONTEXT>'"

# Wait for pane to register, set a stable title (handy for the user to identify it)
sleep 8
NEW_PANE_ID=$(tmux list-panes -F "#{pane_id}" | tail -1)
tmux set-option -t "$NEW_PANE_ID" -p allow-rename off
tmux select-pane -t "$NEW_PANE_ID" -T "<ROLE>-${NEW_PANE_ID}"
tmux select-layout tiled
```

The spawned agent runs as a **normal in-process agent** — it will use `Agent` /
`SendMessage` itself, default to `sonnet`, and ask the user before any opus
escalation. The pane is just a viewing surface.

## Sending a follow-up to a visible pane

```bash
# Delayed-Enter pattern (preferred for non-trivial messages)
tmux send-keys -t "$NEW_PANE_ID" "<MESSAGE>"
sleep 6
tmux send-keys -t "$NEW_PANE_ID" "" Enter
```

## Closing a visible pane

```bash
# 1. Send /exit first — let Claude flush and save state
tmux send-keys -t "$NEW_PANE_ID" "/exit" Enter
sleep 6
# 2. Kill the pane
tmux kill-pane -t "$NEW_PANE_ID"
tmux select-layout tiled
```

## What is NOT used anymore (do not reintroduce)

| String / pattern | Status |
|------------------|--------|
| `AGENT_SIGNAL::TASK_DONE::…` | Retired — the Agent tool return value is the completion signal in-process |
| `STATUS_CHECK:` polling prompts | Retired — sequential execution eliminates stall detection |
| `PEER_SIGNAL::…` cross-pane notifications | Retired — no cross-pane coordination needed in the in-process model |
| `$SPAWNER_PANE` env var / `master pane` field | Retired — handoff happens via the orchestrator's own Agent tool return value |
| Polling loops with `tmux capture-pane | grep AGENT_SIGNAL` | Retired — if you spawn a pane, the agent is its own completion signal via the Agent tool |
| Hand-maintained `session-state.md` pane-ID table | Retired — the new `claude-subagent-protocol` Session Agent Registry is the source of truth |

The old `tmux-protocol` skill (which documented all of the above) has been retired
and removed. Its SKILL.md and RULES.md are no longer present. The pane-visibility
snippets above are the only carry-over.

## See also

- **`claude-subagent-protocol`** — THE orchestration method. Read first.
- **`/triage`** — workflow router: recommends in-process agent(s) / ultracode / `/goal`
  before any orchestration decision. Ask it before spawning anything heavy.
