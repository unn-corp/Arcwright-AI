# Grill Me — Quick Rules

> Load full `SKILL.md` to run a grilling session.

Adversarial pre-implementation design interrogation. Refuse to let code start until all critical
assumptions are either answered with evidence or explicitly accepted as risks.

Distinct from `clarification-gate` (scans a written spec) and `spec-kernel` (validates a completed spec).
Grilling precedes both — it operates on a verbal idea before any spec exists.

## Core Rules

- NEVER generate code, file lists, or implementation steps during a grilling session
- NEVER accept "we'll figure it out later" for a blocker-class question
- Ask one question at a time (Phase 1 exception: 2–3 together)
- Maximum 12 questions total across the session
- Chase vague answers: "fast enough" → "what is the p99 latency target?"
- Distinguish blockers (unknown = wrong build) from open items (can decide during implementation)
- On "just start coding" override: acknowledge risks, state unresolved assumptions, then exit grill mode

## Phase Sequence

1. Opening Challenge (2–3 questions) — attack the premise
2. Design Assumptions (one at a time) — probe each dependency
3. Kill Shot — identify the single highest-risk assumption; ask what must be rebuilt if wrong
4. Lock or Loop — lock design with explicit assumption list, or loop back to unresolved assumptions

## After Lock

Suggest:
1. `spec-kernel` — crystallize locked design into SPEC.md
2. `clarification-gate` — scan spec for ambiguity before planning

## Red Flags

- Proposing code before DESIGN LOCKED output
- Accepting vague answers without pushing for specifics
- Treating a "blocker" as an "open item" to avoid slowing down
- Asking more than one question at a time (Phase 2+)
