# /hookify — Hook Generator

Translate a behavior description into a Claude Code `settings.json` hook.

## Instructions

1. Load `.agents/skills/hookify/SKILL.md` for the full event reference, matcher rules, and safe-merge procedure.
2. Parse `the user's command input` as the behavior description. If empty, ask: "Describe the behavior you want automated (e.g., 'before every file write, scan for secrets')."
3. Map to the correct event + matcher + command using the skill's Step-by-Step Procedure.
4. Show the hook entry for confirmation **before** writing.
5. On confirmation, safe-merge into `.claude/settings.json`.

## Arguments

`the user's command input` — natural-language behavior description. Examples:
- `"before every file write, scan for secrets"`
- `"after edits to *.ts files, run typecheck"`
- `"on session start, echo the current git branch"`
- `"log every bash command to .claude/bash-history.log"`
