# Arcwright workshop

`AGENTS.md` is the workshop's shared instruction file. `CLAUDE.md` is retired,
including root and nested package imports. Do not recreate those files; maintain
project instructions here and follow the applicable instruction hierarchy.

<!-- arcwright-claude-imports: retired -->

## Workspace rules

- This is the source workshop for Arcwright GitHub Releases. The npm packages are retired. Edit
  `_arcwright/`, `.agents/skills/`, `build/`, and package `lib/` or `bin/` sources.
  Never edit generated `packages/agent-orchestration/src/`; builds replace it.
- Matt Pocock skills and their wrappers are local Arcwright-maintained source.
  Preserve stable invocation names and third-party licenses/provenance. Herdr and
  Collie are detached checkouts; their application setup is separate from skills.
- Skill maintenance applies to both this source package and local global installs
  by default. Preserve user customizations and profile links; fleet rollouts remain
  separate unless requested.
- Keep Squidhub-specific overlays out of the generic package. This workshop is
  the single package publication source; publishing requires task authorization.
- Organization procedures live in optional private `vendor/unnamed-dev-skills/`.
  Keep them out of core sources and public bundles; follow
  [organization-pack setup](docs/organization-packs.md) for authorized access/install.
- Do not add AI/model attribution, generated-by notices, or coauthor trailers.
  Preserve required copyright, license, and source credits.

## Fleet management

- This checkout also supports operating the user's connected fleet. For fleet
  work, read [the fleet guide](docs/fleet-management.md) and run `npm run fleet:init`
  if `.fleet/` is missing or incomplete. Setup is local and preserves existing files.
- Keep device inventory, private runbooks, rollout plans, receipts, downloads, and
  recovery notes in Git-ignored `.fleet/`. Keep reusable, sanitized procedures in
  `docs/`. Never stage fleet records or require a commit, clean worktree, source
  pull, or submodule-pointer update for routine fleet operations.
- Use existing verified releases and pinned skill packages for install-only work.
  Source changes and release commissioning are separate work under the applicable
  app/package rules. Personal skill updates default to global installs; do not
  run the installer over this source workshop to refresh its own skills.
- Discover only within the user's requested fleet through available Arcwright
  Connect, Tailscale, or configured remote tools. Verify live identity,
  permissions, platform, and install scope; network visibility grants no authority.
  Reconcile routes to avoid updating the same installation twice.
- Apply updates to a representative device first, then bounded batches. Preserve
  channels, pins, customizations, active work, and required platform update checks.
  Record and resume per-device outcomes; offline, blocked, or unverified devices
  remain pending. Use the app's supported recovery flow and retain recovery assets.

## Frontend and website

- Never add eyebrow/kicker/overline text above headings.
- Never use em dashes in user-facing copy. The required Arcwright Code nightly
  product name below is an explicit exception.
- Website design/component changes belong in `website/src/`. For workflow, team,
  or agent roster changes, update the corresponding `website/src/data/` content.
  Keep website documentation aligned with meaningful README structure changes;
  inspect current components/data rather than assuming a fallback file exists.

## Build and integration references

- Every GitHub Actions job in this repository uses the organization's isolated
  self-hosted runners, including public-repository CI. Require `self-hosted`,
  `unn`, `unn-isolated`, and `t3-ci`, plus the native OS and architecture. Never
  switch to GitHub-hosted or Blacksmith runners as a fallback. Preserve ephemeral
  workers and explicitly selected repository access.

- `node build/build.js` builds the package and checks bundled references/leaks.
- For package behavior changes, run focused tests, then required package gates
  (`npm run test:coverage` in `packages/agent-orchestration/`). Follow the test
  effort policy below; documentation-only work needs no additional harness.
- Read [workshop/build/installer guidance](docs/workshop-guide.md) for relevant
  operations and [Kiro integration rules](docs/dev/kiro-integration.md) before
  changing Kiro formats, adapters, or command/profile registration.

<!-- arcwright-agent-start -->

## Arcwright

Arcwright agents, skills, and workflows are installed in `_arcwright/`.
Key modules: core, awm, awb, _memory

To use an agent, load its `.md` file and follow its activation instructions.
Agent configs are in `_arcwright/{module}/config.yaml`.
Skills are in `.agents/skills/` and `_arcwright/_memory/skills/`.

Shared project instructions belong in `AGENTS.md`. Keep required host instruction files as thin imports instead of duplicating rules; preserve host precedence and user-owned material.

## Skill selection and test effort

Select the relevant installed skill automatically; read its entrypoint once per task and only the references needed now. Prefer the active project's same-named skill; global copies are fallback. Use catalogs and the `arcwright` router without preloading collections. Look up routine facts directly; delegate substantial independent work only when authorized. For writing or reviewing tests, load `test-quality`, then runner guidance as needed. Selection preserves user authorization and host rules.

Use `subagent-protocol` as the shared delegation lifecycle; team presets, review loops, and implementation workflows add their own stages. Give delegated tasks relevant installed skill paths and a finder, using the `arcwright` capability brief when useful. Suggestions are nonexclusive; read a selected SKILL.md directly if no Skill tool exists. Reuse unchanged briefs.

Reuse the nearest suitable test and fixtures. Add the smallest tests that detect a plausible defect in changed public behavior; use independent expected values. Skip tests for cosmetic or documentation-only edits unless a concrete risk warrants one. Avoid implementation-mirroring assertions, redundant cases, unnecessary mocks, new harnesses, and arbitrary coverage quotas. Run focused tests first, then required checks; broaden or repeat only for changed code, failures, unresolved risk, or repository requirements. Keep output concise and state unrun checks. Do not start extra agents merely to write routine tests.

Use the Unnamed Development MCP only when the user explicitly requests it. Load `unnamed-dev-mcp` before that work; ordinary coding has no automatic tracker preflight, synchronization, or pending report.
If Unnamed Development MCP is unavailable, paste the pending tracker payload in chat (project, work, intended status). Do not bury it only in `_arcwright-output/unnamed-pm-pending/`.

To update Arcwright: `arcwright update`
To toggle agent teams: add `--no-teams` or run update again and choose differently at the prompt.
To enable Docker type-check: add `--docker-check`.
To modify gitignore behavior on next update: add `--gitignore full|skills|output-only|none`.
For global installs: add `--global` to any command. Update a global install with `arcwright update --global`.

<!-- arcwright-agent-end -->

## Arcwright Code application work

Before planning or changing `t3code`, or building, packaging, installing, or updating
Arcwright Code, read [the app instructions](t3code/AGENTS.md). They own the mandatory
delivery, nightly identity, retention, maintenance, version-alignment, and launcher
rules, including scheduled publication and the explicit request required for extra
manual builds. Fleet installation work reuses verified published releases.
