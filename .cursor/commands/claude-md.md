# /claude-md — CLAUDE.md Management

Audit and maintain CLAUDE.md files — prune dead weight, capture session learnings.

## Instructions

1. Load `.agents/skills/claude-md-management/SKILL.md` for the full procedure, load-bearing test, and output format.
2. Load `.agents/skills/caveman/SKILL.md` for pre-output discipline.
3. Determine mode from `the user's command input`:
   - `audit` or empty → Mode A: scan and report, confirm before applying
   - `capture` → Mode B: derive session learnings, propose additions
   - `prune` → Mode C: audit + immediately apply pruning (preview first)
   - `--global` suffix → operate on `~/.claude/CLAUDE.md` instead of project file
4. Apply the selected mode and show the diff before writing anything.

## Arguments

`the user's command input` — mode and optional scope flag:
- (empty) → audit project CLAUDE.md
- `capture` → capture session learnings
- `prune` → audit + prune project CLAUDE.md
- `audit --global` → audit `~/.claude/CLAUDE.md`
- `capture --global` → capture session learnings to global CLAUDE.md
