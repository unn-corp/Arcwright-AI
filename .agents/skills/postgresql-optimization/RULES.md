# PostgreSQL Optimization — Quick Rules

> Load full `SKILL.md` when executing this skill as a formal procedure.

## Core Rules
- Run `EXPLAIN (ANALYZE, BUFFERS)` on any query suspected of being slow before suggesting fixes
- Use cursor-based pagination (`WHERE id > $last_id`) — never `OFFSET` on large tables
- Use parameterized queries exclusively — string interpolation into SQL is never acceptable
- Add GIN indexes on JSONB columns queried with `@>`, `?`, or `#>>` operators
- Add GIN indexes on `tsvector` columns for full-text search
- Use partial indexes (`WHERE status = 'active'`) for filtered queries that always include that predicate
- Use covering indexes (`INCLUDE (col1, col2)`) to avoid table lookups on high-frequency queries
- Use composite indexes in left-prefix order matching the most selective column first
- Use `pg_stat_statements` to identify slow queries by `total_time` — don't guess at bottlenecks
- Query `pg_stat_user_indexes WHERE idx_scan = 0` to find unused indexes before adding more
- Use `EXCLUDE USING gist` for overlap constraints on range types instead of application-level checks
- Use recursive CTEs for hierarchical/tree data; avoid repeated self-joins
- Use `domains` for data validation constraints shared across multiple tables
- Run regular `VACUUM ANALYZE`; use pgbouncer for connection pooling under high concurrency
- Use `TIMESTAMPTZ` (not `TIMESTAMP`) for all time columns to avoid timezone bugs

## Red Flags (stop and apply skill)
- `OFFSET` pagination on a table expected to have more than a few thousand rows
- Query on a JSONB column without a GIN index
- String interpolation in a SQL query
- Sequential scan flagged in `EXPLAIN` on a large table with no index
- New index added without first checking `pg_stat_user_indexes` for existing coverage
