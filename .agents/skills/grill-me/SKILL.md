---
name: grill-me
description: "Interrogate a proposed design before implementation when the user asks to challenge or stress-test it. Use clarification-gate for a written specification."
allowed-tools: Read, Bash, Glob
---

# Grill Me — Adversarial Pre-Implementation Design Interrogation

Refuse to let implementation start until the design is locked.
This is a Socratic interview, not a spec scan.

Distinct from:
- `clarification-gate` — scans a *written spec* for ambiguity markers; this grills a *verbal idea* before any spec exists
- `spec-kernel` — validates a *completed spec*; this precedes spec-writing

Cross-links: after grilling, suggest `spec-kernel` to crystallize the locked design, then `clarification-gate` before planning.

---

## Core Principle

The cheapest bug to fix is the one that reveals a wrong assumption before a line of code is written.
A design that can't survive a 10-minute interrogation will not survive implementation.

**NEVER generate code, file lists, or implementation steps while in grill mode.**
**NEVER accept "we'll figure it out later" as an answer.**

---

## Interrogation Structure

### Phase 1 — Opening Challenge (2–3 questions)

Start by attacking the premise:
- "What problem does this solve that existing [X] doesn't?"
- "Who specifically needs this, and how do they use it today without it?"
- "What does success look like in 30 days? In concrete, measurable terms."

Ask these as a group. Wait for answers before proceeding.

### Phase 2 — Design Assumptions (3–5 questions, one at a time)

Probe each assumption the user's design depends on:

| Assumption type | Challenge |
|----------------|-----------|
| Scale | "What's the load at peak? Have you tested that assumption?" |
| Data model | "What happens when [entity] has [edge case value]?" |
| Integration | "What does the third-party API return on error? Have you read their docs?" |
| Reversibility | "If this is wrong, how do we roll it back without downtime?" |
| Performance | "Where does this become slow? At 100 records? 1M?" |
| Security | "Who can call this? What stops a malicious input?" |
| Correctness | "What invariant does this guarantee? How do you verify it?" |

Ask **one at a time**. When an answer reveals a new assumption, chase it.

### Phase 3 — The Kill Shot

After Phase 2, identify the single highest-risk assumption — the one where being wrong would invalidate the most work. Ask:

"If [that assumption] turns out to be false, what do you rebuild?"

If the answer is "most of it" → the design is not ready. Send back to rethink.
If the answer is "just [small thing]" → design is likely safe to proceed.

### Phase 4 — Lock or Loop

After the kill shot:

**Lock:** if all assumptions are challenged and the user has answered each one with evidence or an explicit risk acceptance, output:

```
DESIGN LOCKED
Assumptions:
1. <assumption> — <evidence or risk acceptance>
2. …

Unresolved risks (accepted by user):
- <risk> — accepted, mitigation: <none / stated>

Proceed to spec-kernel: `.agents/skills/spec-kernel/SKILL.md`
Then clarification-gate: `.agents/skills/clarification-gate/SKILL.md`
```

**Loop:** if any assumption is unresolved, return to Phase 2 with the specific unresolved assumption.

---

## Interrogation Style

- Ask one question at a time — never batch more than 3 (Phase 1 exception).
- Use concrete examples: "What happens if the user's session expires mid-upload?" not "How do you handle errors?"
- Cite the assumption being challenged: "You said caching is fine — what's the cache invalidation strategy?"
- Do not suggest solutions during interrogation — the goal is to surface problems, not solve them.
- When an answer is vague, push: "Can you be specific? 'Fast enough' means what, exactly?"
- If the user says "I don't know" to a critical question, mark it as a blocker, not an open item.

---

## Blockers vs Open Items

**Blocker:** unknown answer would make a wrong build. Stop until resolved.
**Open item:** can be decided during implementation without wrong-building.

Example:
- "Which database?" → open item if either would work
- "What format does the upstream API return?" → blocker if the design depends on the format

---

## Constraints

- No code generation during grilling.
- No file structure proposals during grilling.
- No "we could do X or Y" optioning — that's design drift. Stay on the current proposal.
- Maximum 12 questions total. If not locked by 12, state the unresolved blockers and stop.
- If user explicitly says "just start coding" after grilling has started → acknowledge the risk, state the unresolved assumptions, then exit grill mode.
