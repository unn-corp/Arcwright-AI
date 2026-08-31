---
description: N-pass security auto-fix loop. Reviews, remediates, and re-audits until clean or a critical finding requires human review.
---

# /sec-loop — Security Auto-Fix Loop

Run a multi-pass security review-and-fix loop. Each pass audits code for vulnerabilities, auto-remediates what it safely can, then re-audits. Stops when clean, pass limit is reached, or a critical finding requires human sign-off.

## Instructions

1. Load `.agents/skills/security-review/SKILL.md` for the full rule set.
2. Ask the user: "How many passes? (default: 3)" — wait for a response, or use 3 if they skip.
3. Identify the scope: files in `$ARGUMENTS`, or all files changed relative to HEAD.

### Loop (repeat up to N passes):

**Pass N of N:**

1. Run the security review (same as `/security-review`). Assign SR-NNN IDs.
2. If zero findings remain: announce "Clean after pass N — done." and stop.
3. **Critical findings:** STOP IMMEDIATELY. Do NOT auto-fix critical findings. Announce which findings are critical and tell the user: "These require manual security review before proceeding. Do not merge." End the loop.
4. Auto-fix high/medium/low findings you have high confidence to remediate safely:
   - Parameterise raw SQL queries
   - Escape user output (XSS)
   - Add missing auth guards / permission checks
   - Replace weak cryptographic algorithms
   - Remove hardcoded secrets (replace with env var reference)
5. Report what was fixed in this pass.
6. If this was the final pass and non-critical red findings remain: HALT. List them and advise the user.

## Arguments

`$ARGUMENTS` — optional list of files or directories to review. If empty, reviews all files changed relative to HEAD.
