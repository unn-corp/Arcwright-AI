# CloudFront cache and request policy playbook

## Decision sequence

1. Classify the response: immutable public asset, public HTML, public API, private
   content, personalized content, error/redirect, or mutation.
2. State which request dimensions actually change that response: path, query
   parameters, headers, cookies, authorization, language, device, or compression.
3. Put only response-changing dimensions in the cache policy. Put origin-required
   but response-independent values in the origin request policy.
4. Set minimum/default/maximum TTLs from freshness and privacy requirements, then
   verify the origin's `Cache-Control`, `Expires`, and response behavior.
5. Test a request matrix and measure hit ratio, origin requests, latency, and errors.

## Review prompts

- Does a policy include all cookies/query strings/headers when only one or two matter?
- Can a request with a different authorization/session value reuse a cached response?
- Could the minimum TTL override `private`, `no-store`, or `no-cache` semantics?
- Is `Accept-Encoding` handled by compression support rather than an accidental
  extra cache dimension?
- Does the behavior order route protected/API/non-cacheable paths before a broad
  default behavior?
- Does the invalidation policy compensate for missing asset versioning?

## Useful evidence

Capture representative cache keys and response headers for warm and cold requests;
compare the same URL with irrelevant versus relevant query strings, cookies, and
headers. Pair CDN metrics with origin logs so a high hit ratio is not mistaken for
correctness.
