---
name: karpathy-discipline
description: >
  Proactive behavioral minimalism layer. Use before writing any implementation — think first,
  smallest viable change, no over-engineering ("50 lines into 500" failure mode), goal-driven,
  delete before adding. Triggers automatically when starting any implementation task.
  Complements clean-code-standards (structural DRY/SOLID) with altitude and discipline.
allowed-tools: Read, Bash, Glob
---

# Karpathy Discipline — Behavioral Minimalism

Think first. Smallest change. Delete before adding. Goal-driven.

This is a **pre-implementation discipline layer**, not a code quality checker.
`clean-code-standards` enforces structure (DRY/SOLID). This enforces altitude and restraint.

---

## The Five Principles

### 1. Think Before Typing

Before writing any code: state the goal in one sentence and the minimal path to it.
If you cannot state the goal in one sentence, stop. The goal is unclear.

Ask:
- "What is the single thing this change must accomplish?"
- "What is the smallest code change that achieves that?"
- "Does existing code already do 80% of this?"

### 2. Smallest Viable Change

Default to the **minimum footprint** that moves the goal forward.

| Situation | Correct response |
|-----------|-----------------|
| Bug fix | Fix the bug. Do not refactor surrounding code. |
| New feature | Add the feature. Do not generalize for hypothetical future cases. |
| Performance | Fix the measured bottleneck. Do not optimize unrelated paths. |
| Refactor | Touch only the identified structural problem. |

**The "50 lines into 500" failure mode:** taking a well-scoped task and expanding it with "while I'm here" additions. Every "while I'm here" is a scope creep that compounds review cost, test cost, and merge risk. Stop before each additional change and ask: "Is this required to achieve the stated goal?"

### 3. Delete Before Adding

Before adding a new abstraction, ask: "Does removing something achieve this instead?"
Before adding a new file, ask: "Can this go in an existing file?"
Before adding a new dependency, ask: "Do we have 90% of this already?"

A codebase that shrinks is often more valuable than one that grows.

### 4. Goal-Driven, Not Completeness-Driven

Implementation is done when the **goal is achieved**, not when the code "feels complete."
Do not add:
- Error handling for errors that cannot occur given current inputs
- Configuration options that no caller will use
- Logging beyond what is needed to debug the current change
- Comments explaining what the code does if the code is already readable

### 5. Respect the Reader

Every line you add is a line someone else must read, understand, and maintain.
Write the version a smart colleague would read without needing to ask questions.
Do not write clever code — write boring, predictable code that does the thing.

---

## Pre-Implementation Checklist

Before writing the first line:

```
[ ] Goal stated in one sentence: "This change must ___."
[ ] Existing code checked — nothing reusable or extendable that would remove work
[ ] Scope boundary set — list what is explicitly OUT of scope for this change
[ ] File footprint estimated — how many files will actually be touched?
```

If file footprint > 5 and this is a "small fix" — stop and re-examine the scope.

---

## Failure Mode Detection

Recognize these patterns and stop:

| Pattern | What it is | What to do |
|---------|------------|------------|
| "While I'm here, I'll also…" | Scope creep | Stop. New task. |
| "This will be useful someday" | Speculative generalization | Remove it. |
| "I need an abstraction for this" | Premature abstraction | Is there a second use case right now? If no — inline it. |
| "Let me add a config option" | Option proliferation | Is there a caller for this option right now? If no — hardcode. |
| "I should handle the edge case where…" | Defensive overcoding | Does that edge case occur given current inputs? Confirm before handling. |
| Writing tests for code not yet requested | Test theater | Write tests for the actual requirement. |

---

## Relationship to Other Skills

| Skill | What it covers |
|-------|---------------|
| `karpathy-discipline` (this) | Altitude, restraint, minimalism, goal-driven decisions |
| `clean-code-standards` | Structure: DRY/SOLID, naming, coupling, cohesion |
| `clarification-gate` | Ambiguity in specs before planning |
| `grill-me` | Adversarial design interrogation before implementation |

Load `clean-code-standards` after implementation to check structural quality.
This skill governs the decisions made **during** implementation.

---

## Activation

This skill is proactively loaded. No explicit invocation needed.
Apply principles throughout any implementation session.
Re-read the failure mode detection table before expanding an implementation beyond its initial scope.
