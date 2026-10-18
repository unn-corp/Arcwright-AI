---
name: dotnet-msbuild-antipatterns
description: "Review MSBuild project and build files for correctness, maintainability, import safety, paths, and target anti-patterns. Analysis-only unless fixes are requested; SDK-style migration uses its own workflow."
license: MIT
---

<!-- Adapted from github.com/dotnet/skills at 10d85e25fb42d5f65c568d5e979a005ee69eecb3 — MIT, Copyright (c) .NET Foundation and Contributors. See LICENSE and ../VENDORED-DOTNET.md. -->

# Review MSBuild correctness and maintainability

Review the supplied project/build files and only the imports or packaging context
needed to substantiate findings. Keep analysis-only work read-only; apply fixes when
already requested. SDK migration is a separate workflow, not an automatic cleanup.

## Prioritize real defects

For each finding give the file/location, confirmed behavior or conditional risk,
impact, and smallest targeted fix. Distinguish already-correct patterns and style
preferences from correctness defects. Return the review itself for a review request.
Do not treat catalog examples or arbitrary line counts as proof of a bug.

Check these groups selectively:

- **Portable tasks and paths (AP-01–03, AP-14):** prefer built-in tasks over shell
  equivalents, quote string comparisons, and derive relocatable paths from the
  current file/project. Backslashes passed raw to shell/custom consumers may break
  on Unix. MSBuild evaluator paths, imports and built-in file tasks normalize them;
  existing backslashes there are a style choice, not an error.
- **SDK/package defaults (AP-04–09):** remove genuinely redundant defaults only
  after checking effective imports and intended pins. SDK C# file globs differ
  from legacy projects and F#: `.fsproj` files require dependency order, with each
  `.fsi` immediately before its `.fs`. Distinguish legitimate assembly references
  from legacy NuGet HintPaths. Check private analyzer/tool assets, repeated policy,
  and conflicting package versions before proposing centralization.
- **Target/import semantics (AP-10–13, AP-15):** split unrelated target behavior
  when independent scheduling helps. Generators need real `Inputs`/`Outputs` and
  tracked writes; not every informational/phony target should be incremental.
  Defaults usually belong in early `.props`, build logic in late `.targets`.
  Trace effective values/import order before flagging last-writer overrides.

## Import exceptions that must survive review

Guard optional/environment imports with `Exists()`. Required build contracts should
fail fast; SDK imports do not need defensive guards.

Before reporting a missing import inside NuGet `build/` or `buildTransitive/`, check
both source layout and projected packed layout. Read project and immediate-parent
`.nuspec` files plus `.csproj` `PackagePath` metadata; stop that search at the parent.
The package can generate per-TFM files absent from the source tree.

A `buildTransitive/<tfm>/` forwarder should target its sibling `build/<tfm>/` (or
unpartitioned `build/`) contract, not bypass it through `buildMultiTargeting/`.
Derive the TFM from the forwarder's own restored folder when needed; NuGet's
nearest-match TFM can differ from consumer `TargetFramework`. Verify the packed
file before recommending an expression.

## Verification and completion

Ground each recommendation in supplied/evaluated XML or the projected package.
For authorized edits, run the affected build/pack checks appropriate to the risk;
for incremental fixes, verify the second identical no-change build. Preserve all
required repository checks and state what could not be executed. Stop at the
requested files/risk; do not reorganize the whole build for stylistic uniformity.

## Conditional catalog

Open only the matching numbered entry in the
[AP-01–15 catalog](references/workflow-guide.md#ap-01-exec-for-operations-that-have-built-in-tasks).
Use [private assets](references/private-assets.md) for analyzer/tool packages,
[incremental targets](references/incremental-build-inputs-outputs.md) for generator
patterns, or [AP-16–23](references/additional-antipatterns.md) for additional issues.
