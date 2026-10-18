<!-- Conditional reference. The current SKILL.md and host policy take precedence. Paths are relative to this skill folder. -->

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
