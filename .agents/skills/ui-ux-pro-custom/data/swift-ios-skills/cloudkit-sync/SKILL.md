---
name: cloudkit-sync
description: "Implement or debug CloudKit, CKSyncEngine, iCloud key-value/file sync, or SwiftData CloudKit integration. Use for account changes, conflict resolution, persisted change tokens, sharing, and sync recovery."
---

# CloudKit and iCloud Sync

Inspect the existing container, schema, database scope, local source of truth,
and deployment target. Choose record-based CloudKit, CKSyncEngine, SwiftData
sync, key-value storage, or coordinated files to match the existing data model;
do not combine sync engines for the same records by default.

## Correctness constraints

- Verify iCloud/CloudKit capabilities, container IDs, and account availability.
  Use private storage for personal data and shared/public databases only for
  their intended visibility. Keep local functionality usable during outages
  and account changes; avoid leaking one account's cache to another.
- Preserve change tags, custom-zone identity, pending local edits, server
  change tokens, and CKSyncEngine state serialization as applicable. Persist
  checkpoints across launches and recover explicitly from expired tokens.
- Reconcile concurrent edits with a documented merge policy. For
  `serverRecordChanged`, inspect ancestor/client/server values and save a merge
  based on the server record's current change tag. Do not silently discard
  either side or retry an unchanged stale client record forever.
- Treat partial batch failures per item. Bound retries for transient failures
  and respect `retryAfterSeconds`; quota, authentication, schema, and deleted
  zone errors require their own recovery. Recreating a user-deleted zone must
  follow the product's deletion/resync policy, not blindly restore unwanted data.
- Use subscriptions or CKSyncEngine for change discovery rather than a polling
  loop. Delivery and remote visibility are eventual; reconcile local display
  state without assuming a push or immediate read-after-save is guaranteed.
- Check SwiftData CloudKit schema restrictions against the installed SDK:
  defaults/optionality, relationships, uniqueness, and large binary storage.
  Preserve migrations and existing records; do not mechanically make every
  property optional or recreate the production schema.
- Keep key-value sync small and handle external-change notifications. Coordinate
  iCloud file reads/writes and conflict versions. Use appropriate encryption
  fields for sensitive records and keep framework objects in their owning domain.

## Validation and completion

Build with actual entitlements/concurrency settings and use the existing test
container or account setup. Exercise the changed path across relaunch and, for
sync behavior, relevant second-device/account and offline/reconnect scenarios.
Check conflict/partial failure recovery and checkpoint persistence where touched.
A local save or mocked callback alone does not demonstrate synchronization.

Stop when the requested data converges under its stated recovery/merge policy.
State unavailable account/device checks and remaining data risks; do not create
or reset production containers to make a development check pass.

## Conditional recipes

- [Container scope](references/implementation-guide.md#container-and-database-setup),
  [CRUD](references/implementation-guide.md#ckrecord-crud),
  [queries](references/implementation-guide.md#ckquery), and
  [subscriptions](references/implementation-guide.md#cksubscription).
- [Sync engine and sharing patterns](references/cloudkit-patterns.md).
- [Key-value storage](references/implementation-guide.md#nsubiquitouskeyvaluestore),
  [file sync](references/implementation-guide.md#icloud-drive-file-sync),
  [errors](references/implementation-guide.md#account-status-and-error-handling),
  and [conflict merge](references/implementation-guide.md#conflict-resolution).

Source terms: [notice](../UPSTREAM-NOTICE.md), [license](../UPSTREAM-LICENSE).
