---
description: Prune local branches whose remote tracking branch is gone. Fetches with --prune, lists candidates, confirms before deleting.
---

# /clean-gone — Prune Gone Remote Branches

Delete local branches whose upstream remote has been deleted (e.g., after merged PRs).

## Instructions

1. Load `.agents/skills/commit-commands/SKILL.md` for the `/clean-gone` procedure.
2. Run `git fetch --prune`, list gone-remote branches, show them, confirm, then delete.
3. Use `-d` (safe); escalate to `-D` only if `-d` fails and user explicitly confirms.

## Arguments

`$ARGUMENTS` — optional:
- `--yes` — skip confirmation, delete all gone branches with `-d`
- `--force` — use `-D` for all (still show list first)
