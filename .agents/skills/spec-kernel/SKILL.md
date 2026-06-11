---
name: spec-kernel
description: Use when creating a new feature spec, validating a spec before planning, or running the pre-planning quality gate. Triggers on "write a spec", "spec this", "create SPEC.md", or any task entering the planning phase.
---

# Spec-Kernel

## Overview

A SPEC.md is a load-bearing contract, not a planning document. Every claim must change a downstream decision or it is dead weight.

**Core principle:** If removing a sentence would not change what gets built or tested, remove it.

**BMAD Load-Bearing Test:** Before finalising any section, ask: "If this line disappeared, would the architect, developer, or QA agent make a different decision?" If no — cut it.

## Pre-output Discipline

Before generating any SPEC.md or section thereof, invoke the `caveman` skill (`.agents/skills/caveman/SKILL.md`) to apply concise-output discipline. Do not produce verbose prose.

## The Five SPEC Fields

A valid SPEC.md contains exactly these five sections — no others are required at the kernel level.

### 1. Why
One paragraph. Problem statement + goal. No solution language.

### 2. Capabilities
Numbered list with immutable IDs: **CAP-001, CAP-002, …**

Rules:
- IDs are permanent — never renumber, never reuse a deleted ID
- Each capability is a testable behaviour, not a technical step
- Format: `CAP-NNN — <actor> can <observable outcome>`
- Every CAP must have an **Independent Test** line: `  ↳ Test: <how you verify this without implementation detail>`

### 3. Constraints
Bulleted list of hard limits — things the solution MUST NOT violate (performance ceilings, regulatory rules, platform restrictions). Not preferences.

### 4. Non-goals
Explicit list of things this spec does NOT address. Prevents scope creep and downstream confusion.

### 5. Success Signal
≤3 measurable, technology-agnostic statements. Format: `SS-1: <measurable condition>`. 

Good: `SS-1: 95% of users complete onboarding in < 3 minutes on first attempt.`  
Bad: `SS-1: The onboarding flow is implemented in React.`

## Inline Clarification Markers

Use `[NEEDS CLARIFICATION: <specific yes/no or A/B question>]` inline where a decision is blocked. Cap at **3 markers per spec**. If you have more than 3, you are not ready to write a spec — run the `clarification-gate` skill first.

## SPEC.md Template

```markdown
# SPEC — <Feature Name>

**Status:** Draft | Clarifying | Locked  
**Version:** 0.1  
**Date:** YYYY-MM-DD  

---

## Why

<One paragraph: problem + goal. No solution language.>

---

## Capabilities

CAP-001 — <actor> can <observable outcome>
  ↳ Test: <technology-agnostic verification method>

CAP-002 — <actor> can <observable outcome>
  ↳ Test: <technology-agnostic verification method>

<!-- Add CAP-NNN entries. IDs are immutable — never renumber. -->

---

## Constraints

- <Hard limit 1>
- <Hard limit 2>

---

## Non-goals

- <Explicit exclusion 1>
- <Explicit exclusion 2>

---

## Success Signal

SS-1: <measurable, technology-agnostic condition>
SS-2: <measurable, technology-agnostic condition>

---

## Decisions

<!-- Populated by clarification-gate. Do not edit manually. -->
<!-- D-01: <decision text> (locked YYYY-MM-DD) -->

---

## Open Questions

<!-- At most 3 NEEDS CLARIFICATION markers. If more exist, run clarification-gate first. -->
```

---

## Spec Quality Checklist (Pre-Planning Gate)

Run this gate **before handing the spec to any planning or implementation workflow**. No implementation details should exist in the spec at this stage.

Invoke `caveman` before reporting results.

### Checklist Items

| # | Check | Pass Condition |
|---|-------|----------------|
| Q1 | No implementation details | Zero technology names (framework, language, library) in Why/Capabilities/Non-goals |
| Q2 | All capabilities testable | Every CAP has an `↳ Test:` line that does not name an implementation |
| Q3 | Success signals measurable | Every SS-N contains a quantity, rate, or binary observable outcome |
| Q4 | Success signals technology-agnostic | No SS-N names a technology, tool, or platform |
| Q5 | NEEDS CLARIFICATION markers ≤ 3 | Count of `[NEEDS CLARIFICATION:` markers in the full spec |
| Q6 | Load-bearing test passes | No sentence survives only because it sounds good — each changes a decision |
| Q7 | Non-goals present | At least one Non-goal listed |
| Q8 | Constraints are hard limits | No constraint is a preference or a "we should" |

### Reporting Format

```
## Spec Quality Gate — <feature name>

Before: N/8 passing

Findings:
- [FAIL Q1] "Capabilities" section mentions React — replace with UI behaviour description
- [FAIL Q3] SS-2 has no measurable quantity — add percentage or time bound

After: N/8 passing

Status: PASS | BLOCKED (fix failures before proceeding)
```

**Gate rule:** All 8 checks must pass before the spec advances to planning. A BLOCKED spec is returned to the author with findings.

---

## Integration Points

- **PM agent** (`pm.md`): invoke spec-kernel when creating or validating a spec before PRD creation
- **Analyst agent** (`analyst.md`): produce a SPEC kernel as the output of discovery/brief workflows
- **clarification-gate skill**: run before spec-kernel when the problem space has >3 open questions
- **Surviving tracks** (nano, small, compact, rv): spec-kernel is the input contract for compact and small tracks; nano skips it by definition
