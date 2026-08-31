---
description: Single-pass DRY/SOLID review of current changes. Reports violations as DRY-NNN findings.
---

# /dry — DRY/SOLID Code Review

Run a single-pass DRY/SOLID code quality review against the current working changes or the files provided. Reports findings using the standard DRY-NNN ID format.

## Instructions

1. Load `.agents/skills/clean-code-standards/SKILL.md` for the full rule set (23 rules across 7 categories).
2. Identify the scope to review:
   - If `$ARGUMENTS` names specific files or directories, review those.
   - Otherwise, review all files changed in the current working tree (`git diff --name-only HEAD`).
3. Apply each rule in the skill to the identified files. For each violation, assign the next available DRY-NNN ID.
4. Report findings grouped by severity (critical → major → minor). Each finding must include:
   - ID (DRY-NNN)
   - Rule violated (e.g., DRY-01 Single Responsibility)
   - File and line range
   - One-sentence explanation
   - Suggested fix (concise)
5. End with a summary line: `X findings (Y critical, Z major, W minor)`.

Do not auto-fix in this mode — this is a review pass only. Use `/dry-loop` if you want automated remediation.

## Arguments

`$ARGUMENTS` — optional list of files or directories to review. If empty, reviews all files changed relative to HEAD.
