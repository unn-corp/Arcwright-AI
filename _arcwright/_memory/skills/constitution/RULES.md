# constitution — Quick Rules

> Load full `SKILL.md` when creating, updating, or validating a CONSTITUTION.md.

## Core Rules

- Constitution contains non-negotiables only — not roadmap, not decisions, not style prefs
- Starting version is always `1.0.0`
- MAJOR bump: rule removed or weakened. MINOR bump: rule added. PATCH bump: wording only
- MAJOR or MINOR bumps trigger a propagation check — grep planning artifacts for conflicts
- Never auto-fix constitution violations — report as CONST-{N} findings, user decides
- Every version bump gets a DECISIONS.md entry and a Changelog row in CONSTITUTION.md
- Write with `caveman` discipline — no policy bloat, each rule is one clear sentence
- `CONSTITUTION.md` lives at `_arcwright-output/planning/CONSTITUTION.md`
- Present draft to user for approval before first write

## Triggers

- User runs `/constitution create`, `/constitution update`, or `/constitution validate`
- `project-context` reports an existing constitution — read version at session start
- MAJOR or MINOR bump detected — run propagation check automatically

## Red Flags

- Adding roadmap items or task lists to the constitution
- Weakening a non-negotiable without bumping MAJOR version
- Skipping the propagation check after a MAJOR or MINOR bump
- Constitution version not updated after a rule change
- Writing verbose explanations for what should be a one-sentence rule
