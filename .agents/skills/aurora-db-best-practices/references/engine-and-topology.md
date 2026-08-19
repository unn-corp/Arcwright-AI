# Aurora engine and topology playbook

## Choose from workload evidence

1. Record Aurora PostgreSQL vs Aurora MySQL, major/minor version, extensions or
   engine features, driver/ORM, SQL compatibility, and migration constraints.
2. Record steady-state and burst workload, working-set size, read/write ratio,
   connection count/churn, latency tail, availability, RPO/RTO, Region, and cost.
3. Compare provisioned instances, Serverless v2, readers, RDS Proxy, and Global
   Database against those constraints. Avoid choosing a feature because its name
   sounds like a performance guarantee.

## Endpoint and reader decisions

- Writer/cluster endpoints follow the current writer; use them for writes and
  operations that require writer semantics.
- Reader endpoints distribute read-only connections among available readers; they
  do not provide read-after-write consistency, per-query load balancing, or a
  transaction boundary across connections.
- Custom endpoints can isolate workloads, but review connection lifetime, reader
  membership, promotion behavior, and failover assumptions.
- Instance endpoints are useful for deliberate diagnostics or topology-specific
  routing, but hard-coded host/IP lists become stale as instances change.

## Serverless v2 prompts

- Choose minimum ACU for working-set memory, baseline latency, connection capacity,
  reader replication work, and failover; choose maximum ACU for burst headroom.
- Inspect `ServerlessDatabaseCapacity`, `ACUUtilization`, CPU, memory, connections,
  and query waits. A low minimum can evict useful cache and make scale-up slower.
- Writers and readers can scale independently depending on promotion tier. A reader
  with insufficient capacity can add query latency or replication lag.
- Verify engine/version/Region support for scaling-to-zero, Data API, Performance
  Insights, Global Database, and any parameter behavior before recommending them.

## Global Database prompts

- Define primary/secondary Regions, asynchronous replication lag, planned vs
  unplanned failover, write traffic redirection, DNS/endpoint changes, data-loss
  tolerance, and conflict/duplicate-write handling.
- Test promotion and application recovery in an isolated or approved environment;
  confirm credentials, secrets, KMS, networking, parameter groups, and reader
  capacity in the secondary.
- Include cross-Region replication, storage, transfer, reader, monitoring, and
  restore costs in the decision.
