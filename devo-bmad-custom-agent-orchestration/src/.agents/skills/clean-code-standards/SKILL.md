---
name: clean-code-standards
description: DRY/SOLID code quality principles for architectural review — 23 rules across 7 categories. Use when performing a DRY/SOLID review (DR/DRY trigger) or when architect-agent is running a combined AR+PMR+DRY review gate.
version: 1.0.0
author: bmad
tags: [code-quality, solid, dry, architecture, review]
---

# Clean Code Standards

## How to Use This Skill

Load this skill when performing a DRY/SOLID architectural review. For each file in the target area, evaluate against all 23 rules below. Produce findings with ID format `DRY-001`, `DRY-002`, etc.

When running as the combined **AR+PMR+DRY gate sub-agent** (architect-agent), run this skill as the third lens after AR and PMR. Produce a separate findings block appended to the gate output.

## Categories & Rules

### SOLID Principles

- **solid-srp** — Single Responsibility Principle: each class/module has one reason to change. Flag classes that mix data access, business logic, and presentation.
- **solid-ocp** — Open/Closed Principle: open for extension, closed for modification. Flag code that requires internal changes to add new behaviour (missing abstractions, hardcoded switch/if-else on type).
- **solid-lsp** — Liskov Substitution Principle: subtypes must be substitutable for base types without altering correctness. Flag overrides that change base-class contracts or raise new exceptions.
- **solid-isp** — Interface Segregation Principle: no client should depend on interfaces it doesn't use. Flag large interfaces/protocols forcing classes to implement irrelevant methods.
- **solid-dip** — Dependency Inversion Principle: depend on abstractions, not concretions. Flag direct instantiation of concrete dependencies inside high-level modules (should be injected).

### Core Principles

- **core-dry** — Don't Repeat Yourself: every piece of knowledge has a single, authoritative representation. Flag 3+ near-identical code blocks; flag duplicated constants, query patterns, or validation logic.
- **core-kiss** — Keep It Simple, Stupid: prefer the simplest solution that works. Flag over-engineered abstractions, unnecessary indirection, or patterns applied where they add no value.
- **core-yagni** — You Aren't Gonna Need It: don't add functionality until it's needed. Flag speculative generality (hooks/plugin systems for hypothetical future needs, unused configuration options).
- **core-soc** — Separation of Concerns: divide the program into distinct sections, each addressing a separate concern. Flag components that mix routing + business logic + data formatting in one function.
- **core-lod** — Law of Demeter: a unit should have only limited knowledge of other units (`a.b.c.d()` is a violation). Flag deep chained property access and tight coupling across module boundaries.
- **core-fail-fast** — Fail Fast: detect and report errors at the earliest possible point, not silently. Flag swallowed exceptions, empty catch blocks, and silent fallbacks that hide bugs.
- **core-encapsulation** — Encapsulation: hide implementation details, expose only what's necessary. Flag public fields that should be properties, direct model field access across module boundaries.

### Design Patterns

- **pattern-repository** — Repository Pattern: abstract data access behind a consistent interface. Flag direct ORM calls scattered across business logic or routes instead of going through a repository.
- **pattern-factory** — Factory Pattern: use factories for complex object construction. Flag constructor overload or multi-step object building repeated in multiple places.
- **pattern-observer** — Observer Pattern: use events/callbacks over tight coupling. Flag modules that directly call many other modules on state change (should emit events/signals instead).

### Code Organization

- **org-module-size** — Modules should be small and focused. Flag files over 300 lines — strong signal that SRP is violated and the module should be split.
- **org-function-size** — Functions should do one thing. Flag functions over 30 lines — likely mixing multiple concerns. Flag functions that return different types depending on control flow.
- **org-nesting** — Avoid deep nesting (3+ levels). Flag deeply nested if/for/try blocks — prefer early returns and extracted helpers.

### Naming

- **naming-intent** — Names should reveal intent. Flag abbreviations (`usr`, `fn`, `tmp`), single-letter variables outside loops (`x`, `d`), and boolean names that don't read as questions (`active` instead of `is_active`).
- **naming-consistency** — Consistent naming conventions across the codebase. Flag mixed conventions in the same module (e.g., camelCase and snake_case Python, or inconsistent REST verb usage in route names).

### Functions

- **func-args** — Functions should have ≤3 parameters. Flag functions with 4+ parameters — use a config object/dataclass. Exception: well-known constructors with established signatures.
- **func-side-effects** — Functions should not have hidden side effects. Flag functions whose names imply read-only behaviour but also write to DB, cache, or emit events without declaring it.

### Documentation

- **doc-why-not-what** — Comments should explain WHY, not WHAT the code does. Flag comments that merely restate the code (`# increment counter` above `counter += 1`). Flag missing WHY comments on non-obvious business rule implementations.

---

## Severity Guide

| Severity | Condition | Examples |
|---|---|---|
| 🔴 Critical | SOLID violations causing tight coupling or untestable code; DRY violations with 3+ duplicated blocks of ≥10 lines | God class violating SRP, direct DB calls scattered across routes, copy-pasted 50-line validation blocks |
| 🟡 Major | Core principle violations; module/function size violations; naming issues that reduce readability | 60-line function, 400-line module, YAGNI speculation, Law of Demeter chain, missing fail-fast |
| 🟢 Minor | Documentation, minor style, isolated single-instance patterns | Missing WHY comment, one slightly long variable name, single unused config option |

---

## Finding Format

```markdown
### [DRY-001] {title}
File: {path}:{line}
Rule: {rule-id} — {rule name}
Issue: {description of the violation}
Fix: {specific fix — include corrected code snippet where helpful}
```

---

## Status Rules

- `passed` — zero critical findings and ≤3 major findings
- `needs_fixes` — any critical finding OR 4+ major findings

---

## YAML Verdict (return to review-orchestrator or Krakken)

```yaml
dry_review_verdict:
  target: {path or feature name}
  actionable_count: {N}
  critical: {count of 🔴}
  major: {count of 🟡}
  minor: {count of 🟢}
  findings_path: _bmad-output/features/{feature-slug}/planning/dry-review-findings-{artifact_id}.md
  status: passed | needs_fixes
```
