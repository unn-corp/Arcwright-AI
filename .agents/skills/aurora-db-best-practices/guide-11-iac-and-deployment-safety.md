<!-- Conditional reference. The current SKILL.md and host policy take precedence. Paths are relative to this skill folder. -->

## IaC and deployment safety

- Review cluster and instance resources separately. Confirm logical IDs, engine
  version, cluster/instance parameter groups, subnet group, security groups, secret
  references, endpoints, reader promotion tiers, backup retention, deletion
  protection, log exports, and tags.
- Treat changing engine, storage/encryption, cluster identifier, subnet/network,
  parameter group, or resource type as potentially replacement- or reboot-inducing.
  Inspect the generated plan/diff and verify actual deployed behavior.
- Keep secrets out of templates and state where possible. Use references and
  rotation-aware application configuration; confirm a secret replacement does not
  strand old connections or break rollback.
- Separate schema migration execution from infrastructure provisioning when their
  ordering, transactionality, and rollback differ. Make migration status observable
  and fail deployments safely when compatibility checks fail.
- Prefer staged/canary changes, a tested rollback or restore path, and a promotion
  runbook for engine upgrades, topology changes, parameter changes, and migrations.
- Separate a major engine upgrade, parameter-group change, schema migration, and
  application deployment into independently verifiable stages unless a documented
  compatibility constraint requires coupling. A Terraform plan does not prove that
  the old client, extension, schema, or rollback path remains compatible.
