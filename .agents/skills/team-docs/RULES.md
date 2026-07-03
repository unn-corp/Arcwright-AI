---
name: "team-docs"
description: "Quick rules for the Library (Tech Writer + Architect) team — in-process spawn-once + SendMessage reuse, sonnet-first, opus gated for Architect."
---

# team-docs — Quick Rules

Load `claude-subagent-protocol` for the full protocol. This is the team-specific overlay.

## Roles and registry

- **Tech Writer** (`arcwright-tech-writer`) — drafted, then revised. Spawned once at step 1; reused via `SendMessage` at step 3 (and any subsequent revision iteration).
- **Architect** (`arcwright-architect`) — review, then re-review. Spawned once at step 2; reused via `SendMessage` at each re-review pass.
- Registry: `_arcwright-output/sessions/<session-id>/agent-registry.md`. Write `agentId` on first spawn; look it up on every reuse.

## Non-negotiables

1. **In-process is the default.** `Agent` tool for first use; `SendMessage` for revisions and re-reviews. herdr pane visibility is opt-in only.
2. **Sonnet-first, always.** Default both roles to `sonnet`. Architect may use `opus` **only with explicit user permission** (ask before spawning — see `claude-subagent-protocol` §6.3). Tech Writer stays on `sonnet`.
3. **No legacy signals.** `AGENT_SIGNAL`, `STEP COMPLETE`, `PEER_SIGNAL`, `STATUS_CHECK`, the retired pane-based orchestration skill, and `session-state.md` pane tables — all retired in-process.
4. **Reuse over re-spawn.** Tech Writer's revisions and Architect's re-reviews go through `SendMessage` to the original `agentId`. Don't spawn a fresh tech-writer or architect mid-team.
5. **Step 3 is conditional.** Only run if step 2 returned `Needs revision:`. Otherwise the team is complete after step 2.
6. **Reuse → reference only the delta.** When reusing the tech-writer, do not re-feed the prior draft into the prompt — the tech-writer already holds the original draft from step 1.
7. **Trust but verify.** Architect's review may include reading code files for accuracy. Architect has full dev skill access, but should be invoked as a reviewer (read-only intent) — the team does not write code.

## Two-line mental model

- **Tech Writer runs once per loop iteration** (spawn at step 1, reuse at step 3). **Architect runs once per loop iteration** (spawn at step 2, reuse at the re-review).
- **Loop:** 1 (draft) → 2 (review) → 3 (revise, conditional) → 2 (re-review) → ... until approved. Step 3 → step 2 re-review is only when findings exist.
