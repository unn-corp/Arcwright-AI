# project-memory — Quick Rules

> Load full `SKILL.md` when initialising the planning layer or running a formal update procedure.

## Core Rules

- Always read `STATE.md` at session start if it exists — never start a workflow blind when memory is present
- All writes to planning files use `caveman` full level — structured, stripped of filler
- Use absolute dates only (YYYY-MM-DD) — never relative ("yesterday", "last sprint")
- Decision log entries are D-01, D-02, … — never skip or reuse numbers
- Learnings entries are L-01, L-02, … — one entry per track or sprint close
- `CONSTITUTION.md` is read-only from this skill — owned by `constitution`
- Update `STATE.md` at every phase transition, not just at track end
- Trivial decisions (naming, formatting) do not need a DECISIONS.md entry
- `project-context` runs first; it surfaces `{output_folder}` and existing artifacts

## Triggers

- Session start with existing `_arcwright-output/planning/STATE.md` — read immediately
- Phase transition in any track workflow — update STATE + conditionally append DECISIONS / LEARNINGS
- User says "update memory", "log decision", "record lesson", "show state"
- Track or sprint close — mandatory LEARNINGS entry

## Red Flags

- Starting a workflow without checking whether STATE.md exists
- Writing verbose prose in planning files (violates caveman discipline)
- Using relative dates in DECISIONS.md or LEARNINGS.md
- Letting a track complete without updating STATE.md current_phase
