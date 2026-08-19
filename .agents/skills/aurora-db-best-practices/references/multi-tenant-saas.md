# Multi-tenant SaaS on Aurora

This playbook applies when one product stores data for multiple customers,
organizations, workspaces, or environments in Aurora. “Tenant isolation” means a
request, job, administrator, cache, export, or recovery operation must not access
another tenant's data unless it follows an explicit, audited cross-tenant path.

## Select the isolation model

Choose the model per workload or service. A SaaS product can use a hybrid model;
the entire database does not need one isolation level.

| Model | Aurora layout | Appropriate when | Main trade-off and control |
| --- | --- | --- | --- |
| Pool | Shared cluster/database/schema; every tenant-owned row has `tenant_id` | Many tenants, common schema, strong cost/operational efficiency | Highest shared-blast and noisy-neighbor risk; enforce RLS or an equivalent database boundary, quotas, and negative tests |
| Bridge | Shared cluster with a database or schema per tenant, or pooled app tier with dedicated database resources for selected tenants | Tenant tiers, migration boundaries, or stronger separation without a full cluster per tenant | A schema/database on a shared cluster still shares CPU, I/O, storage, failover, and maintenance; maintain a route catalog and fan-out migrations |
| Silo | Dedicated Aurora cluster or full tenant stack per tenant/tier | Regulatory, contractual, noisy-neighbor, residency, or extreme SLO requirements | Highest cost and provisioning/operations burden; use a unified control plane so onboarding, upgrades, monitoring, and versioning remain SaaS-like |
| Hybrid | Pool by default; bridge or silo selected tenants/workloads | Tiered SaaS where requirements differ by tenant or service | Routing, migrations, billing, observability, and support become more complex; make placement explicit and auditable |

Do not call a shared cluster “fully isolated” because each tenant has a schema or
database. If a tenant must survive another tenant's workload, failover, restore, or
maintenance independently, a dedicated cluster or stronger boundary is required.

## Tenant control plane

Keep tenant placement and lifecycle separate from tenant business tables. At minimum,
the control plane should be able to answer:

- What is the immutable tenant ID and current lifecycle state (`provisioning`,
  `active`, `suspended`, `deleting`, or `deleted`)?
- Which tier, Region, isolation model, cluster, database, schema, endpoint, and
  KMS/data-classification policy apply?
- Which schema/migration version is installed, and which onboarding operation or
  idempotency key created it?
- Which API, connection, storage, job, row, export, and retention quotas apply?
- Which deployment, restore, migration, support, and cross-tenant-admin actions are
  authorized and audited?

The application should resolve a verified principal to a tenant membership and then
resolve the tenant route from this catalog. Never derive a schema or database name
from a client-provided tenant string. If a dynamic identifier is unavoidable, use a
server-owned allow-list/catalog lookup and engine-safe identifier quoting; values
must still be parameterized.

For Amplify-backed systems, use the verified Cognito/AppSync/API-authorizer identity
as an input to the membership check. A tenant ID in a GraphQL argument, REST path,
header, form body, or generated client request is not an authorization decision.
Cross-tenant support and platform-admin operations should use a separate, explicit,
short-lived and audited path with a deliberately elevated role—not a hidden wildcard
in ordinary tenant code.

## Aurora PostgreSQL pooled configuration

PostgreSQL Row-Level Security is a useful database enforcement layer for the pooled
model. It is defense in depth, not a replacement for identity, membership, least
privilege, or API authorization.

Use a tenant-leading key in every tenant-owned access path. For example, a
PostgreSQL design can use composite keys and relationships like this:

```sql
CREATE TABLE app.orders (
  tenant_id  uuid NOT NULL,
  order_id   uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  status     text NOT NULL,
  PRIMARY KEY (tenant_id, order_id),
  FOREIGN KEY (tenant_id) REFERENCES app.tenants (tenant_id)
);

CREATE INDEX orders_tenant_created_id
  ON app.orders (tenant_id, created_at DESC, order_id DESC);

ALTER TABLE app.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.orders FORCE ROW LEVEL SECURITY;

CREATE POLICY orders_tenant_boundary ON app.orders
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);
```

Apply the same boundary to `SELECT`, `INSERT`, `UPDATE`, and `DELETE` for every
tenant-owned table. Add tenant ID to unique constraints (`UNIQUE (tenant_id,
slug)`), parent/child foreign keys, and indexes. This prevents a globally valid
child ID or uniqueness rule from accidentally joining or colliding across tenants.

At the start of every database transaction, after server-side membership
authorization, set transaction-local context with a bound value:

```sql
BEGIN;
SELECT set_config('app.tenant_id', $1, true);
-- Execute all reads/writes for this tenant in this transaction.
COMMIT;
```

Rules for the runtime role and pool:

- The runtime role must not own the tables, be a superuser, or have `BYPASSRLS`.
  Keep migration/table-owner and administrative roles separate. `FORCE ROW LEVEL
  SECURITY` does not make superusers or `BYPASSRLS` roles safe.
- Prefer transaction-local state (`SET LOCAL` or `set_config(..., true)`) over
  persistent `SET`. Commit or roll back every transaction, and reset/discard any
  connection on error. This prevents a reused pooled or proxied connection from
  retaining a prior tenant context.
- Test the runtime role with no tenant context, a valid tenant, a second tenant,
  direct SQL, joins, inserts, updates, deletes, exports, and background jobs. An
  absent or invalid context should fail closed or return no tenant rows.
- Keep `TRUNCATE`, maintenance, `SECURITY DEFINER`, owner connections, and
  cross-tenant reports on separate, explicitly authorized paths. Do not assume RLS
  covers every administrative operation.

RLS expressions still need good plans. Put `tenant_id` first in composite indexes
for tenant-scoped access patterns, bound result size, use deterministic keyset
pagination for large/changing sets, and verify plans with representative small and
large tenants. A pooled table can be logically isolated while still allowing one
large tenant to consume all CPU, memory, connections, I/O, or vacuum capacity.

## Aurora MySQL and bridge configuration

Aurora MySQL does not have PostgreSQL's RLS policy mechanism. Do not copy the RLS
example or claim that a shared `tenant_id` predicate in application code is a
database-enforced boundary. For Aurora MySQL, choose one of these deliberately:

- move higher-risk tenants/workloads to a bridge or silo layout;
- use per-tenant databases/schemas with server-owned route mappings and least-
  privilege database users where the operational model supports it; or
- if pooling is required, centralize tenant-scoped repository/query construction,
  use composite tenant keys and constrained views/procedures where appropriate,
  add static analysis and integration tests for missing scope, and make the residual
  application-enforcement risk explicit.

Schema/database separation on one cluster does not isolate compute, I/O, storage,
failover, backups, engine maintenance, or cluster-wide capacity. Use a separate
Aurora cluster when those are part of the tenant contract.

## R&D environment configuration

Treat R&D as a non-production tenant laboratory, not as a place to copy production
data or to hide weaker isolation assumptions. The R&D baseline should include:

1. Prefer a separate AWS account. If that is not practical, use a separate VPC,
   Aurora cluster, KMS key, Secrets Manager secrets, IAM roles, security groups,
   parameter groups, and deployment state. Do not allow R&D credentials to reach
   production clusters.
2. Use synthetic or approved masked fixtures. Do not restore a production snapshot
   into R&D unless an approved anonymization process removes secrets and sensitive
   tenant data before developer access. Tag R&D resources and keep a clear data
   classification in the tenant catalog.
3. Keep the production engine major version, extensions, SQL modes, parameter
   semantics, migration tool, and tenant isolation mechanism representative. R&D
   may use smaller instances/ACUs or auto-pause for cost, but measure cold-start,
   resume, cache-warmup, connection, and failover behavior separately from the
   production SLO.
4. Provision an R&D cohort that includes a new tenant, a small tenant, a large/skewed
   tenant, a suspended tenant, a tenant being migrated, and a bridge/silo tenant if
   production will support those placements. Run the same API, worker, export,
   cache, and authorization tests against each.
5. Make onboarding an idempotent asynchronous workflow: create the control-plane
   record, allocate the route, apply the schema/policies, seed fixtures, run
   isolation checks, set quotas, and mark the tenant active. Retry each step safely
   and expose partial/provisioning state instead of blocking a signup request on
   database and infrastructure work.
6. Exercise noisy-neighbor controls: API rate limits, per-tenant concurrency and
   job quotas, bounded statement timeouts, maximum page/row limits, separate queues
   for expensive work, and connection budgets that include Lambda concurrency,
   workers, migrations, admin access, RDS Proxy, and failover headroom.
7. Test schema changes with a canary tenant, expand/contract compatibility, bounded
   resumable backfills, per-tenant migration status, interruption/retry, and a
   production-sized tenant. For bridge layouts, never assume that a migration ran
   everywhere because one schema succeeded.
8. Verify tenant-level export, deletion, suspension, restore expectations, and
   cache/object/event cleanup. Aurora snapshot/PITR is generally cluster-level;
   tenant-granular recovery may require a logical export/import or a silo boundary.

Keep tenant IDs out of high-cardinality metric dimensions unless the monitoring
system and cardinality budget explicitly support it. Use redacted structured logs,
traces, sampled tenant-level diagnostics, aggregate per-tenant usage/showback data,
and alarms for cross-tenant authorization failures, provisioning failures, quota
breaches, query latency, and noisy-neighbor impact.

## Promotion from R&D to production

Promote versioned infrastructure definitions, migrations, tests, dashboards, and
runbooks—not R&D tenant rows or credentials. Before production rollout:

- compare engine major/version, extensions, parameter groups, network paths,
  endpoint/proxy behavior, connection budgets, RLS/role grants, and backup/restore
  settings;
- run cross-tenant negative tests through the production-shaped API and runtime
  database role, including async and admin paths;
- canary one representative tenant or isolated pool/silo, observe database load,
  lock waits, connections, latency tails, errors, lag, and cost, then expand;
- confirm the tenant catalog and route changes are idempotent, audited, reversible,
  and safe during failover; and
- document which R&D-only shortcuts (auto-pause, smaller capacity, synthetic data,
  relaxed deletion policy, test credentials) are not promoted.

## Review prompts

Flag a multi-tenant Aurora design for deeper review when it has:

- tenant IDs accepted from clients without a server-side membership check;
- pooled PostgreSQL tables without RLS, a runtime role with `BYPASSRLS`, or a
  persistent tenant session variable used through a pool/proxy;
- missing tenant-leading indexes, composite tenant relationships, bounded pages, or
  per-tenant quotas;
- per-tenant schema/database names built from untrusted input;
- R&D access to production credentials or unmasked tenant rows;
- tenant onboarding/migrations without idempotency, canaries, fan-out status, or
  interruption recovery; or
- a claim of tenant-level backup/restore based only on an Aurora cluster snapshot.

These are review triggers. Assign severity from exploitability, data exposure,
tenant count/size, compliance contract, measured blast radius, and recovery evidence.
