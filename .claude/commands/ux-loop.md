---
description: N-pass UX/accessibility auto-fix loop. Reviews, fixes violations, and re-audits until clean or pass limit reached.
---

# /ux-loop — UX Auto-Fix Loop

Run a multi-pass UX and accessibility review-and-fix loop. Each pass audits UI files, auto-fixes violations, then re-audits. Stops when clean or the pass limit is reached.

## Instructions

1. Load `.agents/skills/ux-audit/SKILL.md` for the full rule set.
2. Ask the user: "How many passes? (default: 3)" — wait for a response, or use 3 if they skip.
3. Identify the scope: files in `$ARGUMENTS`, or all UI files changed relative to HEAD.

### Loop (repeat up to N passes):

**Pass N of N:**

1. Run the UX/a11y audit (same as `/ux-audit`). Assign UV-NNN IDs.
2. If zero findings remain: announce "Clean after pass N — done." and stop.
3. Auto-fix all findings you have high confidence to fix safely:
   - Add missing `aria-label` / `alt` attributes
   - Fix contrast ratio issues (swap to compliant token)
   - Replace hardcoded colours with design tokens
   - Fix component reuse violations (extract shared component)
   - Correct layout pattern violations
4. Report what was fixed in this pass.
5. If this was the final pass and red findings remain: HALT. List remaining findings and tell the user manual review is required.

## Arguments

`$ARGUMENTS` — optional list of files or directories to audit. If empty, audits all UI files changed relative to HEAD.
