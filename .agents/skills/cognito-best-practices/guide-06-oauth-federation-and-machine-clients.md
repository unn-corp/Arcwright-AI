<!-- Conditional reference. The current SKILL.md and host policy take precedence. Paths are relative to this skill folder. -->

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
