# /edge-case-hunter — Edge Case Hunter Review

Load and run the `edge-case-hunter` skill (`.agents/skills/edge-case-hunter/SKILL.md`) against the user's command input.

- If the user's command input names a file or path, review that content.
- Otherwise review the current working diff: `git diff` (unstaged) plus `git diff --cached` (staged).

Follow the skill exactly: pure path tracer, exhaustive branch/boundary enumeration, report ONLY unhandled paths as the four-field JSON array, run the deletion check when the diff removes code, and honor the halt conditions. Do not editorialize or assign severity.
