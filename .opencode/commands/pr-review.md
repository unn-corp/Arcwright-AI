---
description: Parallel 6-lens PR review with confidence scoring. Fan-out reviewers (correctness, security, performance, tests, API/contract, readability), dedup findings above a confidence threshold, and produce a ranked report + merge verdict.
handoffs:
  - review-orchestrator (optional, for BLOCK verdicts requiring full AR cycle)
  - code-graph (optional, query blast radius of changed symbols)
---

# /pr-review — PR Review Panel

Run a parallel multi-lens code review on a PR diff or set of changed files.

## Instructions

1. Load `.agents/skills/pr-review-panel/SKILL.md` for the full protocol.
2. Determine scope from `$ARGUMENTS`:
   - PR number/URL → `gh pr diff <number>`
   - File list → use those files' git diff
   - Empty → `git diff main...HEAD`
3. Follow Section 3 (Reviewer Lenses): spawn all 6 lens agents in one parallel assistant message.
4. Follow Section 4 (Aggregation Rules): dedup, apply threshold, rank, compute verdict.
5. Output the report per Section 5 format.
6. If verdict is BLOCK and `--ar` flag is present, invoke `review-orchestrator` RO-FULL on flagged files.

## Arguments

`$ARGUMENTS`:
- PR number or URL
- File paths or globs
- `--threshold N` — confidence cutoff (default 70)
- `--lens r1,r3` — run only named lenses
- `--ar` — auto-escalate to review-orchestrator on BLOCK verdict
