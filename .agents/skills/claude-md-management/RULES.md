# CLAUDE.md Management — Quick Rules

> Load full `SKILL.md` when auditing or writing to CLAUDE.md.

Keeps CLAUDE.md accurate, concise, and load-bearing. Distinct from:
- `constitution` — enforcement rules (CONSTITUTION.md)
- `project-memory` — planning state

## Core Rules

- Load-bearing test: "If this line disappeared, would Claude behave differently?" If no → prune it
- Belongs: persistent house conventions, proactive skill triggers, non-obvious repo structure, tool permission patterns
- Does NOT belong: sprint items, one-off instructions, decisions with rationale, info already in README/lint config
- Always show diff before applying any change — never edit silently
- Global CLAUDE.md changes (`~/.claude/CLAUDE.md`) affect all projects — warn before writing
- Additions must be shorter or equal length to what they replace — never add verbose prose
- Invoke `caveman` before writing any proposed additions

## Modes

- `audit` (default) — scan, report findings, confirm before applying
- `capture` — derive session learnings, propose additions, confirm before writing
- `prune` — run audit, immediately apply PRUNE + REWRITE proposals (preview first)

## Red Flags

- Writing to CLAUDE.md without showing the diff
- Adding task-specific notes (sprint items, one-off reminders)
- Moving enforcement rules here from CONSTITUTION.md
- Writing verbose explanations instead of terse rules
- Adding global CLAUDE.md changes without warning
