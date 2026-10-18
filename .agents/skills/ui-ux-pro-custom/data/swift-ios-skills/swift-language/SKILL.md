---
name: swift-language
description: "Write or review core Swift generics, protocols, enums, typed errors, builders, wrappers, collection code, and formatting. Concurrency diagnostics use swift-concurrency; SwiftUI composition uses swiftui-patterns."
---

# Core Swift Language Patterns

Match the existing codebase's Swift language mode, SDK availability, and public
contracts. Use a clearer language construct when it helps the requested change;
do not mechanically modernize unrelated code or raise compiler requirements.
Concurrency and SwiftUI-specific ownership belong in their focused skills.

## Decisions and correctness constraints

- Prefer generics or `some Protocol` when the caller/compiler should preserve a
  concrete type. Use `any Protocol` for genuine runtime heterogeneity. Opaque
  return paths must resolve to one concrete underlying type; a conditional does
  not make unrelated return types interchangeable.
- Use enums to model finite alternatives and exhaustive handling. Use `Never`
  only for paths/types that cannot produce a value, not to hide a recoverable
  error behind a trap.
- Use typed throws when the supported compiler and a clear error contract let
  callers benefit from exhaustiveness. Mixed underlying errors need an explicit
  mapping or ordinary `throws`; do not erase useful diagnostics to fit one type.
- Use supported `if`/`switch` expressions for simple value selection. Preserve
  branch type compatibility and exhaustive behavior. Prefer ordinary control
  flow when branches contain side effects or several steps.
- Introduce a result builder or property wrapper only for a reusable semantic
  need. Check builder handling of conditionals/loops and wrapper initialization,
  mutation, ownership, and projected-value behavior. A computed property is
  often enough for one local convenience.
- In Codable code, distinguish absent/null optional fields from malformed
  values. Use explicit CodingKeys and parsing strategies where the external
  schema requires them. Do not silently default invalid required data or
  force unwrap decoding results. Keep an independent wire-format example.
- Choose collection APIs by meaning and cost. Avoid creating intermediate
  collections or sorting when a lookup/short-circuit operation suffices, but
  retain a straightforward loop when it is clearer or preserves required
  mutation/order. New convenience APIs need deployment/compiler support.
- Use locale-aware FormatStyle for display when appropriate; machine protocols
  need stable specified formats. Preserve grapheme/Unicode semantics in string
  operations, and use simple string APIs before a complex regex/builder.

## Validation and completion

Compile with the project's actual language mode, supported targets, and public
API consumers. Run the nearest focused behavior checks for the changed contract;
for serialization, check representative encoded/decoded external data rather
than only a self-confirming roundtrip. Type-level examples should actually
compile before being treated as API guidance.

Stop when the requested behavior is clearer and the public contract remains
correct. Do not replace every loop, formatter, existential, or error type just
because a newer construct exists.

## Conditional recipes

- [Expressions](references/implementation-guide.md#ifswitch-expressions),
  [typed throws](references/implementation-guide.md#typed-throws),
  [builders](references/implementation-guide.md#result-builders),
  [wrappers](references/implementation-guide.md#property-wrappers),
  [opaque/existential types](references/implementation-guide.md#opaque-and-existential-types),
  [guards](references/implementation-guide.md#guard-patterns), and
  [Never](references/implementation-guide.md#never-type).
- [Regex](references/implementation-guide.md#regex-builders),
  [Codable](references/implementation-guide.md#codable-best-practices),
  [collections](references/implementation-guide.md#modern-collection-apis),
  [formatting](references/implementation-guide.md#formatstyle),
  [interpolation](references/implementation-guide.md#string-interpolation),
  and [extended patterns](references/swift-patterns-extended.md).

Source terms: [notice](../UPSTREAM-NOTICE.md), [license](../UPSTREAM-LICENSE).
