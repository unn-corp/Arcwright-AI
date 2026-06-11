# PR Review Panel — Quick Rules

> Load full `SKILL.md` when executing this skill as a formal procedure.

## Core Rules
- Fan-out exactly 6 lens agents in ONE assistant message (parallel). Never sequential.
- Each lens: only its own domain. Cross-lens findings go to the closest match.
- Confidence threshold default = 70. Findings below threshold are silently dropped.
- Dedup: same file ±5 lines + same root issue → keep higher confidence.
- Verdict is deterministic: any Critical → BLOCK; ≥2 High → BLOCK; 1 High or ≥3 Medium → REVISE.
- Aggregation is done by the orchestrator itself (no extra agent spawn).
- Lens agents are disposable — do NOT reuse via SendMessage.
- review-orchestrator AR cycle is optional, only on BLOCK verdicts or user request.
- Sonnet for all lenses; Opus for AR cycle only with user permission.
- Max 10 findings per lens. Terse detail — ≤3 sentences per finding.

## Trigger
Use when: "review this PR", "review this diff", "check before merge", or `/pr-review`.
