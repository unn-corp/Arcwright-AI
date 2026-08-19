# Aurora availability, security, and recovery playbook

## Security

- Private subnets and narrow security-group ingress; no public database exposure by
  default.
- TLS in transit with client certificate validation where supported by the driver;
  KMS encryption at rest with key-policy and cross-Region restore checks.
- Secrets Manager or approved secret store, rotation-aware clients, no credentials in
  templates/state/logs. Evaluate IAM database authentication for driver/pool/proxy
  support rather than enabling it automatically.
- Separate runtime, migration, analytics, and administrative database/AWS roles;
  restrict schemas/tables/actions and dynamic identifiers.
- Audit/slow-query/Performance Insights logging only after checking sensitive query
  text and parameter exposure.

## Backups and restore

- Automated backups/PITR, snapshot retention/copies, deletion protection, and
  retain-on-delete policy must match RPO/RTO and account/Region isolation.
- Restore into isolation and verify extensions, schema, users/permissions, secrets,
  parameter groups, network routes, data freshness, application startup, and time to
  service. Snapshot creation alone is not a restore test.
- Treat accidental deletion, credential loss, Region loss, bad migration, and
  corrupted application data as separate recovery scenarios.

## Failover, maintenance, upgrades

- Test writer failover with real client pools and readers. Verify DNS, endpoint
  discovery, transaction outcome handling, idempotent retry, promotion tier, and
  user-visible recovery.
- Review maintenance windows, pending-reboot parameter changes, minor/major engine
  compatibility, extensions, drivers, replica promotion, and staged rollout.
- Treat DDL and upgrades as production operations: estimate locks, WAL/binlog,
  replication/lag, storage, cancellation, and rollback/restore before execution.

## Migration shape

Use expand/contract for compatibility: additive schema, dual-tolerant code, bounded
idempotent backfill, verification, cutover, observation, then cleanup after rollback
and all consumers are retired.
