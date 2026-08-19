# CloudFront review checklist

## Scope and evidence

- [ ] Distribution, aliases, Regions, origins, behaviors, IaC owner, and preserved user journey are identified.
- [ ] Cache hit rate, origin latency/load, error rates, bytes, invalidations, and relevant cost are recorded or marked unknown.

## Cache and UI

- [ ] Each behavior has a deliberate path/order, cache policy, origin request policy, TTL, method, and compression decision.
- [ ] Cache keys vary only on response-changing values; private/personalized data cannot share an unsafe key.
- [ ] Hashed assets use long-lived caching; HTML/API/personalized responses have explicit freshness semantics.
- [ ] Production UI checks cover LCP/INP/CLS, initial bundle, images/fonts, and request waterfalls.

## Security and resilience

- [ ] Viewer/origin HTTPS, TLS, certificate aliases, WAF scope, and logging are correct.
- [ ] S3 origins use OAC/private access and direct public access is denied.
- [ ] Signed content is tested for expiry/tampering and behavior bypass.
- [ ] Failover is limited to safe read behavior and does not imply write protection.

## Operations and rollout

- [ ] Versioned asset names are preferred; invalidations are narrow and intentional.
- [ ] Origin Shield, edge code, real-time logs, and price class have evidence-based justification.
- [ ] IaC lint/plan, propagation, probes, metrics, staged promotion, and rollback are defined.
