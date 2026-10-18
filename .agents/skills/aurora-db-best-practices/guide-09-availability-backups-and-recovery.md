<!-- Conditional reference. The current SKILL.md and host policy take precedence. Paths are relative to this skill folder. -->

## Availability, backups, and recovery

- Define RPO/RTO, writer/reader failure behavior, Region failure behavior, data loss
  tolerance, and restore ownership before choosing readers, Global Database, or
  snapshots.
- Enable automated backups and a deliberate PITR retention window where required.
  Use snapshots/copies for longer retention, cross-account isolation, or regional
  recovery when the threat model requires it. Deletion protection and a retain-on-
  delete policy are safeguards, not substitutes for restore testing.
- Test restores into an isolated environment. Verify schema/extensions, secrets,
  parameter groups, network paths, application configuration, data freshness,
  permissions, and time-to-service—not only that a snapshot can be created.
- Plan maintenance and engine upgrades with a compatibility matrix, extension/driver
  checks, replica/promotion behavior, pending-reboot visibility, prechecks, staged
  rollout, and rollback/restore. Do not combine a major upgrade with unrelated schema
  or application changes without a controlled reason.
- Use expand/contract migrations for compatibility: add nullable/additive structures,
  deploy readers/writers that tolerate both versions, backfill idempotently and at
  a bounded rate, verify counts/constraints/indexes, then remove old structures only
  after all consumers and rollback paths are retired.
- Treat DDL as production work. Check table size, lock duration, replication impact,
  transaction log/WAL/binlog growth, failover behavior, and cancellation/rollback
  before running it.
