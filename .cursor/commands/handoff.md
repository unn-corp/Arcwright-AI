# /handoff — Session Handoff

Compress the current session into a terse, load-bearing continuation artifact.

## Instructions

1. Load `.agents/skills/session-handoff/SKILL.md` for the full document structure and procedure.
2. Load `.agents/skills/caveman/SKILL.md` — apply **full** level throughout.
3. Gather evidence: run `git diff --name-only HEAD`, `git log --oneline -10`, read any open planning docs in `_arcwright-output/`.
4. Write the handoff artifact to `_arcwright-output/handoffs/handoff-{YYYY-MM-DD}.md`. If today's file exists, append `-2`, `-3`.
5. Print the 3-line summary (path, next action, first context ref).

## Arguments

`the user's command input` — optional override note (e.g., "focus on the auth subsystem", "skip files changed"). If empty, derive everything from git evidence.
