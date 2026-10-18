---
name: dotnet-migrate-nullable-references
description: "Migrate an existing C# project to nullable reference types or audit migration suppressions. Excludes a few warnings in an already enabled project and C# 7.3 or earlier."
license: MIT
---

<!-- Vendored from github.com/dotnet/skills — MIT, Copyright (c) .NET Foundation and Contributors. Curated subset; see .agents/skills/VENDORED-DOTNET.md -->

# Migrate nullable reference contracts

Enable nullable analysis in the requested C# project and make annotations reflect
its actual null contract. Preserve runtime control flow: no inserted guards,
null-conditional calls, removed validation, or incidental bug fixes. Record latent
runtime defects separately. Reference-type `?` is metadata; value-type `?` changes
the CLR type. Reflection-driven frameworks can also interpret annotations at runtime.

## Scope and rollout

Identify the project's real build/test commands, SDK, language version, TFMs, and
public consumers. The optional `scripts/Get-NullableReadiness.ps1` scanner reports
settings and suppression counts; it does not choose API semantics. C# 8+ is required;
older TFMs can work with an appropriate language version and attribute polyfills.
Do not silently retarget or change a constrained language baseline.

Reuse the user's migration scope. Choose project-wide enablement for manageable
work, warnings-then-annotations for active large projects, or file-by-file
`#nullable enable` for staged rollout. Work in dependency order from shared models
and utilities outward. Explain the chosen approach; existing authorization suffices
for routine choices, without phase-by-phase confirmation, automatic commits, or PRs.

Enable the chosen nullable context, run a clean/nonincremental build, and retain a
warning baseline before edits. Keep the project's existing warning/error policy.
Use coherent batches and build checkpoints where they expose cascading diagnostics,
not one build for every annotation.

## Resolve contracts accurately

- Decide whether null is valid using documented behavior, implementation and callers.
  Public return values that genuinely return null must be nullable; never conceal
  them with `return null!`, `default!`, or casts.
- Preserve meaningful non-null domain invariants. Do not make everything nullable
  just to silence warnings or infer an undocumented contract from a name alone.
  Ask only when material contract ambiguity cannot be resolved from available facts.
- Prefer flow attributes (`NotNullWhen`, `MaybeNullWhen`, `MemberNotNull`, etc.)
  where they express existing behavior. A justified late-initialization assertion
  belongs at its declaration/initialization boundary rather than every use site.
  Retain each necessary suppression's reason; remove redundant ones.
- Existing runtime guards stay. New checks, defaults, branches, initialization
  behavior, or `required` caller obligations need a deliberate separate scope.
  Do not weaken source contracts merely because a framework returns oblivious types.
- Review unchanged public members in the enabled scope too: unannotated references
  implicitly become non-null contracts. Match overrides/interfaces and generic
  contracts using the compiler and supported attributes.

## Framework and consumer boundaries

Read [EF Core implications](references/ef-core.md) before accepting model/schema
changes, and [ASP.NET implications](references/aspnet-core.md) for validation/JSON
behavior. Do not apply generated database migrations automatically. For libraries,
record material public source-contract changes and inspect consumers; metadata-only
changes can still introduce consumer warnings. Keep working reports in host evidence
or `_arcwright/_memory/skill-runs/dotnet-migrate-nullable-references-<id>/` unless the
user designates a permanent release-note path.

## Verify and stop

Build affected TFMs/consumers, run existing relevant tests and required checks,
review public contracts, `!` additions and the behavioral diff. Require zero scoped
CS86xx warnings or clearly report remaining boundaries. Add/retain a nullable
regression gate without overwriting other warning settings. Zero compiler warnings
alone do not establish semantic correctness. Stop after the requested migration;
report commands/results, rollout coverage and unrun checks.

## Conditional recipes

Use [warning and declaration recipes](references/workflow-guide.md#step-3-fix-dereference-warnings)
for a concrete compiler diagnostic, [flow attributes](references/nullable-attributes.md)
for relationships `?` cannot express, or [consumer changes](references/breaking-changes.md)
for public library review. Do not read the full catalog for a single warning.
