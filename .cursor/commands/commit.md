# /commit — Conventional Commit

Generate a conventional-commit message from staged changes and commit after confirmation.

## Instructions

1. Load `.agents/skills/commit-commands/SKILL.md` for the `/commit` procedure and conventional-commit rules.
2. If `the user's command input` contains `--yes`, skip the confirmation prompt and commit immediately.
3. Follow the `/commit` procedure: check staged diff → derive type → draft message → show → confirm → commit.

## Arguments

`the user's command input` — optional:
- `--yes` — skip confirmation, commit immediately
- Any text overrides the generated subject (still show before committing)
