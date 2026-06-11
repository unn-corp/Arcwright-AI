---
name: "team-blueprint"
description: "Quick rules for the War Room (PM + Analyst + Architect) team — in-process spawn-once + SendMessage reuse, sonnet-first, opus gated for Architect. Planning artifacts only."
---

# team-blueprint — Quick Rules

Load `claude-subagent-protocol` for the full protocol. This is the team-specific overlay.

## Roles and registry

- **PM** (`arcwright-pm`) — drafted, enriched, synthesized. Spawned once at step 1; reused via `SendMessage` at steps 2 and 4. The most-reused role.
- **Analyst** (`arcwright-analyst`) — research. Spawned once at step 1 (parallel with PM). Single-shot, no reuse.
- **Architect** (`arcwright-architect`) — feasibility. Spawned once at step 3. Single-shot, no reuse.
- Registry: `_arcwright-output/sessions/<session-id>/agent-registry.md`. Write `agentId` on first spawn; look it up on every reuse.

## Non-negotiables

1. **In-process is the default.** `Agent` tool for first use; `SendMessage` for the PM's later steps. tmux is opt-in visibility only.
2. **Sonnet-first, always.** Default all three roles to `sonnet`. Architect may use `opus` **only with explicit user permission** (ask before spawning — see `claude-subagent-protocol` §6.3). PM and Analyst stay on `sonnet`.
3. **No legacy signals.** `AGENT_SIGNAL`, `STEP COMPLETE`, `PEER_SIGNAL`, `STATUS_CHECK`, the retired pane-based orchestration skill, and `session-state.md` pane tables — all retired in-process.
4. **Reuse over re-spawn.** PM is reused twice (steps 2 and 4) via `SendMessage` to the same `agentId`. Don't spawn a fresh PM mid-team.
5. **Step 1 is a parallel fan-out** — both Agent calls (analyst, PM) go in a single assistant message so they run concurrently. See `claude-subagent-protocol` §5.2.
6. **Planning artifacts only.** No production code is written. The Architect's `permissionMode: "acceptEdits"` is scoped to prototype / spike code in step 3 only.
7. **Disjoint output paths** in step 1's parallel fan-out: analyst writes to `.../research/`, PM writes to `.../planning/prd-draft.md`. File contention is a user error (see `claude-subagent-protocol` §8).
8. **Trust but verify.** If the architect writes prototype code, confirm files exist before reporting step 3 complete.
9. **Reuse → reference only the delta.** When reusing the PM, do not re-feed prior context into the prompt — the PM already holds the initial draft and the research findings.

## Two-line mental model

- **PM is the spine:** spawn at step 1 (parallel), reuse at step 2 (enrich), reuse at step 4 (synth). One agent, three tasks.
- **Analyst and Architect are single-shots** — they each run once. Their artifacts feed the PM's reuse calls.

## Output paths

- Analyst: `_arcwright-output/features/{slug}/research/r-domain.md`
- PM (draft): `_arcwright-output/features/{slug}/planning/prd-draft.md`
- PM (enriched): `_arcwright-output/features/{slug}/planning/prd.md`
- Architect: `_arcwright-output/features/{slug}/planning/architecture.md` + `_arcwright-output/features/{slug}/prototype/`
- PM (synthesis): `_arcwright-output/features/{slug}/planning/summary.md`
