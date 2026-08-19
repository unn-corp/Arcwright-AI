---
name: cognito-best-practices
description: Use when planning, implementing, deploying, debugging, or reviewing Amazon Cognito User Pools, Identity Pools, managed login/Hosted UI, OAuth/OIDC, MFA/passkeys, federation, Lambda triggers, token/session handling, Cognito-backed multi-tenant SaaS, or Amplify Auth.
---

# Amazon Cognito best practices

Treat Cognito as an identity boundary, not as the complete authorization model.
First identify which Cognito primitive is in use, who the token or temporary
credential is for, what resource the caller is accessing, and where the server
enforces authorization. Optimize the user experience and auth path, but never
trade away issuer/signature validation, least privilege, tenant isolation, or
safe recovery for a faster-looking flow.

## Operating contract

- Establish account/Organization, Region, environment, user-pool and identity-pool
  IDs, app clients, domains, redirect URIs, IdPs, MFA/passkey posture, token/session
  lifetimes, triggers, APIs, tenant model, data classification, quotas, and R&D
  separation before recommending a change.
- Distinguish the two services explicitly:
  - **User Pool:** user directory, authentication, federation, OAuth/OIDC issuer,
    and JWTs for an application or API.
  - **Identity Pool:** federation of a trusted identity into short-lived AWS
    credentials with an IAM role. It does not replace application authorization.
- Start from evidence: sign-in/refresh latency, callback failures, token endpoint
  errors, trigger duration/error rate, MFA delivery failures, throttles, WAF or
  threat-protection outcomes, API 401/403 rates, credential scope, and user-visible
  loading/error states.
- Keep facts, assumptions, findings, and recommendations separate. Cognito feature
  plans, quotas, supported flows, defaults, pricing, and regional availability are
  time-sensitive; verify the current AWS documentation for the target Region.
- Reviews are read-only by default. Do not create users, send verification or MFA
  messages, change a pool/client/IdP, rotate a secret, issue credentials, invoke a
  trigger, or change IAM/WAF settings without authorization for that exact mutation.
- Never place passwords, refresh tokens, client secrets, private keys, raw JWTs,
  authorization codes, IdP assertions, or customer data in hook output, logs,
  committed fixtures, screenshots, or unreviewed telemetry.

## Choose the mode

### Planning

Define the user population, login methods, trust relationships, client type, OAuth
grant, token consumers, API authorization model, AWS-resource access, recovery/MFA
requirements, tenant boundary, environment/account layout, UI performance budget,
operational limits, and rollout/rollback plan. Choose User Pools, Identity Pools,
another AWS identity service, or a combination from the required trust and
authorization semantics.

### Implementation

Make the smallest evidence-backed change. Keep environments and domains distinct,
configure exact redirect/sign-out URLs, use the narrowest client and IAM permissions,
validate generated IaC, test the complete sign-in/refresh/sign-out/recovery path, and
verify the browser/mobile UI does not add an auth waterfall or expose secrets.

### Review

Read [references/review-checklist.md](references/review-checklist.md) and report
severity, evidence, user/data impact, smallest safe improvement, trade-offs,
validation, rollback, unchanged behavior, and unknowns. A review does not authorize
live Cognito or IAM mutations.

## First-pass inventory

Search for and inspect, as applicable:

- `defineAuth`, Amplify Auth configuration, `aws-amplify`, `@aws-amplify/auth`,
  `amazon-cognito-identity-js`, AWS SDK Cognito clients, user-pool and identity-pool
  CloudFormation/CDK/Terraform resources, and generated outputs;
- user-pool sign-in attributes, password policy, email/phone verification, account
  recovery, MFA, WebAuthn/passkeys, threat protection, WAF, device tracking, advanced
  security, deletion/disable behavior, and feature plan;
- app clients, public versus confidential classification, client-secret handling,
  allowed OAuth flows/scopes, response type, PKCE, redirect/sign-out URLs, domain,
  TLS certificate, managed login/Hosted UI branding, and machine-to-machine clients;
- local users, social/SAML/OIDC providers, provider trust/metadata, attribute and
  group mapping, email verification semantics, linking/merging, and IdP-initiated
  flows;
- JWT acquisition, storage, refresh deduplication, revocation/global sign-out,
  logout callbacks, issuer/JWKS/audience/token-use/scope/expiry validation, API
  middleware, caching, clock skew, and key rotation;
- Identity Pool providers, authenticated/unauthenticated roles, role mappings,
  principal/session tags, `GetCredentialsForIdentity`, credential duration, and
  every resource action reachable by a client credential;
- Lambda triggers: pre-sign-up, custom messages/senders, post-confirmation,
  pre/post-authentication, pre-token generation, custom auth, user migration, and
  external dependencies, timeouts, idempotency, retries, logging, and permissions;
- tenant resolution, membership/role source of truth, group or claim usage, API and
  database checks, token staleness/revocation, noisy-neighbor controls, and whether
  tenant context can be changed by a client;
- R&D versus production accounts, Regions, pools, identity pools, domains, IdPs,
  callbacks, secrets, KMS/WAF/IAM policies, synthetic users, fixtures, and data
  handling; and
- auth UI/bootstrap: one-time configuration, initialization/refresh state machine,
  request waterfalls, bundle cost, responsive loading/error/retry states, redirect
  loops, accessibility, and p75 LCP/INP/CLS where the auth flow affects the app.

If a deployed fact or authorization owner cannot be inspected, mark it unknown. A
decoded JWT, successful login, or working happy path does not prove token validity,
tenant isolation, IAM safety, or reliable recovery.

## User Pools: authentication and tokens

- Model the pool as an OIDC issuer. APIs must validate the JWT signature against the
  pool's JWKS and validate issuer, token type/use, expiry/not-before, audience or
  client ID as appropriate, scopes/groups/claims, and clock skew. Decoding a JWT is
  not verification. Prefer a maintained verifier such as `aws-jwt-verify` on the
  server rather than hand-rolled cryptography.
- Use the authorization-code grant with PKCE for browser, SPA, and mobile public
  clients. Generate a fresh high-entropy verifier/challenge for every authorization
  request, bind the callback to the initiating browser/app state, and use exact
  allow-listed redirect and sign-out URIs. Never ship a client secret in a public
  bundle. Use a secret only for a confidential server-side client and keep it in a
  managed secret store.
- Treat ID tokens as identity/profile assertions for the client and access tokens as
  API authorization artifacts. Do not accept an ID token where an API requires an
  access token, or use a client-controlled profile attribute as permission.
- Keep access-token lifetime short enough for the threat model and preserve a
  deliberate refresh/revocation policy. Refresh tokens are long-lived bearer
  credentials: protect them according to the client architecture, rotate/revoke
  where supported and required, handle one refresh at a time, and clear sessions on
  invalid-refresh responses. Logout at the UI is not automatically revocation;
  use revoke or global sign-out for high-risk events and document propagation/stale
  token behavior.
- Never store passwords or password hashes in browser storage. Avoid persistent
  browser storage for bearer tokens unless the threat model explicitly accepts XSS
  exposure; prefer an architecture using a secure, HTTP-only, SameSite cookie for a
  backend session, or the safest platform storage available for a native client.
  Use CSRF protection when cookies authenticate requests.
- Keep user attributes minimal. Separate mutable profile data, verified contact
  state, and authorization data. Custom attributes are not an authorization system;
  changes can be stale in existing tokens and should be checked against a server-side
  source of truth for sensitive operations.
- Enable MFA or phishing-resistant passkeys/WebAuthn when the risk model requires
  it. Prefer TOTP/passkeys over SMS where possible; account for SMS delivery cost,
  phone takeover, recovery, factor replacement, and accessibility. Make the choice
  of required/optional MFA explicit per environment and user population.
- Use managed login/Hosted UI or a well-tested OIDC library for browser redirects.
  A custom domain, TLS certificate, branding, and provider configuration are part
  of the production trust surface. Do not scrape or automate the interactive login
  pages.
- Federate only approved SAML/OIDC/social IdPs. Validate issuer, audience, signing
  keys, metadata/redirects, attribute mapping, email verification semantics, and
  account-linking rules. Do not silently map an unverified email or external group
  to a privileged local account.

## Identity Pools and AWS credentials

- Use an Identity Pool only when the client genuinely needs temporary AWS API
  credentials. For a normal application API, prefer a backend that validates User
  Pool tokens and performs authorization without exposing AWS service permissions to
  the browser.
- Disable unauthenticated identities unless the public/guest use case is explicit.
  If enabled, the unauthenticated role must be narrowly scoped to the minimum public
  actions and resources; it must not read tenant data, write arbitrary objects,
  invoke admin APIs, or reach control-plane operations.
- Give authenticated identities a role with least privilege and bounded resources.
  Review every action, resource ARN, condition, external ID, session duration, and
  provider trust policy. Never use `*` resources or broad administrative permissions
  as a shortcut for a client role.
- Use role mappings or session/principal tags only when the claims are verified,
  mapping rules are explicit, and the resulting IAM policy is least privilege.
  ABAC reduces policy duplication but does not remove the need to validate tenant,
  user status, object ownership, and resource naming.
- Treat temporary credentials as bearer credentials. Use short lifetimes appropriate
  to the app, refresh safely, do not log them, and do not assume removing a User Pool
  session immediately invalidates already-issued Identity Pool credentials.

## OAuth, federation, and machine clients

- Keep separate app clients for materially different trust boundaries, environments,
  or redirect surfaces. Do not create one client per user or use a production client
  in R&D. App clients are configuration/security boundaries, not tenant membership.
- Request the smallest scopes. Define resource-server scopes for APIs and enforce
  them server-side. Client-credentials/M2M tokens represent an application, not a
  human user; use a confidential client, protect its secret, and authorize the
  workload explicitly.
- Allow only the grant/response types required by the client. Treat implicit flow,
  wildcard callbacks, unbounded logout URLs, and unreviewed custom scopes as review
  findings. Keep state/nonce/PKCE validation in the OIDC client and preserve the
  callback context without putting secrets in URLs.
- Use discovery metadata and cache JWKS with a bounded refresh strategy that handles
  key rotation. Never pin a single signing key forever or accept tokens from a
  similarly named pool, Region, or environment.

## Lambda triggers and auth-path performance

- A trigger can be synchronous and can delay or fail an authentication operation.
  Keep pre-sign-up, pre-auth, custom auth, and pre-token generation handlers small,
  deterministic, idempotent, and bounded. Avoid network calls in the critical path;
  when unavoidable, set timeouts, retries, circuit behavior, and a safe failure
  policy. Never make a remote entitlement service the only path to basic sign-in
  without an availability plan.
- Give each trigger its own least-privilege role and function configuration. Do not
  put admin credentials or broad AWS permissions in a trigger just because it runs
  inside an auth flow. Keep secrets in Secrets Manager/Parameter Store and rotate
  them.
- Post-confirmation and post-authentication side effects must be idempotent and
  recoverable. Prefer emitting a durable event or enqueueing work over doing slow
  email, billing, analytics, or provisioning inline. Do not assume Cognito retries
  make external side effects exactly once.
- Use pre-token generation to add only claims/scopes the downstream authorization
  contract needs. Claims are snapshots: membership/role changes may not appear until
  a new token is issued. Do not put large, sensitive, or fast-changing authorization
  state in tokens, and never make a claim alone the only defense for a high-value
  tenant operation.
- Version trigger contracts and test cold starts, dependency size, timeout/error
  paths, malformed attributes, federated users, retries, and concurrent sign-ins.
  Keep logs free of tokens and personal data while retaining correlation IDs and
  useful failure categories.

## Multi-tenant SaaS

### Choose the isolation model deliberately

Document the expected tenant count, user count, compliance/residency, noisy-neighbor
risk, custom-domain/IdP needs, operational budget, and blast radius before choosing:

- **Shared pool, application-enforced tenancy:** efficient for many tenants. Keep a
  single pool/client per environment or trust boundary where practical, resolve the
  tenant server-side, and enforce membership on every API/data operation.
- **Shared pool with groups/claims:** useful for coarse role or AWS-credential role
  mapping. A `cognito:groups` value can help route a request, but group membership is
  not a complete authorization boundary: claims are stale until token refresh,
  groups have operational limits, and application data access still needs a server
  check.
- **Pool per tenant or tenant tiers:** use for strong identity/configuration/quotas,
  dedicated IdPs/domains, residency, or blast-radius requirements. Price the
  lifecycle, deployment, monitoring, quota, migration, and support burden; do not
  use it merely to avoid designing authorization.
- **Account/Region/resource separation:** use when account quotas, legal residency,
  incident blast radius, or customer isolation require it. Separate pools alone do
  not separate APIs, databases, IAM, or operational access.

### Enforce tenant boundaries

- Resolve the tenant from a verified identity and a server-side membership/entitlement
  record. Never accept a tenant ID, group, role, or resource ARN from an untrusted
  client as the authorization decision.
- Check tenant status, user membership, role, object ownership, and requested action
  on the server. Apply the tenant predicate in every data query and mutation, not
  only in a UI route, API gateway authorizer, Cognito group filter, or S3 key prefix.
- Keep a stable internal subject (`sub`) and tenant membership model. Avoid using
  email as a durable identity key. Record authorization decisions/correlation IDs
  without logging raw tokens or sensitive tenant data.
- Design for token staleness. On membership removal, disable/revoke as appropriate,
  shorten the exposure window, and require a fresh server-side membership check for
  sensitive actions. Do not promise instant isolation from group/claim changes
  without testing the actual token/credential lifecycle.
- Bound tenant-specific sign-up, sign-in, refresh, MFA, API, trigger, storage, and
  downstream usage. Cognito quotas can be shared across pools and tenants in an
  account/Region; a single tenant must not exhaust the shared budget.
- Keep tenant routing separate from authentication when possible. A tenant
  directory/control-plane service should map a verified domain or invite to an
  allowed pool/client/IdP and return only an approved route; it must not allow the
  browser to choose an arbitrary pool or callback.

### R&D and production

- Use separate AWS accounts when feasible; at minimum use separate Regions/resources,
  user pools, identity pools, domains, app clients, IdPs, callback URLs, secrets,
  IAM roles, WAF policies, logs, alarms, and data stores. An environment variable
  named `ENV=dev` is not an isolation boundary.
- Use synthetic users, synthetic tenants, and test IdPs in R&D. Never copy production
  passwords, refresh tokens, MFA seeds, IdP assertions, or unmasked tenant data.
  If production-derived data is essential, use an approved minimization/masking
  process and document retention/deletion.
- Disable public sign-up in R&D unless it is the behavior under test; seed users via
  controlled fixtures and remove them after tests. Keep R&D redirect URLs and custom
  domains impossible to confuse with production.
- Exercise sign-up, confirmation, recovery, MFA/passkeys, federation, token refresh,
  global sign-out/revocation, trigger failure, tenant removal, and quota/rate-limit
  behavior with synthetic identities before production rollout.
- Promote IaC, schemas, trigger code, test fixtures, scopes, policies, and runbooks—
  never live users, secrets, archives, tokens, or production identity data.

## UI and runtime performance

- Configure Amplify exactly once at the application entrypoint and keep auth state in
  one source of truth. Do not call `configure` or start competing refresh/listener
  loops from every component.
- Make the auth bootstrap a small state machine (`loading`, `authenticated`,
  `unauthenticated`, `error`) and render an intentional shell/skeleton. Avoid a
  blank screen, redirect loop, duplicate API call, or layout shift while the session
  is being resolved.
- Deduplicate concurrent `fetchAuthSession`/refresh operations. Cache only what is
  safe, bound retries, and distinguish expired-session recovery from a real 403 or
  network outage. Do not block public UI on an unnecessary profile/tenant waterfall;
  load non-critical data after the first usable render.
- Keep auth UI accessible and responsive: preserve focus through MFA/errors,
  announce validation, support keyboard/mobile flows, show progress and recovery,
  and avoid making a CAPTCHA, social-provider script, or large auth bundle block the
  whole application shell.
- Measure the production path: callback-to-first-render, p75 LCP/INP/CLS, JS
  transferred/parsed, auth API latency, trigger duration, refresh frequency, and
  error/retry rates. Optimize verified bottlenecks, not token lifetime or security
  controls by guesswork.
- Ensure public caching never serves authenticated or tenant-specific HTML/API
  responses to another user. Keep token-bearing requests out of cache keys/logs and
  coordinate cookie, CDN, API, and origin authorization semantics with the
  CloudFront/Amplify skills.

## Security, operations, and cost

- Use least-privilege administrative IAM; separate operators who manage pools,
  clients, IdPs, triggers, and IAM roles from application runtime roles. Protect
  client secrets and signing/IdP material in managed secret stores.
- Put WAF and rate controls in front of public authentication surfaces where the
  threat model warrants it. Monitor credential stuffing, sign-up abuse, enumeration,
  MFA/SMS spend, token endpoint throttles, trigger failures, refresh anomalies, and
  unusual tenant concentration.
- Configure verification/recovery messages with a verified sender/domain, safe
  templates, anti-enumeration behavior, bounce/complaint handling, and links that
  cannot be redirected to an untrusted host. Coordinate delivery with SES/SNS/SMTP
  best practices.
- Tag pools, clients, identity pools, domains, triggers, and supporting resources
  with environment/owner/data-classification/cost-center metadata. Keep audit logs
  and CloudTrail retention aligned with incident and compliance needs.
- Treat quotas and billing as design inputs. Record per-account/Region quotas,
  token endpoint rates, user/tenant growth, MAU/trigger/message costs, and expected
  peaks. Request quota increases or shard by account/Region only after documenting
  why the isolation and operating model justify it.

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

## Review output

Use this compact shape:

```text
Scope / account / Region / environment / primitive / client type / preserved behavior:
Auth flow / token issuer-consumers / storage-refresh / MFA-federation baseline:
API authorization / Identity Pool IAM / tenant / R&D isolation baseline:
UI bootstrap / p75 Web Vitals / auth latency / trigger baseline:
Findings:
  [severity] evidence → impact → smallest safe improvement → trade-off
Rollout / rollback / user migration / revocation plan:
Validation / synthetic test and metric evidence:
Unchanged by design:
Open questions / unknowns:
```

Severity is evidence-based:

- **Blocker:** exposed client/admin secret, unverified JWT accepted, arbitrary
  cross-tenant access, unauthenticated broad AWS role, production/R&D identity mix,
  or public callback/IdP trust that enables account takeover.
- **High:** missing issuer/signature/token-use validation, public implicit flow/no
  PKCE, wildcard redirect, over-privileged Identity Pool role, tenant authorization
  only in the client/claim/filter, non-idempotent critical trigger, or recovery path
  that exposes accounts or sensitive data.
- **Medium:** measurable auth/UI latency, refresh storm, trigger availability,
  quota/noisy-neighbor, stale-claim, observability, cost, or environment drift risk
  with a safe staged fix.
- **Low:** hygiene, documentation, tagging, test coverage, or accessibility
  improvement without demonstrated security, data, or user impact.

## Official references

Use AWS and Amplify documentation as the authority for current behavior, quotas,
feature plans, supported flows, and pricing. Recheck time-sensitive links before a
deployment decision.

- [User pool security best practices](https://docs.aws.amazon.com/cognito/latest/developerguide/user-pool-security-best-practices.html)
- [User pool authentication](https://docs.aws.amazon.com/cognito/latest/developerguide/authentication.html)
- [App client settings and PKCE](https://docs.aws.amazon.com/cognito/latest/developerguide/user-pool-settings-client-apps.html)
- [Managed login](https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-pools-managed-login.html)
- [Identity provider and OIDC endpoints](https://docs.aws.amazon.com/cognito/latest/developerguide/federation-endpoints.html)
- [Token verification](https://docs.aws.amazon.com/cognito/latest/developerguide/amazon-cognito-user-pools-using-tokens-verifying-a-jwt.html)
- [Token caching and expiration](https://docs.aws.amazon.com/cognito/latest/developerguide/amazon-cognito-user-pools-using-tokens-caching-tokens.html)
- [User pool security features](https://docs.aws.amazon.com/cognito/latest/developerguide/managing-security.html)
- [Authentication flows, MFA, and passkeys](https://docs.aws.amazon.com/cognito/latest/developerguide/amazon-cognito-user-pools-authentication-flow-methods.html)
- [Identity Pools and IAM](https://docs.aws.amazon.com/cognito/latest/developerguide/security_iam_service-with-iam.html)
- [Group-based multi-tenancy](https://docs.aws.amazon.com/cognito/latest/developerguide/group-based-multi-tenancy.html)
- [Multi-tenant application best practices](https://docs.aws.amazon.com/cognito/latest/developerguide/multi-tenant-application-best-practices.html)
- [Cognito quotas](https://docs.aws.amazon.com/cognito/latest/developerguide/quotas.html)
- [Lambda triggers](https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-pools-working-with-lambda-triggers.html)
- [Pre-token generation](https://docs.aws.amazon.com/cognito/latest/developerguide/user-pool-lambda-pre-token-generation.html)
- [Amplify Auth setup](https://docs.amplify.aws/react/build-a-backend/auth/set-up-auth/)
- [Amplify Auth concepts](https://docs.amplify.aws/react/build-a-backend/auth/concepts/)
