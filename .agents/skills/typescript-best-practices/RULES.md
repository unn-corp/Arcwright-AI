# TypeScript Best Practices — Quick Rules

> Load full `SKILL.md` when executing this skill as a formal procedure.

## Core Rules
- Enable `strict: true`, `noUncheckedIndexedAccess: true`, and `exactOptionalPropertyTypes: true` in every project — never disable strict mode for convenience
- Use `satisfies` for type validation without widening; only use `as` when you genuinely know more than the compiler
- Model mutually exclusive states with discriminated unions (a `status`/`kind` field), not optional fields
- Use `as const` for configuration objects, route maps, and any literal that should not be widened to `string`
- Use `unknown` instead of `any`; narrow with type predicates before use
- Use template literal types to constrain string patterns at compile time
- Use `NoInfer<T>` (TS 5.4+) to prevent unwanted parameter influence on type inference
- Use branded types for domain IDs to prevent accidental cross-type substitution
- Add an exhaustive `default: { const _e: never = x; throw ... }` to every switch on a union
- Use type predicates (`item is User`) for safe runtime narrowing — never `as User`
- Use `import type` for all type-only imports
- Prefer `Record<K, V>` over index signatures; use a specific union for keys when possible
- Use `using` (TS 5.2+) for deterministic resource cleanup via `Symbol.dispose`
- Never use `enum` — use `as const` objects or union types instead
- Never use `Function` type — write specific function signatures

## Red Flags (stop and apply skill)
- Seeing `any`, `@ts-ignore`, or `as SomeType` without a comment explaining why
- Optional fields used to model states that are mutually exclusive
- `strict: false` or missing `noUncheckedIndexedAccess` in tsconfig
- Switch statement on a union with no exhaustive default
