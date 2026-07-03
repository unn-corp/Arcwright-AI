---
name: "team-ux-arch"
description: "Quick rules for the Blueprint Room — UX + Architect design-only team, in-process + reuse."
---

# team-ux-arch — Quick Rules

For the full team spec see SKILL.md. Load `claude-subagent-protocol` for the
spawn / reuse / signal contract.

## Non-Negotiables

1. **In-process is the default.** `Agent` tool + `SendMessage` reuse, governed
   by the Session Agent Registry at
   `_arcwright-output/sessions/<session-id>/agent-registry.md`. herdr pane visibility is opt-in only.
2. **Sonnet-first, always.** Default every spawn (`ux`, `architect`) to
   `sonnet`. Architect may use `opus` only with explicit user permission. Ask
   before escalating (`claude-subagent-protocol` §6.3).
3. **No legacy signals.** `AGENT_SIGNAL`, `STEP COMPLETE`, `PEER_SIGNAL`,
   `STATUS_CHECK`, `$SPAWNER_PANE`, the retired pane-based orchestration skill, `session-state.md` — all
   retired. The Agent tool return value is the sole completion signal.
4. **Reuse over re-spawn.** `ux` and `architect` both appear in multiple
   steps. After the first spawn, look up the role in the registry and dispatch
   via `SendMessage` to the existing ID. The agent retains full prior context.
5. **Design artifacts only.** No production code is written. The team outputs
   wireframes, component specs, API contracts, data flow diagrams, and
   integration notes.
6. **Conflict resolution is conditional.** Step 3 (conflict resolution) only
   runs if step 2 surfaces a `DESIGN_CONFLICT`.
7. **Trust but verify.** Validate that the wireframes, component specs, and
   API contracts were actually produced (read the output paths) before
   reporting step 1 or step 2 complete.

## Registry rows for this team

| Role | Agent | First spawned in | Reused in |
|------|-------|------------------|-----------|
| ux | `arcwright-ux-designer` | step 1 | step 3 (conditional) |
| architect | `arcwright-architect` | step 1 | step 2, step 3 (conditional) |

## Step summary

1. **Parallel Design + Requirements Analysis** — spawn `ux` and `architect`
   (first use, registry miss). Parallel fan-out. Pass both outputs to step 2.
2. **Architecture Validation** — reuse existing `architect` via `SendMessage`.
3. **Conflict Resolution (conditional)** — reuse `ux` and `architect` via
   `SendMessage`. Present options to user if not auto-resolvable.
4. **Final Artifact Collation** — master collates outputs.

## Two-line Mental Model

- **First use of `ux` / `architect`** → `Agent` tool spawn, write registry row.
- **Any other use** → `SendMessage` to the existing ID. Reuse, not re-spawn.
