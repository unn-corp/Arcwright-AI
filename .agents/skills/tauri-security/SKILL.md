---
name: tauri-security
description: "Review Tauri trust boundaries, content policy, webview exposure, commands, and untrusted input."
---

# Tauri v2 Security: CSP & Isolation

Two complementary WebView-side defenses layer on top of the capability ACL: a **Content Security Policy** restricts what the frontend can load and run, and the **Isolation pattern** interposes a sandboxed app between the frontend and Tauri's IPC. Distilled from https://v2.tauri.app/security/csp/ and /security/isolation/.

## When to Use This Skill

- Restricting which scripts/styles/connections the WebView may load (XSS mitigation)
- You ship third-party frontend code and want to vet or sanitize IPC before it reaches Rust
- Hardening a Tauri app prior to release
- Diagnosing why an asset/connection is blocked by CSP

## Content Security Policy (CSP)

Set CSP under `app.security.csp` in `tauri.conf.json`. When set, Tauri **automatically injects** nonces and hashes for the scripts/styles it controls (the bundled frontend), and rewrites the policy at build time — you don't manage Tauri's own nonces by hand.

```json
{
  "app": {
    "security": {
      "csp": {
        "default-src": "'self'",
        "img-src": "'self' asset: http://asset.localhost",
        "connect-src": "'self' https://api.example.com",
        "style-src": "'self' 'unsafe-inline'"
      }
    }
  }
}
```

A string form is also accepted:

```json
"csp": "default-src 'self'; connect-src 'self' https://api.example.com"
```

Key points:

- `csp: null` (the scaffold default) means **no CSP** — fine for early dev, but set one before release.
- To load local files through the asset protocol, include `asset:` and `http://asset.localhost` (and on macOS the custom scheme) in the relevant directives, and enable the asset protocol in config.
- Use `dangerousDisableAssetCspModification` only if you must opt specific directives out of Tauri's automatic modification — it weakens the guarantees.
- A separate `devCsp` can relax the policy for `tauri dev` (e.g. allowing the dev server's websocket) without loosening production.

> ✅ **DO** start from `default-src 'self'` and widen only the specific directives you need.
> ❌ **DON'T** ship with `csp: null` or a blanket `default-src *` — that removes the XSS mitigation entirely.

## The Isolation Pattern

The Isolation pattern injects a **separate, sandboxed `<iframe>` application** that intercepts every IPC message from the frontend *before* it reaches the Tauri core. This lets you validate, sanitize, or reject messages even if your main frontend (or a dependency) is compromised. It is the strongest option when you can't fully trust the frontend code.

### 1. Create the isolation app

A minimal standalone HTML+JS app in its own directory (e.g. `src-tauri/isolation/` or `dist-isolation/`):

```html
<!-- dist-isolation/index.html -->
<!DOCTYPE html>
<html>
  <head><script type="module" src="index.js"></script></head>
  <body></body>
</html>
```

```js
// dist-isolation/index.js
import { setHook } from '@tauri-apps/api/isolation';

setHook((payload) => {
  // Inspect / sanitize / reject the IPC payload here.
  // Return the (possibly modified) payload to forward it on.
  if (payload.cmd === 'dangerous_command') {
    throw new Error('blocked by isolation app');
  }
  return payload;
});
```

### 2. Enable it in tauri.conf.json

```json
{
  "app": {
    "security": {
      "pattern": {
        "use": "isolation",
        "options": { "dir": "../dist-isolation" }
      }
    }
  }
}
```

The default pattern is `"brownfield"` (no isolation). Switching `use` to `"isolation"` activates the iframe interception.

How it works: the IPC payload is encrypted with a per-session key generated in the isolation iframe, so the main frontend can't forge messages that bypass the hook. Isolation is a **WebView-side** boundary; it complements, and does not replace, the capability ACL (which is enforced in Rust).

> Isolation runs on platforms with a compliant WebView. Verify behavior on each target platform, and keep the isolation app tiny and dependency-free to minimize its own attack surface.

## HTTP Response Headers

Beyond CSP, Tauri can attach extra security headers to the responses it serves to the WebView via `app.security.headers`. These are the CSP-adjacent defenses against clickjacking, MIME-sniffing, and cross-origin isolation attacks.

```json
{
  "app": {
    "security": {
      "headers": {
        "Cross-Origin-Opener-Policy": "same-origin",
        "Cross-Origin-Embedder-Policy": "require-corp",
        "Cross-Origin-Resource-Policy": "same-origin",
        "X-Content-Type-Options": "nosniff",
        "Permissions-Policy": "camera=(), microphone=()",
        "Timing-Allow-Origin": [
          "https://developer.mozilla.org",
          "https://example.com"
        ]
      }
    }
  }
}
```

Settable header keys: `Access-Control-Allow-Credentials`, `Access-Control-Allow-Headers`, `Access-Control-Allow-Methods`, `Access-Control-Expose-Headers`, `Access-Control-Max-Age`, `Cross-Origin-Embedder-Policy`, `Cross-Origin-Opener-Policy`, `Cross-Origin-Resource-Policy`, `Permissions-Policy`, `Service-Worker-Allowed`, `Timing-Allow-Origin`, `X-Content-Type-Options`, and `Tauri-Custom-Header` (testing only — not for production).

Value formats:

- **String** — used directly.
- **Array** — items joined with commas (e.g. an origin allow-list).
- **Object** (key-value) — each pair rendered as `key value`, pairs joined with semicolons (used for structured headers like `Permissions-Policy`).
- **`null`** — the header is ignored / not emitted.

> What each buys you: `X-Content-Type-Options: nosniff` stops MIME-sniffing; `Cross-Origin-Opener-Policy` + `Cross-Origin-Embedder-Policy` enable cross-origin isolation (and unlock `SharedArrayBuffer`); `Cross-Origin-Resource-Policy` limits who can embed your resources. There is no dedicated `X-Frame-Options` key here — clickjacking is addressed primarily through CSP `frame-ancestors` and the COOP/CORP set.

## Asset Protocol Scope

The **asset protocol** lets the WebView load local files (images, video, etc.) via a custom scheme, usually through the `convertFileSrc()` helper from `@tauri-apps/api/core`. It is gated by its **own** scope under `app.security.assetProtocol` — this is *distinct from the `fs` plugin scope*, which governs the filesystem plugin's read/write commands. A path being readable by the `fs` plugin does **not** make it loadable via the asset protocol, and vice-versa.

```json
{
  "app": {
    "security": {
      "assetProtocol": {
        "enable": true,
        "scope": ["$APPCACHE/**/*", "$RESOURCE/**/*"]
      }
    }
  }
}
```

The `scope` uses Tauri's `FsScope` type in either form:

```json
// allow-list array form
"scope": ["$HOME/documents/**/*", "$APPCACHE/**/*"]

// object form with deny rules + options
"scope": {
  "allow": ["$APPCACHE/**/*"],
  "deny": ["$APPCACHE/**/secrets/**"],
  "requireLiteralLeadingDot": false
}
```

Key behaviors:

- **Deny wins** — when an `allow` and a `deny` pattern both match, the file is denied.
- **Absolute paths only** — patterns must match resolved absolute paths; use the path variables (`$HOME`, `$RESOURCE`, `$APPCACHE`, `$CACHE`, …) or a leading `/`.
- **Dot-files** — wildcards skip dot-prefixed segments (`.ssh`, `.cache`) by default; set `requireLiteralLeadingDot: false` to include them.
- Prefer `**/*` over a bare `**` for file matching.
- For user-picked folders (via a dialog), pair with the `persisted-scope` plugin (`protocol-asset` feature) to keep access across restarts.

> ✅ **DO** scope the asset protocol to the narrowest directories the UI needs, and pair it with `asset:` / `http://asset.localhost` in the CSP `img-src`/`media-src`.
> ❌ **DON'T** assume the `fs` plugin scope covers asset-protocol loads — they are enforced separately.

## Runtime Authority — the Rust-side ACL enforcer

The **Runtime Authority** is the component inside the Tauri Core (Rust) that actually *enforces* the ACL. It holds all permissions, capabilities, and scopes at runtime and decides, for every single IPC call, whether the calling window/webview is allowed to invoke that command. This is the mechanism behind everything described in the **tauri-capabilities** skill — capabilities are the declarative *policy*, the Runtime Authority is the *enforcement*.

On each `invoke` from the WebView it performs three checks:

1. **Command authorization** — does the requesting origin have a permission granting this specific command?
2. **Capability verification** — does the origin (window/webview label) belong to a capability that applies here?
3. **Scope injection** — if the command defines scopes (e.g. fs paths, allowed URLs), the matching allow/deny scope is attached to the request so the command handler sees only what it's permitted to touch.

If any check fails, **the request is denied and the command handler is never called** — the call is blocked at the point of invocation, not inside the command. Because enforcement lives in the trusted Rust core and not in the frontend, a compromised or malicious WebView cannot grant itself access it wasn't declared in `capabilities/`.

> This is why an undeclared permission produces a silent failure (see the migration footgun in tauri-architecture): the Runtime Authority rejected the invoke before your Rust code ran.

## Threat Model: Application Lifecycle + Ecosystem Security

The ACL/capability system exists because Tauri treats the WebView as untrusted and assumes threats arrive across the whole application lifecycle. Use this as a hardening checklist:

| Phase | Threat | Hardening action |
|-------|--------|------------------|
| **Upstream / dependencies** | A compromised or abandoned crate/npm package ships malicious code | Keep Tauri + deps current; run `cargo audit` and `npm audit`; vet the health/maintenance of libraries before adding them |
| **Development** | Dev server serves frontend assets over unauthenticated HTTP on the LAN (code injection); developer machine or repo compromised | Don't develop as admin; keep prod secrets off dev machines; enforce repo access controls + **signed commits** |
| **Build time** | CI/CD has access to source *and* signing keys; builds are not reliably reproducible | Treat the build pipeline as fully trusted infra; minimize who can change it; protect signing keys |
| **Distribution** | Manifest/update server or binary host is hijacked to push tampered updates | Control (or use a trusted provider for) the manifest server, build server, and binary hosting; sign updates |
| **Runtime** | The WebView loads untrusted content / XSS tries to reach system APIs | The layered defenses: **CSP** + **HTTP headers** + **Isolation** at the WebView boundary, and the **capability ACL enforced by the Runtime Authority** in Rust |

Ecosystem note: the Tauri project itself reduces supply-chain risk on its own releases through automated-but-human-reviewed GitHub build pipelines, required signed commits and maintainer-approved PRs on core repos, and pre-release security audits of security-relevant changes. Your app inherits a trustworthy framework, but the lifecycle threats above (your deps, your build, your distribution) remain **your** responsibility — the ACL is the last line, not the only line.

## How These Layers Fit Together

1. **CSP** — limits what the WebView can load/execute (first line vs. XSS).
2. **Isolation** — vets IPC payloads leaving the WebView (defense if the frontend is compromised).
3. **Capabilities/permissions** (see tauri-capabilities) — the Rust core's authority decides if the command is allowed at all.

Use all three for a hardened app; none alone is sufficient.

## Validation Checklist

- [ ] `app.security.csp` is set (not `null`) for release builds, starting from `default-src 'self'`
- [ ] CSP `connect-src` lists only the APIs the app actually calls
- [ ] `asset:` sources are added only to the directives that need local file access
- [ ] If the frontend isn't fully trusted, the Isolation pattern is enabled with a minimal hook app
- [ ] CSP and Isolation are treated as additions to — not replacements for — the capability ACL
