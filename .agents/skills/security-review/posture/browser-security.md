# 17. Browser & Client-Side Security (Headers, CSP, SRI, Clickjacking)
**Maps to:** `references/xss.md`, `references/csrf.md`, `references/misconfiguration.md`

**Principle:** defense-in-depth in the browser. Even when app code has a bug, security
**response headers** and **integrity controls** shrink the blast radius — they turn an XSS
into a no-op, block clickjacking, and stop a compromised third-party script from skimming
data. The classic failure (CS253's "I'm harvesting credit card numbers from your site"):
an external `<script>` with no integrity check on a payment page → **Magecart** card theft.

> This is HTML/SPA-facing. Mark **N/A** for a pure JSON API / backend with no served HTML.

**Detect:** served HTML, server middleware (`helmet`, secure-headers), framework header
config (Next.js `headers()` / `middleware.ts`, Django `SECURE_*`, Rails), `<meta http-equiv>`,
and `<script src>` / `<link>` pointing at CDNs.

**Run:**
```bash
grep -rniE "Content-Security-Policy|X-Frame-Options|Strict-Transport-Security|X-Content-Type-Options|Referrer-Policy|Permissions-Policy|frame-ancestors|helmet|secure_headers|SECURE_(HSTS|SSL|CONTENT)" --include=*.{js,ts,jsx,tsx,py,rb,go,conf,json} .
# External scripts/styles WITHOUT subresource integrity (potential supply-chain injection)
grep -rniE "<script[^>]+src=|<link[^>]+(href|rel=.?stylesheet)" --include=*.{html,jsx,tsx,ejs,hbs,erb,vue,svelte} . | grep -iE "https?://|//cdn|unpkg|jsdelivr|googleapis" | grep -vi "integrity="
# CSP weakeners / DOM-XSS hardening
grep -rniE "unsafe-inline|unsafe-eval|require-trusted-types-for|trustedTypes|integrity=" --include=*.{js,ts,jsx,tsx,html,json} .
# Next.js header config
grep -rniE "async headers\(\)|key:\s*['\"](Content-Security-Policy|X-Frame-Options|Strict-Transport-Security)" $(git ls-files | grep -iE "next.config|middleware") 2>/dev/null
```

**What good looks like:**
- **Content-Security-Policy** present and meaningful — `default-src 'self'`, no
  `unsafe-inline`/`unsafe-eval` (use **nonces or hashes**), `object-src 'none'`,
  `base-uri 'self'`. This is the single strongest XSS mitigation after output encoding.
- **Clickjacking blocked** — `X-Frame-Options: DENY`/`SAMEORIGIN` *or* CSP
  `frame-ancestors 'self'` (CSP supersedes XFO).
- **`X-Content-Type-Options: nosniff`**, a sane **`Referrer-Policy`**
  (`strict-origin-when-cross-origin`/`no-referrer`), and a **`Permissions-Policy`** locking
  down camera/mic/geolocation/payment to what's used.
- **`Strict-Transport-Security`** in prod (also topic 9).
- **Subresource Integrity (SRI):** every third-party `<script>`/`<link>` from a CDN carries
  `integrity="sha384-…"` + `crossorigin` — *mandatory* on auth/checkout/payment pages.
  Better: self-host critical scripts so there's no third-party trust at all.
- **Trusted Types** (`require-trusted-types-for 'script'`) on JS-heavy apps to kill DOM-XSS sinks.
- A headers middleware (`helmet`, `django-csp`, `secure_headers`) applied **globally**, not per-route.
- **Cookies** `HttpOnly; Secure; SameSite=Lax/Strict` (cross-ref topics 5, 9) — the SameSite
  flag is the modern CSRF backstop (topic 4).

**Red flags:**
| Pattern | Severity |
|---------|----------|
| External `<script>` from a CDN with **no SRI** on a payment/auth/checkout page (Magecart) | **High** |
| No CSP on an app that renders user/3rd-party content | **Medium** (High on payment/auth pages) |
| CSP present but neutered: `unsafe-inline` + `unsafe-eval`, no nonce/hash | **Medium** |
| No `X-Frame-Options`/`frame-ancestors` → clickjacking of state-changing UI | **Medium** |
| Cookies missing `HttpOnly`/`Secure`/`SameSite` | **Medium/High** |
| Missing `nosniff` / `Referrer-Policy` / `Permissions-Policy` | **Low** (defense-in-depth) |
| No Trusted Types on a large client app with `innerHTML`/`dangerouslySetInnerHTML` usage | **Low** |

**Tools (hybrid):**
```bash
# Static: confirm a headers library is wired and CSP isn't all unsafe-*
grep -rniE "helmet\(|contentSecurityPolicy|django-csp|csp_header|secure_headers" --include=*.{js,ts,py,rb} .
# Live (optional, if a URL is in scope): an external header grader gives the authoritative result
# e.g. mozilla observatory / securityheaders.com — note these are runtime, not repo-static
```

**Framework notes:**
- **Next.js:** headers go in `next.config.js` `async headers()` or `middleware.ts`; a strict
  CSP needs a per-request **nonce** set in middleware and read in the app — check it's actually
  wired, not just declared with `unsafe-inline`.
- **Django:** `SECURE_HSTS_*`, `SECURE_CONTENT_TYPE_NOSNIFF`, `X_FRAME_OPTIONS`, plus
  `django-csp` for CSP. **Express:** `helmet()` as the first middleware.

**Verdict guidance:**
- ✅ **Pass** — global headers middleware, meaningful nonce/hash CSP, clickjacking blocked,
  SRI on all third-party scripts (or self-hosted), secure cookies.
- ⚠️ **Weak** — some headers set but CSP missing/`unsafe-*`, or SRI inconsistent, or headers
  applied per-route not globally.
- ❌ **Fail** — no CSP and no clickjacking protection on an app rendering untrusted content,
  or unintegrity-checked third-party scripts on a payment/auth page.

Report findings as `SCAN-NN` with the template/config `file:line`.
