# Skill efficiency maintenance

Completed October 17, 2026. This pass implements the seven approved improvements
using the current Arcwright-owned sources. No new third-party pack was installed.

## Initial-load footprint

| Measure | Before | After | Reduction |
| --- | ---: | ---: | ---: |
| 33 largest skill entrypoints | 605,195 B | 138,101 B | 77.2% |
| Descriptions across 278 skills | 89,487 B | 47,488 B | 46.9% |
| All 278 entrypoints | 2,631,003 B | 2,123,597 B | 19.3% |

135 descriptions were sharpened. Long recipes and examples remain behind topic
links in 33 conditional references, preserving source notices and technical
constraints. These are UTF-8 file sizes, not provider token counts. The full
library is not loaded together. Retained reference material can increase disk
payload while reducing initial model context.

## Changes

1. **One effective skill version.** Shared project/global instructions prefer the
   active project's copy, and the portable router resolves its actual path. Managed
   global copies were refreshed: 217 names shared by this project and
   `~/.agents/skills` now have zero entrypoint drift. Other platform paths and the
   legacy cache were checked as applicable. Physical copies remain for their hosts
   and other projects; native hosts may still advertise duplicate names.
2. **Shorter entrypoints.** 18 Swift/iOS and 15 other specialist guides now retain
   decisions, technical landmines, boundaries, verification, and stop conditions.
   Detailed implementations load only when the current task needs them.
3. **Precise descriptions.** Removed keyword repetition, unsupported savings
   claims, and broad automatic triggers while retaining meaningful exclusions.
   All 278 source skills remain model-invocable.
4. **Direct aliases.** The reviewed pure `matt-pocock-grill-me` forwarding route
   resolves to the canonical grilling skill. Combined workflows remain procedures.
   Exact commands retain precedence; authored custom wrappers are not bypassed.
5. **Proportionate work.** Routine fact lookup no longer forces subagents; context
   discovery reuses supplied facts and is read-only. Context/style/graph sidecars
   match these rules. Removed inherited compulsory provider switches, migration
   confirmations/commits, review fanout, and user retriggers where the actual task
   did not require them. Explicit delivery workflows, approvals, MCP calls, and
   required repository checks remain governed by their existing contracts.
6. **Automated regression checks.** The offline efficiency audit and CI step check
   reviewed footprint growth, duplicate source identities, missing alias targets,
   and alias cycles. Baseline refresh is an explicit review step; it cannot approve
   changed alias semantics. Scope audits report drift without rewriting files.
7. **Behavior comparison.** Fresh native Codex runs used identical isolated task
   fixtures with old and shortened context/migration guides. Both found the right
   Node test command without changing the project, enabled C# nullable analysis
   without suppressions, and built/reran the requested `Ada` and `anonymous` modes.

## Installation and cleanup protection

Updates now preserve a complete modified, untracked, or linked skill bundle and
retain previous ownership hashes. Unchanged files avoid rewrites. Required new
conditional resources and catalogs were installed alongside their guides. Existing
optional module choices and unrelated personal instructions were retained.

Two divergent resources were preserved: Kiro's `VENDORED-MCP.md` and the legacy
cache's `rust-ffmpeg` bundle. They were not silently overwritten or declared owned.
Global tracker bundles already present were refreshed without contacting a tracker
or changing the stored module selection. Cursor's global rule text remains a
staged file for its Settings-based User Rules integration; this pass does not
claim to have changed the application's Settings UI.

Independent code review found that cleanup could remove matching files through a
preserved directory symlink. A focused regression failed before the guard, then
passed with ancestor-link protection. The final package suite passes all 360 tests.

## Comparison evidence and limits

The two selected entrypoints total 46,799 B before and 8,107 B after. The revised
run exposed an additional 1,329 B of targeted reference lines. Baseline output
needed partial rereads after truncation; the variant corrected one failed heading
lookup before continuing. These details are retained rather than hidden behind a
single cost claim.

Both runs used the native Codex host's inherited model/settings (host label
`gpt-6.1-sol`, max reasoning). No model token/billing usage was exposed. Fixture
source checks confirm only the intended nullable configuration and return-type
changes; context files remained unchanged. Both runs encountered a missing optional
.NET targeting pack and used an offline build setting instead of downloading it.
One run per arm on two tasks is a bounded regression check, not statistical proof
of equal quality or measured token savings across the whole skill library.

## Validation

- Full package suite: **360 tests passed in 21 files**.
- Root build: resource/sidecar links and content-leak checks passed.
- Source provenance: all **36** families pass; upstream pins and source hashes
  were not advanced, only local adaptation hashes were refreshed.
- Efficiency/identity/alias audit: all **278** skill entrypoints pass.
- Portable catalog includes command, agent, and canonical skill routes.
- Package dry run includes aliases and conditional references, with no runtime
  evidence or skill-run artifacts. Managed installation identities were refreshed.
- Source and staged whitespace checks pass. No application release, full browser
  suite, Xcode/device suite, or legal-workflow execution was commissioned by this
  skill-maintenance task.

Operational details: [efficiency checks and managed installs](../skill-efficiency.md).
Temporary before/after fixtures, command outcomes, and backups stay in host-managed
conversation evidence rather than shipped skills or always-loaded instructions.
