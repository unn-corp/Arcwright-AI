<!-- Conditional reference. The current SKILL.md and host policy take precedence. Paths are relative to this skill folder. -->

## Validation gate

Before calling a Cognito change complete, run the checks that fit the repository:

1. Record environment/account/Region, primitive, user/client trust type, flows,
   redirect URLs, token consumers, API authorization, AWS roles, tenant model,
   triggers, data classification, quotas, and preserved behavior.
2. Inspect generated IaC and policies for public client secrets, wildcard redirects,
   implicit flow, broad IAM, unauthenticated access, cross-environment references,
   missing WAF/rate controls, and accidental replacement of a live pool/client.
3. Test positive and negative token fixtures: wrong issuer, pool, Region, audience,
   token use, scope, signature/key, expiry, `nbf`, malformed claims, stale tenant
   membership, and missing authorization. Use real signed test tokens only in a
   controlled environment; never commit them.
4. Exercise sign-up/confirmation, sign-in, MFA/passkeys, federation, callback
   state/nonce/PKCE, refresh concurrency, revoke/global sign-out, recovery, disabled
   users, trigger timeout/failure, and Identity Pool credential scope where used.
5. Exercise tenant A/B cross-read/write attempts, role changes, tenant removal,
   noisy-neighbor limits, R&D/production routing, and data/log redaction.
6. Compare callback-to-render latency, p75 UI Web Vitals, trigger duration/errors,
   token endpoint throttles, 401/403 rates, refresh frequency, WAF/threat outcomes,
   message delivery/cost, and per-tenant resource use against a baseline.
