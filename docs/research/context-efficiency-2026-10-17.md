# Context efficiency and model invocation

This pass audits 277 current skill entrypoints, 17 agent profiles, and 219 source
slash commands. Changes apply to workshop source and the generated Arcwright package.
Existing authorization, source licenses, and the user's attribution preference remain
in force. The Taste v2 integration is included.

## Measured entrypoint savings

Measurements are UTF-8 bytes, not provider token counts. Detailed technical material
was moved into conditional topic guides rather than loaded with every invocation.
Reference storage is not the same as runtime context cost.

| Skill | Before | After |
| --- | ---: | ---: |
| Taste frontend | 32,204 | 4,197 |
| Specialist orchestration | 34,530 | 5,398 |
| Scroll world | 38,160 | 3,919 |
| Cognito | 25,646 | 4,004 |
| Aurora | 23,306 | 4,045 |
| Excalidraw generator | 23,958 | 3,093 |
| Rust FFmpeg | 22,136 | 2,851 |
| MCP apps | 19,391 | 3,431 |
| **Total** | **219,331** | **30,938** |

The eight entrypoints are approximately **85.9% smaller**. The final byte counts
can be reproduced with `npm run audit:context`; small subsequent edits can change
the individual figures without changing the approach.

Four command entrypoints (`design`, `team`, `ci-gates`, `security-scan`) shrink from
27,266 bytes to 6,728 bytes, approximately **75.3%**. Each now selects the appropriate
mode/topic and loads its detail only when needed. Twelve long skill descriptions
were shortened. Agent descriptions now name their concrete capability instead of
repeating tool and model boilerplate.

Two stale duplicates under `_arcwright/_memory/skills/` were removed: `writing-skills`
and `excalidraw`. Their maintained counterparts are in `.agents/skills/`. The obsolete
Excalidraw copy also referenced absent files. Other large entrypoints, including
specialist .NET and legal references, remain visible in the audit's size ranking.
Its useful compact diagram-pattern reference is retained with the canonical
Excalidraw generator.

## Agents and discovery

All 17 role definitions, menus, and workflow links are preserved. A supplied task
runs directly; a menu is optional navigation. Profiles use a shared, 1,609-byte
runtime contract once per task. They select relevant skills from metadata rather
than scanning/loading every skill or forcing unrelated UI and elevation guidance.
Automatic self-maintenance and repeated boilerplate were removed; host-managed
memory remains subject to the host's behavior and settings.

The generated always-loaded Kiro steering no longer repeats the complete skill
description table. Native skill resources provide discovery. Project copies take
precedence over global copies; this pass does not remove unrelated global installs.

## Model invocation

The current source audit reports **zero invocation blockers**. The Matt Pocock
adapter removes upstream `disable-model-invocation: true` and adapts disabled Codex
implicit-invocation policy to `true`. Full Send and Full Stop also permit model
selection. Their procedure-level authorization requirements still apply.
`user-invocable: false` remains supported for menu visibility; it does not disable
model selection. These distinctions follow the
[Claude skill invocation controls](https://code.claude.com/docs/en/skills#control-who-invokes-a-skill)
and [Codex skill configuration](https://developers.openai.com/codex/skills).

The portable `arcwright` skill exposes the generated package's **221 command routes
and 17 specialist profiles** to hosts without an equivalent native command surface.
Exact names return the exact route; natural-language lookup returns at most eight
matches. Optional routes are hidden when their required pack is absent. Installed
packages carry the catalog and command references. A workshop checkout can derive
routes directly from source without creating a cache or modifying the skill bundle.

Claude specialist stubs and generated launchers execute supplied tasks rather than
unconditionally waiting at a menu. Kiro orchestration launchers expose the needed
delegation tool and configured MCP servers; design/diagram launchers can run their
helpers. Automatic discovery does not authorize publishing, merging, production
changes, tracker writes, or external messages.

## Validation and maintenance

- **342 tests pass:** 290 integration/platform/helper tests and 52 focused tests;
  both coverage gates pass.
- All 513 current source skill, command, and profile frontmatter blocks parse and
  have descriptions. The build validates sidecars and relative links, rejects
  disabled model invocation, and rejects incomplete agent profiles.
- Tests cover portable routing, exact/limited lookup, a fresh source checkout,
  installed lookup, optional-pack filtering, profile preservation, and Matt Pocock
  invocation adaptation.
- Taste's 11 regression checks cover direction/history output, brand preservation,
  explicit project selection, output escapes, cached/installed skill directories,
  symlinks, separate host evidence storage, a controlled media download with credits,
  source lint, and runtime-output exclusion.
- Package builds, offline source verification for 36 families, website lint/data/
  production build, and package dry-run validation pass. Runtime artifacts remain
  excluded from distributed packages.

Run `npm run audit:context` to inspect entrypoint sizes, missing descriptions, and
model-invocation blockers. `npm run check:skill-sources` detects source drift.
`node build/skill-sources.js --refresh-local` records reviewed local changes without
changing upstream revisions or upstream hashes. The authoring skill now describes
conditional loading and the model-invocation policy.

The tests establish packaging, routing, metadata, and helper behavior. This pass
does not measure provider tokenization, billing, end-to-end latency, or model quality
with an A/B agent benchmark. No live media-provider or standalone browser capture
was required for these source changes; the controlled download fixture is not a
claim that every upstream service is currently reachable.
