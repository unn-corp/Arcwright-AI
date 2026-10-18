---
name: test-quality
description: Choose, write, or review useful regression, unit, integration, property, and UI tests with minimal authoring and execution cost. Use for weak assertions, excessive mocks, flaky or slow suites, or deciding whether a change needs another test.
---

# Useful tests, small budget

1. Read the changed contract and the nearest existing tests and fixtures. Name the plausible failure and observable result in a sentence; use the current request and repository conventions to choose the public boundary. Ask only when ambiguity changes the result. Existing coverage may already suffice.
2. Extend a suitable test before adding a file or harness. Use the cheapest level that reaches the risk: unit tests for logic, integration for boundary interactions, E2E for critical journeys. Reuse deterministic fixtures and factories; isolate mutable state. Add cases only when they detect a distinct failure.
3. Assert behavior through public interfaces using independently derived expected values. Related assertions may share a test. Avoid checking source text, private helpers, incidental call order, or a mock's own configured response unless that is the explicit contract. Substitute external boundaries only when needed for isolation, cost, or determinism.
4. For a regression, show the focused check detects the original defect when feasible, then passes with the fix. Failure must come from the intended assertion, not broken setup. When old behavior cannot safely be reproduced, report that limit. An existing passing test is useful evidence; do not invent a red run. Use small targeted mutation/property checks only for a concrete remaining risk. Keep temporary fault probes in an owned isolated fixture/checkout and restore them; preserve unrelated work.
5. Run the focused test first. Confirm the expected cases executed: zero selection, all-skipped results, and interrupted runs are not passing evidence. Then run related tests and required repository gates. Avoid repeated green runs, broad snapshots, exhaustive permutations, or coverage targets imposed by this skill. Preserve existing required thresholds. Repeat only to investigate flakiness or changed code. Stop when acceptance criteria and material risks have evidence.

Load conditional detail only for the current problem: [generated cases](references/generated-cases.md) for properties or uncertain assertion strength; [flakiness and suite cost](references/flakiness-and-cost.md) for intermittent failures or slow/redundant tests; [boundary checks](references/boundary-checks.md) for API/CLI outcomes or retry behavior.

Load runner guidance such as `vitest`, `playwright-cli`, or `rust-testing-verification` only when needed. Use an installed TDD workflow when test-first development is requested or selected; routine testing does not require a team or new framework.

For UI tests, prefer semantic locators and awaited retrying assertions, with isolated records and reused setup. Wait for the observable condition, not fixed sleeps or network silence.

Keep the plan, patches, and tool output small. Report the changed test, command, outcome, and material limits. Save temporary evidence through the host's evidence tool, otherwise in `_arcwright/_memory/skill-runs/test-quality-<run-id>/`. Keep installed skills read-only; permanent tests stay in the project.
