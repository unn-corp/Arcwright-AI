---
name: dotnet-aot-compat
description: "Resolve .NET trimming and Native AOT analyzer warnings or annotate library compatibility. Excludes publishing binaries and binary-size optimization."
license: MIT
---

<!-- Vendored from github.com/dotnet/skills — MIT, Copyright (c) .NET Foundation and Contributors. Curated subset; see .agents/skills/VENDORED-DOTNET.md -->

# .NET AOT compatibility

Resolve trim/AOT analyzer warnings in the requested project, preserving its public
contracts and target frameworks. This workflow targets net8.0+ analysis, including
multi-targeted libraries; it does not publish binaries or replace whole subsystems.

## Diagnose from compiler evidence

1. Identify the requested project, repository build command, SDK, and TFMs. Reuse
   existing task context; avoid an architectural tour before the first build.
2. Enable `IsAotCompatible` for compatible TFMs only. In multi-targeted projects,
   condition it with `MSBuild::IsTargetFrameworkCompatible` to avoid NETSDK1210 on
   older frameworks. Keep existing required build gates.
3. Capture an analyzer-enabled nonincremental build, retain its real exit status,
   and group IL warnings by code and affected pattern. A filtered warning log is
   evidence, not proof the build succeeded.
4. Inspect a few representative sites, apply a small coherent fix, then rebuild
   when it can reveal cascaded warnings. Follow affected callers rather than
   repeatedly reading unrelated files. Delegate only when authorized and useful;
   routine warning fixes do not require extra agents or model upgrades.

## Choose the smallest valid repair

- **Reflection on `Type`:** apply `DynamicallyAccessedMembers` at the innermost
  requirement and propagate through callers, interfaces, fields, and returns.
  Each caller must supply the callee's required member set or a superset.
- **Lost annotation flow:** avoid boxing `Type` into untyped bags or collections;
  preserve a typed, annotated path instead of suppressing the diagnostic.
- **JSON IL2026/IL3050 clusters:** use a partial `JsonSerializerContext` with
  `JsonSerializable` types and typed metadata overloads. Preserve naming/options,
  converters, polymorphism, and serialized wire behavior. Check generated support
  for dependency-owned types; use an existing AOT-safe serializer/converter when
  their contracts require one. Do not mechanically replace every overload.
- **Fundamental incompatibility:** use the appropriate `RequiresUnreferencedCode`,
  `RequiresDynamicCode`, or `RequiresAssemblyFiles` contract only when it accurately
  describes the API, and propagate the requirement. This exposes unsupported use;
  it does not make that path AOT-safe.

Do not hide IL warnings with `#pragma warning disable` or
`UnconditionalSuppressMessage`. Do not expand scoped work into a serialization
rewrite. After three unsuccessful fixes for one warning, reassess and report the
constraint; do not apply an incompatibility annotation merely to meet a deadline.

## Verification and completion

Build every affected TFM and shared-source consumer. Require zero relevant IL
warnings on compatible TFMs, no NETSDK1210 from the new property, and clean older
TFM builds. Verify behavior affected by changed serialization/reflection using the
nearest existing checks. Distinguish remaining third-party limitations from fixed
local warnings. Stop when the requested warnings are resolved; no cleanup pass on
already-correct annotations. Report commands, results, and any unrun checks.

## Conditional recipes

- For property syntax, warning-code mapping, annotation and JSON examples, open
  [the matching procedure](references/workflow-guide.md#step-by-step-procedure).
- For dependency serializers or shared imports, use
  [gotchas](references/workflow-guide.md#common-gotchas).
- For old TFMs missing attribute types, use [polyfills](references/polyfills.md).
