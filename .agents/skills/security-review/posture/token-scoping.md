# 14. API Token & Credential Scoping (Least Privilege)
**Maps to:** `references/authentication.md`, `references/authorization.md`, `references/data-protection.md`

**Principle:** every token, key, and credential should grant **only the access it needs** —
nothing broader. A leaked token's blast radius equals its scope, so over-scoped credentials
turn a minor leak into a full compromise. This applies in two directions:

- **Outbound** — third-party tokens the app *holds* to call other services (Stripe, GitHub,
  AWS, the database, cloud storage). These should be restricted/read-only/resource-scoped.
- **Inbound** — tokens the app *issues* to its own clients, partners, and integrations.
  These should carry minimal scopes, be per-integration, expire, and be revocable.

This complements (does not duplicate): topic 5 (is the JWT *valid*?), topic 7 (is the secret
*stored* safely?), topic 13 IAM (are *AWS roles* least-privilege?). Topic 14 asks: **is the
token's authority no larger than its job?**

**Detect:**
```bash
# Filenames only: token/config lines can include credentials
rg -l -i 'stripe|sk_live|sk_test|rk_live|github|ghp_|gho_|github_pat_|personal.?access.?token|api[_-]?key|service.?account|oauth|scope' --glob '*.{js,ts,py,go,java,env,yaml,yml,json}' .
rg -l -i 'DATABASE_URL|postgres://|mysql://|mongodb(\+srv)?://|GRANT |createUser|db.?user|role.*superuser' --glob '*.{js,ts,py,go,sql,env,yaml,yml}' .
rg -l -i 'scope[s]?\s*[:=]|requested_scopes|access_type|permissions\s*[:=]|aud\b|\.read|\.write|readonly|read_only|full.?access' --glob '*.{js,ts,py,go}' .
```

## Outbound — tokens the app holds

**What good looks like:**
- **Stripe:** use **restricted keys** (`rk_…`) scoped to the resources actually used, not the
  full secret key (`sk_…`), for anything beyond core server charges. Publishable key
  (`pk_…`) only on the client.
- **GitHub:** **fine-grained PATs** or GitHub App installation tokens scoped to specific
  repos + minimal permissions — not classic PATs with `repo`+`admin`+`workflow`.
- **Database:** the app connects as a user **granted only the tables/operations it uses**
  (e.g. `SELECT`/`INSERT`/`UPDATE` on its schema), never as `postgres`/`root`/superuser.
  Read-only replicas/queries use a read-only role.
- **Cloud (AWS/GCP/Azure):** scoped IAM roles (see topic 13), GCP service accounts with
  minimal roles, Azure SAS tokens limited to a container + permission + short expiry — not
  account-level keys.
- **Generic third-party APIs:** request the **narrowest OAuth scopes** that work; pick
  read-only credentials for read-only integrations; separate keys per environment.
- One credential per purpose so a single leak doesn't expose everything ("no god-token").

**Red flags:**
| Pattern | Severity |
|---------|----------|
| Full Stripe `sk_live_…` used where a restricted key would do (esp. if reachable client-side or in a widely-shared service) | **High** |
| Classic GitHub PAT with `repo`+`admin:org`/`workflow` for a job needing one repo's contents | **High** |
| App connects to DB as superuser/`root`/`postgres` | **High** |
| Account-level cloud key (full access) where a scoped role/SAS would suffice | **High** |
| OAuth integration requesting `*`/`full_access`/all scopes for a narrow feature | **Medium/High** |
| One shared "god" API key reused across all integrations and environments | **Medium** |

## Inbound — tokens the app issues

**What good looks like:**
- API keys / PATs the app mints support **per-token scopes** (read vs write, per-resource),
  not all-or-nothing "valid key = full access".
- **Scopes are enforced server-side on every call** — the handler checks the token actually
  carries the scope for *this* operation, not merely that the token is authentic (a present-
  but-unchecked `scope` claim is no protection). Ties back to topic 1 authorization.
- Tokens are **per-integration / per-client** (distinct credential per consumer) so one can
  be revoked without breaking others, and are **scoped to a single tenant/account**.
- Tokens **expire** and are **revocable**; scope is shown to the user at issuance; default
  is least scope, broaden only on explicit request.
- Machine/service tokens are scoped to the specific service-to-service call, not human-user
  scopes reused for automation.

**Red flags:**
| Pattern | Severity |
|---------|----------|
| Any authenticated token grants full account access (no scope concept) | **High** |
| `scope`/`permissions` claim present in the token but **never checked** on the route | **High** |
| One token works across all tenants/accounts (no tenant binding) | **Critical/High** |
| Issued tokens never expire and cannot be revoked individually | **Medium** |
| Admin-scoped token handed to a client that only needs read | **High** |

**Tools (hybrid):**
Reuse [topic 7's safe secret scan](posture-scan.md#7-environment-variable--secret-management).
Review credential class and effective provider/IAM configuration without printing key
values; the key prefix alone does not establish its permissions.

```bash
# DB grant review (if SQL migrations define roles)
grep -rniE "GRANT (ALL|SUPERUSER)|ALTER ROLE.*SUPERUSER|WITH GRANT OPTION|GRANT rds_superuser" --include=*.sql .
# Stripe key candidates: filenames only
rg -l 'sk_live_|sk_test_|rk_live_|rk_test_' --glob '*.{js,ts,py,go,env}' .
```

**Verdict guidance:**
- ✅ **Pass** — held credentials are restricted/read-only/resource-scoped to their use; issued
  tokens carry enforced, per-integration scopes that expire and revoke.
- ⚠️ **Weak** — least-privilege in places but some broad tokens, or scopes defined but
  inconsistently enforced, or no per-token revocation.
- ❌ **Fail** — full-access third-party keys where scoping is available (Stripe `sk` reused,
  DB superuser, classic all-scope PAT), or issued tokens with no scope model / unchecked
  scope claims / no tenant binding.

Report findings as `SCAN-NN` with `file:line` and the minimal scope it should be reduced to.
