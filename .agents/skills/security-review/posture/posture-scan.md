# Repo Security Posture Scan

A **whole-repo posture audit** across 12 application-security domains, an optional 13th
(AWS IaC) when infrastructure code is present (`aws-cdk.md`), a 14th — API token &
credential scoping / least privilege (`token-scoping.md`), a 15th — API inventory,
versioning & shadow/zombie endpoints (`api-inventory.md`), a 16th — database server
hardening (`database-hardening.md`) when DB config/migrations are present, and a 17th —
browser & client-side security (`browser-security.md`: CSP, headers, SRI, clickjacking) when
the app serves HTML, an 18th — error & exception handling / fail-closed
(`error-handling.md`, OWASP A10:2025), and topics 19–22 — multi-tenancy isolation &
business logic (`multitenancy-logic.md`), SSRF & insecure deserialization
(`ssrf-deserialization.md`), container/image hardening (`container-hardening.md`), and
AI-LLM & WebSocket security (`ai-websocket.md`), a 23rd — user input & form field security
(`input-fields.md`), and a 24th — data classification & field-level encryption
(`data-encryption.md`). Unlike the diff-focused
review in `../SKILL.md` (which asks *"is this changed code exploitable?"*), this scan
asks *"does this repository actually implement each control correctly?"* and produces a
**report card** — one verdict per topic.

## How to run a topic

Each topic below is a self-contained prompt. For every topic:

1. **Detect** — does this topic apply? (e.g. skip JWT if no token auth exists). Use the
   globs/grep patterns to find the relevant code. If nothing matches, mark **N/A**.
2. **Run tools** — execute the listed commands (hybrid mode). If a tool is not installed,
   note `tool unavailable` and fall back to the LLM patterns. Never fail the scan because
   a tool is missing.
3. **Evaluate** — compare what you find against *What good looks like* and *Red flags*.
4. **Verdict** — assign one of: ✅ **Pass** · ⚠️ **Weak** · ❌ **Fail** · **N/A**.
   - **Pass**: control present and correctly implemented across the codebase.
   - **Weak**: present but incomplete, inconsistent, or missing defense-in-depth.
   - **Fail**: control absent, bypassable, or actively misconfigured.
5. **Findings** — for each concrete issue assign `SCAN-NN` with severity, location, fix.

Apply the **research-before-flagging** and **attacker-controlled vs server-controlled**
rules from `../SKILL.md`. Trace data flow before declaring a Fail. A pattern match alone
is not a finding.

### Tool detection (run once, up front)

```bash
# Stack detection
ls package.json pnpm-lock.yaml yarn.lock requirements.txt pyproject.toml go.mod Cargo.toml 2>/dev/null
# Tool availability — note which exist, use them where they apply
for t in npm pnpm yarn pip-audit osv-scanner gitleaks trufflehog trivy semgrep govulncheck cargo-audit; do
  command -v "$t" >/dev/null 2>&1 && echo "have: $t" || echo "miss: $t"
done
```

---

## 1. Authentication & Authorization
**Maps to:** `references/authentication.md`, `references/authorization.md`

**Detect:** route/middleware files, `@login_required`, `requireAuth`, `getServerSession`,
`passport`, `req.user`, `current_user`, role/permission checks, `is_admin`, RBAC tables.

**Run:**
```bash
grep -rniE "login_required|requireAuth|getServerSession|isAuthenticated|@PreAuthorize|ensureLoggedIn" --include=*.{js,ts,jsx,tsx,py,go,java} .
grep -rniE "role|permission|is_?admin|can_?access|authorize|abac|rbac" --include=*.{js,ts,py,go} . | head -50
```

**What good looks like:**
- Every non-public route passes through an auth gate (middleware or decorator), not ad-hoc per-handler checks.
- **Authorization is enforced server-side on every object access** — the resource owner / tenant is checked, not just "is logged in" (prevents IDOR).
- Deny-by-default: unknown routes and missing roles are rejected, not allowed.
- **Internal, service-to-service, and east-west endpoints are authenticated too** — not left
  open because they sit "behind the gateway" (Zero Trust at the API layer). Hackers don't
  distinguish internal from external assets.
- Session invalidation on logout / password change; sessions are server-validated, not trusted from the client.
- **MFA available for sensitive accounts** (TOTP/WebAuthn-passkeys) — at minimum admin/owner
  accounts; phishing-resistant WebAuthn preferred over SMS OTP.

**Red flags:**
- Authorization decided by a client-supplied field (`req.body.userId`, `?role=admin`).
- Object fetched by ID with no ownership/tenant check → **IDOR** (Critical/High).
- Auth check in the UI only (route renders, but the API is open).
- Mixed enforcement: some routes gated, siblings unguarded.

**Severity:** auth bypass / IDOR to sensitive data = **Critical/High**.

> **Topic 13 — AWS IaC Posture** lives in `aws-cdk.md` (CDK / CloudFormation / Terraform:
> IAM least-privilege, S3 public-access, encryption at rest, security groups, secrets,
> WAF/API-throttling, CloudTrail/log retention). Run it when IaC source is present; else **N/A**.
> **Topic 14 — API Token & Credential Scoping** lives in `token-scoping.md` (least privilege
> for tokens the app *holds* and *issues*). Always applicable when the repo uses any tokens.
> **Topic 15 — API Inventory, Versioning & Shadow/Zombie Endpoints** lives in
> `api-inventory.md` (enumerate the full surface; retire old versions; no undocumented routes).
> **Topic 16 — Database Server Hardening** lives in `database-hardening.md` (pg_hba/`trust`,
> PUBLIC grants, app-as-superuser, `SECURITY DEFINER` search_path, `sslmode`). Run when DB
> config/migrations/connection strings are in the repo; otherwise **N/A**.
> **Topic 17 — Browser & Client-Side Security** lives in `browser-security.md` (CSP, security
> response headers, Subresource Integrity, clickjacking, Trusted Types). Run when the app
> serves HTML/SPA; **N/A** for a pure JSON API.
> **Topic 18 — Error & Exception Handling (Fail Closed)** lives in `error-handling.md`
> (OWASP A10:2025 Mishandling of Exceptional Conditions: fail-open security checks, swallowed
> exceptions, error-path resource leaks). Always applicable.
> **Topic 19 — Multi-Tenancy Isolation & Business Logic** (`multitenancy-logic.md`): every
> query scoped to the tenant/owner; payment idempotency, TOCTOU races, client-trusted amounts.
> **Topic 20 — SSRF & Insecure Deserialization** (`ssrf-deserialization.md`): user-controlled
> outbound URLs, `pickle`/`yaml.load`/`ObjectInputStream` on untrusted bytes.
> **Topic 21 — Container & Image Hardening** (`container-hardening.md`): non-root USER, pinned
> minimal base, no secrets in layers, `.dockerignore`. Run when Dockerfiles/compose present; else **N/A**.
> **Topic 22 — AI/LLM & WebSocket Security** (`ai-websocket.md`): prompt injection, tool-call
> authz, RAG-context trust; WS origin check, handshake auth, per-message validation. Run the
> half that applies; **N/A** if the repo has neither LLM calls nor WebSockets.
> **Topic 23 — User Input & Form Field Security** (`input-fields.md`): client-validation-isn't-
> security, rich-text/markdown sanitization, Unicode normalization & homoglyph/bidi/null-byte
> attacks, ReDoS in validators, sensitive-field hygiene. Complements topics 3/4/17.
> **Topic 24 — Data Classification & Field-Level Encryption** (`data-encryption.md`): classify
> & minimize PII; column-level encryption of restricted fields (SSN/bank) on top of at-rest
> (topics 13/16); tokenize cards (never store PAN/CVV); KMS key management. This is the *real*
> data-isolation control — separate tables alone do not encrypt. Run when the app stores PII.

---

## 2. Password Hashing (bcrypt / argon2)
**Maps to:** `references/authentication.md`, `references/cryptography.md`

**Detect:** signup / password-set / login-verify code, user models, `password`, `hash`,
`salt` columns.

**Run:**
```bash
grep -rniE "bcrypt|argon2|scrypt|pbkdf2|password_hash|hashpw|make_password|set_password" --include=*.{js,ts,py,go,java,php} .
grep -rniE "md5|sha1|sha256).{0,40}(password|passwd|pwd" --include=*.{js,ts,py,go,java,php} .
```

**What good looks like:**
- Passwords stored with **argon2id** (preferred) or **bcrypt** (cost ≥ 12) or scrypt.
- A maintained library does the hashing+salting (per-password salt automatic).
- Verification uses the library's constant-time `compare`/`verify`, never `==`.
- No plaintext, no reversible encryption, no fast hashes (MD5/SHA-*) for passwords.

**Red flags (Critical):**
- `md5(password)`, `sha256(password)`, plaintext storage, hardcoded/global salt.
- Home-rolled hashing; `password === stored` string comparison (timing leak).
- Reversible encryption of passwords (recoverable = breach-amplifying).

---

## 3. Input Validation & Sanitization
**Maps to:** `references/injection.md`, language guides

**Detect:** request handlers, body/query/param parsing, form processing, deserialization.

**Run:**
```bash
grep -rniE "zod|joi|yup|pydantic|marshmallow|class-validator|valibot|ajv|express-validator|cerberus" --include=*.{js,ts,py} .
grep -rniE "req\.(body|query|params)|request\.(get|post|json|args|form)|flask\.request" --include=*.{js,ts,py} . | head -50
```

**What good looks like:**
- **Validate at the trust boundary**: every external input parsed through a schema
  (Zod/Pydantic/etc.) that enforces type, length, format, and allowed set *before* use.
- Allowlist over denylist; reject unexpected fields (no mass assignment).
- Output is **encoded for its sink** (HTML escape, SQL params, shell-arg arrays) — validation and encoding are distinct layers.
- **Reject oversized and malformed payloads**: a request body size cap (e.g. `express.json({limit})`,
  client_max_body_size), and XML parsing with entity-expansion/external-entity disabled to
  block **XML bombs** ("billion laughs") and **XXE**. JSON/XML **schema validation** before processing.

**Red flags:**
- Raw `req.body` / `request.json` flowing into queries, file paths, commands, or templates with no schema.
- Hand-rolled regex "sanitizers" trying to strip `'`, `<`, `;`.
- Mass-assignment: `User(**request.json)` / `Object.assign(model, req.body)`.
- No request body size limit (memory-exhaustion DoS); XML parser with DTD/entity expansion on (XXE / XML bomb).

---

## 4. SQL Injection / XSS / CSRF
**Maps to:** `references/injection.md`, `references/xss.md`, `references/csrf.md`

**Detect:** DB queries, ORM raw escapes, template rendering, HTML sinks, state-changing routes.

**Run:**
```bash
# SQLi: string-built queries
grep -rniE "(SELECT|INSERT|UPDATE|DELETE).{0,60}(\+|\$\{|%s|format|f\"|f'|concat)" --include=*.{js,ts,py,go,java,php} .
grep -rniE "\.raw\(|\.extra\(|RawSQL|cursor\.execute\([^,]*%|execute\(.*\+|knex\.raw" --include=*.{js,ts,py} .
# XSS sinks
grep -rniE "dangerouslySetInnerHTML|innerHTML|v-html|\|safe|mark_safe|render_template_string|document\.write" --include=*.{js,ts,jsx,tsx,py,html} .
# CSRF protection presence
grep -rniE "csrf|csurf|SameSite|samesite|X-CSRF|csrf_token|@csrf_exempt" --include=*.{js,ts,py} .
```

**What good looks like:**
- **SQLi:** parameterized queries / ORM bind params only; no string interpolation of input into SQL. `.raw()`/`.extra()` only with bound params.
- **XSS:** rely on framework auto-escaping; `dangerouslySetInnerHTML`/`v-html`/`|safe` only with sanitized (DOMPurify/bleach) content.
- **CSRF:** state-changing routes protected by tokens **or** cookies set `SameSite=Lax/Strict`; pure-Bearer-token APIs (no cookies) are CSRF-exempt by design — note that, don't flag.

**Red flags:** f-string/template-literal SQL with input (**Critical**); `v-html`/`dangerouslySetInnerHTML` on user data (**High**); cookie-session app with `@csrf_exempt` on POST and no SameSite (**Medium/High**).

---

## 5. Secure JWT Handling
**Maps to:** `references/authentication.md`

**Detect:** `jsonwebtoken`, `jose`, `PyJWT`, `python-jose`, `golang-jwt`, `jwt.sign/verify/decode`.

**Run:**
```bash
grep -rniE "jsonwebtoken|jose|pyjwt|python-jose|golang-jwt|jwt\.(sign|verify|decode|encode)" --include=*.{js,ts,py,go} .
grep -rniE "algorithm[s]?|none|HS256|RS256|verify=False|verify_signature" --include=*.{js,ts,py,go} . | grep -i jwt
```

**What good looks like:**
- Signature **always verified** with an explicit pinned algorithm (`algorithms: ['RS256']` / `['HS256']`).
- Strong secret from env (≥ 256-bit), not committed; RS/ES keys for asymmetric.
- Claims validated: `exp` (short-lived access tokens), `iss`, `aud`. Refresh-token rotation; revocation/denylist for logout.
- Tokens stored as `HttpOnly; Secure; SameSite` cookies, **not** `localStorage` (XSS-stealable).

**Red flags (Critical/High):**
- `algorithm: 'none'`, `jwt.decode(token, verify=False)`, decode-without-verify.
- Algorithm not pinned → **alg-confusion** (attacker downgrades RS256→HS256 using public key as HMAC secret).
- Hardcoded JWT secret; no `exp`; access tokens that never expire; JWT in `localStorage`.

---

## 6. Rate Limiting & Brute-Force Protection
**Maps to:** `references/business-logic.md`, `references/authentication.md`

**Detect:** login / password-reset / OTP / signup / payment routes, gateway/middleware config.

**Run:**
```bash
grep -rniE "rate.?limit|express-rate-limit|slowapi|flask-limiter|throttle|bucket4j|limiter|RateLimiter" --include=*.{js,ts,py,go,java} .
grep -rniE "login|signin|authenticate|reset.?password|forgot.?password|verify.?otp|/auth" --include=*.{js,ts,py,go} . | head -40
```

**What good looks like:**
- Rate limiting on **authentication and sensitive endpoints** (login, reset, OTP, signup, payments) — by IP **and** by account.
- Progressive backoff / temporary lockout / CAPTCHA after repeated failures.
- Limits enforced server-side (middleware, API gateway, or WAF), backed by shared store (Redis) so they hold across instances.
- Resource-expensive endpoints (search, export, file processing) also bounded.
- On AWS, app-level limits are backstopped at the **edge** — API Gateway throttling/usage
  plans and **WAF rate-based rules**. Those are checked in **topic 13** (`aws-cdk.md`); a
  repo can legitimately push rate limiting entirely to the edge, so confirm there before
  marking this Fail.

**Red flags:**
- No throttling on login/reset → credential stuffing & brute force (**High**).
- In-memory limiter on a multi-instance deploy (trivially bypassed) (**Medium**).
- Generic 429 missing on auth routes while present elsewhere (inconsistent).

---

## 7. Environment Variable & Secret Management
**Maps to:** `references/data-protection.md`, `references/supply-chain.md`

**Detect:** `.env*`, config loaders, `process.env`, `os.environ`, `os.getenv`, CI secrets,
committed credentials.

**Run:**
```bash
command -v gitleaks >/dev/null && gitleaks detect --no-banner --redact -v 2>/dev/null || echo "gitleaks unavailable"
command -v trufflehog >/dev/null && trufflehog filesystem . --no-update 2>/dev/null | head -40
git ls-files 2>/dev/null | grep -E "(^|/)\.env($|\.)" ; echo "--- .gitignore check ---"
grep -nE "^\.env|^\*\.env|secrets" .gitignore 2>/dev/null
grep -rniE "(api[_-]?key|secret|token|password|aws_access|private[_-]?key)\s*[:=]\s*['\"][A-Za-z0-9/+_-]{12,}" --include=*.{js,ts,py,go,java,yaml,yml,json,env} . | grep -viE "process\.env|os\.(environ|getenv)|example|placeholder|\.env\." | head -40
```

**What good looks like:**
- All secrets read from env / a secrets manager (Vault, AWS Secrets Manager, Doppler, Infisical) — none hardcoded.
- `.env` (and `.env.*` except `.env.example`) is git-ignored and **not** tracked; only `.env.example` with placeholder names is committed.
- App fails fast on missing required env (validated at boot), and never logs secret values.
- Distinct secrets per environment; rotation possible without code change.

> This topic covers how secrets are **stored**. Whether each token is **scoped to only what
> it needs** (restricted Stripe keys, non-superuser DB users, minimal OAuth scopes) is
> **topic 14** (`token-scoping.md`).

**Red flags (Critical):**
- Any real secret committed (gitleaks/trufflehog hit, live key in source or history).
- `.env` tracked in git; secrets in client-side bundles (`NEXT_PUBLIC_*`, `VITE_*`) that aren't truly public.
- Secrets passed as Docker `ARG` or baked into image layers.

---

## 8. Secure API Routes
**Maps to:** `references/api-security.md`, `references/misconfiguration.md`

**Detect:** route definitions, controllers, serializers, CORS config, error handlers.

**Run:**
```bash
grep -rniE "cors\(|Access-Control-Allow-Origin|allow_origins|CORSMiddleware" --include=*.{js,ts,py,go} .
grep -rniE "app\.(get|post|put|patch|delete)|@(Get|Post|router\.)|@app\.route|@router\.|http\.HandleFunc" --include=*.{js,ts,py,go} . | head -60
```

**What good looks like:**
- Each route declares method + auth + input schema; consistent across the API.
- **CORS** locked to known origins (no `*` with `credentials: true`); reflective origin echo avoided.
- Responses use explicit serializers / DTOs (no leaking internal fields, password hashes, tokens). No mass assignment on write.
- Pagination/size caps on list endpoints; security headers present; verbose stack traces off in prod.
- **Minimal disclosure (share as little as possible):** error responses return generic
  messages + a correlation ID, never stack traces, SQL, internal hostnames/IPs, or library
  versions. Responses expose only the fields the client needs (no **excessive data exposure**).
- Sensitive/admin endpoints optionally **IP-allowlisted**; admin surface minimized and role-separated.
- Where payloads carry files or rich content, scan them (AV / **ICAP**) before processing — see topic 11.

**Red flags:**
- `Access-Control-Allow-Origin: *` together with credentials (**High**).
- Endpoint returns whole DB model incl. sensitive columns → **excessive data exposure** (**Medium/High**).
- Mutating route accepts arbitrary fields → mass assignment / privilege escalation.
- Error responses leak stack traces / SQL / internal IPs / versions (**Low/Medium** — recon aid).

---

## 9. HTTPS Everywhere / Transport Security
**Maps to:** `references/misconfiguration.md`

**Detect:** server/transport config, cookie flags, redirects, external `http://` calls, HSTS.

**Run:**
```bash
grep -rniE "http://" --include=*.{js,ts,py,go,java,yaml,yml,conf,env} . | grep -viE "localhost|127\.0\.0\.1|0\.0\.0\.0|schema|xmlns|w3\.org|example\.com" | head -40
grep -rniE "Strict-Transport-Security|hsts|secure:\s*false|secure=False|sslRedirect|forceSSL|rejectUnauthorized\s*:\s*false|InsecureSkipVerify" --include=*.{js,ts,py,go,conf} .
```

**What good looks like:**
- TLS terminated for all inbound traffic; HTTP redirects to HTTPS (or HSTS preloaded).
- **Modern TLS only** — TLS 1.2/1.3, weak cipher suites and SSLv3/TLS 1.0/1.1 disabled at
  the server/load balancer/CloudFront (topic 13 checks `minimumProtocolVersion`).
- **Mutual TLS (two-way TLS)** for partner / service-to-service / high-trust APIs where the
  client presents a cert too — not just server-side TLS.
- Cookies set `Secure` (+ `HttpOnly`, `SameSite`); `HSTS` header in prod.
- Outbound calls to third parties use `https://`; TLS verification **on** (no `rejectUnauthorized:false`, `InsecureSkipVerify:true`, `verify=False`).

**Red flags:**
- TLS verification disabled in client calls (**High** — enables MITM).
- `Secure` cookie flag off in prod; plaintext `http://` to external APIs carrying tokens (**High**).
- No HSTS / no HTTP→HTTPS redirect (**Low/Medium**, defense-in-depth).

---

## 10. Dependency & Software Supply Chain (OWASP A03:2025)
**Maps to:** `references/supply-chain.md`

> **A03:2025 Software Supply Chain Failures** broadened the old "Vulnerable & Outdated
> Components" to the whole chain — not just *known-vulnerable* deps but the **build pipeline,
> artifact integrity, and dependency trust**. This topic now covers both (see the supply-chain
> sub-block after the CVE checks).

**Detect:** lockfiles and manifests for each ecosystem present.

**Run (use the manager that matches the lockfile):**
```bash
# Node
[ -f package-lock.json ] && npm audit --omit=dev 2>/dev/null | tail -25
[ -f pnpm-lock.yaml ] && pnpm audit --prod 2>/dev/null | tail -25
[ -f yarn.lock ] && yarn npm audit 2>/dev/null | tail -25
# Python
{ [ -f requirements.txt ] || [ -f pyproject.toml ]; } && command -v pip-audit >/dev/null && pip-audit 2>/dev/null | tail -25
# Go / Rust / multi-ecosystem
[ -f go.mod ] && command -v govulncheck >/dev/null && govulncheck ./... 2>/dev/null | tail -25
[ -f Cargo.toml ] && command -v cargo-audit >/dev/null && cargo audit 2>/dev/null | tail -25
command -v osv-scanner >/dev/null && osv-scanner --recursive . 2>/dev/null | tail -30
command -v trivy >/dev/null && trivy fs --scanners vuln --severity HIGH,CRITICAL . 2>/dev/null | tail -30
```

**What good looks like:**
- Lockfiles committed and current; no **Critical/High** advisories in production deps.
- Automated scanning in CI (Dependabot/Renovate/audit step) — check `.github/`.
- No abandoned or typosquat-looking packages; direct deps reasonably pinned.
- **Guard against malicious packages, not just vulnerable ones** (the `event-stream` lesson):
  watch for suspicious `postinstall`/`preinstall` scripts, recently-hijacked or newly-published
  deps, and dependencies fetched from non-registry URLs/git. Socket.dev-style behavioral SCA
  catches what CVE scanners miss; consider `--ignore-scripts` in CI installs.

**Red flags:** Critical/High CVE in a production dependency (**rate to the CVE's severity**);
no lockfile (non-reproducible builds); audit never run in CI; an unexpected `postinstall`
script or a dependency pulled from a raw git/URL source.

> Report the scanner's own Critical/High results as findings; summarize counts rather than
> pasting the full tree.

**Supply-chain integrity (beyond CVEs — A03:2025):**
- **Lockfile integrity**: lockfiles committed with hashes; installs use `npm ci`/`--frozen-lockfile`/
  `pip --require-hashes`, not floating `npm install` in CI.
- **Dependency confusion**: internal/scoped packages pinned to the private registry; no public
  package can shadow an internal name (`.npmrc`/registry scoping present).
- **Build & CI/CD integrity**: pinned action/image versions (GitHub Actions pinned to a SHA,
  not `@main`); least-privilege CI tokens (`permissions:` block); no secrets echoed in build logs.
- **Provenance / SBOM**: build provenance or an SBOM (CycloneDX/SPDX) generated; release
  artifacts signed where feasible.

**Red flags (supply chain):** floating `npm install` in CI (non-reproducible); GitHub Action
pinned to `@main`/a tag instead of a SHA (**Medium**); internal package name resolvable from a
public registry → **dependency confusion** (**High**); CI workflow with `permissions: write-all`
or secrets printed to logs (**Medium**).

---

## 11. Secure File Uploads
**Maps to:** `references/file-security.md`

**Detect:** multipart handlers, `multer`, `formidable`, `request.files`, `FileField`,
S3/GCS put, image processing, `path.join` with user input.

**Run:**
```bash
grep -rniE "multer|formidable|busboy|request\.files|UploadFile|FileField|MultipartFile|os\.path\.join|path\.join" --include=*.{js,ts,py,go,java} . | head -40
grep -rniE "mimetype|content-type|file\.(name|filename)|originalname|extension|magic|filetype" --include=*.{js,ts,py,go} . | head -30
```

**What good looks like:**
- Type validated by **content sniffing (magic bytes)**, not just extension or client `Content-Type`; allowlist of accepted types.
- Size limits enforced; server **generates the stored filename** (UUID), never trusts user filename → blocks path traversal.
- Files stored outside web root / in object storage, served via signed URLs; uploaded content not executable.
- Images re-encoded; archives bounded (zip-bomb / zip-slip guards).

**Red flags (High/Critical):**
- `path.join(uploadDir, req.file.originalname)` → path traversal / overwrite.
- Upload dir is web-served and executes scripts (`.php`, `.jsp`) → RCE.
- Type trusted from client `Content-Type` / extension only; no size cap (DoS).

---

## 12. Logging & Monitoring
**Maps to:** `references/logging.md`, `references/error-handling.md`

**Detect:** logger setup, auth event logging, error handlers, log sinks, alerting/metrics.

**Run:**
```bash
grep -rniE "logger|logging|winston|pino|bunyan|structlog|log\.(info|warn|error)|console\.log" --include=*.{js,ts,py,go} . | head -40
grep -rniE "log.*(password|token|secret|authorization|cookie|ssn|credit|cvv|api[_-]?key)" --include=*.{js,ts,py,go} . | head -30
```

**What good looks like:**
- **Security events logged**: logins (success+failure), authz denials, password/role changes, admin actions — with who/what/when, ideally structured.
- Logs **never contain secrets or PII** (no passwords, tokens, full card/SSN, raw auth headers); sensitive fields redacted.
- Centralized, tamper-resistant log storage with retention; errors monitored/alerted; failures **fail closed** (an error in auth denies, not allows).
- Correlation/request IDs for tracing; no `console.log` of request bodies in prod.

**Red flags:**
- Secrets/PII written to logs (**High** — turns log access into a breach).
- No audit trail for auth/authz events (**Medium** — can't detect or investigate intrusions).
- User input logged unsanitized → log injection/forging (**Low/Medium**).
- Errors swallowed silently or failing open (**High** when on an auth path).

---

## Report Card Format

```markdown
# Security Posture Scan: <repo>

**Scanned:** <date> · **Stack:** <node/python/go…> · **Tools used:** <npm audit, gitleaks…>

| # | Topic                                | Verdict | Findings |
|---|--------------------------------------|---------|----------|
| 1 | Authentication & Authorization       | ✅/⚠️/❌/N/A | SCAN-01 |
| 2 | Password Hashing                     | …       | …        |
| 3 | Input Validation & Sanitization      | …       | …        |
| 4 | SQL Injection / XSS / CSRF           | …       | …        |
| 5 | Secure JWT Handling                  | …       | …        |
| 6 | Rate Limiting & Brute-Force          | …       | …        |
| 7 | Env Var & Secret Management          | …       | …        |
| 8 | Secure API Routes                    | …       | …        |
| 9 | HTTPS / Transport Security           | …       | …        |
|10 | Dependency Vulnerabilities           | …       | …        |
|11 | Secure File Uploads                  | …       | …        |
|12 | Logging & Monitoring                 | …       | …        |
|13 | AWS IaC Posture (CDK/CFN/TF) †       | …       | …        |
|14 | API Token & Credential Scoping       | …       | …        |
|15 | API Inventory / Versioning / Shadow  | …       | …        |
|16 | Database Server Hardening ‡          | …       | …        |
|17 | Browser & Client-Side Security §     | …       | …        |
|18 | Error & Exception Handling (A10:2025)| …       | …        |
|19 | Multi-Tenancy Isolation & Biz Logic  | …       | …        |
|20 | SSRF & Insecure Deserialization      | …       | …        |
|21 | Container & Image Hardening ¶        | …       | …        |
|22 | AI/LLM & WebSocket Security ◊        | …       | …        |
|23 | User Input & Form Field Security     | …       | …        |
|24 | Data Classification & Field Encryption| …      | …        |

† Topic 13 (`aws-cdk.md`) is included only when IaC source is present; otherwise **N/A**.
Topic 14 (`token-scoping.md`) — least privilege for tokens the app holds *and* issues.
Topic 15 (`api-inventory.md`) — shadow/zombie endpoints, versioning, full surface enumeration.
‡ Topic 16 (`database-hardening.md`) — runs only when DB artifacts (pg_hba/config, SQL
migrations, connection strings, DB docker/IaC services) are in the repo; else **N/A**.
§ Topic 17 (`browser-security.md`) — CSP, security headers, SRI, clickjacking, Trusted Types;
runs when the app serves HTML/SPA, **N/A** for a pure JSON API.
Topic 18 (`error-handling.md`) — OWASP A10:2025; fail-closed error/exception handling. Always applicable.
Topic 19 (`multitenancy-logic.md`) — tenant/data isolation + business-logic/race conditions.
Topic 20 (`ssrf-deserialization.md`) — SSRF + insecure deserialization.
¶ Topic 21 (`container-hardening.md`) — runs only when container artifacts (Dockerfile/compose) are present; else **N/A**.
◊ Topic 22 (`ai-websocket.md`) — run the half that applies (LLM integration and/or WebSocket); **N/A** if neither.
Topic 23 (`input-fields.md`) — input-field layer: client-vs-server validation, rich-text sanitization, Unicode/normalization, ReDoS, sensitive-field hygiene.
Topic 24 (`data-encryption.md`) — data classification, field-level encryption of restricted PII, tokenization, key management. Always applicable when the app stores PII.

**Posture score:** <X Pass, Y Weak, Z Fail, W N/A>

## Findings (by severity)

### [SCAN-01] <Title> — <Critical/High/Medium/Low>
- **Topic:** <n>  · **Location:** `file:line`  · **Confidence:** High
- **Issue:** …
- **Impact:** …
- **Fix:** …

## Top priorities
1. <highest-severity actionable item>
2. …
```

End with: `24 topics scanned — A Pass, B Weak, C Fail, D N/A · N findings (x Critical, y High, …)`.

A clean repo should read: "No high-confidence posture failures; N topics N/A."

---

## Appendix A: OWASP Top 10:2025 (web) → topic coverage

The canonical web-app risk list. Confirm each category is covered; cite the OWASP ID in findings.

| OWASP Top 10:2025 | Covered by topic |
|-------------------|------------------|
| **A01** Broken Access Control | 1 (authz/IDOR), 8, 14, 19 (tenant isolation) |
| **A02** Security Misconfiguration | 7, 8, 9, 13, 17 |
| **A03** Software Supply Chain Failures | 10 (deps + CI/CD + integrity) |
| **A04** Cryptographic Failures | 2 (password hashing), 9 (TLS), 13 (encryption at rest), 24 (field-level PII encryption) |
| **A05** Injection | 3, 4 (SQLi/XSS), 16 (DB-side SQL), 23 (input fields) |
| **A06** Insecure Design | 19 (business logic) + `references/business-logic.md` (threat-model, not fully static-scannable) |
| **A07** Authentication Failures | 1, 5 (JWT), 6 (brute-force), 2 |
| **A08** Software or Data Integrity Failures | 10 (build/artifact integrity), 17 (SRI), 20 (deserialization) |
| **A09** Security Logging & Alerting Failures | 12 |
| **A10** Mishandling of Exceptional Conditions | 18 (fail-closed) |

> Note: SSRF (A10:2021) dropped off the 2025 top-level list — covered by **topic 20**
> (and `references/ssrf.md` in the diff-review skill).

## Appendix B: OWASP API Security Top 10 (2023) → topic coverage

Use this to confirm the scan covers each systemic API risk; cite the OWASP ID in findings
where it applies.

| OWASP API risk | Covered by topic |
|----------------|------------------|
| **API1** Broken Object Level Authorization (BOLA/IDOR) | 1 (authz / object-ownership checks) |
| **API2** Broken Authentication | 1, 5 (JWT), 6 (brute-force) |
| **API3** Broken Object Property Level Authorization (excessive data exposure / mass assignment) | 3, 8 |
| **API4** Unrestricted Resource Consumption | 3 (payload size), 6, 13 (throttling/WAF) |
| **API5** Broken Function Level Authorization | 1, 8 |
| **API6** Unrestricted Access to Sensitive Business Flows | 6, and `references/business-logic.md` |
| **API7** Server-Side Request Forgery (SSRF) | `references/ssrf.md` (diff-review skill) |
| **API8** Security Misconfiguration | 8, 9, 13 |
| **API9** Improper Inventory Management (shadow/zombie APIs) | 15 |
| **API10** Unsafe Consumption of 3rd-Party APIs | 9 (TLS verify), 10 (deps), 14 (scoped tokens) |
