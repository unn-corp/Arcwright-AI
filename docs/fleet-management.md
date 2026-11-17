# Arcwright skills fleet management

Use this checkout to track, update, and recover Arcwright skills package
installations on selected devices. Routine rollouts use verified published
packages and require no repository commit, source pull, or clean worktree.
Follow the [workshop guide](workshop-guide.md) for source changes and the
[release guide](releases.md) for package verification and offline installation.

## Prepare local storage

From the repository root, run:

```sh
npm run fleet:init
```

`node build/fleet-init.js` is equivalent and needs no dependency installation.
The command creates missing entries without overwriting existing files. Agents
run it when starting a skills rollout if the workspace is missing or incomplete. It
does not connect to devices, install updates, or schedule recurring work.

| Local path | Contents |
| --- | --- |
| `.fleet/README.md` | Local guide to the skills fleet records |
| `.fleet/inventory.json` | Device identities, verified routes, install scopes, installed versions, and channel or pin |
| `.fleet/runs/<UTC>-<name>/` | Skills rollout plan, per-installation receipts, and redacted logs |
| `.fleet/artifacts/<version>/` | Verified skills package archives and release metadata |
| `.fleet/recovery/` | Prior package versions and references to managed-file backups |

The root `.gitignore` excludes the entire directory, including nested files. Do
not force-add its contents or put private fleet records in tracked docs, skills,
or package sources. Setup gives new directories owner-only access
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

- Stable local ID, verified host identity, OS, and architecture. A physical host
  can have several users and installations.
- Verified connection route and verification time, such as a Tailscale node or
  configured SSH target. Keep credentials in the transport's credential store.
- Installed package version and source, desired version or channel/pin, update
  group, and last observed time.
- Global or project scope, target directory, host adapters, optional packs, and
  local customizations that must survive updates.

Discover devices within the user's requested account or network and verify that
the available authenticated route has the required access. Use live identities
to reconcile routes and deduplicate updates by installation. Keep offline
devices visible with their last-seen time.

## Plan and apply a rollout

1. **Capture the scope.** Create a local run directory with a UTC timestamp and
   short purpose, such as `.fleet/runs/20261018T180000Z-skills/`. In `plan.md`,
   record the requested device/group selection, exclusions, desired package
   version, install scope, and authorization from the task.
   Resolve only ambiguities that change the result; routine per-device steps
   within an authorized rollout need no repeated permission questions.
2. **Inspect and pin.** Check live identity, platform, installed version,
   customization, connectivity, update preferences, and recovery readiness.
   Resolve the eligible skill package once and record its exact version, source,
   and manifest or digest.
   Use that identity throughout the rollout; do not resolve an unpinned `latest`
   separately on each device. Honor explicit pins/channels and current eligibility;
   a withdrawn or newly invalid release pauses the run. Group compatible targets;
   unsupported platforms remain skipped with a reason.
3. **Start with a representative device.** Use one suitable device per affected
   platform/install class. Apply through the supported updater, verify it, then
   continue in small bounded batches and serialize updates on each device. A failed
   or unverified trial pauses that group. Diagnose before expanding. After a
   network loss, verify the actual state before continuing.
4. **Verify on the destination.** Check the installed version, source, and manifest.
   Verify skill discovery and preservation of user overlays.
5. **Record and resume.** Append per-device stage receipts to `events.jsonl` in
   the run directory. Include UTC time, stable target identity and install scope,
   before/target/observed versions, package source and integrity,
   action, outcome, verification, and any blocker or recovery reference. Redact
   logs. On retry, inspect live state and skip targets already verified at the
   pinned version; do not blindly repeat an interrupted installation.

Report verified, pending/offline/blocked, skipped, failed, and recovered devices
separately, with the exact target and remaining actions. Partial success is not a
completed fleet rollout. Do not enable recurring updates, change saved policy,
unpin a device, or expand the selected fleet unless the user's task authorizes it.

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

## Recovery and retention

Prune reproducible downloads and redundant redacted logs only after the rollout
is settled. Retain concise receipts, package archives needed for rollback, and
references to backups of installer-managed files and preferences. Keep a local
rollback copy when the prior release is no longer downloadable. Preserve user
overlays and private files during recovery.
