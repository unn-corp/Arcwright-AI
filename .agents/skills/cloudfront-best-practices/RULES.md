# CloudFront quick rules

- Inspect behavior order, origin, cache policy, origin request policy, TTLs, methods, and viewer protocol before changing anything.
- Keep cache keys minimal. Forward origin-needed values without varying the cache unless they change the response.
- Use long TTLs for hashed immutable assets; keep HTML, APIs, and personalized responses revalidated or uncached.
- Never combine a positive minimum TTL with private/no-store content.
- Require HTTPS; use OAC for private S3 origins, Block Public Access, CloudFront-scope WAF, and ACM in `us-east-1`.
- Prefer versioned names to `/*` invalidations. Treat failover as read-only resiliency: it does not protect writes.
- Measure cache hit rate, origin latency, errors, bytes, origin load, and cost before/after. Review UI LCP/INP/CLS and request waterfalls too.
- Reviews are read-only. Do not mutate distributions, DNS, WAF, keys, or invalidations without explicit authorization.
