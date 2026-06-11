---
description: Create, update, or validate the project CONSTITUTION.md — versioned non-negotiables for test discipline, security posture, and house conventions.
handoffs:
  - label: "Update planning memory after changes"
    prompt: "/project-memory update state"
  - label: "Log constitution decision"
    prompt: "/project-memory log decision Constitution v[version]"
  - label: "Validate codebase against constitution"
    prompt: "/constitution validate"
---

# /constitution — Project Constitution

Manage the project's standing non-negotiables document.

## Instructions

1. Load `.agents/skills/constitution/SKILL.md` for the full procedure.
2. Parse `$ARGUMENTS` to determine the sub-command:
   - `create` — initialise a new `CONSTITUTION.md` (§3 of skill)
   - `update [description of change]` — bump version and apply change (§4)
   - `validate` — check codebase compliance against current rules (§5)
   - *(empty)* — if `CONSTITUTION.md` exists, show current version + summary; if not, offer to create one
3. Always run `project-context` first to locate `{output_folder}` and check if `CONSTITUTION.md` already exists.
4. All writes use `caveman` concise output — no verbose prose in constitution entries.
5. On MAJOR or MINOR version bump, run the propagation check (§7 of skill) and report affected artifacts.

## Arguments

`$ARGUMENTS` — sub-command: `create`, `update [description]`, or `validate`. If empty, show current status.
