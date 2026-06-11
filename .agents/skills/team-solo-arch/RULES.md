---
name: "team-solo-arch"
description: "Quick rules for the Oracle — single Architect, in-process via Session Agent Registry, sonnet-first, no legacy signals."
---

# team-solo-arch — Quick Rules

The Oracle is a single-role team. The `architect` role is spawned once and reused via `SendMessage`. Load this before any Oracle run; for the full protocol, see `SKILL.md` and `claude-subagent-protocol`.

## Agent Registry

One row, role `architect`, at `_arcwright-output/sessions/<session-id>/agent-registry.md`. See `claude-subagent-protocol` §3 for the full format. Update the `Last Task` column on every `SendMessage`.

## Non-Negotiables

1. **In-process is the default.** `Agent` tool + `SendMessage` reuse, governed by the Session Agent Registry. tmux is opt-in visibility only.
2. **Sonnet-first.** Default every spawn to `sonnet`. Opus only with explicit user permission — ask before escalating.
3. **No legacy signals.** The Agent tool return value is the sole completion signal. Do not reintroduce `AGENT_SIGNAL` / `STEP COMPLETE` / `PEER_SIGNAL` / `STATUS_CHECK` / `$SPAWNER_PANE` / `tmux-protocol` skill references / `session-state.md` pane tables in the in-process flow.
4. **Reuse over re-spawn.** First ask for the `architect` role → spawn, record `agentId` in the registry. Every follow-up on the same scope → `SendMessage(to: <agentId>, ...)`. Only spawn fresh if the new ask is genuinely disjoint.
5. **Registry path.** `_arcwright-output/sessions/<session-id>/agent-registry.md`. One row: `architect`. See `claude-subagent-protocol` §3.
6. **Trust but verify.** If the Architect writes prototype code, verify file changes (`git diff --stat`, `Read`) before reporting the step complete. See `claude-subagent-protocol` §9.
7. **6 KB prompt size guard.** If the handoff prompt (architecture question + prior context) exceeds ~6 KB, write the prior analysis to a file and pass the path. See `claude-subagent-protocol` §7.3.
8. **No version-pinned model names.** Use aliases: `opus` / `sonnet` / `haiku` / `fable`.
9. **No background spawns.** Do not use `run_in_background: true`. Sequential handoff is blocking — wait for the Agent return value.
10. **Single-step team, multi-step reuse.** The Oracle is one logical step, but the user may ask many questions in sequence. Always check the registry first; reuse the existing `architect` agent when the ask is on-topic.

## Two-line Mental Model

- **Spawn** = first ask for the `architect` role this session. Get `agentId`, write registry row, dispatch.
- **SendMessage** = any follow-up ask on the same scope. Look up the `architect` row, send to the existing ID. The agent retains prior context.

## Model Gate (always ask)

```
This task may benefit from opus (deeper architectural reasoning). Default is sonnet.
Switch this spawn to opus? (yes / no / always-yes-for-this-session)
```

If "no" → spawn `sonnet`. If "always-yes-for-this-session" → record preference, stop asking for this role.

## Wind-down (no pane close)

Stop dispatching. Agent goes idle. `claude agents` to inspect. Rename registry to `agent-registry.closed.md` (or delete) at session end.
