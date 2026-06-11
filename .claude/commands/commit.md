---
description: Staged changes → conventional-commit message. Shows message before committing. Lighter than verify-and-ship (no tests/lint).
handoffs:
  - label: "Push + open PR after commit"
    prompt: "/commit-push-pr"
  - label: "Run full quality gate instead"
    prompt: "/verify-and-ship"
---

# /commit — Conventional Commit

Generate a conventional-commit message from staged changes and commit after confirmation.

## Instructions

1. Load `.agents/skills/commit-commands/SKILL.md` for the `/commit` procedure and conventional-commit rules.
2. If `$ARGUMENTS` contains `--yes`, skip the confirmation prompt and commit immediately.
3. Follow the `/commit` procedure: check staged diff → derive type → draft message → show → confirm → commit.

## Arguments

`$ARGUMENTS` — optional:
- `--yes` — skip confirmation, commit immediately
- Any text overrides the generated subject (still show before committing)
