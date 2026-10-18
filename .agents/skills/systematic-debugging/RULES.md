# Systematic Debugging — Quick Rules

> Load full `SKILL.md` when executing this skill as a formal procedure.

## Core Rules
- Treat installed skill files as read-only; save generated artifacts under the active project’s `_arcwright/_memory/skill-runs/systematic-debugging-<run-id>/`
- Run helpers by absolute path from the application or its isolated Arcwright fixture, never from an installed skill directory
- NEVER propose fixes before completing Phase 1 (root cause investigation)
- Read error messages and stack traces completely — they often contain the exact solution
- Reproduce the bug consistently before doing anything else
- Check git diff and recent changes first — most bugs trace to recent modifications
- In multi-component systems, add diagnostic instrumentation at each boundary and run once to gather evidence before proposing fixes
- Trace bad values backward through the call stack to find the origin — fix at source, not symptom
- Form one hypothesis at a time; make the smallest possible change to test it
- One fix at a time — never bundle multiple changes
- Create a failing test before implementing any fix
- If 3+ fixes have failed, stop and question the architecture — do not attempt Fix #4
- "Simple bugs" still have root causes — never skip the process because it seems easy
- Systematic debugging is faster than thrashing, even under time pressure

## Evidence Grading (tag every finding)
- **Confirmed** — directly observed; cite `path:line` / output / log line. No citation → not Confirmed.
- **Deduced** — inferred from Confirmed facts; show the reasoning chain (premise A + premise B ⇒ C), each premise Confirmed or Deduced.
- **Hypothesized** — plausible, unproven; state what would confirm it AND what would refute it. A hypothesis with no test is a guess.
- A root cause may only be declared from Confirmed evidence (or a Deduction chain resting on Confirmed facts). A Hypothesized root cause is the input to Phase 3, not a root cause.
- Tag findings inline, e.g. `[Confirmed] …`, `[Deduced] …`, `[Hypothesized] … (confirm by X / refute if Y)`. Never silently upgrade a tier — restate with the new citation.

## Red Flags (stop and apply skill)
- About to change code without knowing why it broke
- Thinking "just try X and see if it works"
- Proposing multiple fixes simultaneously
- Already tried 2+ fixes with no success
- Each fix reveals a new problem in a different place
- Feeling urgency or time pressure to skip investigation
