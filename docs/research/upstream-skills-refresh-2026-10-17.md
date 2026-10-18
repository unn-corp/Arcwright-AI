# Upstream skill refresh

Applied the [October 16 audit](upstream-skills-audit-2026-10-16.md) to the Arcwright workshop on October 17, 2026. The refresh preserves existing local work, namespaces, optional installer choices, native/T3 orchestration, and the preference for no AI attribution in generated commits, PRs, comments, or artifacts. Required human source credits and license notices remain.

The [source record](../skill-sources.json) covers **35 source families**, with immutable revisions, source paths, licenses, adaptations, audited upstream hashes, and local source hashes. A reviewed revision identifies the source considered; it does not imply every upstream file was copied or every underlying API revalidated.

## Applied changes

| Area | Result |
| --- | --- |
| BMAD Method | Stable v6.12.4 review methods adapted into the existing panel: verification before filtering/grouping, every raw finding dispositioned, failed lenses reported incomplete, and prior findings rechecked against current evidence. R4 now requires a real consumer, regression, assertion gap, and repository/test inspection. Edge-case guidance adds call-signature and handle-lifetime checks. Epic validation persists draft/final status and named open checks, with a core-file churn diagnostic. |
| Builder | One authoritative 250-line step maximum replaces the contradictory 250/300 rules. Both validators use a read-only checker and preserve incomplete scope. Outcome/consumer quality, progressive disclosure, advisory model-aware token guidance, and baseline/variant evaluation methods fit the existing workflow. |
| TEA | Official documentation links restored. A local capability adapter covers risk planning, automation, traceability, NFRs, review, evaluation, and framework/CI work using the existing runtime. It records TEA 3.1's new setup requirements and the separate v6 registry pin. |
| Superpowers | Presence-only identity diagnostics, polluter discovery/count fixes, portable Graphviz invocation and CRLF parsing, valid optional skill metadata, and proportionate skill validation. SDD keeps separate spec/quality gates while adding durable task/source custody, dirty-source snapshots, exact review boundaries, bounded repairs, interruption recovery, and fresh app-owned re-review tasks. |
| .NET | Five functional files refreshed in four skills: real incremental-build XML/diagnostics, project-instance and shared-output hazards, TFM-aware forwarding, correct import order, and platform library names. Existing optional curation retained; omitted upstream dependencies explained locally. |
| Next.js and SEO | Installed-version documentation routing, version-aware cache invalidation, seven-file Next SEO refresh, qualified structured-data/AI-search claims, Dataset Search correction, and keyword-input provenance. Missing SEO sibling routes now point to the consolidated local workflow. |
| UI/UX engine | Scripts, helper, and data refreshed together. Saved designs are preserved by default; project/page names are sanitized; modes/palettes remain coherent; button text uses accessible contrast. Additional observed short-dark-request and legacy-color cases fixed. Root DESIGN.md and custom copy/native guidance remain authoritative. |
| Mobile guidance | Compose references refreshed with version gates, modifier-size correction, and separate AndroidX source terms. The existing Swift coordinator example now refreshes its stored representable; original concurrency/observation/preview compatibility guidance uses Apple API contracts. |
| Vite, Vitest, VitePress | Current Vite/Vitest guidance gated by installed versions; stable VitePress v1 references retained with separate v2-alpha references. No application dependency upgrades. |
| React and Motion | React research-owner URLs corrected with documentation terms retained. Motion distinguishes server-module imports from client hooks and treats historical Workers advice as version/build-specific. |
| Playwright and browser-use | Playwright commands and ten references refreshed with narrower grants, native preview priority, evidence paths, and authorized attachment routing. Corrected an upstream Windows URL example during review. Browser-use's generic example uses public imports; beta remains an explicit backend with prerequisites. |
| Website auditing | Concise audit/repair/re-audit loop plus a self-contained squirrelscan operations companion, including current levels, offline processing, actual coverage, entity inspection, and optional MCP setup. Existing authorization is honored; local audits do not silently enable billed cloud use or publication. |
| DESIGN.md | Accept frontmatter, interleaved YAML, or both; require one occurrence of each top-level key; preserve deliberate section omissions and valid existing layouts. |
| Rust and FFmpeg | Copy/iterator-state and helper-extraction guidance, compilable assertion example, and MSRV gates. FFmpeg references refreshed as one versioned pack, including frame I/O, packet sinks, detection, multi-output, CLI subset, progress, compatibility, and shutdown behavior. |
| Strands | Published Python v1.61.1 invocation Limits, stop-reason/cancellation handling, SDK-versus-ready-harness distinction, and correct boto3 session/profile region precedence. Later default-branch cancellation forms are not assumed. |
| Integration | Build checks now traverse declared Markdown resources in references and sibling skills, and ship shared source/license notices. Two other dead security-reference links repaired. Website catalog includes the squirrelscan companion. |

## Sources kept deliberately unchanged

The selected MCP server-development, PDF-lib, Rust-performance, RenderDoc, Matt Pocock, and legal content already matched the reviewed sources. Their source identities are recorded without unnecessary functional churn. The remaining WebSocket differences were discovery/maintainer wording with little technical value.

Matt Pocock remains an actual pinned Git submodule with an optional namespaced stable pack. The refresh does not replace it with an untracked copy or move its pin without review.

## Compatibility and source terms

Larger upstream architecture changes are represented by compatible content adapters. BMAD v7's runtime, Builder's TOML/uv bootloader, and the latest TEA module are not installed over Arcwright's personas, configuration, task model, or installer. The useful reviewed behavior is available through the existing workflows and references.

The pre-existing Swift collection uses PolyForm Perimeter 1.0.0, including its competition restriction; both the historical and current source have those terms. Its full terms and provenance are now retained. No fresh current Swift collection, renamed kits, or beta platform examples were imported. Small correctness changes and compatibility guidance were independently authored from Apple contracts. This refresh does not assert additional redistribution rights for the existing collection.

Anthropic's document-specific source-available packs were not copied. No matching import lineage was established for Arcwright's original doc-* recipes, which remain local recipes. Their presence does not grant rights to replace them with restricted upstream material.

## Validation

- Package coverage suite: **307 tests passed**, with all configured coverage thresholds met.
- UI generator: **109 tests passed**; data validation covers 12 domains and 22 stacks. Before the fixes, fixtures demonstrated overwritten saved designs, an output-path escape, and inadequate generated button contrast.
- Debugging and renderer: 12 focused helper cases plus six LF/CRLF/mixed renderer cases passed. Polluter and CRLF failures were observed before repair; credential fixtures used dummy values only.
- Builder size checker: six scoped CLI tests passed, including boundary sizes, CRLF/no-final-newline, missing scope, token advice, and symlink handling.
- Rust assertion: original example failed compilation; corrected example compiled and ran.
- Independent paper exercises covered incomplete review, stale/duplicate findings, dirty-source recovery, valid skill metadata, meaningful coverage, local audit authorization, interleaved design tokens, and shared browser routing. These check instruction interpretation, not live service execution or a measured prompt-performance gain.
- Independent review identified the Windows quoting issue and confirmed its correction; no further concrete regressions remained in the reviewed scope.
- Integrated package build, local/sibling references, source/hash verification, and package leak gate passed. The npm dry run includes 2,051 files; 14 required skill/reference/license/adapter files were present, with no interpreter caches. Website lint, catalog integrity, TypeScript, and production build passed.

Real Graphviz layout rendering, native Windows execution, Apple SDK/device compilation, FFmpeg runtime integrations, and live paid model/cloud/browser jobs were not run. Those were not needed to validate this source refresh; controlled fixtures and primary API/source checks are described above. Next's existing supported Claude `user-invocable: false` metadata is preserved despite the Codex-only quick validator rejecting that extension.

## Maintaining the source record

Run `npm run check:skill-sources` from the workshop. It works offline and flags changed, added, or removed files in the recorded source scopes; CI runs it before packaging. For an intentional local edit, inspect the diff and then run `node build/skill-sources.js --refresh-local`. That refresh changes only local hashes, preserving reviewed source pins and upstream hashes. A new import requires a separate source/license/semantic review and a deliberate update to those source fields.

The package and skills are prepared locally. This work did not publish a package, push/merge a PR, install an application, configure a tracker, or schedule recurring updates.
