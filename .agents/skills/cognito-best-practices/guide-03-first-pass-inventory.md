<!-- Conditional reference. The current SKILL.md and host policy take precedence. Paths are relative to this skill folder. -->

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
