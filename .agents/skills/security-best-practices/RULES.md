# Security Best Practices — Quick Rules

> Load full `SKILL.md` when executing this skill as a formal procedure.

## Core Rules
- Enforce HTTPS in production — redirect all HTTP requests with a 301
- Set security headers via Helmet (or equivalent): CSP, HSTS with `preload`, `X-Frame-Options`, etc.
- Rate-limit all API routes; apply stricter limits (e.g., 5 per 15 min) to auth endpoints with `skipSuccessfulRequests: true`
- Validate and sanitize all user input before any use — use a schema library (Joi, Zod, Pydantic)
- Use parameterized queries exclusively — never interpolate user input into SQL strings
- Sanitize HTML output with DOMPurify or equivalent when rendering user-supplied content
- Protect state-changing endpoints with CSRF tokens; validate on every POST/PUT/DELETE
- Never hardcode secrets — store in environment variables; throw on startup if required vars are missing
- Never commit `.env` files or any file containing secrets
- Use short-lived JWTs (15 min access token) paired with long-lived refresh tokens (7 days); rotate refresh tokens on each use and delete the prior token
- Never use `eval()`, direct `innerHTML` assignment with user data, or `dangerouslySetInnerHTML` with unvalidated input
- Apply least-privilege and defense-in-depth: layer controls rather than relying on a single check

## OWASP Top 10 — stop and apply skill when any of these are present
- Missing authorization checks on routes (A01)
- HTTP endpoints serving sensitive data (A02)
- String interpolation in queries (A03)
- Hardcoded or committed secrets (A02/A05)
- No rate limiting on public endpoints (A07)
- Dependencies not audited (`npm audit`) (A06)
- Missing CSRF protection on state-changing routes (A08)
