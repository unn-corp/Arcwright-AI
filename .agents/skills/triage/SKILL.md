---
name: triage
description: Take a task description and recommend the right Arcwright track (nano/small/compact/medium/extended/large/rv) with reasoning.
version: 2.0.0
---

# Triage Skill

Given a user's task description, score its complexity and recommend which Arcwright track (`nano`, `small`, `compact`, `medium`, `extended`, `large`, or `rv`) to run. Output the recommended track with a short rationale and the exact slash command to invoke it.

---

## Input

A natural-language task description in `$ARGUMENTS`. Example:
> "add a dark mode toggle to the settings page"

If `$ARGUMENTS` is empty, ask the user for the task description and wait.

---

## Scoring Rubric

Score each dimension 0–2 based on the task description. Sum them.

| Dimension | 0 pts | 1 pt | 2 pts |
|-----------|-------|------|-------|
| **Files touched** | 1-2 | 3-8 | 9+ |
| **New architecture** | No | Minor refactor | New service / schema |
| **UX impact** | None | Tweak existing UI | New screen / flow |
| **Data migration** | None | Single table / field | Multi-table / breaking |
| **Testing impact** | None / handled by QA agent | New unit tests | New integration / e2e tests |
| **Risk of regression** | Low | Medium | High |

**Map total score → track:**

| Score | Track | Slash command |
|-------|-------|---------------|
| 0-1 | Nano | `/arcwright-track-nano` |
| 2 | Small | `/arcwright-track-small` |
| 3 | Compact | `/arcwright-track-compact` |
| 4-5 | Medium | `/arcwright-track-medium` |
| 6-7 | Extended | `/arcwright-track-extended` |
| 8+ | Large | `/arcwright-track-large` |

Special case: if the task describes auditing, reviewing, or cleaning up existing code (no new features), recommend `/arcwright-track-rv` regardless of score.

---

## Process

1. Read the task description
2. For each scoring dimension, write a one-line justification and score
3. Sum the score
4. Map to track
5. Output the recommendation in this format:

```
Score: X/12
Recommended track: <track> — <code>
Rationale: <one sentence summary>
Run: /arcwright-track-<slug>
```

---

## Notes

- If the task is ambiguous, ask one clarifying question before scoring (e.g., "Is this a UI change, a backend change, or both?").
- If the user explicitly asks to override the recommendation, respect it — your role is advisory.
- Do NOT start the recommended workflow yourself; the user runs the slash command.
