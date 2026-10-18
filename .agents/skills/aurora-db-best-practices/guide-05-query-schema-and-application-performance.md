<!-- Conditional reference. The current SKILL.md and host policy take precedence. Paths are relative to this skill folder. -->

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
