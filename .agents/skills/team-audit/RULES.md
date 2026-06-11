---
name: "team-audit"
description: "Quick rules for the Crucible — full audit + fix loop, in-process + reuse, security default sonnet."
---

# team-audit — Quick Rules

For the full team spec see SKILL.md. Load `claude-subagent-protocol` for the
spawn / reuse / signal contract.

## Non-Negotiables

1. **In-process is the default.** `Agent` tool + `SendMessage` reuse, governed
   by the Session Agent Registry at
   `_arcwright-output/sessions/<session-id>/agent-registry.md`. tmux is opt-in
   visibility only.
2. **Sonnet-first, always — including Security.** Default every spawn
   (`architect`, `ux`, `security`, `dev`) to `sonnet`. Security is **not** a
   silent-opus default. Ask the user before any opus spawn or effort upgrade
   (`claude-subagent-protocol` §6.3).
3. **No legacy signals.** `AGENT_SIGNAL`, `STEP COMPLETE`, `PEER_SIGNAL`,
   `STATUS_CHECK`, `$SPAWNER_PANE`, `tmux-protocol`, `session-state.md` — all
   retired. The Agent tool return value is the sole completion signal.
4. **Reuse over re-spawn.** All four roles are reused across loop iterations
   (fix pass, then re-audit). Security is the load-bearing case — re-engage
   the existing Security agent on each re-audit, not a fresh one.
5. **Critical security first.** All findings are merged and sorted by
   severity: critical security → critical arch/ux → major → minor. The fix
   pass follows that order; the re-audit only covers reviewers whose findings
   were addressed (Security always when security findings were fixed).
6. **Security has final sign-off authority.** The loop does not exit until
   Security signals a clean pass on the remediated areas.
7. **Trust but verify.** After Dev's fix batch, verify actual file changes
   via `git diff` or `Read` before declaring the fix pass complete. Re-audit
   must reference the actual fixes, not the summary.

## Registry rows for this team

| Role | Agent | First spawned in | Reused in |
|------|-------|------------------|-----------|
| architect | `arcwright-architect` | step 1 (parallel fan-out) | step 3 re-audit if arch findings were addressed |
| ux | `arcwright-ux-designer` | step 1 (parallel fan-out) | step 3 re-audit if ux findings were addressed |
| security | `arcwright-review-orchestrator` (security lens) | step 1 (parallel fan-out) | step 3 re-audit (always when security findings were fixed) |
| dev | `arcwright-dev` | step 2 | every fix-pass iteration |

## Step summary

1. **Concurrent Audit** — spawn `architect`, `ux`, `security` in one message
   (parallel fan-out, first-use registry miss for all three).
2. **Fix Batch** — spawn `dev` (first use). Critical security first.
3. **Targeted Re-Audit** — reuse `security` via `SendMessage` (always).
   Reuse `architect` and/or `ux` via `SendMessage` if their findings were
   addressed. Loop exits on Security clean pass.

## Two-line Mental Model

- **First use of any role** → `Agent` tool spawn, write registry row.
- **Re-audit of a role from step 1** → `SendMessage` to the existing ID. The
  Security agent keeps the original findings, the fix descriptions, and the
  sign-off state across iterations.
