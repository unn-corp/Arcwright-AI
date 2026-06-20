# 16. Database Server Hardening (PostgreSQL-focused)
**Maps to:** `references/injection.md`, `references/authentication.md`, `references/data-protection.md`,
`references/misconfiguration.md` · related: the `postgresql-optimization` skill

**Principle:** the database is the crown jewels — a hardened app in front of a soft database
still loses. This topic scans **what the repo defines about the database**: committed
`pg_hba.conf` / `postgresql.conf`, SQL migrations, ORM/connection config, and Docker/IaC DB
services. It is PostgreSQL-primary (per the Cybertec hardening rules) with MySQL/other
equivalents noted.

> **Scope:** repo-static only. The *live* server's running config, OS shell access, superuser
> password custody, and actual TDE state need a DBA/live audit (out of scope here) — flag
> those as recommendations, not findings.

**Detect (skip to N/A if no DB artifacts):**
```bash
git ls-files | grep -iE "pg_hba\.conf|postgresql\.conf|\.sql$|alembic|migrations?/|knexfile|prisma/schema|ormconfig|my\.cnf|docker-compose" | head
grep -rniE "postgres(ql)?://|mysql://|mongodb(\+srv)?://|DATABASE_URL|PG[A-Z]+=|sslmode=" --include=*.{env,yml,yaml,js,ts,py,go,conf} . | head -30
```

## A. Connection auth & network exposure
**What good looks like:**
- **No `trust`** auth in `pg_hba.conf` (especially non-local) — use `scram-sha-256` + SSL;
  `peer` is acceptable for local only.
- **`scram-sha-256`, not `md5`** (md5 hashes are precomputed/crackable).
- `pg_hba.conf` entries are **specific**: no `0.0.0.0/0`, no `all all` (scope to the db,
  user, and subnet that actually need access); each line documented (who/why).
- `listen_addresses` not `'*'` unless firewalled; the Postgres port (5432 / MySQL 3306) is
  **not published to `0.0.0.0`** in `docker-compose`/IaC (bind to localhost or a private net).

**Red flags:**
| Pattern | Severity |
|---------|----------|
| `trust` auth method in `pg_hba.conf` (any remote line) | **Critical** |
| `md5` auth where `scram-sha-256` is available | **Medium/High** |
| `pg_hba.conf` host line with `0.0.0.0/0` or `all all` | **High** |
| `listen_addresses = '*'` with no firewall context | **High** |
| DB port mapped `5432:5432` / `3306:3306` on `0.0.0.0` in docker-compose | **High** |

## B. Privileges & least authority
**What good looks like:**
- Migrations **`REVOKE ALL ON SCHEMA public FROM PUBLIC`** and `REVOKE ALL ON DATABASE … FROM
  PUBLIC` (pre-PG15 default lets any role create objects in `public` — a known privilege-
  escalation vector); revoke `TEMP` where unneeded.
- App connects as a **non-superuser, non-owner role** granted only the privileges it uses
  (ties to topic 14). Superuser reserved for admin, never for the app, replication, or backups.
- **`ALTER DEFAULT PRIVILEGES`** used so new objects get correct grants automatically.
- No `GRANT … TO PUBLIC` on application tables/schemas.

**Red flags:**
| Pattern | Severity |
|---------|----------|
| App role created/used with `SUPERUSER` (or app connects as `postgres`/`root`) | **High** |
| `GRANT … TO PUBLIC` on app objects; no `REVOKE … FROM PUBLIC` on `public` schema | **Medium/High** |
| Broad `GRANT ALL` to the app role instead of scoped privileges | **Medium** |

## C. SQL safety inside the database
**What good looks like:**
- **`SECURITY DEFINER` functions set a fixed `search_path`** (`SET search_path = pg_catalog, …`)
  — without it, a caller can hijack `search_path` to run their objects as the definer
  (privilege escalation). Keep definer functions minimal and audited.
- Dynamic SQL in PL/pgSQL built with **`format()` + `%I`/`%L`** (or `EXECUTE … USING`), never
  string concatenation (`'… ' || arg`) — DB-side SQL injection is real (DoS, data exfil).

**Red flags:**
| Pattern | Severity |
|---------|----------|
| `SECURITY DEFINER` function with no `SET search_path` | **High** |
| `EXECUTE '… ' \|\| variable` / concatenated dynamic SQL in plpgsql | **High** |

## D. Transport, secrets & patching
**What good looks like:**
- Connection strings to remote DBs use **`sslmode=require`** (ideally `verify-full`), never
  `sslmode=disable`. Server `ssl = on`, TLS ≥ 1.2.
- **No `ALTER USER … PASSWORD '…'` with a literal** in migrations/scripts — it lands in the
  query log in plaintext *and* commits a secret; set passwords via the client `\password`
  protocol / a secret manager.
- Encryption at rest: managed (RDS `storageEncrypted`, topic 13) or TDE.
- DB image pinned to a **supported major version** (not EOL `postgres:11`/`mysql:5.7`); minor
  updates applied (security fixes ship in minors).

**Red flags:**
| Pattern | Severity |
|---------|----------|
| `sslmode=disable` (or no sslmode) on a non-local DB connection | **High** |
| `ALTER USER/ROLE … PASSWORD '<literal>'` in a committed file | **Medium/High** |
| Docker image on an EOL Postgres/MySQL major version | **Medium** |

**Tools / grep fallbacks (hybrid):**
```bash
# Auth & exposure
grep -rniE "^[^#]*\btrust\b|^[^#]*\bmd5\b|0\.0\.0\.0/0|^[[:space:]]*host[[:space:]]+all[[:space:]]+all" $(git ls-files | grep -i pg_hba) 2>/dev/null
grep -rniE "listen_addresses\s*=\s*'\*'|^[^#]*ssl\s*=\s*off" $(git ls-files | grep -i postgresql.conf) 2>/dev/null
grep -rniE "5432:5432|3306:3306" --include=*.{yml,yaml} .
# Privileges & PUBLIC
grep -rniE "SUPERUSER|GRANT (ALL|.*) TO PUBLIC|GRANT ALL|REVOKE .* FROM PUBLIC|ALTER DEFAULT PRIVILEGES" --include=*.sql .
# SQL safety
grep -rniE "SECURITY DEFINER" --include=*.sql . | head        # then check each for SET search_path
grep -rniE "EXECUTE .*\|\||format\(" --include=*.sql .
# Transport, secrets, version
grep -rniE "sslmode=disable|sslmode=|ALTER (USER|ROLE).*PASSWORD '" --include=*.{sql,env,yml,yaml,js,ts,py,go} .
grep -rniE "postgres:[0-9]+|mysql:[0-9.]+|image:.*(postgres|mysql)" --include=*.{yml,yaml} . ; grep -rniE "FROM (postgres|mysql):" --include=Dockerfile* .
```

> **MySQL equivalents:** `trust` ≈ accounts with empty/`mysql_native_password`; PUBLIC ≈
> grants to `''@'%'`; `sslmode=require` ≈ `REQUIRE SSL` / `--require-secure-transport`;
> superuser ≈ `GRANT ALL … WITH GRANT OPTION` / `root`. **MongoDB:** the original cautionary
> tale — never run with auth disabled or bound to `0.0.0.0` without `--auth`.

**Verdict guidance:**
- ✅ **Pass** — scram+SSL auth, specific scoped `pg_hba`, PUBLIC revoked, app on a least-priv
  role, definer functions pin `search_path`, no plaintext-password DDL, SSL required, version supported.
- ⚠️ **Weak** — mostly hardened but md5 lingering, a broad grant, or no `ALTER DEFAULT PRIVILEGES`.
- ❌ **Fail** — `trust` auth, app-as-superuser, `GRANT TO PUBLIC` on data, definer function
  without `search_path`, concatenated dynamic SQL, or `sslmode=disable` to a remote DB.

Report findings as `SCAN-NN` with the config/migration `file:line`.
