---
name: "team-solo-qa"
description: "Quick rules for the Inquisitor — single QA agent, in-process via Session Agent Registry, sonnet-first, no legacy signals."
---

# team-solo-qa — Quick Rules

The Inquisitor is a single-role team. The `qa` agent is spawned once and reused via `SendMessage` for every queued run. Load this before any Inquisitor run; for the full protocol, see `SKILL.md` and `claude-subagent-protocol`.

## Agent Registry

One row, role `qa`, at `_arcwright-output/sessions/<session-id>/agent-registry.md`. See `claude-subagent-protocol` §3 for the full format. Update the `Last Task` column after every `SendMessage`.

## Non-Negotiables

1. **In-process is the default.** `Agent` tool + `SendMessage` reuse, governed by the Session Agent Registry. tmux is opt-in visibility only.
2. **Sonnet-first.** Default every spawn to `sonnet`. QA is verification only — opus not recommended. Only with explicit user permission if failure triage warrants it. Ask before escalating.
3. **No legacy signals.** The Agent tool return value is the sole completion signal. Do not reintroduce `AGENT_SIGNAL` / `STEP COMPLETE` / `PEER_SIGNAL` / `STATUS_CHECK` / `$SPAWNER_PANE` / `tmux-protocol` skill references / `session-state.md` pane tables in the in-process flow.
4. **Reuse over re-spawn.** First run → spawn, record `agentId` in the registry. **Every subsequent run on the same target → `SendMessage(to: <agentId>, ...)`**. Only spawn fresh if the new target is genuinely disjoint.
5. **Registry path.** `_arcwright-output/sessions/<session-id>/agent-registry.md`. One row: `qa`. See `claude-subagent-protocol` §3.
6. **Trust but verify.** QA writes test reports (and may run playwright-cli). After the run, verify the report was written to the expected path and that the verdict is structured. See `claude-subagent-protocol` §9.
7. **6 KB prompt size guard.** If the run prompt (scope + prior report) exceeds ~6 KB, write the prior report to a file and pass the path. See `claude-subagent-protocol` §7.3.
8. **No version-pinned model names.** Use aliases: `opus` / `sonnet` / `haiku` / `fable`.
9. **No background spawns.** Do not use `run_in_background: true`. Sequential handoff is blocking — wait for the Agent return value.
10. **Update the registry's `Last Task` column** after each `SendMessage` so the user can see what the QA agent is "thinking about".

## Two-line Mental Model

- **Spawn** = first run for the `qa` role this session. Get `agentId`, write registry row, dispatch.
- **SendMessage** = every subsequent run on the same target. Look up `qa`, send to the existing ID. The agent retains prior context (last run results, prior failures).

## Model Gate (always ask)

```
This task may benefit from opus (deeper failure triage). Default is sonnet.
Switch this spawn to opus? (yes / no / always-yes-for-this-session)
```

If "no" → spawn `sonnet`. If "always-yes-for-this-session" → record preference, stop asking for this role.

## Wind-down (no pane close)

Run queue drained → stop dispatching. Agent goes idle. `claude agents` to inspect. Rename registry to `agent-registry.closed.md` (or delete) at session end.
