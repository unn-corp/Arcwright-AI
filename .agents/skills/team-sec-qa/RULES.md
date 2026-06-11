---
name: "team-sec-qa"
description: "Quick rules for the Vault — security-first remediation loop, in-process + reuse, security default sonnet."
---

# team-sec-qa — Quick Rules

For the full team spec see SKILL.md. Load `claude-subagent-protocol` for the
spawn / reuse / signal contract.

## Non-Negotiables

1. **In-process is the default.** `Agent` tool + `SendMessage` reuse, governed
   by the Session Agent Registry at
   `_arcwright-output/sessions/<session-id>/agent-registry.md`. tmux is opt-in
   visibility only.
2. **Sonnet-first, always — including Security.** Default every spawn
   (`security`, `qa`, `dev`) to `sonnet`. Security is **not** a silent-opus
   default. Ask the user before any opus spawn or effort upgrade
   (`claude-subagent-protocol` §6.3).
3. **No legacy signals.** `AGENT_SIGNAL`, `STEP COMPLETE`, `PEER_SIGNAL`,
   `STATUS_CHECK`, `$SPAWNER_PANE`, `tmux-protocol`, `session-state.md` — all
   retired. The Agent tool return value is the sole completion signal.
4. **Reuse over re-spawn — Security is the load-bearing case.** All three
   roles are reused across remediation loop iterations. Security is
   re-engaged on every sign-off pass and must know the original findings, the
   QA exploit attempts, and the current sign-off state. Spawning a fresh
   Security agent loses that context.
5. **QA verifies exploit paths, not just code.** QA's role is to attempt to
   trigger vulnerabilities through the live UI/API. Pass only when the
   attack surface is confirmed gone — not when the code compiles.
6. **Security has sign-off authority.** Step 4 is the gate: the loop exits
   only on Security's clean pass. Escalation returns to step 2 (Dev
   re-remediates via SendMessage).
7. **Trust but verify.** After Dev's remediation, verify actual file changes
   via `git diff` or `Read` before QA's verification pass. QA's verdict must
   be backed by playwright-cli output captured to a known file path.

## Registry rows for this team

| Role | Agent | First spawned in | Reused in |
|------|-------|------------------|-----------|
| security | `arcwright-review-orchestrator` (security lens) | step 1 | step 4 sign-off (every loop iteration) |
| qa | `arcwright-qa` | step 3 (first verification) | every step 3 re-verification |
| dev | `arcwright-dev` | step 2 (first remediation) | every step 2 re-remediation |

## Step summary

1. **Security Review** — spawn `security` (first use, registry miss).
2. **Remediation** — spawn `dev` (first use, registry miss).
3. **Exploit Path Verification** — spawn `qa` (first use, registry miss).
4. **Security Sign-Off** — reuse `security` via `SendMessage`. If
   escalation: return to step 2 (reuse `dev`), then step 3 (reuse `qa`),
   then step 4 (reuse `security`) until clean pass.

## Two-line Mental Model

- **First use of any role** → `Agent` tool spawn, write registry row.
- **Next loop iteration, same role** → `SendMessage` to the existing ID.
  Security keeps the original findings and sign-off state; QA keeps the
  prior exploit attempts; Dev keeps the patch history.
