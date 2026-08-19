---
name: aurora-db-best-practices
description: Use when planning, designing, deploying, debugging, or reviewing Amazon Aurora PostgreSQL or Aurora MySQL clusters, schemas, queries, connections, readers, failover, Serverless v2, Global Database, backups, security, migrations, multi-tenant SaaS data isolation, R&D tenant environments, or database-backed application performance.
---

# Aurora database best practices

Treat Aurora as a distributed database service and an application contract, not
just a faster PostgreSQL/MySQL instance. Review the engine, cluster topology,
connection behavior, SQL workload, recovery objectives, security boundary, and
infrastructure lifecycle together.

## Operating contract

- Identify the engine and major version first: Aurora PostgreSQL or Aurora MySQL,
  provisioned or Serverless v2, Region(s), cluster topology, writer/readers,
  endpoints, VPC/subnets, parameter groups, and deployment owner.
- Start from evidence. Inspect query plans, database load/waits, connection churn,
  latency/error distributions, CPU/memory/I/O, replica lag, failover duration,
  backup/restore results, ACU/instance utilization, and cost when available.
- Keep facts, assumptions, findings, and recommendations separate. An Aurora
  feature, default, engine extension, limit, or pricing rule is not universal;
  verify it for the engine version and Region.
- Reviews are read-only by default. Do not run destructive DDL, write production
  data, backfill, fail over, restore over an existing database, change retention,
  rotate credentials, or modify a live cluster during a review without explicit
  authorization for that exact mutation.
- Never place passwords, connection strings with secrets, tokens, customer rows,
  private keys, or raw database dumps in hook output, logs, build artifacts, or
  committed configuration.

## Choose the mode

### Planning

Inventory the workload and recovery contract, choose the Aurora topology and engine
features that fit it, and produce a staged plan with latency/capacity targets,
security controls, migration risk, metrics, cost dimensions, validation, and rollback.

### Implementation

Make the smallest evidence-backed change. Check engine/version support, parameter
group scope, pending-reboot behavior, CloudFormation/IaC replacement risk, secret
handling, endpoint semantics, and backup/restore implications before applying it.

### Review

Read [references/review-checklist.md](references/review-checklist.md) and report
severity, evidence, user/runtime impact, smallest safe improvement, trade-offs,
rollout, validation, rollback, unchanged behavior, and unknowns. Do not turn a
review finding into a live database mutation silently.

## First-pass inventory

Search for and inspect, as applicable:

- CDK, CloudFormation, Terraform, Pulumi, Serverless, Amplify, migration tools,
  database modules, and application deployment configuration;
- engine, engine mode/version, cluster and instance classes, Serverless v2 minimum
  and maximum ACUs, promotion tiers, reader count, global-cluster membership,
  deletion protection, and copy-tags settings;
- writer, reader, custom, proxy, instance, and Data API endpoints; connection
  strings, DNS caching, timeouts, retry policy, transaction boundaries, and pool
  settings across every service, Lambda concurrency, job, and local tool;
- schemas, migrations, extensions, functions/triggers, indexes, views, query
  builders/ORMs, repositories, transaction code, pagination, and tests;
- tenant identity/membership and authorization, tenant control-plane/catalog,
  pool/bridge/silo placement, `tenant_id` constraints/indexes/RLS, per-tenant
  routing, onboarding, quotas, background jobs, exports, deletion, and migration
  status;
- VPC/subnets, security groups, private/public accessibility, TLS enforcement,
  IAM database authentication, Secrets Manager, KMS, audit/log exports, and
  cross-account access;
- automated-backup/PITR retention, snapshots, cross-Region/cross-account copies,
  restore drills, maintenance windows, minor/major upgrade policy, parameter groups,
  and blue/green or staged rollout controls; and
- CloudWatch metrics/alarms, Performance Insights or Database Insights, Enhanced
  Monitoring, slow-query logs, engine logs, tracing, dashboards, and cost reports.

If a deployed fact or downstream consumer cannot be inspected, mark it unknown. Do
not infer safety from a clean `cdk diff`, a healthy instance, or a successful local
migration alone.

## Engine and topology decisions

- Choose Aurora PostgreSQL vs Aurora MySQL from extension, SQL dialect, driver/ORM,
  operational, and migration requirements. Do not present engine-specific parameters,
  extensions, failover behavior, or SQL examples as interchangeable.
- Use a writer/cluster endpoint for writes and a reader endpoint or deliberate
  reader routing for read-only work. A reader endpoint distributes connections; it
  does not make a query transactionally consistent with a preceding write and does
  not replace application-level read-after-write decisions.
- Size readers for read capacity, failover promotion, and background replication
  work—not only average read traffic. Set promotion tiers intentionally and test
  which reader becomes writer.
- Use provisioned instances when the workload is steady, latency-sensitive, or
  requires predictable capacity. Consider Serverless v2 for variable workload or
  operational simplicity only after measuring scale-up/down behavior, minimum
  capacity, connection limits, warm-buffer effects, and cost.
- Serverless v2 writers and readers can have independent capacity behavior. Choose
  minimum/maximum ACUs from memory/working-set, connection, burst, and failover
  requirements; do not choose the minimum solely to minimize idle cost.
- Use Aurora Global Database only when cross-Region read/DR requirements justify
  asynchronous replication, regional cost, and operational complexity. Define RPO,
  RTO, planned vs unplanned failover, write forwarding/traffic redirection, conflict
  handling, and isolated restore tests.
- Treat Aurora storage durability as distinct from application backup/restore,
  cross-Region recovery, and accidental deletion protection. Pick the topology from
  recovery evidence, not from the word “Aurora.”

## Query, schema, and application performance

- Trace the critical request from UI/API handler to repository/ORM, SQL, transaction,
  result shaping, and downstream calls. Bound rows, columns, joins, sort work,
  pagination, and response payloads at every layer.
- Use `EXPLAIN`/`EXPLAIN ANALYZE` and workload evidence before adding or removing an
  index. Run `ANALYZE`-style diagnostics and write-heavy index changes in a safe
  environment; an index can reduce read latency while increasing write cost,
  storage, vacuum/maintenance work, or lock pressure.
- Prevent N+1 queries, unbounded `SELECT *`, offset pagination on large/changing
  datasets, accidental cross joins, unbounded sorts, and application scans. Prefer
  keyset/seek pagination when the access pattern permits it.
- Keep transactions short and explicit. Avoid holding a connection across network
  calls or user interaction, and inspect lock waits, isolation level, deadlocks,
  retries, and long-running transactions.
- Use engine-appropriate maintenance: PostgreSQL autovacuum/analyze, bloat and
  vacuum health, or MySQL statistics, indexes, and purge/transaction behavior.
  Do not copy a PostgreSQL tuning rule into Aurora MySQL or vice versa.
- Keep database work out of the browser. APIs should enforce authorization, use
  bounded reads/writes, expose stable loading/error/empty states, and cache only
  data whose freshness and tenant semantics are safe. Coordinate UI/API changes
  with `amplify-best-practices`, `cloudfront-best-practices`, and
  `frontend-responsive-design-standards` when they apply.
- For Amplify-backed applications, identify AppSync versus REST, generated client
  pagination contracts, GraphQL selection sets/resolver N+1 behavior, Lambda
  cold-start/VPC connection latency, tenant authorization/RLS boundaries,
  serialization cost, and frontend request waterfalls/Web Vitals. A fast SQL query
  does not prove a fast user journey.

## Multi-tenant SaaS on Aurora

Use this section whenever Aurora stores data for more than one customer, workspace,
organization, or environment. Read [references/multi-tenant-saas.md](references/multi-tenant-saas.md)
for the configuration playbook and review every layer, not only the `tenant_id`
column.

- Choose an explicit pool, bridge, silo, or hybrid model from tenant isolation,
  compliance, noisy-neighbor, scale, latency, recovery, and cost requirements.
  A schema or database per tenant on one shared cluster is not the same resource
  boundary as a dedicated Aurora cluster.
- Maintain a tenant control-plane record with an immutable tenant ID, lifecycle
  state, tier, Region, isolation model, cluster/database/schema route, schema
  version, quotas, data classification, and provisioning status. Resolve the route
  from this catalog on the server; never let request input select an arbitrary
  cluster, database, schema, table, or SQL expression.
- Derive tenant context from verified identity and membership (for example,
  Cognito/AppSync/API-authorizer claims plus a server-side membership lookup).
  Treat tenant IDs in URLs, GraphQL arguments, form bodies, headers, and job input
  as untrusted until checked. Carry the context through queues, events, caches,
  exports, scheduled jobs, and logs.
- For Aurora PostgreSQL pooled tables, use `tenant_id` as a required key, composite
  tenant-scoped uniqueness/foreign keys, indexes whose leading access key is the
  tenant ID, and database-enforced Row-Level Security (RLS). Set the tenant ID
  inside each transaction with `set_config(..., true)`/`SET LOCAL`, use a runtime
  role that is not the table owner and has no `BYPASSRLS`, and default-deny when
  tenant context is absent. Never leak session-scoped tenant state through a pool
  or proxy.
- Aurora MySQL does not provide PostgreSQL-style RLS. Use a stronger isolation
  model, or combine mandatory tenant-scoped repositories with restricted schemas,
  views/procedures, database roles, negative tests, and reviewable query paths. Do
  not present application middleware alone as a complete storage boundary.
- Bound each tenant's reads, writes, page size, statement time, queue work,
  connection share, and API rate. Measure skew and noisy neighbors; route a tier
  or workload to a bridge/silo or separate reader when pooled capacity cannot meet
  its SLO. Keep reader routing consistent with read-after-write semantics.
- Make onboarding idempotent and asynchronous: register the tenant, allocate its
  route, apply the baseline schema/policies, seed only approved synthetic R&D
  fixtures, verify isolation, and mark it ready. Use a canary tenant and bounded,
  resumable fan-out for per-tenant migrations/backfills.
- In R&D, use a separate AWS account when practical, otherwise separate VPC,
  cluster, KMS key, secrets, roles, and parameter groups. Never use production
  credentials or unmasked production rows. Keep engine major version, extensions,
  and security semantics representative of production; a lower R&D ACU or auto-
  pause setting is not production latency evidence.
- Test cross-tenant negative cases through the real API, background workers, direct
  runtime DB role, caches, and exports. Test tenant deletion/export, snapshot/PITR
  restore implications, failover, migration interruption, and promotion from R&D
  to production. Promote IaC, code, and migrations—not R&D tenant data.

## Connections, pooling, and failover

- Count connections across every process, instance, Lambda concurrency, worker,
  migration job, and administrator. A connection consumes database memory/CPU even
  when idle; oversized pools can reduce capacity and increase tail latency.
- Reuse clients/pools outside request handlers where the runtime allows it, but cap
  pool size, idle time, lifetime, queue wait, and connection timeout. Do not create
  one unbounded pool per invocation or per request.
- Use RDS Proxy or an engine-appropriate pooler when connection churn, bursty
  serverless clients, or failover behavior justify it. RDS Proxy is connection
  pooling/multiplexing, not a query cache; session state, transactions, temporary
  tables, prepared statements, and other features can pin connections. Measure
  proxy pinning and borrowed-connection wait before tuning it.
- Treat pool and proxy limits as a single budget. Align application pool lifetime
  and idle timeout with proxy limits, and leave headroom for database automation and
  administrative access.
- Use Aurora-provided writer/read endpoints rather than hard-coded instance IPs.
  Configure bounded connect/login/socket/query timeouts, TCP keepalive where useful,
  and DNS cache behavior appropriate to the client. A retry must distinguish a safe
  idempotent operation from a transaction or mutation with unknown commit state.
- Test failover with representative clients. Verify connections are discarded or
  recycled, the writer is rediscovered, in-flight transactions are classified,
  idempotent work retries, and user-visible errors remain bounded.
- Do not claim RDS Proxy or a reader endpoint makes failover instantaneous. Measure
  detection, DNS/connection recovery, pool recovery, query retry, and application
  recovery separately.

## Security and data protection

- Keep Aurora in private subnets with security groups scoped to the application
  producers/consumers. Avoid public accessibility and broad inbound database ports.
- Require TLS in transit where the application contract permits it and verify the
  client actually validates the certificate. Use encryption at rest with KMS and
  confirm key policy, rotation, cross-Region/replica access, and restore behavior.
- Store credentials in Secrets Manager or an equivalent approved secret store. Do
  not commit passwords or place them in URLs, logs, error messages, snapshots,
  environment dumps, or hook context. Use IAM database authentication only when
  its token lifetime, driver support, pool/proxy behavior, and operational cost fit.
- Grant least privilege to database users and AWS identities. Separate migrations,
  runtime reads/writes, analytics, and administration; do not grant application
  roles superuser or broad schema ownership without evidence.
- Review log exports, slow-query logging, Performance Insights/Database Insights,
  audit extensions, and query text for sensitive data before enabling or centralizing
  them. Redact values at the application and observability boundaries.
- Treat schema/migration input as untrusted. Parameterize values, restrict dynamic
  identifiers, validate tenant scope, and do not allow model/user input to choose an
  arbitrary cluster, schema, table, SQL expression, or migration operation.

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

## Observability and cost

- Monitor database load and waits, CPU, freeable memory, connections, read/write
  I/O, storage growth, replica lag, deadlocks/locks, failover events, errors,
  Serverless capacity/ACU utilization, proxy borrow/pinning, and backup/restore
  health. Use engine-appropriate metrics rather than a single CPU alarm.
- Use Performance Insights or Database Insights to find top SQL and wait events;
  pair it with query plans and application traces. Slow-query logs are evidence,
  not a reason to enable unlimited verbose logging in production.
- Set alarms around user-impacting thresholds and saturation trends, with runbooks
  that identify whether to tune SQL, pool/concurrency, readers, ACUs/instances,
  storage, or an upstream request pattern.
- Model instance/ACU hours, storage, I/O, I/O-Optimized or standard pricing mode,
  readers, Global Database replication/transfer, RDS Proxy, backups/snapshots,
  Performance Insights retention, logs, and cross-Region transfer together. Recheck
  current pricing; never encode a price assumption as a universal best practice.
- Optimize the largest measured contributor first. Adding a reader or increasing
  ACUs does not fix an N+1 query, a connection storm, an unbounded result, or a
  missing index automatically.

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

## Validation gate

Before calling an Aurora change complete, run the checks that fit the repository:

1. Record engine/version, topology, endpoints, connection budget, workload baseline,
   RPO/RTO, and cost dimensions; mark unavailable facts unknown.
2. Run representative query plans and load tests for critical reads/writes,
   pagination, concurrency, locks, pool/proxy behavior, and error/retry handling.
3. Exercise writer failover and reader routing in a safe environment. Verify DNS,
   pool recycling, idempotent retries, transaction error handling, and recovery time.
4. Restore a backup/snapshot into isolation and test application startup, schema,
   extensions, secrets, permissions, data freshness, and service time.
5. Run the repository's IaC lint/plan/synth and migration prechecks. Check for
   replacement, reboot, public exposure, plaintext secrets, unsafe DDL, and pending
   parameter changes.
6. Compare p50/p95/p99 latency, error rate, database load/waits, connections,
   replica lag, capacity, storage/I/O, failover time, and cost against the baseline.

## Review output

Use this compact shape:

```text
Scope / engine / version / topology / preserved behavior:
Evidence and unknowns:
Workload, connection, availability, and recovery baseline:
Findings:
  [severity] evidence → impact → smallest safe improvement → trade-off
Migration or rollout:
Validation / metrics / restore / failover / rollback:
Unchanged by design:
Open questions:
```

Use severity as a decision aid, not as a substitute for evidence:

- **Blocker:** proven cross-tenant data exposure or a runtime path that bypasses the
  tenant boundary, public exposure with an exploitable path, plaintext credentials,
  destructive/replacement change without a recovery path, or a migration/upgrade
  that has not proven compatibility and restore/rollback.
- **High:** unbounded connection/query behavior, untested client failover, missing
  tenant authorization, inadequate reader/capacity headroom, or missing evidence for
  a production RPO/RTO claim.
- **Medium:** measurable latency/cost/maintenance risk with a safe staged fix.
- **Low:** hygiene or observability improvement without demonstrated user/data risk.

Public accessibility, a low Serverless v2 minimum, one reader, `SELECT *`, or offset
pagination are review triggers, not automatic defects. Confirm ingress paths,
latency goals, workload shape, result size, and consistency needs before assigning
severity. Offset pagination can be reasonable for small, stable, shallow result sets;
large or changing datasets usually need bounded keyset/cursor pagination.

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
