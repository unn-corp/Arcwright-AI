---
description: N-pass DRY/SOLID auto-fix loop. Reviews, fixes violations, and re-reviews until clean or pass limit reached.
---

# /dry-loop — DRY/SOLID Auto-Fix Loop

Run a multi-pass DRY/SOLID review-and-fix loop. Each pass reviews the code, auto-fixes violations, then re-reviews. Stops when clean or the pass limit is reached.

## Instructions

1. Load `.agents/skills/clean-code-standards/SKILL.md` for the full rule set.
2. Ask the user: "How many passes? (default: 3)" — wait for a response, or use 3 if they skip.
3. Identify the scope: files in `$ARGUMENTS`, or all files changed relative to HEAD.

### Loop (repeat up to N passes):

**Pass N of N:**

1. Run the DRY/SOLID review (same as `/dry`). Assign DRY-NNN IDs.
2. If zero findings remain: announce "Clean after pass N — done." and stop.
3. Auto-fix all findings you have high confidence to fix safely:
   - Rename poorly named variables/functions
   - Extract duplicated logic into a shared function/module
   - Split oversized functions
   - Remove dead code
   - Fix obvious SOLID violations (SRP, OCP)
4. Report what was fixed in this pass.
5. If this was the final pass and red findings remain: HALT. List remaining findings and tell the user manual review is required.

Do not loop indefinitely — respect the pass count. When halting with unresolved findings, do not auto-fix further without user direction.

## Arguments

`$ARGUMENTS` — optional list of files or directories to review. If empty, reviews all files changed relative to HEAD.
