# Testing skills follow-up

A second Skill Scout pass reviewed six additional skill entrypoints on October 17, 2026. Registry counts below were observed around 20:49–20:50 UTC. They measure per-skill installs, not repository stars. Unverified or absent registry results are not reported as zero. Entrypoint sizes exclude references.

| Candidate | Installs | Entrypoint | License | Useful contribution and decision |
| --- | ---: | ---: | --- | --- |
| [Trail of Bits property-based-testing](https://skills.sh/trailofbits/skills/property-based-testing) | 6,635 | 4,306 B | CC-BY-SA-4.0 | Useful comparison for invariants and generator quality. No source text or files imported from this pack. |
| [fast-check javascript-testing-expert](https://skills.sh/dubzzz/fast-check/javascript-testing-expert) | 245 | 16,728 B | MIT | Maintainer guidance on controlled randomness/time and replay. No per-source-file test mandate or automatic dependency installation adopted. |
| [AWS property-based-testing-guide](https://github.com/aws-samples/sample-ramp-aidlc-mod-starter-packs/blob/d9722ca0d48b06810c966682e39a306c16d0066a/skills-library/property-based-testing-guide/SKILL.md) | Not indexed in the observed results | 4,840 B | MIT-0 | Useful metamorphic/conservation examples. No fixed minimum case count or mandatory specification artifacts adopted. |
| [Wshobson python-testing-patterns](https://skills.sh/wshobson/agents/python-testing-patterns) | 36,131 | 7,282 B | MIT | Useful API outcomes and retry-branch examples; much of the general guidance overlaps the installed library. |
| [Test Stinky](https://skills.sh/saschb2b/skills/test-stinky) | 13 | 10,618 B | MIT | Duration and redundancy analysis can help targeted maintenance. Its mandatory 41.8 KB catalog is excessive for ordinary tasks. |
| [Intercom fix-flaky-tests](https://github.com/intercom/2x-skills/blob/main/plugins/test-tools/skills/fix-flaky-tests/SKILL.md) | Unverified | 19,210 B | MIT | Useful shared-state/cleanup classification. Its CI-only verification and remote publication workflow do not fit our default. |

Reviewed immutable source/license pairs include [Trail of Bits body](https://github.com/trailofbits/skills/blob/5c99c03fb8a9ea568432ecbcba5d86e9f4ac2bf0/plugins/property-based-testing/skills/property-based-testing/SKILL.md) and [license](https://github.com/trailofbits/skills/blob/5c99c03fb8a9ea568432ecbcba5d86e9f4ac2bf0/LICENSE), plus [fast-check body](https://github.com/dubzzz/fast-check/blob/32239231c8327f2dfb0a07e10fa483213a6b1bfb/skills/javascript-testing-expert/SKILL.md) and [license](https://github.com/dubzzz/fast-check/blob/32239231c8327f2dfb0a07e10fa483213a6b1bfb/LICENSE). No additional third-party pack, plugin, or dependency was installed. The new local references are original Arcwright guidance informed by existing policy and maintainer documentation.

## Additional value incorporated

The `test-quality` entrypoint now rejects zero-selected, all-skipped, and interrupted runs as passing evidence. Three conditional references provide the additional detail:

- `references/generated-cases.md`: choose a useful invariant instead of a large example matrix, reject vacuous properties, construct meaningful inputs, bound execution, shrink failures, and preserve concrete counterexamples alongside replay data. Matching encoder/decoder bugs or an identity implementation can satisfy weak properties; known examples and complementary checks remain useful.
- `references/flakiness-and-cost.md`: capture the original failure, vary one suspected condition within a budget, restore shared state, and distinguish an eventual retry pass from an established fix. Measure expensive setup and preserve each distinct contract when consolidating tests.
- `references/boundary-checks.md`: exercise real public API/CLI boundaries, assert meaningful outputs and effects, and distinguish transient recovery, exhaustion, permanent errors, and promised idempotency without real sleeping or external side effects.

Primary technical references are [fast-check's explanation](https://fast-check.dev/docs/introduction/why-property-based/), [replay parameters](https://fast-check.dev/docs/api/interfaces/Parameters/), [Hypothesis replay guidance](https://hypothesis.readthedocs.io/en/latest/tutorial/replaying-failures.html), [pytest flakiness guidance](https://docs.pytest.org/en/stable/explanation/flaky.html), and [FastAPI testing](https://fastapi.tiangolo.com/tutorial/testing/). These are conditional references, not new default tool requirements.

The main guide grew from 415 to 466 whitespace-delimited words. Its three references contain 431, 408, and 235 words respectively and load only for the relevant problem. No always-loaded global policy text was added.

The TDD team quick rules still contradicted the new provider policy by forcing Sonnet, assumed one host's agent-reuse API, and directed artifacts to the old output tree. Its entrypoint, quick rules, and native examples now inherit the user's host/model, follow fresh Arcwright Code/T3 review-task rules, and use `_arcwright/_memory/skill-runs/team-tdd-<run-id>/`. The quick rules are 224 words.

Installed copies were refreshed in existing global skill roots. All old global guide bodies matched the saved baseline; TDD files matched managed installation hashes before replacement. No customized or linked bundles were overwritten. Twelve existing managed TDD file identities were refreshed so future update/removal handling does not mistake these maintenance changes for user edits. Backups and detailed copy results remain in host-managed conversation evidence.

## Validation

The build passed resource-link and content-leak checks. All 36 source-family hash checks passed; model invocation remains enabled across 278 source skills. All TDD JSON examples parse after removal of fixed model arguments. Package/global copy checks verify the conditional files are present. This pass changes skill guidance only; no application test suite or token-use benchmark was required or claimed.

A bounded scenario review selected the intended actions: no tests for a documentation-only heading fix; stronger ordering/value-preservation checks for an idempotence-only sort property; and incomplete verification for a zero-test success exit. This was an instruction-following sanity check, not an executed application test or token benchmark.
