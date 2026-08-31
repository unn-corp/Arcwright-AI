# /caveman — Concise Output Mode

Load the `caveman` skill and write in compressed form for the rest of this turn (or until
"normal mode"). Cuts token usage on artifacts and replies while preserving full technical
accuracy. `the user's command input` selects the level.

## Instructions

### Step 1: Load the caveman skill

Read `.agents/skills/caveman/SKILL.md` for the full ruleset, intensity levels, and the
auto-clarity carve-outs (security warnings, destructive actions, ordered sequences).

### Step 2: Set level from arguments

- `lite` — drop filler/hedging, keep articles + full sentences (user-facing docs)
- `full` — default; drop articles, fragments OK, short synonyms (internal artifacts)
- `ultra` — maximal terseness, causal arrows, abbreviations (scratch notes / LEARNINGS)
- no argument → `full`

### Step 3: Apply and persist

Write terse for the whole turn. Never compress code, paths, commands, URLs, error strings,
or requirement/decision IDs. Drop back to clear language for any security warning,
irreversible-action confirmation, or step where terseness risks misreading, then resume.

To compress an existing verbose file instead, use `/caveman-compress <path>` (loads the
`caveman-compress` skill). Say "normal mode" to revert.
