# Cognito multi-tenant SaaS and R&D isolation

## Tenant model decision

Start with the application authorization model, then decide whether Cognito needs
one shared pool, pools per tenant/tier, or account/Region separation. A shared pool
is often operationally efficient, but it does not provide tenant isolation by itself.
One pool per tenant can support separate IdPs, domains, quotas, residency, and blast
radii, but increases lifecycle, deployment, monitoring, migration, and support work.
Separate accounts/Regions are for real quota, legal, operational, or customer
isolation requirements—not a replacement for checking authorization in code.

## Request path contract

```text
verified JWT -> stable subject -> server-side tenant membership -> action/resource check
                                      |                         |
                                      +-- current status         +-- tenant predicate in every query
```

- Verify issuer/signature/token use/audience/expiry before resolving identity.
- Resolve tenant from a controlled directory, invite, domain mapping, or membership
  record. Never let a browser choose an arbitrary pool, tenant, client, role, bucket
  prefix, database schema, or callback URL.
- Check tenant status, user membership, role, object ownership, and requested action
  on every sensitive API and data operation. Groups and token claims may be useful
  hints or coarse routes, but are stale snapshots and not the only authorization
  boundary.
- On role or membership change, define the exposure window for existing tokens and
  Identity Pool credentials. Use server-side checks for high-value actions and
  revoke/disable/force reauthentication where the risk requires it.

## Quotas and noisy neighbors

Cognito quotas can be shared by pools and tenants in an account/Region. Measure and
bound sign-up, sign-in, refresh, MFA, token endpoint, trigger, and downstream usage
per tenant/tier. A per-tenant app client is not a rate-limit boundary; use an API
gateway/service quota or application control plane. Split accounts/Regions/resources
when quotas, residency, compliance, or blast radius justify the operating cost.

## R&D contract

- Separate account/Region/resources when feasible. At minimum separate user pools,
  identity pools, domains, app clients, IdPs, callback/sign-out URLs, secrets,
  trigger functions, IAM roles, WAF policies, logs, alarms, and data stores.
- Use synthetic users, tenants, and IdPs. Do not copy production passwords, refresh
  tokens, MFA seeds, IdP assertions, client secrets, or unmasked tenant data.
- Disable public sign-up in R&D unless it is the behavior under test. Seed controlled
  fixtures and clean them after tests. Make R&D hostnames and callbacks visually and
  technically distinct from production.
- Test cross-tenant reads/writes, removed membership, stale claims, pool/client
  routing, federation, MFA/recovery, trigger failure, refresh/revocation, and quota
  behavior before promoting code or IaC.
- Promote policies, scopes, schemas, trigger code, fixtures, alarms, and runbooks;
  never promote live identities, tokens, secrets, or production logs/archives.

## Official references

- [Group-based multi-tenancy](https://docs.aws.amazon.com/cognito/latest/developerguide/group-based-multi-tenancy.html)
- [Multi-tenant best practices](https://docs.aws.amazon.com/cognito/latest/developerguide/multi-tenant-application-best-practices.html)
- [Cognito quotas](https://docs.aws.amazon.com/cognito/latest/developerguide/quotas.html)
- [Tagging Cognito resources](https://docs.aws.amazon.com/cognito/latest/developerguide/tagging.html)
