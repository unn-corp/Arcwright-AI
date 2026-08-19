# Cognito review checklist

## Scope and trust

- [ ] Account/Organization, Region, environment, pool IDs, client IDs, domain, and preserved behavior are identified.
- [ ] User Pool versus Identity Pool choice matches whether the consumer needs JWT-based application access or temporary AWS credentials.
- [ ] Public/confidential client, human/M2M workload, OAuth grant, scopes, callback/sign-out URLs, and IdP trust are explicit.

## Token and session security

- [ ] APIs verify signature/JWKS, issuer, token use, expiry/not-before, audience/client, scopes, and required claims; decoding alone is not accepted.
- [ ] Public clients use authorization code + PKCE with fresh verifier/state/nonce and no embedded secret.
- [ ] Redirect and sign-out URLs are exact allow-lists; implicit flow and wildcards are absent or explicitly justified.
- [ ] ID/access tokens are used for their correct purposes; passwords, codes, refresh tokens, and bearer tokens are not logged or exposed in unsafe storage.
- [ ] Refresh, retry, expiry, revoke/global sign-out, clock skew, key rotation, and concurrent refresh behavior are tested.

## Authentication and federation

- [ ] MFA/passkeys, recovery, verification, enumeration, SMS risk/cost, and account takeover controls match the threat model.
- [ ] Managed login/custom domain/TLS, social/SAML/OIDC metadata, issuer/audience, attribute mapping, verified email, and account linking are reviewed.
- [ ] Lambda triggers are least-privileged, bounded, idempotent, observable without sensitive data, and resilient to timeout/failure/retry.
- [ ] Pre-token claims/scopes are minimal and not the sole high-value authorization boundary.

## Identity Pool and IAM

- [ ] Unauthenticated identities are disabled unless explicitly required; guest role permissions are minimal and resource-scoped.
- [ ] Authenticated role mappings, provider trust, conditions, session/principal tags, credential duration, and every reachable AWS action/resource are least privilege.
- [ ] The browser is not given AWS permissions when a server-side API is the safer contract.

## Multi-tenancy and R&D

- [ ] Tenant is resolved from verified identity plus server-side membership/entitlement, not client input, a UI route, group filter, or unverified claim.
- [ ] Every API/data read and write checks tenant, user, object ownership, role, and action; stale membership/token behavior is explicit.
- [ ] Shared-pool, groups, pool-per-tenant, account/Region isolation, quota, noisy-neighbor, and operational trade-offs are documented.
- [ ] R&D and production use separate pools/identity pools/domains/clients/IdPs/callbacks/secrets/roles/logs and synthetic or approved masked data.

## UI and operations

- [ ] Amplify config runs once; auth bootstrap/refresh is deduplicated and has intentional loading, error, retry, and recovery states.
- [ ] Callback-to-first-render, JS cost, request waterfall, p75 LCP/INP/CLS, auth latency, trigger latency/errors, 401/403, throttles, and refresh rate are measurable.
- [ ] WAF/threat protection/rate controls, CloudTrail/audit, tagging, alarms, quotas, MAU/message/trigger cost, and incident owners are defined.
- [ ] CDN/API caching cannot cross users or tenants; token-bearing data is not exposed through cache keys or logs.

## Rollout

- [ ] IaC plan/synth catches client/pool replacement, broad IAM, public callbacks, cross-environment references, and secret drift.
- [ ] Synthetic tests cover sign-up, confirmation, sign-in, MFA/passkeys, federation, PKCE/state/nonce, refresh, revoke/global sign-out, recovery, trigger failure, and tenant A/B isolation.
- [ ] Rollback, user migration, token/credential revocation, IdP rollback, quota incident, and R&D cleanup procedures are documented.
