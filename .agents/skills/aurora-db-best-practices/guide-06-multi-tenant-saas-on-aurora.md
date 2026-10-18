<!-- Conditional reference. The current SKILL.md and host policy take precedence. Paths are relative to this skill folder. -->

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
