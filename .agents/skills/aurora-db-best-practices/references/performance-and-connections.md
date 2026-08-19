# Aurora performance and connection playbook

## Query path

- Trace UI/API request → repository/ORM → SQL → transaction → response. Record
  query text shape, plan, rows scanned/returned, locks/waits, payload size, and
  p50/p95/p99 latency.
- Prefer bounded, selective queries with explicit columns and stable keyset
  pagination. Treat `SELECT *`, unbounded `LIMIT`/sorts, offset pagination on large
  changing sets, N+1, cross joins, and application-side scans as review triggers.
- Add indexes from measured plans and write/read workload. Check index storage,
  write amplification, vacuum/statistics/maintenance, lock pressure, and migration
  time before applying them.
- Keep transactions short; do not hold a transaction or connection over network
  calls, queues, user input, or long computation. Classify deadlocks, serialization
  failures, timeouts, and ambiguous commits before retrying.

## Connection budget

Build a budget across all clients:

```text
max concurrent app instances × pool max
+ worker/migration/admin connections
+ burst and failover headroom
≤ database/proxy capacity with operational reserve
```

An idle PostgreSQL/MySQL connection still consumes resources. Reuse pools outside
handlers where the runtime permits, cap pool size and queue wait, set idle/lifetime
limits, and do not create a fresh pool per request or Lambda invocation.

## RDS Proxy prompts

- Use Proxy for connection churn/bursty clients only when measurement justifies its
  cost and network path. It pools and multiplexes; it does not cache query results.
- Inspect session pinning from transactions, session variables, temporary tables,
  prepared statements, or engine-specific behavior. Pinned connections reduce
  multiplexing benefits.
- Align client pool lifetime/idle timeout with proxy limits, watch borrow latency,
  database connection utilization, and proxy logs, and test failover through the
  proxy.

## Failover and client behavior

- Use bounded connect/login/socket/query timeouts and TCP keepalive where useful;
  avoid long DNS caching that keeps clients on retired writer/reader addresses.
- On failure, discard/recycle broken connections, rediscover the writer through the
  cluster endpoint, and retry only operations whose commit outcome and idempotency
  are understood. Do not blindly replay a transaction or mutation.
- Measure detection, endpoint/DNS recovery, pool recovery, query retry, and user
  recovery separately. A healthy cluster does not prove a healthy client failover.

## UI/API boundary

Keep database access server-side. Parallelize independent bounded reads, cache only
data whose tenant/freshness contract permits it, and preserve loading/error/empty
states. Review the request waterfall and Web Vitals alongside database metrics.
