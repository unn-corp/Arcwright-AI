---
name: dotnet-incremental-build
description: "Diagnose unnecessary MSBuild rebuilds and broken no-op builds using target inputs/outputs, tracked writes, binlogs, and Visual Studio up-to-date checks. Not for first-build or evaluation performance."
license: MIT
---

<!-- Adapted from github.com/dotnet/skills at 10d85e25fb42d5f65c568d5e979a005ee69eecb3 — MIT, Copyright (c) .NET Foundation and Contributors. See LICENSE and ../VENDORED-DOTNET.md. -->

# Diagnose incremental .NET builds

Find why a no-change MSBuild invocation reruns work. Focus on target scheduling,
resolved inputs/outputs, tracked writes, and Visual Studio's separate up-to-date
check. First-build speed and evaluation performance are different investigations.
A diagnosis request produces findings; implement already-authorized fixes.

## Evidence-first procedure

1. Identify the exact project, configuration, TFM, SDK, command and target. Keep
   these identical across two no-edit builds. Capture first/second binlogs and a
   diagnostic text log during the second build, in host evidence storage or the
   active project's `_arcwright/_memory/skill-runs/dotnet-incremental-build-<id>/`.
2. Inspect the second build's skip/out-of-date messages. If a binlog MCP is
   available, discover its exposed tools and load/search the existing log;
   otherwise use the captured text. Do not launch another build just to search.
3. For each rerun target, record the evaluated `Inputs` and `Outputs`, actual
   existence and timestamps, newest input versus oldest output, and the exact
   scheduling reason. For batched transforms, map each input to its output and
   find missing, duplicate or unmatched pairs.
4. Check output deletion/cleaning/rewrites by other targets and all real inputs,
   including generated/dynamic files, project changes and properties. Compare
   resolved paths across runs; timestamps/build numbers/GUIDs in output paths
   destroy reuse. Configuration/TFM/package changes legitimately invalidate work.

Without both `Inputs` and `Outputs`, the incremental mechanism is not engaged.
Report timestamp comparison and mapping as **not applicable** in that case, not as
an unverified check or an invented timestamp diagnosis. MSBuild compares timestamps,
not content hashes. An expensive compiler-server startup is not proof a target's
incremental check failed.

## Fix only the demonstrated cause

Add complete, stable inputs/outputs to custom generating targets, use
`IntermediateOutputPath` for generated intermediates, and register writes in
`FileWrites` for cleanup. Ensure generated compile items remain available when a
target is skipped. Use `Returns` when returning items should not itself establish
an incremental output contract.

If an input is touched on every build, inspect its producer and preserve timestamps
when relevant content is unchanged. Never exclude a real dependency just because it
changes frequently. `WriteLinesToFile Overwrite="true"` runs after target scheduling;
it alone cannot explain why that same target was scheduled.

For VS-only rebuilds, inspect Fast Up-to-Date Check's verbose reason separately
from MSBuild. Register custom inputs/outputs appropriately; disabling that check is
a diagnostic option, not a default permanent repair.

## Required result

Report target/root cause, timestamp comparison or explicit N/A, missing/rewritten
outputs, complete/dynamic inputs, evaluated paths/mapping, and the second no-change
build's expected skip or justified rerun. After an authorized fix, repeat the same
pair only as needed to demonstrate it. Mark checks that could not run unverified;
do not claim implementation from inspection. Stop after the scoped cause is proven.

## Conditional recipes

- [Binlog and captured-log analysis](references/workflow-guide.md#diagnosing-why-did-this-rebuild)
  for tool operations and message examples.
- [Tracked writes](references/workflow-guide.md#filewrites-and-clean-build) and
  [incremental targets](references/workflow-guide.md#making-custom-targets-incremental)
  for XML patterns.
- [VS up-to-date checks](references/workflow-guide.md#visual-studio-fast-up-to-date-check)
  for IDE-only behavior; [common fixes](references/workflow-guide.md#common-fixes)
  for write-only-when-different and `Returns` examples.
