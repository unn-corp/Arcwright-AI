# Keeping skill context small

Run `node build/skill-efficiency.js --check` before packaging. It is offline and
compares each entrypoint and description with the reviewed UTF-8 byte footprints
in `docs/skill-efficiency-baseline.json`. It flags additions, removals, growth,
duplicate source skill names, missing alias targets, and alias cycles. Byte counts
are context-volume evidence, not provider token or billing estimates. Shrinkage
passes without changing the baseline. After reviewing a legitimate change, run
`node build/skill-efficiency.js --refresh-baseline` and review the JSON diff.

To inspect installed drift without changing files:

```bash
node build/skill-efficiency.js --scope global=/home/me/.agents/skills --json
```

The project is first, followed by scopes in the supplied order. Each shared name
reports its effective entrypoint, hashes, and preserved copies. A differing global
copy can be an intentional override; drift alone does not fail the audit. Duplicate
names within one scope do fail. This is the portable router's explicit precedence;
native hosts may expose and choose duplicate skills differently. The checker follows
installed symlinks for reading and reports them; it never reconciles or deletes them.

## Aliases

`.agents/skills/arcwright/aliases.json` records only reviewed pure aliases. Each
entry names the canonical skill and hashes the alias's Markdown body, excluding
frontmatter. A changed body requires a new equivalence review; refreshing the
footprint baseline does not silently accept it. Combined workflows such as
`matt-pocock-grill-with-docs` retain their procedure and are not aliases.

The portable catalog retains every command name and gives exact commands precedence
over namesake profiles and skills. An equivalent forwarding command can resolve
directly to its canonical `SKILL.md`. Runtime hashes preserve customized installed
aliases and commands: if either changes, the router reads its authored procedure.
Missing optional packs remain hidden, and a completely excluded alias pack may
leave its registry entry in an installed bundle without breaking lookup.

Description-only commands using either maintained forwarding template can also
resolve directly to their existing same-named skill. Extra body instructions or
other frontmatter keep the command route, including Full Send and Full Stop's
delivery mode selection. Both command and skill source hashes guard these routes.

For Kiro, the installer adapts router helpers and translates valid source guards
to the adapted package hashes. It never treats installed or unreviewed source
edits as proof that an alias is equivalent.

Use the returned `resolvedPath` and `executionKind`. Existing project skill copies
take precedence over global sibling copies; global-only skills resolve beside the
installed router. Without a native Skill tool, read the selected entrypoint and
follow it. This does not require a child agent or grant new action permissions.


## Managed installations

Project skills are the effective version for that project; installed globals are
fallbacks. Keep both scopes available for hosts and other projects that need
them, and inspect drift with the scope audit rather than deleting a global copy
because a project contains the same name. Native host discovery may still show
both; the shared selection policy and portable router read one effective copy.

The installer checks a bundle against its previous file identities before
updating it. A changed or linked file preserves the entire bundle, including
references, with a concise notice. Untracked same-named skills are also preserved.
Unchanged files are not rewritten. Previous hashes remain recorded for preserved
customizations so subsequent updates or uninstall cannot adopt their edited bytes
as installer-owned. Codex/OpenCode bookkeeping aliases share ownership for their
common physical global directory.

The dependency-free `arcwright/scripts/skill-metadata.cjs` owns description/name
reading, invocation policy, and optional module classification. Source audits and
portable helpers import it directly; the installer reads the bundled copy from
`src/.agents/skills/arcwright/scripts/`. Build before running installer source.

Cleanup refuses paths containing a symlink, even when the target content matches
an old installer hash. This protects personal files behind a linked bundle during
orphan removal and uninstall. Compare a preserved bundle with the new source and
merge the desired changes explicitly; do not suppress a drift report by blindly
claiming custom bytes as installer-owned.
