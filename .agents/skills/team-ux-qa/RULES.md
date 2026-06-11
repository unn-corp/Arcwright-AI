---
name: "team-ux-qa"
description: "Quick rules for the Atelier — UX implements + QA validates loop, in-process + reuse."
---

# team-ux-qa — Quick Rules

For the full team spec see SKILL.md. Load `claude-subagent-protocol` for the
spawn / reuse / signal contract.

## Non-Negotiables

1. **In-process is the default.** `Agent` tool + `SendMessage` reuse, governed
   by the Session Agent Registry at
   `_arcwright-output/sessions/<session-id>/agent-registry.md`. tmux is opt-in
   visibility only.
2. **Sonnet-first, always.** Default every spawn (`ux`, `qa`) to `sonnet`. Ask
   the user before any opus spawn or effort upgrade
   (`claude-subagent-protocol` §6.3).
3. **No legacy signals.** `AGENT_SIGNAL`, `STEP COMPLETE`, `PEER_SIGNAL`,
   `STATUS_CHECK`, `$SPAWNER_PANE`, `tmux-protocol`, `session-state.md` — all
   retired. The Agent tool return value is the sole completion signal.
4. **Reuse over re-spawn — this team lives by it.** Both `ux` and `qa` are
   reused across revision loops. The QA agent retains the last run, prior
   failures, and the playwright-cli setup across iterations. Spawning a fresh
   QA agent per loop iteration loses that context.
5. **Worked reuse example:** "Re-engage the existing QA agent with the new
   test target via SendMessage." See SKILL.md `## Spawn-once + Reuse` for the
   full SendMessage JSON.
6. **Loop is conditional.** Step 3 (revision) only runs when step 2 fails.
   Step 2 (validation) re-runs after each revision. The loop exits when QA
   reports pass.
7. **Trust but verify.** QA reports pass/fail — but the orchestrator must
   confirm the playwright-cli output is captured and the assertions map to
   the acceptance criteria before exiting the loop.

## Registry rows for this team

| Role | Agent | First spawned in | Reused in |
|------|-------|------------------|-----------|
| ux | `arcwright-ux-designer` | step 1 | every step 3 iteration |
| qa | `arcwright-qa` | step 2 (first pass) | every step 2 re-validation |

## Step summary

1. **Design + Implementation** — spawn `ux` (first use, registry miss).
2. **Live UI Validation** — spawn `qa` (first use, registry miss).
3. **Revision (conditional)** — reuse `ux` via `SendMessage`. Return to step 2.
4. **Re-validation** — reuse `qa` via `SendMessage` (the worked example).

## Two-line Mental Model

- **First time the role shows up** → `Agent` tool spawn, write registry row.
- **Next loop iteration, same role** → `SendMessage` to the existing ID. The
  QA agent remembers the prior run, the UX Designer remembers the prior
  implementation.
