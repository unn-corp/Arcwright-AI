<!-- Conditional reference. The current SKILL.md and host policy take precedence. Paths are relative to this skill folder. -->

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
