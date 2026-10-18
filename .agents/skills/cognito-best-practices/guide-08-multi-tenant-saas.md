<!-- Conditional reference. The current SKILL.md and host policy take precedence. Paths are relative to this skill folder. -->

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
