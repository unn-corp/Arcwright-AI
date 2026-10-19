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

## Scheduled publication

The release workflow follows the T3 fork's cadence on `main`:

| Channel | Schedule (UTC) | Selection |
| --- | --- | --- |
| Nightly (`next`) | Daily at 07:23 | Publish the current main commit only when it has not already been released |
| Stable | Sunday at 08:23 | Promote the newest eligible nightly that has been published for at least 24 hours |

Both jobs require `[self-hosted, linux, x64, unn, unn-isolated, t3-ci]`.
They use the organization's isolated workers, never hosted-runner fallbacks.
Publication runs serialize in one queue; a later run does not cancel a pending
publisher during a service delay.
GitHub schedules run from the default branch and may start late during load;
see [scheduled workflow behavior](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule).

The planner pins the source commit before the build. Nightlies use
`MAJOR.MINOR.PATCH-nightly.YYYYMMDD.RUN`, where `RUN` is the workflow run number.
The next patch follows the latest stable version, while a higher source package
version can declare a new minor or major series. The builder aligns the packaged
runtime and lockfile to that identity without making daily version commits.

Weekly stable builds use the mature nightly's exact source commit and core
version, record its tag as `promotedFrom`, and repeat the package and installation
checks. Candidates outside main, older than the current stable's history, or with
no newer version are ineligible. An unchanged main or no eligible stable candidate
produces a successful skip, not a duplicate release.

Every publication runs source/provenance checks, package coverage gates, and
isolated Codex/Claude install and repeat-update verification. Assets are uploaded
to a draft, downloaded and checked against `SHA256SUMS`, then published. Nightlies
are prereleases and never move GitHub's stable `latest` pointer. Stable installs
remain stable; `--channel next` opts into nightlies. Schedules publish packages,
not unattended fleet updates.

For an authorized manual nightly or stable promotion, dispatch `release.yml` on
`main` and select `nightly` or `stable`. A failed draft can be retried only for the
same pinned source; published assets are never overwritten. The tag-based flow
below remains available for explicit initial stable releases and versioned releases
outside the weekly schedule.

## Manual publication and npm retirement

Publishing requires task authorization. Align the runtime version and lockfile,
commit the reviewed source, and push a matching `vVERSION` tag. The release
workflow uses the organization's isolated self-hosted runners, runs the required
package gates and artifact verification, and publishes the four release assets.
The publishing runner needs the GitHub CLI (`gh`); its workflow token supplies
repository-scoped release access. No npm publishing credentials are required.
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
