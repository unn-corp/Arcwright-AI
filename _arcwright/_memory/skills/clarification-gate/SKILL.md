---
name: clarification-gate
description: Use when a spec or feature request has ambiguity before planning begins, when running the /clarify discipline, or when spec-kernel finds >3 NEEDS CLARIFICATION markers. Triggers on "clarify this", "ask clarifying questions", or entry into any planning workflow.
---

# Clarification Gate

## Overview

Ambiguity in specs costs more to fix after implementation than before. This skill ports spec-kit's /clarify rigor: scan a spec or request against a 12-category taxonomy, surface at most 5 questions, ask them one at a time, and lock each answer as a binding decision.

**Core principle:** Ask fewer questions better. One precise question answered is worth ten vague ones batched.

## Pre-output Discipline

Before generating any question or decision output, invoke the `caveman` skill (`.agents/skills/caveman/SKILL.md`).

## The 12-Category Ambiguity Taxonomy

Scan the spec or request against each category. Flag categories with ambiguity. Only escalate to questions if the ambiguity would cause a wrong build or a wrong test.

| # | Category | What to probe |
|---|----------|---------------|
| 1 | **Functional Scope** | What exactly is in vs. out? Where does this feature start and stop? |
| 2 | **Domain / Data Model** | What entities exist? What are their relationships and cardinalities? |
| 3 | **UX Flow** | What is the step-by-step user journey? What are the branching paths? |
| 4 | **Non-functional Requirements** | Performance targets, availability, load, latency, scale ceiling? |
| 5 | **Integration / External Deps** | Which third-party systems, APIs, or data sources are involved? |
| 6 | **Edge Cases** | What happens at boundaries — empty state, max load, error, unauthorized? |
| 7 | **Constraints / Tradeoffs** | What cannot change? What is the forced tradeoff (speed vs. accuracy, cost vs. quality)? |
| 8 | **Terminology** | Are domain terms used consistently? Does "user" mean the same thing everywhere? |
| 9 | **Completion Signals** | How will we know the feature is done? What does "working" look like? |
| 10 | **Permissions / Access Control** | Who can do what? Are there role-based restrictions? |
| 11 | **Error Handling & Recovery** | What is the fallback when things go wrong? Is degraded mode acceptable? |
| 12 | **Prioritization / MVP Boundary** | If this must ship smaller, which capabilities survive? What is the core? |

## Question Protocol

### Rules
- Ask **at most 5 questions** per session
- Ask **one question at a time** — wait for the answer before asking the next
- Each question must be drawn from the taxonomy scan — no fishing
- Each question comes with an AI-recommended answer and an A/B/C/Custom option table
- Integrate each answer into the spec **immediately** (incremental, not batched)
- If fewer than 5 questions are needed, stop early — do not pad

### Question Format

```
**Clarification [N/max 5] — Category: <Category Name>**

<One sentence stating what is ambiguous and why it matters.>

My recommendation: **Option A** — <brief rationale>

| Option | Description |
|--------|-------------|
| A | <recommended answer> |
| B | <alternative answer> |
| C | <another alternative> |
| Custom | Type your own answer |

*(After you answer, I will update the spec and ask the next question if needed.)*
```

### Incremental Integration

After each answer:
1. Update the relevant spec section immediately
2. Log the decision in the Decisions table (see format below)
3. State what changed: "Updated CAP-002 to reflect option B: …"
4. Then ask the next question (if questions remain)

## Decision Locking

Every answer to a clarification question becomes a **locked decision** with a permanent ID.

### Decision Format

```
## Decisions

D-01: <Decision text — what was decided> (locked YYYY-MM-DD)
  Source: Clarification 1 — Functional Scope
  Cited by: CAP-002, Constraints

D-02: <Decision text> (locked YYYY-MM-DD)
  Source: Clarification 2 — Edge Cases
  Cited by: CAP-004
```

### Binding Constraint Rule

Once locked, a decision becomes a **binding constraint** for all downstream work:
- Architect agents must not propose designs that contradict locked decisions
- Developer agents must cite the decision ID when implementing the relevant capability
- If a later task conflicts with a locked decision, escalate — do not silently override

### Decision Override Protocol

A locked decision can only be changed by:
1. Explicitly stating "Override D-0N: <reason>"
2. Logging the override in the Decisions table with the new lock date
3. Re-running the spec quality checklist

## Full Session Flow

```
1. Receive spec or feature request
2. Invoke caveman
3. Scan against all 12 taxonomy categories — note flagged categories
4. Rank flagged categories by impact (wrong build > wrong test > ambiguous > cosmetic)
5. Select top ≤5 questions from top-ranked categories
6. Ask Q1 with option table + recommendation
7. Receive answer → integrate into spec → log D-0N decision
8. Ask Q2 (if needed) → repeat until all questions answered or 5 reached
9. Confirm: "Clarification gate complete. N decisions locked. Spec updated."
10. Hand updated spec to spec-kernel quality checklist
```

## Integration Points

- **spec-kernel skill**: run clarification-gate first when spec has >3 NEEDS CLARIFICATION markers; hand result to spec-kernel quality gate
- **PM agent** (`pm.md`): invoke clarification-gate at start of CP (Create PRD) and VP (Validate PRD) flows when ambiguity is present
- **Analyst agent** (`analyst.md`): invoke clarification-gate during discovery/brief creation when user input is underspecified
- **Tracks**: compact and small tracks invoke clarification-gate as the first step if the brief is ambiguous; nano skips it
