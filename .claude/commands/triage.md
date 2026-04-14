---
description: Take a task description and recommend which Arcwright track to run (nano/small/compact/medium/extended/large/rv).
---

# /triage — Task Complexity Triage

Score a task description across 6 complexity dimensions and recommend the appropriate Arcwright workflow track. Outputs the recommended track with a rationale and the exact slash command to invoke.

## Instructions

1. Load `.agents/skills/triage/SKILL.md` for the full scoring rubric and output format.
2. Parse `$ARGUMENTS` as the task description to triage. Example:
   > "add a dark mode toggle to the settings page"
3. If `$ARGUMENTS` is empty, ask the user: "Describe the task you want to triage." Wait for their response.
4. Follow the skill:
   - Score each of the 6 dimensions (files touched, new architecture, UX impact, data migration, testing impact, risk of regression) 0–2.
   - Sum the score and map to a track.
   - Check for the special-case: if the task is audit/review/cleanup with no new features → recommend `/arcwright-track-rv`.
5. Output the recommendation in the format specified by the skill:
   ```
   Score: X/12
   Recommended track: <track>
   Rationale: <one sentence>
   Run: /arcwright-track-<slug>
   ```
6. Do NOT start the recommended workflow. The user runs the slash command themselves.

## Arguments

`$ARGUMENTS` — natural-language task description to score and route. If empty, prompts for input.
