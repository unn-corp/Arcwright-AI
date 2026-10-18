---
name: aurora-db-best-practices
description: Plan, implement, debug, or review Aurora PostgreSQL/MySQL queries, connections, Serverless v2, readers, tenant isolation, migrations, failover, and recovery.
---

# Aurora

Identify engine/version, Region, topology, provisioned versus Serverless v2,
writer/readers/proxy endpoints, network boundary, tenant model, and recovery goals.
Start from query plans, waits/load, p95/p99 latency, connections, I/O, replica lag,
failover/restore evidence, and cost. Distinguish facts from assumptions.

## Focused workflow

1. Select planning, implementation/debugging, or review from the request. Read only
   the matching topic guides below. For reviews use
   [the checklist](references/review-checklist.md), citing impact and actual evidence.
2. Trace the affected query and request path. Bound result size, transactions,
   pools, retries, and serverless connection bursts. Prevent N+1 work and avoid
   using more capacity as a substitute for a query or application fix.
3. Keep writer routing for writes; route reads according to their consistency needs.
   RDS Proxy is pooling/multiplexing, not a query cache. Account for combined app,
   proxy, and database connection budgets, pinning, and failover/DNS recovery.
4. Preserve private access, TLS, role separation, credential handling, and tenant
   membership enforcement. Test cross-tenant denial and pooled-connection state.
   Keep R&D data and credentials separate from production.
5. For a schema, parameter, topology, engine, or IaC change, establish compatibility,
   rollout, rollback, and recovery evidence first. Define RPO/RTO and prove an
   isolated restore; backup creation alone does not prove recovery.
6. Verify the changed workload and user-visible recovery/performance. Report the
   smallest evidence-backed change, trade-offs, checks, and remaining uncertainty.

Reviews are read-only. Do not perform production DDL, failover, restore-overwrite,
backfill, deletion, or credential rotation without authorization for that operation.
Verify time-sensitive engine features, quotas, regional support, and pricing from
current primary sources. Do not load the entire AWS/database library for a local SQL fix.

## Conditional detail

Load only the guide for the current decision, then any specific reference it names.
Do not preload all guides or repeat their examples in the output.

| Topic | Guide |
| --- | --- |
| Aurora database best practices | [guide-00-aurora-database-best-practices.md](guide-00-aurora-database-best-practices.md) |
| Operating contract | [guide-01-operating-contract.md](guide-01-operating-contract.md) |
| Choose the mode | [guide-02-choose-the-mode.md](guide-02-choose-the-mode.md) |
| First-pass inventory | [guide-03-first-pass-inventory.md](guide-03-first-pass-inventory.md) |
| Engine and topology decisions | [guide-04-engine-and-topology-decisions.md](guide-04-engine-and-topology-decisions.md) |
| Query, schema, and application performance | [guide-05-query-schema-and-application-performance.md](guide-05-query-schema-and-application-performance.md) |
| Multi-tenant SaaS on Aurora | [guide-06-multi-tenant-saas-on-aurora.md](guide-06-multi-tenant-saas-on-aurora.md) |
| Connections, pooling, and failover | [guide-07-connections-pooling-and-failover.md](guide-07-connections-pooling-and-failover.md) |
| Security and data protection | [guide-08-security-and-data-protection.md](guide-08-security-and-data-protection.md) |
| Availability, backups, and recovery | [guide-09-availability-backups-and-recovery.md](guide-09-availability-backups-and-recovery.md) |
| Observability and cost | [guide-10-observability-and-cost.md](guide-10-observability-and-cost.md) |
| IaC and deployment safety | [guide-11-iac-and-deployment-safety.md](guide-11-iac-and-deployment-safety.md) |
| Validation gate | [guide-12-validation-gate.md](guide-12-validation-gate.md) |
| Review output | [guide-13-review-output.md](guide-13-review-output.md) |
| References | [guide-14-references.md](guide-14-references.md) |
