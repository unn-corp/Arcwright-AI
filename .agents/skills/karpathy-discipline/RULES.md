# Karpathy Discipline — Quick Rules

> Use the full `SKILL.md` when scope or implementation choices need diagnosis; do not force an extra read for routine work.

Behavioral minimalism layer — altitude and restraint during implementation.
Complements `clean-code-standards` (structural DRY/SOLID) — this governs decisions, that governs structure.

## The Five Principles (Quick Ref)

1. **Think before typing** — state the goal in one sentence. If you can't, stop.
2. **Smallest viable change** — minimum footprint that achieves the stated goal.
3. **Delete before adding** — can removing something achieve this instead?
4. **Goal-driven, not completeness-driven** — done when goal is achieved, not when code "feels complete."
5. **Respect the reader** — boring, predictable code that does the thing.

## Red Flags (Stop Immediately)

- "While I'm here, I'll also…" → scope creep, new task
- "This will be useful someday" → speculative generalization, remove it
- "I need an abstraction for this" → is there a second use case *right now*?
- "Let me add a config option" → is there a caller for this option *right now*?
- "I should handle the edge case where…" → does it occur given current inputs?
- File footprint growing past 5 files for a "small fix" → re-examine scope

## Pre-Implementation Must-Do

Before writing the first line:
- Goal stated in one sentence
- Existing code checked for reuse
- Scope boundary set (what is OUT)
- File footprint estimated
