# 15. API Inventory, Versioning & Shadow/Zombie Endpoints
**Maps to:** `references/api-security.md`, `references/misconfiguration.md`, `references/logging.md`

**Principle:** you can't protect what you don't know exists. A complete, current inventory of
every endpoint is the foundation under topics 1–14 — controls (auth, throttling, validation,
logging) only help on endpoints you actually know about. The favorite attack surface is the
endpoint nobody is watching:

- **Shadow APIs** — endpoints created by a team without central governance / not in the spec.
- **Zombie APIs** — deprecated/old-version endpoints still live and reachable.
- **Internal/east-west APIs** assumed safe "because they're behind the gateway."

**Detect:**
```bash
# API definitions in the repo (the documented surface)
git ls-files | grep -iE "openapi|swagger|\.raml$|asyncapi|schema\.graphql$|\.proto$" | head
# Every route the code actually declares (the real surface) — diff this against the spec
grep -rnoE "(app|router)\.(get|post|put|patch|delete)\(['\"][^'\"]+|@(Get|Post|Put|Patch|Delete)\(['\"][^'\"]+|@app\.route\(['\"][^'\"]+|@router\.(get|post|put|patch|delete)\(['\"][^'\"]+|http\.HandleFunc\(['\"][^'\"]+" --include=*.{js,ts,py,go} . | sort -u
# Versioning scheme + deprecated/legacy paths still mounted
grep -rniE "/v[0-9]+/|/api/v|version|deprecat|legacy|/old/|/beta/" --include=*.{js,ts,py,go} . | head -40
```

**What good looks like:**
- A **machine-readable API spec** (OpenAPI/GraphQL schema) exists and is kept in sync with
  the code; CI flags routes that exist in code but not in the spec (drift = shadow API).
- **Versioning is explicit** (version in the path, e.g. `/api/v2/...`); old versions have a
  documented deprecation + **retirement** date and are *removed*, not left running forever.
- No undocumented, debug, or `/test` / `/internal` endpoints reachable in production.
- **Every** endpoint — internal, east-west, and admin included — is enumerated and carries
  the topic 1 auth gate. Nothing is trusted merely for being "behind the gateway" (Zero
  Trust at the API layer).
- Endpoints are reconciled against access logs (topic 12): a route receiving traffic that
  isn't in the inventory is investigated.

**Red flags:**
| Pattern | Severity |
|---------|----------|
| Live deprecated/old-version endpoints (`/v1` still up after `/v2` ships) with weaker controls | **High** |
| Routes in code absent from the API spec (shadow endpoints) | **Medium/High** |
| Debug/test/internal routes (`/debug`, `/__admin`, `/test`) mounted in prod | **High** |
| Internal/service endpoints with no auth ("trusted network" assumption) | **High** |
| No API spec at all / no way to enumerate the surface | **Medium** |
| Old API version kept "just in case" with no owner or monitoring | **Medium** |

**Tools (hybrid):**
```bash
# If a spec exists, lint it and compare endpoint counts to the grep above
command -v redocly  >/dev/null && redocly lint $(git ls-files | grep -iE "openapi|swagger" | head -1) 2>/dev/null | tail -20
command -v spectral >/dev/null && spectral lint $(git ls-files | grep -iE "openapi|swagger" | head -1) 2>/dev/null | tail -20
# Count: routes-in-code vs paths-in-spec — a gap means shadow endpoints
```

**Verdict guidance:**
- ✅ **Pass** — spec exists and matches code, versioning explicit with retirement of old
  versions, no debug/shadow/zombie endpoints, every route (incl. internal) authenticated.
- ⚠️ **Weak** — spec exists but drifts from code, or old versions linger without a sunset
  plan, or a couple of undocumented endpoints.
- ❌ **Fail** — no inventory at all, live zombie endpoints with weak controls, or
  internal/debug routes reachable unauthenticated in prod.

Report findings as `SCAN-NN` with the route `file:line` and the inventory gap.
