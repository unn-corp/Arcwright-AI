---
name: "team-arch-dev"
description: "Quick rules for the Foundry (Architect + Dev) team — in-process spawn-once + SendMessage reuse, sonnet-first, opus gated for Architect."
---

# team-arch-dev — Quick Rules

Load `claude-subagent-protocol` for the full protocol. This is the team-specific overlay.

## Roles and registry

- **Architect** (`arcwright-architect`) — design + spot-check. Spawned once at step 1; reused via `SendMessage` at steps 3 and 4a.
- **Dev** (`arcwright-dev`) — implementation + remediation. Spawned once at step 2; reused via `SendMessage` at step 4.
- Registry: `_arcwright-output/sessions/<session-id>/agent-registry.md`. Write `agentId` on first spawn; look it up on every reuse.

## Non-negotiables

1. **In-process is the default.** `Agent` tool for first use; `SendMessage` for every later step. tmux is opt-in visibility only — never the spawn path.
2. **Sonnet-first, always.** Default both roles to `sonnet`. Architect may use `opus` **only with explicit user permission** (ask before spawning — see `claude-subagent-protocol` §6.3). Dev stays on `sonnet`.
3. **No legacy signals.** `AGENT_SIGNAL`, `STEP COMPLETE`, `PEER_SIGNAL`, `STATUS_CHECK`, the retired pane-based orchestration skill, and `session-state.md` pane tables — all retired in-process. The Agent tool return value is the sole completion signal.
4. **Reuse over re-spawn.** Architect steps 1 → 3 → 4a all reuse the same `agentId`. Dev steps 2 → 4 reuse the same `agentId`. Don't spawn a fresh architect or dev mid-team.
5. **PermissionMode `acceptEdits` on Dev** so the implementation step runs without per-write prompts. Omit on Architect.
6. **Trust but verify.** After steps 2 and 4, run `git diff --stat` to confirm files actually changed before reporting the step complete.
7. **Re-spot-check loops use the same architect agent** (the registry row) — do not spawn a second architect for the loop.
8. **One canonical loop:** 1 (design) → 2 (impl) → 3 (spot-check) → 4 (remediate, conditional) → 3 (re-spot-check) → ... until clean. Step 3 → step 4 is only when findings exist.

## Two-line mental model

- **Architect runs twice (step 1, step 3+):** design once, spot-check the same agent on every remediation pass.
- **Dev runs twice (step 2, step 4+):** implement once, fix the same agent on every finding batch.
