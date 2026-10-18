<!-- Conditional reference. The current SKILL.md and host policy take precedence. Paths are relative to this skill folder. -->

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
