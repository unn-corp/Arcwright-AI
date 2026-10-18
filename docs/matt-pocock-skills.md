# Arcwright engineering and productivity skills

Arcwright maintains its own local versions of the 27 stable skills adapted from [mattpocock/skills](https://github.com/mattpocock/skills). Canonical source is `.agents/skills/matt-pocock*/`, with command wrappers in `.claude/commands/matt-pocock*.md`. These are editable source files, not generated snapshots or submodules.

The original reviewed revision is `49dd158d1076134a641b33efb035946536778336` (upstream plugin 1.3.1). It records origin, not a dependency. Licenses, original input hashes, and source paths remain in the router's `SOURCE.json` and `LICENSE` files. The complete local file hashes live in `docs/skill-sources.json`.

## Install and use

```bash
arcwright install --matt-pocock --yes
arcwright update --matt-pocock --yes
```

The choice persists when the flag is omitted on updates. `arcwright update --no-matt-pocock --yes` removes unchanged managed pack files while preserving user edits. The pack remains optional and is excluded from default installations, including `--yes`.

The workshop already contains the skills and command wrappers. Invoke `/matt-pocock` on command-capable hosts, the `matt-pocock` Kiro agent, or `$matt-pocock` in Codex to select a skill. Direct names such as `/matt-pocock-tdd` remain unchanged for compatibility. Hermes requires a global installation to load skills from `~/.hermes/skills/`.

## Included skills

| Area | Skills, each with the `matt-pocock-` prefix |
| --- | --- |
| Guidance and setup | ask-matt, setup-matt-pocock-skills, retro |
| Planning and design | grill-with-docs, to-spec, to-tickets, wayfinder, domain-modeling, codebase-design, improve-codebase-architecture |
| Implementation and verification | tdd, implement, implement-spec, diagnosing-bugs, code-review, pr |
| Exploration and operations | prototype, research, triage, wizard |
| Productivity | grill-me, grilling, handoff, teach, to-questionnaire, wait-what, writing-for-agents |

Scripts, templates, references, and host metadata are maintained alongside each skill. Experimental and miscellaneous upstream skills are excluded. Namespaced references prevent collisions with existing Arcwright skills such as `grill-me` and `triage`.

Model invocation is enabled. The shared `INTEGRATION.md` loads once per task and covers native/Arcwright Code/T3 tools, existing authorization, read-only installed bundles, project-scoped output, and private secret input. Installation does not run setup, change trackers, or grant authority for external operations. Generated deliverables have no AI/model bylines, notices, or coauthor trailers; required source, copyright, and license notices remain.

## Maintain our versions

Edit the canonical skill or command directly. The build packages those exact local files, including local changes, without running Git, initializing submodules, fetching upstream, or recreating skill source. Do not edit generated `packages/agent-orchestration/src/` output.

```bash
node build/skill-sources.js --refresh-local
npm run check:skill-sources
npm run build
```

Run the relevant agent-orchestration tests and website data check for affected changes. When adding or removing a skill, update `matt-pocock/SOURCE.json`, `CATALOG.md`, and the source manifest's local roots together. Keep the original upstream hashes distinct from local hashes. Upstream changes may be reviewed and adapted manually; they are never pulled automatically over our versions.

`node build/matt-pocock.js --local` remains a compatibility helper for verifying local source and creating missing command wrappers. It never imports or rewrites skills, relies on an old local install manifest, or deletes source files.
