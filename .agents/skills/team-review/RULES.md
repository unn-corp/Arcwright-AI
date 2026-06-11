---
name: "team-review"
description: "Quick rules for the Review + Fix Loop (Architect + UX + Dev) — in-process spawn-once + SendMessage reuse, sonnet-first, opus gated for Architect."
---

# team-review — Quick Rules

Load `claude-subagent-protocol` for the full protocol. This is the team-specific overlay.

## Roles and registry

- **Architect** (`arcwright-architect`) — review + targeted re-review. Spawned once at step 1; reused via `SendMessage` at step 3 (only if Architect had findings).
- **UX Designer** (`arcwright-ux-designer`) — review + targeted re-review. Spawned once at step 1; reused via `SendMessage` at step 3 (only if UX had findings).
- **Dev** (`arcwright-dev`) — fix batch. Spawned once at step 2; reused via `SendMessage` on each subsequent fix pass.
- Registry: `_arcwright-output/sessions/<session-id>/agent-registry.md`. Write `agentId` on first spawn; look it up on every reuse.

## Non-negotiables

1. **In-process is the default.** `Agent` tool for first use; `SendMessage` for re-reviews and fix passes. tmux is opt-in visibility only.
2. **Sonnet-first, always.** Default all three roles to `sonnet`. Architect may use `opus` **only with explicit user permission** (ask before spawning — see `claude-subagent-protocol` §6.3). UX and Dev stay on `sonnet`.
3. **No legacy signals.** `AGENT_SIGNAL`, `STEP COMPLETE`, `PEER_SIGNAL`, `STATUS_CHECK`, the retired pane-based orchestration skill, and `session-state.md` pane tables — all retired in-process.
4. **Reuse over re-spawn.** Architect and UX Designer re-review through `SendMessage` to their original `agentId`. Dev reuses the same `agentId` on every fix pass.
5. **Step 1 is a parallel fan-out** — both Agent calls (architect, UX) go in a single assistant message so they run concurrently. See `claude-subagent-protocol` §5.2.
6. **Targeted re-review only the affected reviewer.** If only the architect had findings, only re-engage the architect — do not re-spawn UX. Step 3 issues `SendMessage` calls only for reviewers with affected findings.
7. **Disjoint output paths:** AR writes to `.../review/ar*.md`, UV writes to `.../review/uv*.md`, Dev writes to `.../review/fixes.md`. File contention is a user error.
8. **PermissionMode `acceptEdits` on Dev** so the fix step runs without per-write prompts. Omit on Architect and UX Designer.
9. **Trust but verify.** After step 2 and any subsequent fix pass, run `git diff --stat` to confirm files actually changed before reporting complete.
10. **Loop exit:** when both reviewers (or the only reviewer with findings) report clean pass — task complete. If new findings appear in re-review, return to step 2 with remaining findings.

## Two-line mental model

- **Step 1 = parallel fan-out (spawn both reviewers).** Step 2 = spawn dev with merged findings. Step 3 = reuse only the affected reviewers; if any finding remains, reuse dev on the next pass.
- **Each role spawns exactly once per team run.** Reuse is the rule, re-spawn is the exception (e.g., stale agent after a long pause — see `claude-subagent-protocol` §3.4).
