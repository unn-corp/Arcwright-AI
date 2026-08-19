# CloudFront security and operations playbook

- Private S3: CloudFront Origin Access Control, a distribution-scoped bucket
  policy, S3 Block Public Access, and a test that direct S3 access is denied.
- Private cached content: signed URLs/cookies, trusted key groups, protected key
  storage, expiry/tampering tests, and behavior ordering that cannot bypass auth.
- Viewer/origin transport: HTTPS, a modern TLS policy, correct aliases/certificate,
  and an explicit exception for any non-TLS custom origin.
- WAF: CloudFront/global scope, managed protections plus targeted rate limits,
  logging, and alarms aligned with the threat model.
- Failover: explicit read methods and status codes; no assumption that writes are
  safe to retry or fail over.
- Rollout: staging distribution or continuous deployment, controlled header/weight
  routing, propagation confirmation, request probes, metrics, and a reversible
  previous policy/distribution configuration.
- Observability: `CacheHitRate`, `OriginLatency`, 4xx/5xx rates, requests, bytes,
  origin load, standard logs, sampled real-time logs, and cost dimensions.
