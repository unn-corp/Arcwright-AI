# Aurora database review checklist

## Scope and evidence

- [ ] Engine/version, provisioned/Serverless v2 mode, Regions, topology, endpoints, deployment owner, and preserved behavior are identified.
- [ ] Query plans, DB load/waits, latency/error tails, connections, CPU/memory/I/O, replica lag, failover, restore, and cost evidence are recorded or marked unknown.

## Workload and performance

- [ ] Critical UI/API paths are traced to bounded SQL, transactions, result shaping, and downstream calls.
- [ ] N+1, unbounded scans/sorts/results, unsafe offset pagination, lock/transaction issues, and missing/overloaded indexes are checked.
- [ ] Offset pagination is judged against result size/stability; large or changing datasets have bounded deterministic keyset/cursor alternatives.
- [ ] Connection budget covers services, Lambda concurrency, workers, migrations, admins, proxy, and failover headroom.
- [ ] Pool/proxy pinning, borrow wait, idle/lifetime limits, timeouts, DNS behavior, and retry/idempotency are tested.

## Topology and availability

- [ ] Writer/reader/custom/proxy endpoints match consistency and routing needs; no stale instance IP assumptions.
- [ ] Reader sizing/promotion tiers, Serverless v2 min/max ACUs, Global Database lag/failover, and regional recovery are explicit.
- [ ] Reader AZ placement/promotion capacity, reserved Lambda concurrency, and RDS Proxy pinning/borrow/target-health metrics are explicit where applicable.
- [ ] Failover is tested through the actual client/pool path, including transaction outcome and user recovery.

## Security and recovery

- [ ] Private networking, narrow security groups, TLS, KMS, Secrets Manager, IAM/database roles, and sensitive logging are reviewed.
- [ ] Tenant model (pool/bridge/silo/hybrid), control-plane route, membership authorization, tenant-leading keys, and cross-tenant negative tests are explicit.
- [ ] Aurora PostgreSQL RLS is enabled and fail-closed where pooled; runtime roles do not own tables or bypass RLS. Aurora MySQL uses an explicitly reviewed alternative boundary.
- [ ] R&D has separate credentials/resources and synthetic or masked data; production data and access are not copied into the R&D tenant lab.
- [ ] Tenant onboarding, migration fan-out, quotas/noisy-neighbor controls, export/delete, and tenant-granular recovery limitations are tested and observable.
- [ ] Automated backups/PITR, snapshots/copies, deletion protection, retention, RPO/RTO, isolated restore, and restore evidence are present.
- [ ] Engine upgrades, parameter reboots, DDL, migrations, and IaC replacement risk have prechecks and rollback.
- [ ] A snapshot/PITR restore drill is complete before approving destructive or major-version changes; engine, parameters, schema, and app rollout are staged unless coupling is justified.

## Operations and cost

- [ ] Metrics/alarms cover DB load/waits, connections, memory, I/O, lag, errors, capacity, proxy, backups, and failover.
- [ ] Instance/ACU, storage/I/O, readers, Global Database, proxy, backup, logs, monitoring, and transfer costs are modeled.
- [ ] IaC plan/synth cannot unexpectedly expose, replace, delete, reboot, or strand the cluster/secret.
- [ ] Severity is evidence-based: blocker/high findings include a stop/go condition and recovery path, not only a generic recommendation.
