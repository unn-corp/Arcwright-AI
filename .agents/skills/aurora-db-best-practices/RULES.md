# Aurora database quick rules

- Identify engine/version, provisioned vs Serverless v2, topology, endpoints, Region, VPC, and recovery goals before recommending changes.
- Start from query plans, database load/waits, p95/p99 latency, connections, I/O, replica lag, failover/restore evidence, and cost.
- Use writer endpoints for writes and reader routing only for reads whose consistency semantics permit it; never hard-code instance IPs.
- Bound every query, result, transaction, pool, retry, and Lambda/serverless connection burst. Prevent N+1 and unbounded scans/sorts.
- Treat RDS Proxy as pooling/multiplexing, not a query cache; measure pinning, borrow wait, and the combined app/proxy/database connection budget.
- Test failover, DNS/pool recovery, transaction outcome classification, idempotent retries, and user-visible recovery time.
- Keep clusters private, require TLS where appropriate, use KMS/Secrets Manager, and separate runtime/migration/admin IAM/database roles.
- Define RPO/RTO; enable deliberate backups/PITR, protect deletion, and prove isolated restore—not just snapshot creation.
- Treat DDL, engine upgrades, parameter changes, topology changes, and IaC replacement as production rollouts with prechecks and rollback.
- Coordinate Aurora with API/UI/cache skills; a reader or bigger instance does not fix an N+1 query or request waterfall.
- For Amplify APIs, check AppSync/REST, resolver N+1, GraphQL selection sets/pagination, Lambda VPC/cold-start latency, tenant authorization/RLS, serialization, and Web Vitals.
- For multi-tenant Aurora SaaS, identify pool/bridge/silo placement, the tenant control-plane route, server-side membership checks, PostgreSQL RLS or the Aurora MySQL equivalent, tenant-leading indexes/composite keys, pooled connection and noisy-neighbor budgets, async idempotent onboarding, migration fan-out, and tenant-level export/delete/restore limits.
- Treat R&D as a separate non-production boundary: use synthetic or masked data, separate credentials/resources, production-shaped engine semantics, and cross-tenant negative tests. Promote migrations and IaC, never R&D tenant data or credentials.
- Treat public accessibility, low ACU, a single reader, `SELECT *`, and offset pagination as evidence-gathering triggers; do not label them defects without workload and access-path context.
- Before a major upgrade, require an isolated restore drill and split engine, parameter, schema, and application changes unless compatibility evidence justifies coupling.
- Reviews are read-only. Never run production DDL, failover, restore-overwrite, backfill, delete, or credential rotation without explicit authorization.
