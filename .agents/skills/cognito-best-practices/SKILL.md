---
name: cognito-best-practices
description: Plan, implement, debug, or review Cognito User Pools and Identity Pools, OAuth/JWT flows, tenant authorization, MFA, triggers, and application auth performance.
---

# Cognito

Establish the User Pool versus Identity Pool, account/Region/environment, client
and OAuth flow, issuer/token consumers, IAM roles, tenant model, and evidence of the
problem. User Pools authenticate; Identity Pools issue temporary AWS credentials.
Neither replaces server-side application authorization.

## Apply only the relevant path

- Planning: choose trust boundaries, clients, flows, tenant isolation, recovery,
  session lifetime, rollout, and rollback from the actual requirements.
- Implementation/debugging: inspect the failing sign-in, callback, refresh, API,
  or recovery path; make the smallest supported change and verify that full path.
- Review: use [the review checklist](references/review-checklist.md) and relevant
  topic guides below. Report evidence, impact, fix, validation, rollback, and unknowns.
  A review does not authorize live changes or messages.

Public browser/mobile clients use authorization code with PKCE and no client
secret. Keep exact redirect/sign-out allowlists. Validate JWT signature/JWKS,
issuer, token use, expiry, audience/client, scopes, and server-side tenant/membership
access. Decoding is not verification; an ID token is not an API access token.

Bound refresh/retries and Lambda triggers; keep credentials and raw tokens out of
logs and artifacts. Distinguish UI logout from revocation. Scope Identity Pool roles
narrowly and keep guest access off unless required. Account for MFA, recovery,
throttling, WAF, and stale claims. Separate R&D and production resources and data.
Measure the application's callback-to-render and user-visible loading/error states.

Read only the guides needed for the task. Verify changing AWS feature support,
quotas, defaults, and regional behavior in current primary documentation. No user
creation, MFA messages, pool/client/IdP changes, credentials, IAM, or WAF mutations
are implied by invoking this skill. Preserve existing authorization and report
unverified assumptions. Do not expand a small auth fix into an infrastructure audit.

## Conditional detail

Load only the guide for the current decision, then any specific reference it names.
Do not preload all guides or repeat their examples in the output.

| Topic | Guide |
| --- | --- |
| Amazon Cognito best practices | [guide-00-amazon-cognito-best-practices.md](guide-00-amazon-cognito-best-practices.md) |
| Operating contract | [guide-01-operating-contract.md](guide-01-operating-contract.md) |
| Choose the mode | [guide-02-choose-the-mode.md](guide-02-choose-the-mode.md) |
| First-pass inventory | [guide-03-first-pass-inventory.md](guide-03-first-pass-inventory.md) |
| User Pools: authentication and tokens | [guide-04-user-pools-authentication-and-tokens.md](guide-04-user-pools-authentication-and-tokens.md) |
| Identity Pools and AWS credentials | [guide-05-identity-pools-and-aws-credentials.md](guide-05-identity-pools-and-aws-credentials.md) |
| OAuth, federation, and machine clients | [guide-06-oauth-federation-and-machine-clients.md](guide-06-oauth-federation-and-machine-clients.md) |
| Lambda triggers and auth-path performance | [guide-07-lambda-triggers-and-auth-path-performance.md](guide-07-lambda-triggers-and-auth-path-performance.md) |
| Multi-tenant SaaS | [guide-08-multi-tenant-saas.md](guide-08-multi-tenant-saas.md) |
| UI and runtime performance | [guide-09-ui-and-runtime-performance.md](guide-09-ui-and-runtime-performance.md) |
| Security, operations, and cost | [guide-10-security-operations-and-cost.md](guide-10-security-operations-and-cost.md) |
| Validation gate | [guide-11-validation-gate.md](guide-11-validation-gate.md) |
| Review output | [guide-12-review-output.md](guide-12-review-output.md) |
| Official references | [guide-13-official-references.md](guide-13-official-references.md) |
