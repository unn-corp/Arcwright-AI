# Spec-Kernel — Quick Rules

> Load full `SKILL.md` when executing this skill as a formal procedure.

## Core Rules
- Every SPEC.md has exactly 5 sections: Why, Capabilities, Constraints, Non-goals, Success Signal
- Capability IDs (CAP-001…) are immutable — never renumber, never reuse deleted IDs
- Every CAP requires an `↳ Test:` line — technology-agnostic verification method
- BMAD Load-Bearing Test: if removing a sentence changes no downstream decision, cut it
- Inline marker `[NEEDS CLARIFICATION: <question>]` — hard cap of 3 per spec
- More than 3 open questions → run `clarification-gate` before writing the spec
- Success Signals must be measurable and technology-agnostic (quantities/rates, not tool names)
- No implementation detail (framework, language, library) in Why/Capabilities/Non-goals
- Invoke `caveman` skill before generating any SPEC.md output

## Pre-Planning Quality Gate (8 checks)
- Q1: No implementation details in spec body
- Q2: Every CAP has `↳ Test:` line
- Q3: Every SS-N has a measurable quantity or binary outcome
- Q4: No SS-N names a technology or platform
- Q5: ≤3 NEEDS CLARIFICATION markers
- Q6: Load-bearing test — each sentence changes a decision
- Q7: At least one Non-goal present
- Q8: Constraints are hard limits, not preferences

All 8 must pass before spec advances to planning. Report before/after pass counts.

## Red Flags (stop and apply skill)
- Spec describes HOW not WHAT
- CAP says "implement X using Y" instead of "user can Z"
- Success signal names a technology ("the React component renders")
- More than 3 open questions in spec
- Constraint says "we should" instead of "must not"
