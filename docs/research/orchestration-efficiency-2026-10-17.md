# Orchestration improvements, 2026-10-17

Implemented all six recommendations: capability briefs, nonexclusive role hints,
inherited model selection, focused QA, shared team execution, and wiring audits.
The existing skill names, MCP calls, team boundaries, and delivery authorization
remain available. No AI attribution was added; required source/license notices
remain in place.

## Skill awareness and handoffs

All 17 profiles now use the shared runtime and the maintained
[role registry](../../.agents/skills/arcwright/agent-capabilities.json).
The [capability helper](../../.agents/skills/arcwright/scripts/agent-capabilities.cjs)
returns at most four relevant installed skills with actual entrypoint paths,
discovery paths, and relevant missing capabilities. Suggestions are nonexclusive:
agents can discover other installed skills rather than being limited to their role.

The resolver prefers project overrides, preserves local invocation restrictions
and customized aliases, supports global-only installs, and never writes a cache
into an installed bundle. A host without a native Skill tool can read the selected
`SKILL.md` directly. Tool availability and permissions come from the actual host,
not from a file being present.

The shared handoff contract carries objective, role, ownership, source identity,
acceptance evidence, known decisions, task IDs, tool constraints, and the small
capability brief. Unchanged briefs and project context are reused. Team presets,
implementation/review templates, Sol Loop, review panels, and session handoffs use
this contract. Project/global instructions now state the same discovery rule.

See [agent capability usage](../agent-capabilities.md) for commands and role hints.

## Execution and verification

- Removed 13 fixed model fields. Profiles, team presets, command wrappers, Kiro
  adapters, task management, and optional pane guidance inherit host/user choices.
- Preserved native delegation where compatible, live model discovery, T3 task
  custody, fresh delegated review rounds, stable retry IDs, worktree source limits,
  actual concurrency limits, and the explicit boundary on top-level conversations.
- Replaced QA's consecutive full-suite quota with focused behavior checks and
  required repository gates. Zero selected, all skipped, interrupted, or unavailable
  checks cannot establish approval. Existing evidence can be reused on the same
  source; changes or concrete concerns require current evidence.
- Replaced repeated team mechanics with one shared procedure. Each preset still
  declares its own roles, stages, ownership, budget, and completion gates. Security
  and independent approvals, design-only work, conditional architecture consultation,
  sprint ordering, and emergency/four-file hotfix guards remain explicit.
- Task management now keeps registry writes with the coordinator, analyzes shared
  resources as well as file conflicts, and continues an already-authorized queue
  without a question after each wave. Existing registry locations are reused; new
  run artifacts go under the project's Arcwright memory directory.
- Simplified the triage, task, and skill-scout command wrappers so stale duplicate
  instructions cannot override their current skills. Session handoffs no longer
  force an additional compression skill.

All 303 primary menu command IDs and their order remain intact across 17 profiles.
Workflow/resource destinations and frontmatter other than the removed model fields
were preserved.

## Measured footprint

Measurements compare pre-task snapshots with the revised source. They are UTF-8
bytes, not measured model tokens, latency, cost, or effectiveness.

| Surface | Before | After | Reduction |
| --- | ---: | ---: | ---: |
| 17 team entrypoints | 201,674 | 34,565 | 82.9% |
| Team entrypoints, sidecars, and the new shared procedure | 253,518 | 58,051 | 77.1% |
| 17 agent profiles | 187,375 | 147,150 | 21.5% |
| Existing protocol entrypoints and conditional guides | 42,874 | 25,499 | 40.5% |

The new capability registry/helper are discovered through the router; agents receive
the small result rather than the entire registry or skill collection.

## Validation

- Package build passed, including resource/link validation and the content leak
  check: 2,436 text files scanned, with two binary files excluded.
- All **368 tests in 22 files passed**. The 26 focused capability/router tests also
  passed on the final implementation. New fixtures cover project/global resolution,
  direct entrypoints without a Skill tool, missing optional packs, local invocation
  restrictions, task argument safety, no runtime writes, registry/profile drift,
  and stale model/test quotas in generated host adapters.
- Four existing team opt-out assertions were narrowed to top-level skill bundles:
  the shared `references/team-execution.md` is a resource, not an installed team
  skill. The affected platform tests passed after that correction.
- Source audit reports 278 model-invocable skills, 17 roles/profiles, and no blockers.
  All 36 audited source families pass provenance checks. Upstream pins were not
  changed; local hashes and reviewed footprints were refreshed.
- Package dry-run confirms inclusion of the helper, registry, finder, shared runtime,
  and shared team procedure. Nothing was published.

Two independent live quality cases exercised revised guidance without a native
Skill API. QA reproduced a real blank-alias failure, extended one existing test,
fixed the function, passed all four public assertions, and ran its required syntax
check. The writer documented observed behavior and produced a continuation handoff
while leaving implementation/tests untouched and deliberately skipping code checks.
Both completed without questions or nested delegation. These are bounded quality
checks, not a controlled before/after or statistical comparison; usage was unavailable.

## Installed state and limits

Refreshed managed skills, profiles, native activation stubs, command routes, and
Kiro adapters in the existing project/global installations. Personal instructions,
configuration choices, optional module selection, and customizations were preserved.
The Kiro `VENDORED-MCP.md` override and legacy `rust-ffmpeg` customization were retained.
The project AWS stub keeps its existing description while using the shared runtime.

Actual global lookup succeeds for all 17 roles and resolves 16 installed profiles;
the optional AWS profile remains absent according to the existing install choices.
All 217 shared project/global skill entrypoints match. Managed instruction edits
were checked to preserve content outside their blocks. Cursor's global user rules
remain a staged file; its application settings were not changed.

Native host behavior was exercised through Codex. Other host adapters were built,
inspected, and covered by installer fixtures; their complete live host matrix was
not exercised. Existing authorization still controls installation, external
messages, tracker synchronization, commits, pushes, PRs, merges, and production
operations. This task did not commission an application release.

Temporary snapshots, logs, package inventory, live case results, installation
backups, and compatibility audits are retained in this conversation's evidence
directory under `orchestration-efficiency/`.
