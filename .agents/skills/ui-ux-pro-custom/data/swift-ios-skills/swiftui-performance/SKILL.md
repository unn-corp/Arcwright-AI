---
name: swiftui-performance
description: "Investigate slow SwiftUI rendering, scrolling, CPU/memory growth, invalidation, identity churn, or layout cost. Use for measured diagnosis and targeted fixes rather than speculative performance refactors."
---

# SwiftUI Performance

Start with the affected interaction and existing view/state code. Establish a
repeatable symptom before optimizing. If local tools can collect evidence,
inspect it directly; ask for a device trace only when necessary evidence is
unavailable, with the exact interaction/build information needed.

## Diagnose before refactoring

1. Inspect identity, state reads, `body` work, image loading, layout, and
   animation around the affected view. Code review identifies hypotheses;
   it does not prove a measured improvement.
2. Capture the relevant interaction in an optimized Release/profile build,
   preferably on the affected physical device. Keep data, device/OS, build
   settings, and interaction comparable across before/after measurements.
   Simulator and Debug results have explicit limits.
3. Distinguish many cheap body evaluations from a few expensive evaluations,
   layout/commit work, decoding/I/O, and resource growth. Use the SwiftUI
   instrument and Time Profiler/call tree appropriate to the installed Xcode.
4. Fix the demonstrated cause with the smallest change and rerun the same
   measurement. Stop speculative refactoring when evidence no longer points
   to a remaining problem in scope.

## Correctness constraints

- Preserve stable semantic identity in `ForEach`, list rows, and navigation.
  Generating IDs during rendering or changing `.id` resets view lifetime and
  can discard focus, state, tasks, and scroll position.
- Keep synchronous I/O, repeated formatting/sorting, and large image decoding
  out of frequent `body` work. Cache/precompute at the correct data lifetime
  with invalidation; stale cached UI is not an acceptable optimization.
- Narrow Observation dependencies to values each view needs. An owned
  `@Observable` object can appropriately live in `@State`; do not mechanically
  replace ownership wrappers or split models without identifying invalidation.
- Use lazy containers for substantial off-screen content when beneficial.
  Inspect geometry/preference feedback loops and actual layout cost; avoid
  treating every `GeometryReader` or conditional as inherently defective.
- Keep UI state in its required isolation domain and move expensive work through
  a supported owner. A detached task does not make captured non-Sendable data
  safe. Preserve cancellation and stale-result handling.
- Constrain animations to meaningful state changes and respect Reduce Motion.
  Add equality shortcuts only when comparison captures every visible dependency;
  a skipped update that hides new content is a correctness regression.

## Validation and completion

Compare the relevant latency, frame/body/layout cost, CPU, or memory metric with
its baseline and confirm behavior, state restoration, scrolling, and accessibility
still work. Report the measurement method and limits, including unrun device
checks. A code diff, preview, or reduced line count is not performance proof.

Stop when the requested symptom is resolved or the evidence identifies a
specific external/device limitation. Do not turn an isolated scrolling fix into
an architecture rewrite or repeat profiling without a remaining hypothesis.

## Conditional references

- [Code smells](references/implementation-guide.md#common-code-smells-and-fixes),
  [Instruments workflow](references/implementation-guide.md#instruments-profiling),
  [identity](references/implementation-guide.md#identity-and-lifetime),
  [lazy loading](references/implementation-guide.md#lazy-loading-patterns), and
  [Observation](references/implementation-guide.md#state-and-observation-optimization).
- [WWDC performance background](references/demystify-swiftui-performance-wwdc23.md),
  [Instruments details](references/optimizing-swiftui-performance-instruments.md),
  [hang diagnosis](references/understanding-hangs-in-your-app.md), and
  [broader performance reference](references/understanding-improving-swiftui-performance.md)
  only for the relevant diagnosis.

Source terms: [notice](../UPSTREAM-NOTICE.md), [license](../UPSTREAM-LICENSE).
