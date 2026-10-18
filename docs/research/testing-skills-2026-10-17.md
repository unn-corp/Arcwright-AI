# Testing skills and economical test authoring

Reviewed October 17, 2026. Seven candidate skill bodies were compared with the installed library. Registry observations below were captured at 09:09 UTC using the unauthenticated skills.sh search API. Counts are per-skill installs, not repository stars, and change over time. Sizes measure UTF-8 entrypoint bytes, excluding references; they are not token counts or measured savings.

| Candidate | Installs | Entrypoint | Terms | Decision |
| --- | ---: | ---: | --- | --- |
| [Superpowers test-driven-development](https://skills.sh/obra/superpowers/test-driven-development) | 252,225 | 9,578 B | MIT | Useful defect-detection and red/green discipline, but overlaps our TDD skill. Do not import deletion/restart rules, every-method mandates, or unconditional full-suite checks. |
| [Anthropic webapp-testing](https://skills.sh/anthropics/skills/webapp-testing) | 179,473 | 3,913 B | Apache-2.0 | Server lifecycle wrapper adds Python alongside existing TypeScript/browser tools. Its network-silence/sleep recommendations conflict with current Playwright practices. No additional pack needed. |
| [Currents playwright-best-practices](https://skills.sh/currents-dev/playwright-best-practices-skill/playwright-best-practices) | 94,823 | 26,306 B | MIT | Broad conditional reference library; avoid its large entrypoint and mandatory repeated/full-suite completion loops for ordinary changes. |
| [Wshobson e2e-testing-patterns](https://skills.sh/wshobson/agents/e2e-testing-patterns) | 23,980 | 4,231 B | MIT | Best compact E2E reference reviewed. Keep critical journeys at E2E and logic/edge cases at cheaper levels; most mechanics already exist locally. |
| [Wshobson javascript-testing-patterns](https://skills.sh/wshobson/agents/javascript-testing-patterns) | 20,174 | 14,629 B | MIT | Useful deterministic factory/fixture ideas; overlaps Vitest. Reject arbitrary coverage quotas and implementation-detail assertions. |
| [dotnet test-gap-analysis](https://skills.sh/dotnet/skills/test-gap-analysis) | 3,100 | 19,334 B | MIT | Useful specialized audit, with significant inventory overhead. Not a default step for each code change. |
| [dotnet test-value-evidence](https://skills.sh/dotnet/skills/test-value-evidence) | 184 | 10,825 B | MIT | Strong targeted defect-detection guidance despite low adoption. Credit sufficient existing tests and distinguish genuine regression failures from broken setup; avoid routine evidence paperwork. |

Primary reviewed sources: [Superpowers TDD](https://github.com/obra/superpowers/blob/bb92a77741419a4ab5f06e711a283343f1ada0c3/skills/test-driven-development/SKILL.md), [Wshobson E2E](https://github.com/wshobson/agents/blob/044b4b21f083948e69ec878a7b07c8d0951a6ffa/plugins/developer-essentials/skills/e2e-testing-patterns/SKILL.md), and [test-value-evidence](https://github.com/dotnet/skills/blob/10d85e25fb42d5f65c568d5e979a005ee69eecb3/plugins/dotnet-test/skills/test-value-evidence/SKILL.md). Additional source and license links are available from each registry entry. Microsoft's separate `playwright-skills` repository returned 404; the actual `playwright-cli` skill is already installed. An overlapping Checkly candidate had nine installs and unverified redistribution terms, so it was excluded.

## Local changes

The default library now includes the compact `test-quality` skill, written as Arcwright guidance rather than another imported framework. It selects tests from changed public behavior, prefers existing tests and fixtures, uses independent expected results, permits sufficient existing coverage, runs focused checks first, and stops after acceptance risks are covered. It has no scripts, external dependencies, mandatory delegation, or coverage quota. Its entrypoint is 415 whitespace-delimited words and loads only for relevant tasks.

Updated local TDD guidance removes routine seam-approval questions and allows refactoring after green. Vitest and Playwright entrypoints prioritize focused execution; Playwright uses retrying assertions and observable readiness instead of network silence. CI examples preserve project coverage requirements and no longer inject a default Python coverage floor. The TDD team uses focused acceptance tests and repository-required gates instead of repeating the whole suite by default. Existing required checks and coverage floors remain in force.

[Playwright CLI documentation](https://playwright.dev/docs/test-cli) confirms focused files/titles, `--last-failed`, and `--only-changed`. The changed-file filter selects changed test files, not all application behavior affected by source changes. [Official practices](https://playwright.dev/docs/best-practices) support isolated tests and web-first assertions. Detailed runner references remain conditional.

Shared project/global instruction generation now routes test tasks to `test-quality` and selects other skills from installed descriptions. It preserves authorization and host rules, discourages routine extra agents, and avoids preloading catalogs. Skill Scout follows the user's provider/model choice and compares context cost and installed overlap; it no longer pins Sonnet or assumes discovery authorizes installation or contribution.

## Installed instructions and verification

Applied managed instruction updates to the workspace and installed Codex, Claude, OpenCode, and Grok surfaces, preserving personal content outside managed blocks and verifying idempotence. Updated Kiro's unmodified, manifest-verified generated core steering from 23,042 to 2,477 bytes by removing its duplicate skill catalog and adding the compact policy. The shared guide and updated Scout were copied only to existing global skill roots. Cursor's staged user-rules file was updated; applying those User Rules still happens in Cursor Settings.

The initial invocation audit found no disabled model invocation across 277 source skills, 17 profiles, and 219 source commands; installed global skill roots also had no explicit blockers. The new guide retains model invocation. Validation covers generated instructions, preservation of personal rules, installed skill availability, packaging/link checks, and source provenance. These checks establish configuration and packaging; no end-to-end benchmark of model token use or every agent's future compliance was performed.

Validation completed: 127 focused tests and 65 installation/platform/provenance tests passed (192 total). Build reference/leak checks and all 36 source-family hash checks passed. The final source audit reports 278 skills, 17 profiles, 219 source commands, and zero model-invocation blockers.

A [second testing-skills pass](testing-skills-followup-2026-10-17.md) covers property testing, flaky-test diagnosis, safe suite consolidation, and API/retry boundaries.
