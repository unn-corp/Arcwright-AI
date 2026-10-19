# Arcwright releases

Arcwright is distributed through public
[GitHub Releases](https://github.com/unn-corp/Arcwright-AI/releases). Consumers
need Node.js 20+ and `tar`, with no npm install or GitHub authentication. npm
remains a development dependency manager, not the distribution channel.

## Install and migrate

```bash
curl -fsSLO https://github.com/unn-corp/Arcwright-AI/releases/latest/download/arcwright.cjs
node arcwright.cjs --tools codex,claude-code --yes
# Existing npm-created project installation:
node arcwright.cjs update --yes
# Existing global installation:
node arcwright.cjs update --global --yes
```

The managed command is `~/.local/bin/arcwright`. Put `~/.local/bin` on `PATH`.
The launcher refuses to replace an unrelated command at that location. If an old
npm-installed binary occupies it, remove that npm installation first. Old global
npm installations elsewhere may shadow it; check `command -v arcwright` and use
the new command's absolute path until `PATH` is corrected.

Updates preserve the installed host choices, module configuration, custom skills,
user instructions, Claude settings, and optional-pack preferences through the
existing manifest-based update engine. The engine's source API stays available
for authorized organization-pack composition. Retirement removes npm publishing
and npm-specific invocation, while retaining this migration behavior.

`arcwright update` downloads the latest stable archive; `--release VERSION` pins
a version. `--channel next` selects the newest published prerelease, including on
subsequent updates when recorded in the target manifest. `--archive PATH` accepts
an offline archive alongside its matching `release.json`. The digest in that
metadata is verified before extraction or target changes. The launcher and
metadata must come from a trusted release. `SHA256SUMS` also covers the launcher
and metadata for independent checking.

The runtime and prior release runtimes live under `~/.local/share/arcwright/`.
The active runtime is selected only after a successful installation/update.
Help, version, migration, and uninstall commands can use that runtime offline.
`ARCWRIGHT_RELEASES_URL` explicitly selects a trusted release mirror with GitHub's
`latest/download` and `download/vVERSION` layout. HTTP is allowed only for loopback
test servers.

## Build and verify

```bash
npm --prefix packages/agent-orchestration ci
npm --prefix packages/agent-orchestration test -- test/release-launcher.test.js test/cli.test.js
npm --prefix packages/agent-orchestration run test:coverage
npm run release:build
npm run release:verify
```

The builder runs the normal source/reference/leak checks and stages `bin/`,
`lib/`, generated `src/`, and lockfile-pinned production dependencies. Development
dependencies, upstream Git history, and private organization overlays stay out.
Bundled dependency and skill licenses are preserved. The output consists of a
versioned archive, `arcwright.cjs`, `release.json`, and `SHA256SUMS` in `dist/`.

Verification installs and repeats updates for Codex and Claude in temporary
project directories and temporary homes. It checks skills, Claude commands and
hooks, personal instructions/settings/skills, manifest preferences, and custom
module configuration. To additionally migrate the actual published npm baseline:

```bash
npm install --prefix /tmp/arcwright-npm-baseline --ignore-scripts --no-audit --no-fund @arcwright-ai/agent-orchestration@1.2.2
node build/verify-release.cjs dist /tmp/arcwright-npm-baseline/node_modules/@arcwright-ai/agent-orchestration
```

Use an isolated path appropriate for your environment. The verifier never installs
into the source workshop or the real home directory.

## Publish and retire npm

Publishing requires task authorization. Align the runtime version and lockfile,
commit the reviewed source, and push a matching `vVERSION` tag. The release
workflow uses the organization's isolated self-hosted runners, runs the required
package gates and artifact verification, and publishes the four release assets.
The publishing runner needs the GitHub CLI (`gh`); its workflow token supplies
repository-scoped release access.
Prerelease versions must be published as GitHub prereleases. Manual publication
must run the same checks, associate the release tag with its exact source commit,
and include all four assets.

After the replacement is publicly downloadable and verified, deprecate every
version of the legacy npm packages using an authenticated maintainer account:

```bash
npm deprecate '@arcwright-ai/agent-orchestration@*' 'Arcwright moved to GitHub Releases. Install and migrate: https://github.com/unn-corp/Arcwright-AI/blob/main/docs/releases.md' --registry=https://registry.npmjs.org/
npm deprecate '@arcwright-ai/tmux-setup@*' 'Retired. Herdr replaces the tmux package. Arcwright releases: https://github.com/unn-corp/Arcwright-AI/releases' --registry=https://registry.npmjs.org/
```

Deprecation retains old versions for existing users while showing the migration
notice. Do not unpublish them or delete installed user skills/configuration.
Both local package manifests set `private: true` to prevent future npm publication.
