# Clean Code Standards — Quick Rules

> Load full `SKILL.md` when executing this skill as a formal procedure.

## Core Rules
- SRP: each class/module has one reason to change — flag classes mixing data access, business logic, and presentation
- OCP: adding new behavior should not require modifying existing internals — flag hardcoded type switches with no abstraction
- DIP: high-level modules depend on abstractions — flag direct instantiation of concrete dependencies inside business logic
- DRY: flag 3+ near-identical code blocks or duplicated constants/validation logic
- KISS: flag over-engineered abstractions and unnecessary indirection
- YAGNI: flag speculative features, unused config options, and plugin systems built for hypothetical needs
- Law of Demeter: flag deep chained access (`a.b.c.d()`) and tight coupling across module boundaries
- Fail Fast: flag swallowed exceptions, empty catch blocks, and silent fallbacks that hide errors
- Module size: flag files over 300 lines
- Function size: flag functions over 30 lines or returning different types based on control flow
- Nesting: flag 3+ levels of nested if/for/try — prefer early returns and extracted helpers
- Naming: flag abbreviations (`usr`, `fn`), non-question boolean names (`active` vs `is_active`), mixed conventions in one module
- Functions: flag 4+ parameters — use a config object/dataclass; flag functions with hidden side effects
- Comments: flag comments that restate the code; flag missing WHY comments on non-obvious business rules
- Findings format: `DRY-001`, severity Critical/Major/Minor; status `passed` = zero critical + ≤3 major

## Red Flags (stop and apply skill)
- File exceeds 300 lines
- Function exceeds 30 lines or has 4+ parameters
- Same logic copy-pasted in 3+ places
- Exception caught and silently ignored
- Constructor or route handler directly instantiates its own dependencies
