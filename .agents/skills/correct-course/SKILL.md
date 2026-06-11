---
name: correct-course
description: Use when a task is mid-flight and something invalidates the current plan — a discovered constraint, a changed requirement, a blocker, a failed verification, or new information. Clarifies the triggering issue, analyzes its impact across spec/plan/architecture, drafts before/after change proposals, classifies the scope (Minor/Moderate/Major), and routes to the right agent. A structured course-correction, not an ad-hoc pivot.
allowed-tools: Read, Grep, Glob, Write
---

# Correct Course

Mid-task reality diverged from the plan. Rather than silently improvising, run a
structured correction: name the issue, trace its blast radius, propose concrete
before/after edits, classify the scope, and hand off to whoever owns the fix.

## When to invoke

- A discovered constraint or dependency breaks the current approach
- A requirement changed or was misunderstood
- A blocker (technical, access, external) stalls the task
- A `goal-backward-verify` FAIL shows the goal itself (not just the code) shifted
- New information makes the current plan wrong or wasteful

## Procedure

### 1. Clarify the triggering issue
State, in one or two sentences:
- **What** triggered the correction (the concrete event/finding)
- **Why** it invalidates the current plan
- **Evidence** — cite the `path:line`, error, spec quote, or verification finding

Do not proceed until the trigger is crisply stated. Ask the user one question if ambiguous.

### 2. Analyze impact across artifacts
Walk each layer and record whether it's affected:

| Layer | Question | Affected? |
|-------|----------|-----------|
| **Spec / requirements** | Does the stated goal or acceptance criteria change? | yes/no + note |
| **Plan / tasks** | Do remaining tasks, sequence, or estimates change? | yes/no + note |
| **Architecture** | Do interfaces, data models, or component boundaries change? | yes/no + note |
| **Implemented code** | Does already-written code need rework or rollback? | yes/no + note |
| **Tests / verification** | Do test plans or acceptance checks change? | yes/no + note |

### 3. Draft before/after proposals
For each affected artifact, write a concrete proposal — not a vague intention:

```
PROPOSAL P1 — <artifact path>
BEFORE: <current text/behavior/interface>
AFTER:  <proposed replacement>
WHY:    <ties back to the trigger>
```

### 4. Classify scope
Pick exactly one:

| Scope | Criteria | Default route |
|-------|----------|---------------|
| **Minor** | Single artifact, no interface/goal change, no rework of merged code. Proceed within current track. | Stay with current dev — apply inline. |
| **Moderate** | Multiple artifacts or a plan/sequence change, but goal stands. Needs re-planning, not re-scoping. | Route to **pm** (plan) and/or **architect** (interfaces). |
| **Major** | Goal / acceptance criteria changed, or architecture boundary moves, or significant rework. Track may need re-selection. | Route to **analyst/pm** for re-spec; re-run triage for track. |

### 5. Route to the right agent
State the handoff explicitly:
- **Minor** → continue with dev; attach the proposals.
- **Moderate** → spawn/hand to `arcwright-pm` (plan) or `arcwright-architect` (design), then back to dev.
- **Major** → spawn/hand to `arcwright-analyst` / `arcwright-pm` to re-spec; recommend re-running `/triage` for track selection.

Always name the receiving agent and the exact proposals it must act on.

## Output — CORRECTION report (terse)

> **REQUIRED PRE-OUTPUT:** If this skill instructs an agent to WRITE the correction
> report to a file, invoke `caveman` first (concise-output discipline). Inline returns
> need no file.

```
CORRECTION — <task>
Trigger: <one line> (evidence: path:line)
Impact: spec ✗ | plan ✓ | arch ✗ | code ✓ | tests ✓
Proposals:
  P1 <artifact> — BEFORE→AFTER (why)
  P2 ...
Scope: Moderate
Route: arcwright-pm (re-sequence tasks P1,P2) → dev
```

## Notes

- This is **mid-task** correction. For a brand-new task or ambiguous request, use `triage` instead.
- Do not relax the goal to make the plan fit — if the goal must change, that is a **Major** scope and goes back to spec.
- Keep proposals concrete and citable; a proposal without a before/after is not actionable.
