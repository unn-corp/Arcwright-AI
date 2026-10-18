# Review Loop and efficiency follow-up

## Applied changes

[review-loop](../../.agents/skills/review-loop/SKILL.md) is the canonical,
provider-neutral review-and-repair workflow. `sol-loop` remains a small
compatibility alias, including pointers for historical deep links. Commands,
catalogs, delivery callers, native Kiro agents, and the website use the new name.

Before initial delegation, the workflow asks which model the user wants. An
explicit choice for that run answers the question. The private ledger retains
the model/provider/options across rounds, resumptions, and an enclosing delivery
workflow. A pending question, default option, timeout, or unavailable model does
not authorize automatic fallback. Scope inspection can continue while waiting.

The workflow retains one read-only reviewer, coordinator-owned fixes, scoped
acceptance criteria, closure conditions, source-specific evidence, bounded rounds,
publication boundaries, and attribution restrictions. Native tools and Arcwright
Code/T3 Code calls remain available according to host capabilities. Each T3 review
round remains a fresh delegated task with preserved retry identity.

The independent review identified and closed four issues:

| Finding | Applied change |
| --- | --- |
| Delivery's blockers-only question rule could suppress model selection | Both delivery skills and shared procedure explicitly allow the unanswered initial model question and retain the selection |
| Delegation and MCP retry budgets were ambiguous | Shared recovery distinguishes three transport attempts for one logical operation from one corrective child retry within the workflow budget |
| Inherited-proof wording could cause redundant checks on resume | Retain evidence with verifiable unchanged source/input identity; recheck affected or unverifiable claims |
| Later review rounds could retransmit entire histories | Send the original brief and concise material findings/closures, evidence, responses, and objections; reference accessible immutable details |

## Closed optimization findings

**Split recipe-heavy iOS entrypoints into conditional references.** Essential
constraints and task routing remain in each `SKILL.md`. All 62 original code
examples and all procedural sections moved into 18 topic references; the existing
HealthKit extended-pattern guide and frontmatter remain unchanged.

| Entrypoint | Before | After |
| --- | ---: | ---: |
| HealthKit | 15,693 | 2,290 |
| MetricKit Diagnostics | 15,645 | 2,025 |
| Speech Recognition | 15,615 | 2,211 |
| Combined | 46,953 | 6,526 |

The initial entrypoints are 86% smaller. A permission task, subscriber setup, and
recorded-file task can retrieve their entrypoint and selected guide in
3,076–4,299 bytes each. These are UTF-8 source sizes, not token or billing
measurements. Full reviews can still select the pitfalls, checklist, and sources.

**Refresh Kiro alias guard metadata after adaptation.** `copySkillTree` now
adapts CommonJS router helpers as well as Markdown and JSON. It translates guard
hashes using the selected adapted package files only when the original hash
matches the original source. It never calculates guards from installed edits or
accepts a stale package guard as equivalence proof. The unchanged Kiro wrapper
can resolve directly, while customized aliases and commands keep their authored
behavior and installer identity across updates. Repeated installation leaves
unchanged catalog bytes untouched.

The review sampled orchestration hot paths and used entrypoint-size metadata to
choose further candidates. It was not a semantic audit of every skill body.

## Optimization validation

- The focused Kiro installation regression reproduced the extra command hop
  before the fix. All 28 focused installation/routing tests pass afterward;
  the full 371 package tests and required coverage gates pass.
- Verified all 35 procedural sections and 62 code blocks were retained, checked
  relative links, and confirmed the existing extended guide was unchanged.
  Narrow retrieval checks select the appropriate guide without loading other recipes.
- Build, package dry run, footprint checks for 281 skills, and provenance checks
  for 36 source families pass. The package contains all 18 new references and the
  existing HealthKit extended guide. Only the three reviewed entrypoint footprints
  changed; upstream source pins remain unchanged.
- Refreshed the router and UI/UX bundles in five installed skill scopes using
  installer ownership checks and preserved saved installation choices. All 15
  available alias lookups resolve directly and all five canonical review-loop
  lookups succeed. Kiro's installed capability helper resolves its suggested
  test-quality skill correctly. The shared global install retains 220 matching
  skill names with zero entrypoint drift.

## Workflow rename validation

- Two independent static review rounds closed the instruction conflicts and
  retained scope, authority, model selection, and task custody.
- Existing routing and installation checks were extended; all 370 package tests
  and required coverage gates passed.
- Package build, bundled references/private-content checks, and package dry run
  passed. All 281 source skills remain model-invocable with valid alias targets;
  local provenance checks passed for 36 source families without changing upstream
  audit revisions.
- Website lint, TypeScript/Vite build, and data integrity passed.
- Updated five installed skill scopes and eight native command/agent entrypoints
  with ownership checks. Retired unchanged legacy UI metadata; preserved saved
  installation choices. All ten canonical/legacy lookups resolve. The main global
  install shares 220 skill names with source and has zero entrypoint drift.

No publication, application release, commit, or push was performed.
