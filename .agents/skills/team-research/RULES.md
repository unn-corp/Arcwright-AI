---
name: "team-research"
description: "Quick rules for the Recon Pod — research + synthesis + documentation, in-process + reuse."
---

# team-research — Quick Rules

For the full team spec see SKILL.md. Load `claude-subagent-protocol` for the
spawn / reuse / signal contract.

## Non-Negotiables

1. **In-process is the default.** `Agent` tool + `SendMessage` reuse, governed
   by the Session Agent Registry at
   `_arcwright-output/sessions/<session-id>/agent-registry.md`. tmux is opt-in
   visibility only.
2. **Sonnet-first, always.** Default every spawn (`analyst`, `pm`,
   `tech-writer`) to `sonnet`. Ask the user before any opus spawn or effort
   upgrade (`claude-subagent-protocol` §6.3).
3. **No legacy signals.** `AGENT_SIGNAL`, `STEP COMPLETE`, `PEER_SIGNAL`,
   `STATUS_CHECK`, `$SPAWNER_PANE`, `tmux-protocol`, `session-state.md` — all
   retired. The Agent tool return value is the sole completion signal.
4. **Reuse over re-spawn.** Each role appears once in the standard flow, so
   reuse is rare for this team — but if a second round is needed (e.g., a
   follow-up research question lands in the same session), look up the role
   in the registry and `SendMessage` the existing agent rather than
   re-spawning.
5. **Parallel research tracks are first-use spawns.** Issuing two Analyst
   calls in parallel writes two registry rows (or one row + a
   `analyst-2`/`analyst` row, depending on naming). Disjoint research
   domains are required — same domain = user error.
6. **Sequential flow.** Research → synthesis → documentation. No
   revisits-to-prior-steps loop.
7. **Trust but verify.** Validate that research outputs, the PM brief, and
   the final documentation were actually produced (read the output paths)
   before reporting each step complete.

## Registry rows for this team

| Role | Agent | First spawned in | Reused in |
|------|-------|------------------|-----------|
| analyst | `arcwright-analyst` | step 1 (single) or step 1 (parallel track A) | follow-up research questions (rare) |
| analyst-2 | `arcwright-analyst` | step 1 (parallel track B, if used) | n/a |
| pm | `arcwright-pm` | step 2 | n/a (single pass) |
| tech-writer | `arcwright-tech-writer` | step 3 | n/a (single pass) |

## Step summary

1. **Research** — spawn `analyst` (single track) or two parallel
   `analyst` calls (multi-track). Each parallel call is a first-use
   registry miss.
2. **Synthesis** — spawn `pm` (first use, registry miss).
3. **Documentation** — spawn `tech-writer` (first use, registry miss).
   Final output — no next step.

## Two-line Mental Model

- **First use of any role** → `Agent` tool spawn, write registry row.
- **Follow-up question to an existing role** → `SendMessage` to the existing
  ID. Most often this team runs once and exits; reuse applies to follow-up
  research questions in the same session.
