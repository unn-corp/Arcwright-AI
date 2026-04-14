# Redis Best Practices — Quick Rules

> Load full `SKILL.md` when executing this skill as a formal procedure.

## Core Rules
- Key naming: use colon-separated namespaces (`user:1234:profile`); keep keys short but descriptive and consistent
- Always set a TTL on cache keys — never store cache data without expiration
- Add jitter to TTLs for keys that many clients request simultaneously to prevent thundering herd
- Use `SCAN` instead of `KEYS` in production — `KEYS` blocks the server and is unsafe on large datasets
- Use the right data structure: String for simple values/counters, Hash for objects with multiple fields, List for queues, Set for unique collections, Sorted Set for leaderboards/time-series, Stream for event logs
- For complex atomic operations, use Lua scripts or `MULTI/EXEC` — never rely on application-level "check then set"
- Use `WATCH` + `MULTI/EXEC` for optimistic locking on read-modify-write patterns
- Use connection pooling with appropriate timeouts; handle reconnection gracefully — never create a new client per request
- Pipeline batch operations to reduce round-trips
- Avoid values larger than 100KB; for large JSON, consider RedisJSON
- For horizontal scaling, use hash tags (`{user:1234}`) to co-locate related keys on the same cluster slot
- Deploy at least 3 Sentinel instances for automatic failover
- Require authentication; use TLS; disable dangerous commands (`FLUSHALL`, `KEYS`) in production via `rename-command`
- Use `allkeys-lru` eviction policy for pure caches; configure `maxmemory` explicitly

## Red Flags (stop and apply skill)
- Cache key set without TTL
- `KEYS *` used in application code
- Read-modify-write without `WATCH`/Lua script
- New Redis client created inside a request handler
- No authentication or TLS in a production config
