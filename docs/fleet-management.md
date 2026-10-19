# Fleet management

Use this checkout to manage Arcwright Code and installed Arcwright skills on the
devices the user selects. Routine operations consume verified published releases
and packages; they require no repository commit, source pull, or clean worktree.
Preserve existing source edits and submodule pointers. New source changes or a
release commission follow their own app/package procedures.

## Prepare local storage

From the repository root, run:

```sh
npm run fleet:init
```

`node build/fleet-init.js` is equivalent and needs no dependency installation.
The command creates missing entries without overwriting existing files. Agents
run it when starting fleet work if the workspace is missing or incomplete. It
does not connect to devices, install updates, or schedule recurring work.

| Local path | Contents |
| --- | --- |
| `.fleet/README.md` | Local entrypoint; add personal operational notes or link private runbooks |
| `.fleet/inventory.json` | Stable device identities, routes, install scopes, desired policy, and last observations |
| `.fleet/runs/<UTC>-<name>/` | One rollout's plan, per-device receipts, and redacted logs |
| `.fleet/artifacts/<version>/<platform>/` | Verified downloads and their source manifests |
| `.fleet/recovery/` | Recovery references and notes; native snapshots stay in their required device locations |

The root `.gitignore` excludes the entire directory, including nested files. Do
not force-add its contents or put private fleet records in tracked docs, skills,
package sources, or app submodules. Setup gives new directories owner-only access
and new files owner read/write on POSIX; on other systems use the OS account's
private directory permissions. Existing files and permissions are preserved.
Git exclusion is not encryption or backup: use a private backup location if
inventory or history must survive losing this checkout.

Keep reusable procedures and sanitized examples in `docs/`. Keep real hostnames,
network addresses, account/device IDs, installation paths, and run outcomes in
`.fleet/`. Reference credentials by their host-managed name; do not save tokens,
pairing URLs, private keys, or authenticated command output in fleet records.
Host-managed screenshots and temporary tool evidence use conversation evidence
storage; fleet receipts can reference it, but keep durable essential facts in the
local receipt because conversation evidence can expire.

## Inventory and discovery

The initial inventory is `{ "schemaVersion": 1, "devices": [] }`. It is a local
record, not an executable update configuration. Keep it small; use per-device
notes for lengthy procedures. For each managed installation record:

- A stable local ID and observed Connect environment ID or network node identity.
  Use a hostname as a label, not as the sole identity check.
- Actual OS, architecture, role (desktop, server, Android, skills), and install
  scope. One physical host can have several environments, users, and data homes.
- Available connection references: Arcwright Connect environment, Tailscale
  node, or configured SSH target. Record which route
  was verified and when; credentials stay in the transport's credential store.
- Installed version/source, desired release or package version, channel/pin,
  update group, and last observed time. Unknown facts stay unknown.
- For skills: global or project scope, host adapters/optional packs, target
  directory, and local customizations that must survive updates.

Discover devices through the available app/network tools within the user's
requested account or network. A Tailscale node or tailnet address is a discovery
hint; use its available authenticated management route. Do not assume a listing
provides shell access. Arcwright Connect
availability also depends on the configured service; see [remote access](../t3code/docs/user/remote-access.md).
Only operate where current capabilities and permissions permit the requested work.

Reconcile existing entries using live identities. Multiple Connect, LAN, tailnet,
or SSH routes can reach the same environment; deduplicate update requests by
installation/coordinator identity. Do not merge distinct installations just
because they share a device name or IP. Refresh stale observations before acting;
keep offline devices visible with their last-seen time.

## Plan and apply a rollout

1. **Capture the scope.** Create a local run directory with a UTC timestamp and
   short purpose, such as `.fleet/runs/20261018T180000Z-skills/`. In `plan.md`,
   record the requested device/group selection, exclusions, component (app or
   skills), desired version, install scope, and authorization from the task.
   Resolve only ambiguities that change the result; routine per-device steps
   within an authorized rollout need no repeated permission questions.
2. **Inspect and pin.** Check live identity, platform, installed version,
   customization, connectivity, update preferences, and recovery readiness.
   Resolve the eligible app release or skill package once and record its exact
   version, source, manifest/integrity information, and platform artifact digests.
   Use that identity throughout the rollout; do not resolve an unpinned `latest`
   separately on each device. Honor explicit pins/channels and current eligibility;
   a withdrawn or newly invalid release pauses the run. Group compatible targets;
   unsupported platforms remain skipped with a reason.
3. **Start with a representative device.** Use one suitable device per affected
   platform/install class. Apply through the supported updater, verify it, then
   continue in small bounded batches. Respect per-device serialization and shared
   Windows/WSL maintenance ownership. A failed or unverified trial pauses that
   group; diagnose before expanding. Network loss leaves an unknown/pending state
   until a live check establishes the outcome.
4. **Verify on the destination.** Check actual installed version/source, startup,
   saved connections, and the changed capability. For skills, verify installed
   manifests/catalog discovery and preservation of user overlays. Downloaded,
   requested, waiting, and installed are distinct from verified. After app
   replacement, follow the canonical launcher/menu procedure and record its result.
5. **Record and resume.** Append per-device stage receipts to `events.jsonl` in
   the run directory. Include UTC time, stable target identity and install scope,
   before/target/observed versions, source and artifact digest or package integrity,
   action, outcome, verification, and any blocker or recovery reference. Redact
   logs. On retry, inspect live state and skip targets already verified at the
   pinned version; do not blindly repeat an interrupted installation.

Report verified, pending/offline/blocked, skipped, failed, and recovered devices
separately, with the exact target and remaining actions. Partial success is not a
completed fleet rollout. Do not enable recurring updates, change saved policy,
unpin a device, or expand the selected fleet unless the user's task authorizes it.

## Updating Arcwright Code

Read [app instructions](../t3code/AGENTS.md), the [updating guide](../t3code/docs/user/updating.md),
and the applicable [release procedure](../t3code/docs/operations/fork-releases.md#default-agent-delivery).
Install-only fleet work reuses existing verified releases. A request needing new
code/builds becomes separate source/release work under those rules; do not
silently turn an existing-release rollout into repository changes or publication.

Use the named host's App updates controls or supported authenticated maintenance
tools. A client and its connected hosts are separate targets. `t3 update` runs
against the destination's running home; use the documented `--base-dir` when
targeting another home. Do not run it on the controller expecting it to update a
remote device. Verify its current command help and capabilities before use.

Follow the platform-specific [update and confirmation rules](../t3code/docs/user/updating.md#choose-the-device):
desktop uses the confirmed Electron updater; managed servers and Android retain
native maintenance admission and their own recovery/OS approvals. Desktop
confirmation can stop owned backends, so an authorized fleet rollout does not
substitute for the required exact-artifact interruption confirmation. Automatic
updates never stop agents. Do not bypass a waiting check, replace binaries
manually, or invent another coordinator namespace. Preserve affected-home snapshots
where required, saved connections, work, channels, pins, and recovery assets.
Use the allocated nightly identity and canonical menu/launcher rules. Verify each
target independently; desktop confirmation does not authorize a phone installation.

## Updating Arcwright skills

Use the same verified published `@arcwright-ai/agent-orchestration` version for
each compatible target. Personal fleet skills default to global installs to
avoid changing project source. Run on the destination device, replacing `VERSION`
with the verified exact package version:

```sh
arcwright --release VERSION update --global
```

For an explicitly selected project install, use `update --directory` with that
device's absolute project path instead of `--global`. Preserve its existing
module, adapter, optional-pack, hook, output, and customization choices. Project
updates may change that project's managed files; do not commit them as part of
fleet work or hide source changes with blanket ignore rules. Never point the
installer at this source workshop to refresh its canonical skill library.

Check the installed package/manifest and relevant skill discovery after updating;
opening a new session may be needed to refresh a host's catalog. Preserve private
overlays and inspect ownership conflicts rather than replacing them wholesale.
For recovery, retain the prior version and affected managed files/preferences;
use the supported installer or reviewed owned-file restore without deleting
unrelated skills or importing another machine's credentials.

## Codex accounts on devices

Arcwright Code can run several Codex accounts from one Codex home. Each extra
account gets a shadow home that links the shared skills, plugins, sessions,
configuration, and memory database. The shadow home keeps its own `auth.json`,
`models_cache.json`, and Codex background server state (`app-server-daemon` and
`app-server-control`).

- Sign in to each account separately on each device and in each home:
  `CODEX_HOME=<home> codex login`, adding `--device-auth` on a headless host.
  Never copy `auth.json` between devices or homes. Codex refresh tokens are
  single-use, so once one copy refreshes, the others fail with "refresh token
  was already used". Arcwright Code then shows that provider as not
  authenticated.
- To find copies without exposing secrets, compare each home's account email,
  `last_refresh`, and a short hash of the refresh token across devices. A hash
  that matches on two devices is a copy. Fix it by signing in again on one
  device, which overwrites the file. Do not run `codex logout` on a copy: logout
  revokes the session, and that also signs out the other device.
- `codex login status` only reads the local file. To confirm a login works, run a
  short `codex exec` prompt in that home. A login past its refresh interval
  refreshes during the check, so test a copy only after the other device has its
  own sign-in.
- Codex 0.163 and later refuse a symlinked daemon directory ("socket directory
  path exists and is not a directory"), and a shared directory would also attach
  one account to another account's server. Arcwright Code builds without the
  per-account daemon change link these directories into shadow homes. To repair
  a shadow home, remove only the symlink (never its target, which belongs to the
  shared home's running server) and create an empty owner-only directory. An
  older build links it again when the next Codex session starts, so the repair
  holds only until the device runs a fixed build. Arcwright Code's own providers
  talk to Codex over stdio and are not affected; the Codex CLI is.
  `arcwright update --global --codex-self-heal on` saves this repair for every
  later global install and update, for homes Arcwright Code does not manage;
  `--credential-copy-check local` also reports logins copied between homes on
  that device.
- When you inspect a device, record its Codex version, each `~/.codex*` home,
  the `shadowHomePath` values in Arcwright Code's `settings.json`, whether the
  daemon entries are symlinks, and the outcome of each login check.

## Recovery and retention

For an app failure, use its recorded native recovery flow. Do not restore a data
home independently of the coordinator or silently replace a database after new
writes. Record the recovery outcome and stop the affected rollout group.

Prune reproducible downloads and redundant redacted logs only after the rollout
is settled. Retain inventory, concise receipts, customizations, and assets still
referenced by installed builds or recovery. A retired remote release is not
permission to remove a device's required local recovery copy. Review large caches
and private backups as local operations; never use a repository commit as a fleet
backup or rewrite historical artifact identities.
