# Canonical instructions and delegation

## Findings and changes

Arcwright has one runtime delegation protocol:
[subagent-protocol](../../.agents/skills/subagent-protocol/SKILL.md).
`claude-subagent-protocol` is a compatibility alias. Team presets, `sol-loop`,
and `subagent-driven-development` define stages and review gates on that shared
lifecycle. Framework design guidance such as Strands multi-agent patterns is a
different concern. The implementation workflow and Matt Pocock integration now
refer to the shared lifecycle instead of maintaining another dispatch procedure.

[AGENTS.md](../../AGENTS.md) is the workshop's canonical shared instruction file.
Useful workshop rules moved there, with build/installer and Kiro details in
[workshop-guide.md](../workshop-guide.md) and
[kiro-integration.md](../dev/kiro-integration.md), loaded when relevant. Stale
model preferences, blanket permission flags, duplicate skill catalogs, and a
nonexistent website fallback reference were removed. Existing app delivery,
nightly naming, and release retention instructions remain verbatim.

The root, `.claude/`, and two package Claude instruction files are three-line
managed imports of the canonical file. This is a
[documented compatibility mechanism](https://code.claude.com/docs/en/memory#share-one-file-with-other-coding-tools),
including hosts that cannot load AGENTS.md directly. Import paths resolve relative
to their entrypoint. Shared rules are edited in AGENTS.md.

The installer follows the same convention for Claude-only and mixed-host installs.
It creates project AGENTS.md and one root import, updates an existing nested
entrypoint without creating a redundant one, and replaces complete installer-owned
legacy blocks. It preserves unowned host content rather than automatically moving
it. Global Claude imports `~/.arcwright/AGENTS.md`; personal/global instructions
are never copied into the project. Other hosts retain supported native entrypoints.
Uninstall removes owned rules/imports and preserves remaining user instructions,
including user additions to the new global shared file.

The startup reminder points to AGENTS.md and requests context discovery only when
facts are missing. Hook ownership recognizes the old and new reminders, allowing
updates to replace them and uninstall to remove them without leaving stale hooks.

## Installed copies

Refreshed the four affected installed bundles already present in each of five
active host skill directories, preserving ownership checks and saved module/tool
choices. Updated the owned shared runtime and Kiro core steering. Refreshed only
Arcwright-managed global instruction blocks and two existing startup reminders;
outside-block global instruction content remained byte-identical. The inactive
legacy cache contains none of these bundles and was not expanded.

## Validation

- A contained probe of the pre-change installer confirmed that a Claude-only
  install failed to create AGENTS.md.
- Six focused checks passed for shared authoring, updates, migration, global paths,
  hook deduplication, and uninstall behavior. The final required coverage run passed
  all 370 tests and existing coverage thresholds.
- Package build passed invocation, bundled reference, and private-content checks.
- Reviewed footprints and alias resolution passed for all 280 source skills;
  upstream audit revisions were unchanged across 36 source families.
- All four workshop imports resolve directly to AGENTS.md. The 219 skill names
  shared with the main global installation have zero entrypoint drift.
- Package dry run verifies the canonical and compatibility skill resources ship.

No website implementation or application binary changed. No release, publication,
commit, or push was part of this maintenance task.
