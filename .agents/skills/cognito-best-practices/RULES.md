# Cognito quick rules

- Identify account/Region/environment, User Pool versus Identity Pool, client type, OAuth flow, issuer, token consumers, IAM roles, tenant model, triggers, and R&D boundary first.
- User Pools authenticate users and issue JWTs; Identity Pools exchange trusted identities for temporary AWS credentials. Do not confuse authentication with application authorization.
- Public browser/mobile clients use authorization code + PKCE, never embedded client secrets; use exact redirect/sign-out allow-lists and reject implicit flow unless there is an exceptional documented reason.
- APIs must verify JWT signature/JWKS, issuer, token use, expiry/not-before, audience/client, scopes, and tenant/membership authorization. Decoding is not verification.
- Treat ID tokens as identity/profile assertions and access tokens as API authorization artifacts; never substitute one for the other.
- Protect refresh tokens and sessions, deduplicate refresh, bound retries, and use revoke/global sign-out for high-risk events. UI logout alone is not revocation.
- Prefer MFA/passkeys and phishing-resistant factors for the threat model; treat SMS and recovery as takeover/cost surfaces. Keep WAF/threat protection/rate controls in scope for public auth.
- Identity Pool unauthenticated access is off by default; authenticated/guest IAM roles must be narrow, resource-scoped, and free of admin or wildcard permissions.
- Keep Lambda triggers small, bounded, least-privileged, and idempotent; move slow side effects to durable asynchronous work and do not put fast-changing authorization state in tokens.
- For multi-tenant SaaS, resolve tenant and membership server-side on every sensitive operation. Groups/claims/filters help route but are not authorization boundaries and can be stale.
- Use separate R&D/production accounts or resources, pools, domains, clients, IdPs, callbacks, secrets, roles, logs, and synthetic users. Never copy production passwords, tokens, MFA seeds, or unmasked tenant data.
- Configure Amplify Auth once, deduplicate session bootstrap/refresh, preserve loading/error/recovery states, and measure callback-to-render plus p75 LCP/INP/CLS.
- Reviews are read-only. Never create users, send messages, change pools/clients/IdPs, issue credentials, invoke triggers, or mutate IAM/WAF without explicit authorization.
