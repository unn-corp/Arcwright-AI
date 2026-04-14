# Python Backend — Quick Rules

> Load full `SKILL.md` when executing this skill as a formal procedure.

## Core Rules
- Use async/await for all I/O operations; never call blocking code (e.g., `time.sleep`) inside an `async def` route — use a sync function or `asyncio.sleep` instead
- Type everything with Pydantic models; validate all input at the boundary using `Field` constraints
- Use FastAPI's `Depends()` for dependency injection — never instantiate services or DB sessions inside route handlers
- Raise `HTTPException` early on invalid state — fail fast, do not pass invalid data deeper into the stack
- Never trust user input; validate and sanitize before any use
- Structure code by domain: `router.py`, `schemas.py`, `models.py`, `service.py`, `dependencies.py` per module
- Use `async_sessionmaker` with `expire_on_commit=False` for SQLAlchemy async sessions; yield sessions via a dependency
- Set `pool_pre_ping=True` on the async engine to handle stale connections
- Use `Redis.from_env()` (Upstash pattern) — never hardcode Redis credentials
- Add TTL to every cached key with `setex`; use sliding window rate limiting on sensitive endpoints
- Always use `SlidingWindow` or `FixedWindow` rate limiting from `upstash_ratelimit`, keyed on `request.client.host`

## Red Flags (stop and apply skill)
- Blocking I/O call inside an `async def` function
- Database session or Redis client created directly inside a route handler
- Missing Pydantic validation on incoming request data
- Hardcoded secrets or connection strings in source code
- Missing TTL on a Redis SET operation
