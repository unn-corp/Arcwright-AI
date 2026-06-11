# Clarification Gate — Quick Rules

> Load full `SKILL.md` when executing this skill as a formal procedure.

## Core Rules
- Scan spec against 12 taxonomy categories before forming any question
- Ask at most 5 questions — stop early if fewer suffice
- One question at a time — never batch questions
- Every question: one AI-recommended answer + A/B/C/Custom option table
- Integrate each answer into the spec immediately after receiving it — do not batch
- Every answer becomes a locked decision: D-01, D-02, … with permanent IDs
- Locked decisions are binding constraints for all downstream work (architect, dev, QA)
- To override a locked decision: explicit "Override D-0N" statement + re-log + re-run quality gate
- Invoke `caveman` before generating output

## The 12 Taxonomy Categories
1. Functional Scope — in vs. out
2. Domain / Data Model — entities + relationships
3. UX Flow — step-by-step journeys + branches
4. Non-functional Requirements — performance, scale, latency
5. Integration / External Deps — third-party systems
6. Edge Cases — boundaries, errors, empty states
7. Constraints / Tradeoffs — hard limits + forced tradeoffs
8. Terminology — consistent domain vocabulary
9. Completion Signals — definition of done
10. Permissions / Access Control — roles + restrictions
11. Error Handling & Recovery — fallback + degraded mode
12. Prioritization / MVP Boundary — core vs. cut

## Red Flags (stop and apply skill)
- About to start planning with >3 unanswered questions in spec
- Asking multiple questions simultaneously
- Proceeding after answer without updating the spec
- Treating a clarification answer as a preference rather than a locked decision
- Downstream agent contradicts a D-0N decision without explicit override
