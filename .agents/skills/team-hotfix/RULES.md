---
name: "team-hotfix"
description: "Quick rules for Rapid Response — Dev + Security, in-process via Session Agent Registry, sonnet-first, permission-before-opus, no legacy signals. Strict guardrails: max 4 files, isolated subsystem."
---

# team-hotfix — Quick Rules

Rapid Response is a two-role team. `dev` and `security` are each spawned once and reused for rework. Load this before any hotfix run; for the full protocol, see `SKILL.md` and `claude-subagent-protocol`.

## Agent Registry

Two rows (`dev`, `security`) at `_arcwright-output/sessions/<session-id>/agent-registry.md`. See `claude-subagent-protocol` §3 for the full format. Replace both rows on a disjoint second hotfix in the same session.

## Non-Negotiables

1. **In-process is the default.** `Agent` tool + `SendMessage` reuse, governed by the Session Agent Registry. herdr pane visibility is opt-in only.
2. **Sonnet-first.** Default every spawn to `sonnet`. Opus only with explicit user permission — ask before escalating. Security role is the most common candidate for opus.
3. **No legacy signals.** The Agent tool return value is the sole completion signal. Do not reintroduce `AGENT_SIGNAL` / `STEP COMPLETE` / `PEER_SIGNAL` / `STATUS_CHECK` / `$SPAWNER_PANE` / the retired pane-based orchestration skill / `session-state.md` pane tables in the in-process flow.
4. **Reuse over re-spawn (within a hotfix cycle).** First use of `dev` or `security` → spawn, record `agentId` in the registry. Rework on the same fix → `SendMessage(to: <agentId>, ...)` to the same agent.
5. **Spawn fresh on a new hotfix.** A second, disjoint hotfix in the same session → spawn fresh for both roles and replace the registry rows.
6. **Registry path.** `_arcwright-output/sessions/<session-id>/agent-registry.md`. Two rows: `dev` and `security`. See `claude-subagent-protocol` §3.
7. **Trust but verify.** Dev writes code. After the fix, verify file changes (`git diff --stat`, `Read` the changed files). The orchestrator MUST verify before reporting PTM-ready.
8. **6 KB prompt size guard.** If a handoff prompt (issue + fix output + review feedback) exceeds ~6 KB, write to `_arcwright-output/...` and pass paths. See `claude-subagent-protocol` §7.3.
9. **No version-pinned model names.** Use aliases: `opus` / `sonnet` / `haiku` / `fable`.
10. **No background spawns.** Do not use `run_in_background: true`. Sequential handoff is blocking — wait for the Agent return value.
11. **permissionMode: acceptEdits** for Dev (autonomous fix within guardrails). Omit for Security (read-only review).
12. **Guardrails are non-negotiable.** Max 4 files, isolated subsystem, `[emergency]` confirmation from user. If a guardrail would be violated, surface to user immediately — do not spawn past the guardrail.

## Two-line Mental Model

- **Spawn** = first use of `dev` or `security` in this hotfix cycle. Get `agentId`, write registry row, dispatch.
- **SendMessage** = rework on the same fix. Look up the role, send to the existing ID. The agent retains prior context (the diff, prior review).

## Model Gate (always ask)

```
This role may benefit from opus (deeper reasoning for security sign-off / complex fix).
Default is sonnet.
Switch this spawn to opus? (yes / no / always-yes-for-this-session)
```

If "no" → spawn `sonnet`. If "always-yes-for-this-session" → record preference, stop asking for this role.

## Wind-down (no pane close)

Hotfix complete (PTM-ready or user took over) → stop dispatching. Both agents go idle. `claude agents` to inspect. Rename registry to `agent-registry.closed.md` (or delete) at session end.

## Handoff Order (strict)

1. Guardrail check (master, no spawn).
2. Dev `Agent` (or `SendMessage` on rework) → `$STEP_2_OUTPUT`.
3. **Verify fix** (`git diff --stat`).
4. Security `Agent` (or `SendMessage` on re-review) → `$STEP_3_OUTPUT`.
5. PTM or escalate.

Do not skip verification. Do not reorder. The Security review is the gate; without it, no PTM.
