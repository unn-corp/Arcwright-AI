# Evidence for verification gaps

Read this for the Tests/Coverage lens. Find changed behavior that could regress where it is used without a normal verification run detecting it. A missing test file or low coverage percentage alone is not a finding.

## Qualify the change

- Stop for non-behavioral changes: formatting, comments, pure renames, or type-only changes without runtime effects. A removed, skipped, or weakened test still changes verification and warrants checking.
- Dependency, build/config, data, validation, error, event, and default changes can affect behavior even when the diff looks small.
- Trace deterministic behavior around model calls; do not require live inference or semantic model-response tests. Do not request phrase-existence tests over hand-authored instructions/documentation. Deterministic prompt/request construction and response handling can warrant output checks.

## Trace the consumer and its tests

Identify the changed contract/output/side effect, then read direct callers, registered entry points, or schema/event consumers that observe it. Stop when the behavior is covered, the next consumer cannot observe the change, or the next hop would be guesswork. Group similar consumers; expand where the observed contract differs.

For each candidate name the smallest realistic regression: invert a branch, omit a field, retain an old error code/default, or skip a real integration. If no concrete regression can be named, untested downstream code is not a finding. This is a reasoned counterexample, not authorization to edit production code.

Read relevant tests and assertions. Before claiming none exist, search the whole repository by symbol **and import/reference paths**; conventional test folders are insufficient. Record exactly what was checked, including execution selection when a test exists outside the normal command.

A test protects behavior when the realistic regression would fail an assertion in the normal verification path. A helper's test may miss caller values. Success-only assertions, mocks bypassing integration, stale fixtures, ignored results, skipped tests, or an E2E traversal without checking the changed result may not protect it. A real integration test still counts under a different filename or test level.

## Ground each finding

| Shape | Required evidence |
| --- | --- |
| Regression gap | Named consumer, realistic regression, tests read, assertion it escapes |
| Missing adoption | Same observable contract, evidence the new behavior supersedes the local one, no test detecting non-adoption |
| Broken verification | Removed/weakened/skipped/not-normally-run check and behavior it no longer protects |

Supersession can come from requested intent, a replaced sibling, removed duplicate, or a test defining the new rule. Without that signal, migration is a refactor suggestion, not an adoption gap.

Include the changed location and consumer as file/line, the minimal regression, and evidence: test assertions read or actual symbol/import searches and results. State the search boundary rather than making a repository-wide absence claim after a narrow search. Name the observable missing assertion and concrete consequence using the project's existing test style.

Reopen cited evidence before filing. Drop unsupported claims, compiler-enforced cases, unaffected legacy behavior, and regressions already covered at a real consumer. Do not demand implementation-mirroring or mock-call tests. Report another genuine defect reached during tracing under its proper lens rather than extending the hunt.

An empty result is valid. Goal-backward verification remains the separate check that implementation is substantive, wired, and fed real data.

Adapted from [BMAD verification-gap lens](https://github.com/bmad-code-org/BMAD-METHOD/blob/bab9082c3e884e0d72c759bcd1a6d90bcc01be84/src/core-skills/bmad-review/references/lens-verification-gap.md), commit `bab9082c3e884e0d72c759bcd1a6d90bcc01be84` (MIT; [license](../UPSTREAM-LICENSE)). Arcwright keeps R4, native tools, confidence display, and readable reports.
