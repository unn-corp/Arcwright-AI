---
description: Switch to explanatory or learning output mode — explain the "why" inline as you work, or teach concepts + leave learning checkpoints. Opposite dial from /caveman.
handoffs:
  - label: "Switch to concise mode"
    prompt: "/caveman"
  - label: "Switch to learning mode"
    prompt: "/explain-mode learn"
---

# /explain-mode — Explanatory / Learning Output Mode

Switch response style to explain rationale and concepts as you work.
Opposite dial from `/caveman`.

## Instructions

Determine mode from `$ARGUMENTS`:

### `explain` or empty → Explanatory Mode
Load `.agents/skills/output-style-explanatory/SKILL.md`.
Attach one-sentence "why" rationale inline to every non-trivial action.
Format: `<action> — <why>`. Persist for the session.

### `learn` → Learning Mode
Load `.agents/skills/output-style-learning/SKILL.md`.
Explain concepts on first encounter (2–4 sentences), leave LEARN MORE checkpoints after
meaningful steps, name recognizable patterns. Persist for the session.

### `off` → Deactivate
Return to standard output style (no explicit rationale unless asked).

## Note on Artifacts

Both modes govern conversational output only.
For any artifact written to disk (spec, PRD, plan, handoff), still apply `caveman` discipline.

## Arguments

`$ARGUMENTS`:
- (empty) or `explain` — explanatory mode
- `learn` — learning mode
- `off` — deactivate
