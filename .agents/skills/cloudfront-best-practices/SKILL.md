---
name: cloudfront-best-practices
description: Use when planning, implementing, deploying, debugging, or reviewing Amazon CloudFront distributions, cache policies, origin request policies, S3/private origins, signed URLs or cookies, WAF, edge code, invalidations, CDN delivery, or Amplify Hosting delivery performance.
---

# CloudFront best practices

Treat CloudFront as a request-routing and caching contract between viewers, edge
locations, origins, and the application UI. Optimize cache reuse and origin work
without weakening authorization, freshness, or rollback behavior.

## Operating contract

- Establish the distribution topology before recommending a change: aliases and
  certificate, behaviors and their order, origins, origin groups, cache policies,
  origin request policies, response headers policies, WAF, signed-content controls,
  logging, DNS, IaC owner, and the relationship to Amplify Hosting or S3.
- Start from evidence. Use `CacheHitRate`, `OriginLatency`, 4xx/5xx rates, request
  volume, bytes downloaded, invalidation history, origin load, and cost when they
  are available. A high cache hit ratio is not a success if it serves the wrong
  representation or hides stale/private data.
- Keep facts, assumptions, findings, and recommendations separate. CloudFront
  settings propagate asynchronously; do not call an unconfirmed distribution
  update complete merely because an IaC command succeeded.
- Reviews are read-only by default. Do not update a distribution, invalidate paths,
  rotate keys, change DNS, publish edge code, or alter a WAF policy during a review
  unless that exact mutation is authorized.
- Never place private keys, signed URLs, cookies, tokens, raw request payloads, or
  customer data in hook output, logs, build artifacts, or committed configuration.

## Choose the mode

### Planning

Inventory the current delivery contract, identify the user journey and origin
workload, define cache/freshness/security invariants, and propose a staged plan.
Include expected cache-key effects, origin-load effects, propagation time, metrics,
rollback, and invalidation/versioning strategy.

### Implementation

Make the smallest evidence-backed change. Validate behavior ordering, policy IDs,
origin authorization, TLS, WAF scope, certificates, and deploy dependencies before
applying it. Prefer a staging distribution or CloudFront continuous deployment for
risky behavior changes.

### Review

Read [references/review-checklist.md](references/review-checklist.md) and report
severity, evidence, user/performance/security impact, smallest safe improvement,
trade-offs, validation, rollback, unchanged behavior, and unknowns. Do not turn a
finding into an edit without saying so.

## First-pass inventory

Search for and inspect, as applicable:

- distribution definitions and exports in CDK, CloudFormation, Terraform, Pulumi,
  Serverless, Amplify Hosting configuration, or custom deployment scripts;
- aliases, ACM certificate ARN and region, viewer protocol policy, TLS policy,
  supported HTTP versions, IPv6, price class, and default root object;
- every behavior's path pattern, order, origin, allowed/cached methods, cache policy,
  origin request policy, response headers policy, TTLs, compression, redirects,
  signed-content settings, and function/Lambda@Edge associations;
- S3, API Gateway, ALB, custom HTTP, and VPC origins; origin groups, failover
  status codes, Origin Access Control, origin protocol policy, timeouts, keepalive,
  Origin Shield, and origin headers;
- DNS, WAF web ACL, geo restrictions, trusted key groups, public keys, logging,
  CloudWatch alarms, standard/real-time logs, and deployment promotion controls;
- frontend asset naming, cache-control headers, HTML/API/personalized paths,
  image/font loading, bundle output, and request waterfalls; and
- invalidation commands, cache-busting conventions, release rollback, and the
  source of each setting so console drift is visible.

If a deployed fact cannot be inspected, mark it unknown. Do not infer it from an
IaC definition alone.

## Cache-key and request policy rules

The cache policy determines what varies the cache key and the TTL behavior. The
origin request policy forwards additional values to the origin without adding them
to the cache key. Use that separation deliberately:

- Include only headers, cookies, and query strings that change the representation.
  Forwarding every value creates fragmented caches and increases origin requests.
- Do not put authentication, session, personalization, tracking, or irrelevant
  analytics parameters in a shared cache key. Keep authenticated/personalized
  responses uncached or use an explicit, safe variation model.
- If the origin needs a value only for authorization, routing, or observability,
  prefer an origin request policy, but confirm that the response is safe for every
  request that shares the cache key.
- Set minimum, default, and maximum TTLs from content freshness requirements. A
  positive minimum TTL can cache content even when the origin sends `private`,
  `no-store`, or `no-cache`; never use that combination for private data.
- Use long TTLs for content-addressed or otherwise immutable assets. Use explicit
  short TTLs/revalidation or disabled caching for HTML shells, APIs, mutations,
  previews, and user-specific responses.
- Keep behavior path patterns narrow and order them deliberately. A broad behavior
  must not match before a protected, API, or non-cacheable path.
- Enable Brotli/Gzip through the cache policy where supported. Do not independently
  forward `Accept-Encoding` in a way that creates an unnecessary cache dimension.
- Keep query-string normalization and parameter allowlists explicit. Test both
  relevant and irrelevant parameters rather than assuming the origin ignores them.

Do not select a managed policy just because it is convenient. Confirm its cache-key
dimensions, TTLs, compression support, and whether it matches the origin's response
semantics.

## Origin security and content protection

- Require HTTPS from viewers and use a modern TLS policy appropriate for supported
  clients. Require HTTPS to custom origins unless a documented private-network
  exception exists.
- For private S3 origins, prefer Origin Access Control with a bucket policy scoped
  to the distribution. Keep S3 Block Public Access enabled and verify direct S3
  access fails. Do not make an S3 bucket public to make CloudFront work.
- Use signed URLs or signed cookies for private cached content. Prefer trusted key
  groups, keep private signing keys out of the repository, test expiry/tampering,
  and ensure behavior ordering cannot bypass the protected path.
- Associate CloudFront WAF web ACLs with the global CloudFront scope. Choose managed
  protections, targeted rate limits, logging, and alarms from the threat model;
  do not assume a WAF replaces origin authorization.
- Use geo restrictions, custom headers, origin authentication, and private origins
  only when their security semantics are understood and tested. Never treat an
  unverified secret header as the sole protection for a public origin.
- Validate error responses and redirects as carefully as successful responses.
  Avoid caching authorization failures, personalized errors, or origin outage pages
  longer than intended.

## UI and asset-delivery priorities

For an Amplify or frontend codebase, connect CDN settings to the actual critical
journey:

- Keep hashed JS/CSS/image/font assets cacheable for a long time and deploy new
  names. Keep HTML and data responses separately governed so a new UI can discover
  new asset names without a broad purge.
- Inspect the LCP resource, render-blocking CSS/fonts, image dimensions and format,
  initial JavaScript, and request waterfalls. A high CDN hit ratio cannot compensate
  for an oversized entry bundle or a serialized API waterfall.
- Do not cache user-specific, authorization-sensitive, or locale/device-varying
  responses in a shared behavior without an explicit cache-key and privacy design.
- Preserve stable loading, error, empty, and retry states when changing cache or
  origin behavior. Test cold and warm navigations, authenticated and anonymous
  sessions, mobile clients, compressed clients, and a newly deployed release.
- For Amplify Hosting, inspect generated asset/HTML headers and the framework's
  static/SSR/ISR contract before adding custom CloudFront assumptions. Coordinate
  with `amplify-best-practices` for build, backend, and UI changes.

## Origin performance, routing, and edge compute

- Keep origins close to the workload and make origin requests bounded. Use request
  collapsing, keepalive, parallel independent origin work, and response compression
  where measurements show benefit.
- Use Origin Shield only when duplicate origin fetches, multi-CDN traffic, or an
  expensive origin justifies the additional request charge and extra hop. Measure
  before and after; it is not a default for every dynamic request.
- Treat origin failover as read-path resiliency. CloudFront failover applies to
  `GET`, `HEAD`, and `OPTIONS`, not writes; never assume it protects `POST`, `PUT`,
  `PATCH`, or `DELETE`.
- Confirm allowed methods, cached methods, redirects, CORS, and cacheability before
  changing a behavior. Do not cache mutation responses or let retries duplicate a
  non-idempotent operation.
- Use CloudFront Functions or Lambda@Edge only for a measured edge concern such as
  lightweight URL/header normalization, redirects, or access control. Keep code
  small, deterministic, observable, and compatible with its runtime limits; avoid
  moving ordinary application work to the edge without evidence.

## Deployments, invalidations, and IaC

- Prefer versioned asset names and narrow, deliberate HTML/API invalidations over
  invalidating `/*` on every deployment. Broad invalidations add cost, propagation
  work, and can hide an incorrect cache-control contract.
- Keep a rollback path for behavior/policy changes: previous policy IDs, previous
  distribution template, asset manifest, origin configuration, and the release
  header or weight used by staged routing.
- For CloudFront ACM certificates, verify the certificate is in `us-east-1` and
  covers every alias. For WAF, verify the web ACL uses CloudFront's global scope.
- In IaC, review replacement/update behavior, dependency ordering for OAC and S3
  bucket policies, behavior order, managed policy IDs, aliases, logging destinations,
  and drift. Run the repository's linter and `cdk diff`, `terraform plan`, or
  equivalent before deployment.
- Treat distribution propagation as asynchronous. Confirm the distribution is
  deployed, then exercise a request matrix and inspect metrics/logs before promotion.

## Validation gate

Before calling a change complete, run the checks that fit the repository:

1. Inspect every behavior and produce a table of path pattern, order, origin, cache
   key dimensions, origin-forwarded values, TTLs, methods, protocol, and protection.
2. Exercise HTTPS/HTTP, compressed/uncompressed clients, relevant/irrelevant query
   strings, cookies, headers, anonymous/authenticated content, cache hit/miss, 4xx,
   5xx, and a newly released asset.
3. Confirm private S3 access through CloudFront works while direct S3 access fails;
   test signed URL/cookie expiry and tampering when applicable.
4. Test origin failover with safe read methods and configured status codes. Verify
   that writes are not silently retried or routed as if they were reads.
5. Run the IaC linter/plan and check certificate region, WAF scope, OAC/bucket
   policy dependencies, behavior ordering, and logging permissions.
6. Compare warm/cold user journeys, cache hit ratio, origin latency, error rates,
   bytes, origin request volume, and relevant cost. For risky changes, use staged
   routing and a measured promotion/rollback.

## Review output

Use this compact shape:

```text
Scope / distribution / origins / preserved behavior:
Evidence and unknowns:
Cache-key and TTL baseline:
Findings:
  [severity] evidence → impact → smallest safe improvement → trade-off
Plan or rollout:
Validation / metrics / rollback:
Unchanged by design:
Open questions:
```

## References

- [Cache and request policies](references/cache-and-request-policies.md) — read for
  cache-key, TTL, compression, and origin-forwarding decisions.
- [Security and operations](references/security-and-operations.md) — read for OAC,
  signed content, WAF, TLS, logging, failover, and staged rollout.
- [Review checklist](references/review-checklist.md) — read for a codebase or
  distribution audit.
- [Official sources](references/official-sources.md) — use when a current AWS
  behavior, default, limit, or price matters.
