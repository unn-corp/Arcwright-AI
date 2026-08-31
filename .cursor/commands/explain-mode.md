# /explain-mode — Explanatory / Learning Output Mode

Switch response style to explain rationale and concepts as you work.
Opposite dial from `/caveman`.

## Instructions

Determine mode from `the user's command input`:

### `explain` or empty → Explain Mode
Load `.agents/skills/output-style-explanatory/SKILL.md` and run its **explain** mode:
attach a one-sentence "why" rationale inline to every non-trivial action. Persist for the session.

### `learn` → Learn Mode
Load `.agents/skills/output-style-explanatory/SKILL.md` and run its **learn** mode:
explain mode plus concept explanations on first encounter, LEARN MORE checkpoints after
meaningful steps, and pattern naming. Persist for the session.

### `off` → Deactivate
Return to standard output style (no explicit rationale unless asked).

## Note on Artifacts

Both modes govern conversational output only.
For any artifact written to disk (spec, PRD, plan, handoff), still apply `caveman` discipline.

## Arguments

`the user's command input`:
- (empty) or `explain` — explanatory mode
- `learn` — learning mode
- `off` — deactivate
