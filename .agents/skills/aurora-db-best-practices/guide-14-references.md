<!-- Conditional reference. The current SKILL.md and host policy take precedence. Paths are relative to this skill folder. -->

## References

- [Engine and topology decisions](references/engine-and-topology.md) — read when
  choosing provisioned/Serverless v2, readers, endpoints, Global Database, or
  promotion/failover behavior.
- [Performance and connections](references/performance-and-connections.md) — read
  for query workload, pools, RDS Proxy, timeouts, scaling, and UI/API boundaries.
- [Multi-tenant SaaS on Aurora](references/multi-tenant-saas.md) — read when Aurora
  serves multiple tenants or when designing tenant onboarding, isolation, RLS,
  R&D environments, quotas, migrations, or tenant-level recovery.
- [Availability, security, and recovery](references/availability-security-recovery.md)
  — read for backups, restore, failover, encryption, secrets, upgrades, and DR.
- [Review checklist](references/review-checklist.md) — read for an Aurora codebase,
  cluster, or migration audit.
- [Official sources](references/official-sources.md) — use when a current AWS
  behavior, engine/version support, limit, default, or price matters.

Coordinate with `postgresql-optimization` or `clean-code-standards` for engine/query
details, `aws-serverless-cdk` for general IaC, `amplify-best-practices` for Amplify
build/backend/UI boundaries, and `cloudfront-best-practices`/`s3-best-practices` for
the asset-delivery and object-storage sides of the system.
