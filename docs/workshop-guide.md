# Arcwright workshop reference

Shared agent instructions live in [AGENTS.md](../AGENTS.md). This reference holds
details needed for workshop, installer, website, and publication work.

The workshop's root and nested `CLAUDE.md` imports are retired. Maintain shared
instructions in `AGENTS.md`; do not recreate those imports.

## Sources and output

This workspace builds `@arcwright-ai/agent-orchestration` for multiple agent hosts.
The npm organization is `@arcwright-ai`; the repository is
[unn-corp/Arcwright-AI](https://github.com/unn-corp/Arcwright-AI).
`@arcwright-ai/tmux-setup` is a deprecated standalone package, replaced by Herdr.

| Path | Purpose |
| --- | --- |
| `_arcwright/awm/` | Method profiles and workflows: analysis, architecture, development, product, QA, review, verification |
| `_arcwright/awb/` | Builder profiles and workflows for agents, workflows, modules |
| `_arcwright/core/` | Master orchestrator, runtime contract, core workflows |
| `_arcwright/_memory/` | Sidecar memory and skills |
| `.agents/skills/` | Canonical skill library, including locally maintained imported skills |
| `.claude/commands/` | Native command sources and generated skill wrappers; also routed through the neutral catalog |
| `.grok/commands/`, `.opencode/commands/` | Git-ignored local adapters generated from canonical commands |
| `packages/agent-orchestration/lib/`, `bin/` | Permanent installer and CLI source |
| `packages/agent-orchestration/lib/templates/herdr/` | Shipped Herdr runtime assets; `herdrSetup.js` and `herdrAssets.js` integrate them |
| `packages/agent-orchestration/src/` | Generated package output; never edit directly |
| `packages/tmux-setup/lib/`, `bin/`, `src/tmux/` | Legacy standalone package sources |
| `website/` | Vite + React + TypeScript site for arcwright.space |
| `.fleet/` | Git-ignored device inventory, rollout records, artifacts, and recovery notes |
| `vendor/unnamed-dev-skills/` | Optional private organization pack; excluded from public core builds |

For operating devices from this checkout, follow [fleet management](fleet-management.md).
Run `npm run fleet:init` once to prepare local storage. Routine device updates use
verified published artifacts without committing or changing the workshop's source.

`npm run commands:sync` refreshes the workshop's Grok/OpenCode command adapters;
the normal build also runs it. A local hash manifest updates or retires only owned,
unchanged adapters and preserves custom files. Edit canonical `.claude/commands/`
sources for shared changes. Fresh checkouts create the native adapters on first
sync/build; installed projects continue to receive adapters through the installer.

The installer exposes `sourceApiVersion: 1` and `createInstaller({ sourceDir })`
for an explicitly selected trusted bundle. The default API uses the public package
source. Organization installers compose a private temporary source from that core
plus their own payload and reuse the same install/update ownership rules. Never
write an overlay into the installed public package or publish a composed private
bundle. See [organization packs](organization-packs.md).

## Build and publish

Run `node build/build.js` from the workspace root. The build copies modules and
generic skills, generates Kiro steering and native agents, bundles commands and
the model-invocable catalog, and validates references, invocation policy, and
absence of project-private Squidhub overlays. Install-time adapters handle
host-specific skill content; see [Kiro integration](dev/kiro-integration.md).

The workshop is the only publication source. Squidhub keeps unpublished local
overlays (personas, MCP templates, and related project content) on top of the
installed package. Keep these out of the distributable.

For an explicitly authorized package release, build and validate the package,
then run `npm publish --access public` from `packages/agent-orchestration/` using
the existing npm organization and authentication. Use private credential entry
for missing authentication. Ordinary source work does not authorize publishing.

## Website

Keep workflow, team, and agent data in `website/src/data/` consistent with source.
Keep website documentation aligned with meaningful README changes. Inspect the
current site components/data; do not assume a README-fetch or fallback module
exists. Design and component changes belong in `website/src/`.

The site deploys through Dokploy. For an authorized deployment, its
`docker-compose.yml` and Dockerfile support `docker compose up -d` from `website/`.
Traefik labels configure arcwright.space and Let's Encrypt TLS. A local source
or documentation edit alone does not authorize deployment.

## Installer

The supported host registry, paths, optional modules, and writers live in
`packages/agent-orchestration/lib/installer.js`. The CLI's `--help` and
[README](../README.md) describe current options. Keep those surfaces aligned.
Instruction authoring uses project `AGENTS.md`, including Claude-only installs.
Claude entrypoints contain a managed relative import. Global Claude instructions
live in `~/.arcwright/AGENTS.md`, imported by `~/.claude/CLAUDE.md`; other hosts use
their supported global `AGENTS.md` locations. Preserve user-owned instructions.

An installation can explicitly retire Arcwright's Claude imports by placing this
standalone policy line in its shared `AGENTS.md`, outside the managed block:

```html
<!-- arcwright-claude-imports: retired -->
```

The updater honors that choice: it removes complete Arcwright-owned import/rule
blocks and deletes a host file only when nothing else remains. It never creates
a new `CLAUDE.md` under this policy or moves personal host content into shared
instructions. The workshop uses this policy. With a host that does not discover
`AGENTS.md` natively, load that file explicitly when starting work.

- Project installs default to the chosen directory; global installs use
  `~/.arcwright/` plus supported per-host config directories. On WSL, terminal
  hosts use the Linux home and GUI hosts such as Kiro use the Windows home.
- Updates restore saved tool, team, optional-module, hook, and output choices.
  Preserve module `config.yaml`, user overlays, and customized skill bundles.
  The updater removes installer-owned orphans using its files manifest.
- TOML customization is base < team `<name>.toml` < personal `<name>.user.toml`
  under `_arcwright/custom/` (global: `~/.arcwright/custom/`). Scalars override;
  `__append` appends arrays; keyed objects match by `id`/`name`.
- Project gitignore modes are `output-only`, `skills`, `full`, and `none`.
  Personal `*.user.toml` files remain ignored in managed modes. Enumerate shipped
  command paths from the bundle so user commands are not covered accidentally.
- Hook modes are `safe`, `full`, and `none`, documented in
  [hooks-guide.md](hooks-guide.md). Preserve existing user permissions and hooks.
  Host-specific guard settings do not grant privileges to another runtime.
- `--model-surface` configures Hermes through OmniRoute; see
  [model launchers](../packages/agent-orchestration/docs/dev/model-launchers.md#preferred-global-cli-agent-hermes-through-omniroute).
  Provider-specific launchers are a secondary compatibility path.
- Cursor global User Rules remain app-managed: stage
  `~/.cursor/arcwright-user-rules.md` for Settings rather than inventing a config
  path. Hermes global skills do not imply a global `AGENTS.md` loader; preserve
  `~/.hermes/SOUL.md`. Grok merges rather than replacing bundled skills.

Native tool/command formats are adapters. They do not create separate delegation
protocols: use `subagent-protocol`; workflows provide role and review topology.

Maintain shared discovery metadata in
`.agents/skills/arcwright/scripts/skill-metadata.cjs`. It supplies source audits,
portable helper discovery, and the built installer's skill/command module filters.
Build first so the installer can import the same bundled helper. Keep profile menu
help in its module's `resources/agent-menus/` and preserve the profile's relative
`<menu src="..."/>` reference; the build rejects missing or unsafe targets.
