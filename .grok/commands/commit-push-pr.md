---
description: Commit staged changes, push, and open a GitHub PR in one step. Shows commit message before committing. Lighter than verify-and-ship.
handoffs:
  - label: "Run full quality gate first"
    prompt: "/verify-and-ship"
---

# /commit-push-pr — Commit + Push + Open PR

Commit staged changes with a conventional-commit message, push, and create or show a GitHub PR.

## Instructions

1. Load `.agents/skills/commit-commands/SKILL.md` for the full `/commit-push-pr` procedure.
2. Follow the procedure: check staged → draft message → show → confirm → commit → push → create or link PR.
3. If `$ARGUMENTS` contains `--yes`, skip confirmation.

## Arguments

`$ARGUMENTS` — optional:
- `--yes` — skip confirmation
- `--draft` — create PR as draft
