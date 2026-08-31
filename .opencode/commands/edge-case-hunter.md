---
description: Exhaustive branch/boundary edge-case review of the current diff (or a named file). Reports only unhandled paths as structured findings.
allowed-tools: Read, Grep, Glob, Bash
---

# /edge-case-hunter — Edge Case Hunter Review

Load and run the `edge-case-hunter` skill (`.agents/skills/edge-case-hunter/SKILL.md`) against $ARGUMENTS.

- If $ARGUMENTS names a file or path, review that content.
- Otherwise review the current working diff: `git diff` (unstaged) plus `git diff --cached` (staged).

Follow the skill exactly: pure path tracer, exhaustive branch/boundary enumeration, report ONLY unhandled paths as the four-field JSON array, run the deletion check when the diff removes code, and honor the halt conditions. Do not editorialize or assign severity.
