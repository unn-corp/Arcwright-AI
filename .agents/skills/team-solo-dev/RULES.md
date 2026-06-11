---
name: "team-solo-dev"
description: "Quick rules for Ghost — single solo-dev, in-process via Session Agent Registry, sonnet-first, no legacy signals."
---

# team-solo-dev — Quick Rules

Ghost is a single-role team. The `solo-dev` agent is spawned once and reused via `SendMessage` for every queued task. Load this before any Ghost run; for the full protocol, see `SKILL.md` and `claude-subagent-protocol`.

## Agent Registry

One row, role `solo-dev`, at `_arcwright-output/sessions/<session-id>/agent-registry.md`. See `claude-subagent-protocol` §3 for the full format. Update the `Last Task` column after every `SendMessage`.

## Non-Negotiables

1. **In-process is the default.** `Agent` tool + `SendMessage` reuse, governed by the Session Agent Registry. tmux is opt-in visibility only.
2. **Sonnet-first.** Default every spawn to `sonnet`. Opus not recommended for Ghost — only with explicit user permission if a task warrants it. Ask before escalating.
3. **No legacy signals.** The Agent tool return value is the sole completion signal. Do not reintroduce `AGENT_SIGNAL` / `STEP COMPLETE` / `PEER_SIGNAL` / `STATUS_CHECK` / `$SPAWNER_PANE` / `tmux-protocol` skill references / `session-state.md` pane tables in the in-process flow.
4. **Reuse over re-spawn.** First task in the queue → spawn, record `agentId` in the registry. **Every subsequent task in the same queue → `SendMessage(to: <agentId>, ...)`**. Only spawn fresh if the next task is genuinely disjoint (different project, different area).
5. **Registry path.** `_arcwright-output/sessions/<session-id>/agent-registry.md`. One row: `solo-dev`. See `claude-subagent-protocol` §3.
6. **Trust but verify.** Ghost writes code. After each `Agent` / `SendMessage` call, verify file changes (`git diff --stat`, `Read` key files) before marking the task complete. See `claude-subagent-protocol` §9.
7. **6 KB prompt size guard.** If the task prompt (task description + prior task summaries) exceeds ~6 KB, write the prior outputs to files under `_arcwright-output/...` and pass paths. See `claude-subagent-protocol` §7.3.
8. **No version-pinned model names.** Use aliases: `opus` / `sonnet` / `haiku` / `fable`.
9. **No background spawns.** Do not use `run_in_background: true`. Sequential handoff is blocking — wait for the Agent return value.
10. **permissionMode: acceptEdits.** Ghost's autonomous execution expects `acceptEdits` so file writes don't prompt the user. The orchestrator has approved the queue scope before reaching Dev.
11. **Update the registry's `Last Task` column** after each `SendMessage` so the user can see what the dev agent is "thinking about".

## Two-line Mental Model

- **Spawn** = first task in the Ghost queue. Get `agentId`, write registry row, dispatch.
- **SendMessage** = every subsequent queued task. Look up `solo-dev`, send to the existing ID. The agent retains prior context across the whole queue.

## Model Gate (always ask)

```
This task may benefit from opus (deeper reasoning on a complex algorithm). Default is sonnet.
Switch this spawn to opus? (yes / no / always-yes-for-this-session)
```

If "no" → spawn `sonnet`. If "always-yes-for-this-session" → record preference, stop asking for this role.

## Wind-down (no pane close)

Queue drained → stop dispatching. Agent goes idle. `claude agents` to inspect. Rename registry to `agent-registry.closed.md` (or delete) at session end.
