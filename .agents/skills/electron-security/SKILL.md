---
name: electron-security
description: "Harden Electron process boundaries, webPreferences, CSP, navigation, external links, preload exposure, Fuses, embedded content, and device permissions. Use for Electron-specific security reviews."
---

# Electron Security

Electron ships a full Node.js runtime alongside a Chromium renderer. Treat **all remote
content, and any content that can be influenced by remote content, as untrusted** — the
same posture you would take for a web server. A single XSS in a renderer that has Node
access is remote code execution on the user's machine.

Modern Electron (28+) ships secure defaults: `contextIsolation: true`, `sandbox: true`,
and `nodeIntegration: false`. The job is mostly to *not* weaken them, then add the
navigation, CSP, and Fuses layers on top.

## When to Use This Skill

- Creating a `BrowserWindow` and setting `webPreferences`
- Auditing an existing app for the common Electron security misconfigurations
- Adding a Content Security Policy to an Electron app
- Restricting navigation, popups, or `shell.openExternal` targets
- Locking the packaged binary with Electron Fuses
- Reviewing a PR that touches `webPreferences`, `<webview>`, or `loadURL`

## The Process Model

| Process | Runs | Has Node? | Trust |
|---------|------|-----------|-------|
| **Main** | `app`, `BrowserWindow`, native menus, `ipcMain` | Yes (full) | Trusted |
| **Renderer** | Chromium page (your HTML/JS/CSS) | No (with secure defaults) | **Untrusted** |
| **Preload** | Bridge script, runs before the page in an isolated context | Limited Node + `contextBridge` | Trusted boundary |

The preload script is the *only* sanctioned channel between untrusted renderer code and
trusted main-process capabilities. With `contextIsolation: true`, the preload runs in a
separate JavaScript context from the page, so the page cannot reach into preload internals
or prototype-pollute its way to Node. See `electron-ipc` for designing that bridge.

## The Security Baseline

```js
const { BrowserWindow } = require('electron')
const path = require('node:path')

const win = new BrowserWindow({
  webPreferences: {
    preload: path.join(__dirname, 'preload.js'),
    contextIsolation: true,   // default true — NEVER set false
    sandbox: true,            // default true — keep it
    nodeIntegration: false,   // default false — NEVER set true for remote/untrusted content
    webSecurity: true,        // default true — NEVER disable
    allowRunningInsecureContent: false,
  },
})
```

```js
// ❌ NEVER — this hands Node (and thus the OS) to any XSS in the page
new BrowserWindow({
  webPreferences: {
    nodeIntegration: true,
    contextIsolation: false,
    sandbox: false,
    webSecurity: false,
  },
})
```

Rules:
- ❌ **NEVER** enable `nodeIntegration` for content you do not 100% control.
- ❌ **NEVER** disable `contextIsolation` — it is the wall between page and preload.
- ❌ **NEVER** disable `webSecurity` or set `allowRunningInsecureContent: true` to "make
  something work." Fix the underlying resource instead.
- ✅ Set an explicit `preload` path with `path.join(__dirname, ...)`, not a relative URL.

## Content Security Policy

Defense in depth against XSS. Set it via response headers from the main process (preferred
over a `<meta>` tag, which can't restrict everything).

```js
const { session } = require('electron')

session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
  callback({
    responseHeaders: {
      ...details.responseHeaders,
      'Content-Security-Policy': [
        "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; object-src 'none'",
      ],
    },
  })
})
```

- ❌ **NEVER** include `'unsafe-eval'`, and avoid `'unsafe-inline'` for scripts.
- ✅ Prefer `default-src 'self'`; widen only the specific directives you must.

## Validate Navigation and Window Creation

A compromised or malicious page can try to navigate to attacker-controlled URLs or open
popups with their own privileged `webPreferences`. Lock both down per-`webContents`.

```js
const { shell } = require('electron')

app.on('web-contents-created', (_event, contents) => {
  // Block in-page navigation to anything that isn't your own origin
  contents.on('will-navigate', (event, url) => {
    const parsed = new URL(url)
    if (parsed.origin !== 'https://example.com') event.preventDefault()
  })

  // Deny ALL window.open by default; open trusted https externally instead
  contents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://example.com/')) {
      setImmediate(() => shell.openExternal(url))
    }
    return { action: 'deny' }
  })
})
```

`shell.openExternal` hands a URL to the OS, which may launch arbitrary handlers
(`file:`, `smb:`, custom protocols). **Allowlist before calling it** — never pass a
renderer-supplied string straight through.

```js
function openExternalSafely(url) {
  const u = new URL(url)                 // throws on garbage
  if (u.protocol === 'https:') shell.openExternal(url)
}
```

## Electron Fuses

Fuses flip runtime features off in the *packaged* binary, so even a tampered app can't
re-enable them. Flip these off when unused:

- `runAsNode` — disables the `ELECTRON_RUN_AS_NODE` escape hatch
- `enableNodeCliInspectArguments` — blocks `--inspect` debugging of production
- `enableNodeOptionsEnvironmentVariable` — blocks `NODE_OPTIONS` injection
- `embeddedAsarIntegrityValidation` + `onlyLoadAppFromAsar` — verify the app bundle

Use `@electron/fuses` (typically wired into the build):

```js
const { flipFuses, FuseV1Options, FuseVersion } = require('@electron/fuses')

flipFuses('/path/to/MyApp', {
  version: FuseVersion.V1,
  [FuseV1Options.RunAsNode]: false,
  [FuseV1Options.EnableNodeCliInspectArguments]: false,
  [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
  [FuseV1Options.OnlyLoadAppFromAsar]: true,
})
```

## Embedding Web Content Done Right

Apps often need to show content they don't fully control — a third-party page, a docs site,
an OAuth flow. Electron gives you three options, in descending order of safety:

| Approach | What it is | Verdict |
|----------|-----------|---------|
| **`WebContentsView`** | A native view hosting its own `webContents`, composited into a `BaseWindow` | ✅ Preferred for in-app embedding |
| **`<iframe>`** | Standard sandboxed HTML frame | ✅ Fine for trusted/same-origin or `sandbox`-attributed content |
| **`<webview>` tag** | Electron's custom embedding tag | ⚠️ Discouraged — architectural changes, fragile, not guaranteed long-term |

`WebContentsView` is the modern replacement for the now-**deprecated `BrowserView`**. It
composites as a native view, so the embedded content lives in a **separate `webContents`**
with its own isolated process and its own `webPreferences` — the embedder page cannot reach
into it via the DOM the way it can with `<webview>`.

```js
const { BaseWindow, WebContentsView } = require('electron')
const path = require('node:path')

const win = new BaseWindow({ width: 1024, height: 768 })

// Embedded untrusted content — locked-down, isolated webPreferences
const view = new WebContentsView({
  webPreferences: {
    contextIsolation: true,
    sandbox: true,
    nodeIntegration: false,
    // No preload here unless this view genuinely needs a bridge.
  },
})
win.contentView.addChildView(view)
view.setBounds({ x: 0, y: 80, width: 1024, height: 688 })
view.webContents.loadURL('https://third-party.example.com')
```

Because the embedded content has its own `webContents`, the **same guards apply to it**:
the `web-contents-created` handler (above) already catches it, so its `will-navigate`,
`setWindowOpenHandler`, and permission handlers are enforced too. Set its bounds explicitly
(it doesn't flow with HTML layout).

- ✅ Prefer `WebContentsView` over the deprecated `BrowserView` for any new embedding.
- ✅ Give untrusted embedded views the **same secure `webPreferences` baseline** — never a
  laxer one "because it's just an iframe-ish thing."
- ❌ **NEVER** give embedded untrusted content a preload that exposes privileged IPC.
- ⚠️ Avoid `<webview>`; if a legacy reason forces it, handle `will-attach-webview` and
  delete any dangerous `webPreferences` (e.g. `nodeIntegration`) it tries to set.

## Device Access (WebHID / Web Serial / WebUSB / Web Bluetooth)

When a page calls `navigator.hid.requestDevice()`, `navigator.serial.requestPort()`,
`navigator.usb.requestDevice()`, or `navigator.bluetooth.requestDevice()`, Electron does
**not** show Chromium's device chooser by default — you must drive it from main via a
`select-*-device` event, and gate it behind permission handlers. This is a privileged
capability (a page reaching real hardware); treat the device list as something you filter,
not something the page picks freely.

```js
const { app } = require('electron')

app.whenReady().then(() => {
  const ses = win.webContents.session

  // 1) Choose which device to grant. You supply the picker UI/logic.
  ses.on('select-hid-device', (event, details, callback) => {
    event.preventDefault()
    const device = details.deviceList.find(d => d.vendorId === 0x1234)
    callback(device?.deviceId)        // callback() with no id = user cancelled
  })
  // Equivalents: 'select-serial-port', 'select-bluetooth-device'

  // 2) Approve the high-level permission (camera/mic/hid/serial/usb/...).
  ses.setPermissionRequestHandler((wc, permission, callback) => {
    const allowed = new Set(['hid', 'serial'])
    callback(allowed.has(permission))
  })

  // 3) Approve a SPECIFIC device for a SPECIFIC origin (finer-grained;
  //    also consulted on subsequent automatic reconnects).
  ses.setDevicePermissionHandler((details) => {
    return details.origin === 'https://app.example.com'
      && details.device.vendorId === 0x1234
  })
})
```

- ✅ `event.preventDefault()` + `callback(deviceId)` in the `select-*-device` handler — the
  chooser does nothing until you call back.
- ✅ Layer all three: `setPermissionRequestHandler` (does this origin get the *class* of
  device?), the `select-*-device` event (which device this time?), and
  `setDevicePermissionHandler` (is this exact origin↔device pairing allowed, incl. silent
  reconnects?).
- ✅ Allowlist by **origin and by vendor/product ID** — never blanket-grant device access.
- ❌ **NEVER** auto-select the first device without checking the requesting origin.

## ASAR Integrity

`asar` packs your app source into a single archive (`app.asar`) — it bundles files and
*lightly* obscures source, but on its own it is **not** a security boundary: anyone can
unpack an unsigned `.asar`. The **ASAR integrity fuse** turns it into a tamper check by
validating the archive's header hash at runtime against a value embedded in the signed
binary, so a swapped or patched `app.asar` refuses to load.

Two fuses work together (see the Fuses section above):

- `embeddedAsarIntegrityValidation` — verify the `.asar` against the embedded hash.
- `onlyLoadAppFromAsar` — refuse to run app code from anywhere *but* the validated archive
  (closes the "load from the unpacked dir instead" bypass).

Integrity validation is **meaningful only on a code-signed app** — the embedded hash is
protected by the OS signature, so an attacker can't recompute it without re-signing.
electron-builder wires the integrity metadata automatically; with Forge/`@electron/packager`,
`@electron/asar` + the fuses handle it.

**`asarUnpack` for native modules:** native `.node` addons (and anything that must exist as
a real file on disk — binaries you `spawn`, files you load by absolute path) can't be
loaded from inside the archive. Unpack them to `app.asar.unpacked/`:

```jsonc
// electron-builder
{ "build": { "asar": true, "asarUnpack": ["**/*.node", "**/node_modules/sharp/**"] } }
```

```js
// forge.config.js
module.exports = {
  packagerConfig: {
    asar: { unpack: '**/*.node' },   // or unpackDir for whole directories
  },
}
```

- ✅ Keep `asar: true`; enable the integrity fuse on **signed** builds.
- ✅ `asarUnpack` native modules and any file that needs a real on-disk path.
- ❌ **NEVER** treat `asar` alone as protection against tampering — without the integrity
  fuse + signature it's trivially repackable.

## Other Rules

- ✅ Load app content over `https:` or from the local filesystem — never plain `http:`.
- ✅ Verify `permissionRequestHandler` on the session; deny camera/mic/geolocation you
  don't use.
- ❌ Avoid `<webview>`; if required, handle `will-attach-webview` and strip dangerous
  `webPreferences` it tries to set.
- ✅ Keep Electron current — security patches track Chromium. Run the Electronegativity
  audit tool against the app.

## Validation Checklist

- [ ] `contextIsolation: true`, `sandbox: true`, `nodeIntegration: false` on every window
- [ ] `webSecurity` not disabled; no `allowRunningInsecureContent`
- [ ] A restrictive CSP is set (no `unsafe-eval`)
- [ ] `will-navigate` rejects off-origin navigation
- [ ] `setWindowOpenHandler` denies by default
- [ ] `shell.openExternal` only ever receives allowlisted URLs
- [ ] Unused Fuses flipped off in the packaged build
- [ ] Untrusted embedded content uses `WebContentsView` (not deprecated `BrowserView`, not `<webview>`) with the same secure `webPreferences` baseline
- [ ] Device access gated: `select-*-device` handler + `setPermissionRequestHandler` + `setDevicePermissionHandler`, allowlisted by origin and vendor/product ID
- [ ] ASAR integrity fuse enabled on the signed build; native modules `asarUnpack`ed
- [ ] Electron version is recent (security support window)
