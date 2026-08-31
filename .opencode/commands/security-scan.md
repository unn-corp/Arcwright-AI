---
description: Whole-repo security posture scan across 12 app-security domains (authn/z, hashing, validation, injection, JWT, rate limiting, secrets, API routes, HTTPS, deps, uploads, logging) plus AWS IaC (CDK/CFN/TF), API token scoping, API inventory/shadow-endpoints, database server hardening (Postgres/MySQL), browser/client-side security (CSP, headers, SRI, clickjacking), fail-closed error handling, multi-tenancy/business-logic, SSRF/deserialization, container hardening, AI-LLM/WebSocket security, user input/form field security, and data classification/field-level encryption. Mapped to the OWASP Top 10:2025 and API Top 10. Hybrid LLM + tools. Reports a report card with SCAN-NN findings.
---

# /security-scan — Repo Security Posture Scan

Audit an entire repository's security posture across 12 domains and produce a **report
card**. This is broader than `/security-review` (which reviews a diff for exploitable
vulns) — it asks *"does this repo implement each control correctly?"* It is hybrid:
runs real tools (npm audit, gitleaks, trivy, pip-audit, govulncheck…) where installed and
falls back to LLM analysis otherwise.

## Instructions

1. Load `.agents/skills/security-review/posture/posture-scan.md` (the 12 app-security
   topic prompts and report-card format). When IaC source is present (`cdk.json`, `lib/`
   CDK stacks, `cdk.out/*.template.json`, `*.tf`, SAM/CloudFormation templates), also load
   `.agents/skills/security-review/posture/aws-cdk.md` for **topic 13 (AWS IaC posture)**;
   otherwise mark topic 13 **N/A**. Always load
   `.agents/skills/security-review/posture/token-scoping.md` for **topic 14 (API token &
   credential scoping — least privilege)** whenever the repo uses any tokens/keys/credentials.
   Always load `.agents/skills/security-review/posture/api-inventory.md` for **topic 15
   (API inventory, versioning & shadow/zombie endpoints)** whenever the repo exposes any HTTP
   API. When DB artifacts are present (`pg_hba.conf`, `postgresql.conf`/`my.cnf`, `*.sql`
   migrations, ORM/connection config, a DB service in `docker-compose`/IaC, or a
   `DATABASE_URL`), also load `.agents/skills/security-review/posture/database-hardening.md`
   for **topic 16 (database server hardening)**; otherwise mark topic 16 **N/A**.
   When the app serves HTML/SPA (templates, JSX/TSX, server-rendered pages, a `public/`
   index), also load `.agents/skills/security-review/posture/browser-security.md` for
   **topic 17 (browser & client-side security — CSP, headers, SRI, clickjacking)**; mark it
   **N/A** for a pure JSON API. Always load
   `.agents/skills/security-review/posture/error-handling.md` for **topic 18 (error &
   exception handling — fail closed, OWASP A10:2025)**. Always load
   `.agents/skills/security-review/posture/multitenancy-logic.md` (**topic 19** — tenant
   isolation & business-logic/race) and `.agents/skills/security-review/posture/ssrf-deserialization.md`
   (**topic 20** — SSRF & insecure deserialization). When container artifacts (`Dockerfile`,
   `docker-compose`, `Containerfile`) are present, load
   `.agents/skills/security-review/posture/container-hardening.md` (**topic 21**); else N/A.
   When the repo calls an LLM/AI API or uses WebSockets/Socket.IO, load
   `.agents/skills/security-review/posture/ai-websocket.md` (**topic 22**, run only the
   applicable half); else N/A. Always load
   `.agents/skills/security-review/posture/input-fields.md` (**topic 23** — user input & form
   field security: client-vs-server validation, rich-text sanitization, Unicode/normalization,
   ReDoS, sensitive-field hygiene) whenever the app takes any user text input. When the app
   stores personal/financial data, also load
   `.agents/skills/security-review/posture/data-encryption.md` (**topic 24** — data
   classification, field-level encryption of restricted PII, card tokenization, key management);
   else N/A. Use the two OWASP maps in
   `posture-scan.md` — **Top 10:2025 (web)** and **API Top 10 (2023)** — to confirm
   systemic-risk coverage and cite OWASP IDs in findings. Also load
   `.agents/skills/security-review/SKILL.md` for the
   confidence rules, severity table, and attacker-controlled-vs-server-controlled guidance —
   apply them: **research data flow before flagging; report HIGH-confidence findings only.**
   When a topic overlaps a reference (injection, xss, csrf, authentication, authorization,
   file-security, supply-chain, logging, data-protection, api-security, misconfiguration),
   consult that `references/*.md` for depth.

2. Determine scope from `$ARGUMENTS`:
   - A path → scan that repo/directory.
   - Empty → scan the current working directory's repo.
   - A topic number/name (e.g. `5`, `jwt`, `uploads`) → run only that topic.

3. Run the **tool-detection** block first to learn the stack and which scanners exist.
   Note unavailable tools in the report rather than erroring.

4. Walk all topics in order (12 app-security + topic 13 AWS IaC when applicable). For each:
   detect applicability → run its tools → evaluate
   against *What good looks like* / *Red flags* → assign a verdict (✅ Pass · ⚠️ Weak ·
   ❌ Fail · N/A) → record `SCAN-NN` findings with severity, `file:line`, and a fix.
   Skip cleanly to **N/A** when a topic doesn't apply (e.g. no uploads, no JWT).

5. Output the **report card** exactly as templated in the posture-scan doc: the 12-row
   table, posture score, findings grouped by severity, and a "Top priorities" list.

6. Flag any **Critical** finding (committed live secret, auth bypass/IDOR, SQLi, password
   stored with a fast hash, `algorithm: none`, wildcard-admin IAM, public S3 with data,
   DB open to the internet) as **requires human review before merge**.

This command is read-only by default — it reports, it does not fix. For automated
remediation use `/sec-loop`. For a single changed-code review use `/security-review`.

## Arguments

`$ARGUMENTS` — optional. A path to scan, and/or a single topic (number `1`–`22` or keyword
like `jwt`, `uploads`, `aws`/`cdk`/`iac`, `tokens`/`scopes`, `inventory`/`shadow`,
`db`/`database`/`postgres`, `csp`/`headers`/`browser`, `errors`/`fail-closed`,
`tenancy`/`logic`/`race`, `ssrf`/`deserialization`, `docker`/`container`, `llm`/`ai`/`websocket`,
`input`/`fields`/`forms`, `encryption`/`pii`/`data`) to run in isolation. If empty, scans the
current repo across all topics (topics 13, 16, 17, 21, 22 auto-included when IaC / DB / HTML /
container / AI-WS artifacts are present).
