---
name: electron-packaging
description: >
  Package and distribute Electron apps: choose Electron Forge vs electron-builder, use
  electron-vite for dev/build of main/preload/renderer, and code-sign for each OS (macOS
  signing + notarization, Windows Authenticode).
  USE FOR: setting up a build/packaging pipeline, producing installers (dmg, nsis, deb,
  rpm), configuring code signing and notarization, choosing a packaging tool, wiring a
  Vite-based Electron build, publishing to app stores (Mac App Store, Microsoft Store,
  Snapcraft), and adopting ECMAScript modules (ESM) in main/preload.
  DO NOT USE FOR: auto-update at runtime (see electron-updates), security hardening (see
  electron-security), or native module compilation (see electron-native-modules).
---

# Electron Packaging & Distribution

Shipping an Electron app means producing platform installers and signing them so the OS
will run them without scary warnings. Two mature toolchains dominate, and a fast dev/build
bundler (electron-vite) sits underneath both.

## When to Use This Skill

- Bootstrapping packaging for a new Electron app
- Producing distributable installers per OS
- Configuring code signing and notarization
- Deciding between Electron Forge and electron-builder
- Setting up electron-vite for the main/preload/renderer bundles

## Forge vs electron-builder

| | **Electron Forge** | **electron-builder** |
|---|---|---|
| Maintained by | Electron team (official) | Community |
| Model | Plugin + maker pipeline | Single config (`build` key / yaml) |
| Bundler | Vite or Webpack plugin | Bring your own |
| Best when | You want the officially-supported, batteries-included path | You want one tool that does build + sign + publish + update feed |

Pick **Forge** for new projects wanting official support; pick **electron-builder** if you
also want its integrated `electron-updater` flow (see `electron-updates`). Don't run both.

### Electron Forge

```bash
npm init electron-app@latest my-app -- --template=vite
cd my-app
npm run make        # produces installers in out/make/
```

`forge.config.js` declares makers (one per target format):

```js
module.exports = {
  packagerConfig: {
    asar: true,
    osxSign: {},                       // see signing section
  },
  makers: [
    { name: '@electron-forge/maker-squirrel' }, // Windows .exe installer
    { name: '@electron-forge/maker-dmg' },       // macOS .dmg
    { name: '@electron-forge/maker-deb' },        // Debian/Ubuntu
    { name: '@electron-forge/maker-rpm' },        // Fedora/RHEL
  ],
}
```

### electron-builder

```bash
npm install --save-dev electron-builder
```

```jsonc
// package.json
{
  "build": {
    "appId": "space.arcwright.myapp",
    "productName": "My App",
    "files": ["dist/**", "package.json"],
    "asar": true,
    "mac": { "target": ["dmg", "zip"], "category": "public.app-category.productivity" },
    "win": { "target": ["nsis"] },
    "linux": { "target": ["AppImage", "deb"] }
  }
}
```

```bash
npx electron-builder --mac --win --linux   # cross-target where the host allows
```

## electron-vite for Dev & Build

`electron-vite` bundles all three Electron entry points (main, preload, renderer) with
Vite — fast HMR for the renderer, proper externals handling for the main process.

```bash
npm create @quick-start/electron@latest
```

```js
// electron.vite.config.js
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'

export default defineConfig({
  main: { plugins: [externalizeDepsPlugin()] },     // keep node_modules external
  preload: { plugins: [externalizeDepsPlugin()] },
  renderer: { /* normal Vite config: react(), etc. */ },
})
```

`externalizeDepsPlugin()` keeps dependencies external for main/preload (they run in Node),
while the renderer is bundled like a normal web app. `electron-vite build` emits to
`out/`, which Forge/electron-builder then package.

- ✅ Keep native modules (and anything needing `__dirname`/`require` at runtime) external
  in the main/preload configs.
- ❌ **NEVER** bundle native `.node` addons into the renderer.

## Code Signing — macOS

Unsigned macOS apps are blocked by Gatekeeper. You need a **Developer ID Application**
certificate, then **notarization** (Apple scans the signed app) and **stapling**.

```bash
# Forge: set env so @electron/osx-sign + @electron/notarize run during `make`
export APPLE_ID="dev@example.com"
export APPLE_APP_SPECIFIC_PASSWORD="abcd-efgh-ijkl-mnop"   # app-specific password
export APPLE_TEAM_ID="ABCDE12345"
```

```js
// forge.config.js — sign then notarize
module.exports = {
  packagerConfig: {
    osxSign: {},                          // uses Developer ID from the keychain
    osxNotarize: {
      appleId: process.env.APPLE_ID,
      appleIdPassword: process.env.APPLE_APP_SPECIFIC_PASSWORD,
      teamId: process.env.APPLE_TEAM_ID,
    },
  },
}
```

- ✅ Use an **app-specific password** (or an App Store Connect API key), never your Apple
  account password.
- ✅ Notarization requires a **hardened runtime** + Developer ID signature.
- ❌ **NEVER** commit certificates, `.p12` files, or app-specific passwords to git.

## Code Signing — Windows (Authenticode)

Windows SmartScreen flags unsigned installers. Sign with an OV or (better, instant-trust)
EV code-signing certificate. Modern certs typically live on an HSM/cloud token.

```jsonc
// electron-builder — Azure Trusted Signing / token-based
{
  "build": {
    "win": {
      "signtoolOptions": {
        "publisherName": "Arcwright LLC"
      }
    }
  }
}
```

Forge signs via `@electron/windows-sign` (configure `windowsSign` in `packagerConfig`).

- ✅ EV certificates build SmartScreen reputation immediately; OV certs accrue it over time.
- ✅ Use a timestamp server so signatures stay valid after the cert expires.
- ❌ **NEVER** store the signing certificate or its password in the repo or CI logs;
  inject from a secret store.

## Store Distribution

Shipping through an OS app store is a **different build** from the Developer-ID / standalone
installer above — different signing identity, extra sandboxing, and store-specific metadata.

### Mac App Store (MAS)

The MAS target is distinct from Developer ID distribution: it uses **Apple Distribution**
signing identities (not Developer ID Application), requires a **provisioning profile**, and
mandates the **App Sandbox**.

```jsonc
// electron-builder
{
  "build": {
    "mac": {
      "appId": "space.arcwright.myapp",
      "category": "public.app-category.productivity"
    },
    "mas": {
      "type": "distribution",
      "provisioningProfile": "build/embedded.provisionprofile",
      "entitlements": "build/entitlements.mas.plist",
      "entitlementsInherit": "build/entitlements.mas.inherit.plist",
      "hardenedRuntime": false
    }
  }
}
```

Key differences from Developer ID:
- ✅ Sign with **Apple Distribution** + **3rd Party Mac Developer** identities; embed a
  **provisioning profile** tied to your App Store Connect app record.
- ✅ The **App Sandbox** is mandatory — `entitlements.mas.plist` must declare
  `com.apple.security.app-sandbox` plus only the capabilities you use (network client,
  file access, etc.). Child Electron helpers inherit via the `*.inherit.plist`.
- ✅ Upload via Transporter / `xcrun altool`; notarization is **not** used for MAS (the
  store review process replaces it).
- ❌ **NEVER** reuse a Developer ID cert for MAS, and vice versa — App Sandbox restrictions
  often surface bugs that don't appear in the standalone build, so test the MAS build
  separately.

### Microsoft Store (AppX / MSIX)

Package as **AppX** (Forge: `@electron-forge/maker-appx`; electron-builder: `appx` target).
Store-signed packages are re-signed by Microsoft, so you don't ship your own cert for the
Store channel; for sideloaded `.appx` you self-sign or use a trusted cert.

```jsonc
// electron-builder
{ "build": { "win": { "target": ["appx"] },
  "appx": { "identityName": "12345Arcwright.MyApp", "publisher": "CN=…",
            "publisherDisplayName": "Arcwright", "applicationId": "MyApp" } } }
```

- ✅ `identityName`/`publisher` must match the values reserved in **Partner Center** for
  your app exactly, or the Store rejects the upload.

### Snapcraft (Linux Snap)

Snap is the Snap Store's confined package format. electron-builder produces it directly
(needs `snapcraft` installed on the build host):

```bash
npx electron-builder --linux snap
```

```jsonc
// electron-builder
{ "build": { "linux": { "target": ["snap"] },
  "snap": { "grade": "stable", "confinement": "strict",
            "plugs": ["default", "browser-support", "network"] } } }
```

- ✅ `confinement: strict` is required for the Snap Store; add `plugs` only for the
  interfaces you actually use.
- ✅ Publish with `snapcraft upload --release=stable my-app.snap` (after `snapcraft login`).

## ESM in Electron

Electron supports **ECMAScript Modules** (`import`/`export`) in the main process, preload,
and renderer — but with caveats that don't apply to a plain Node app. CommonJS still works
everywhere; adopt ESM deliberately, not reflexively.

**Opting in:** either give the file an `.mjs` extension, or set `"type": "module"` in
`package.json` (which makes `.js` files ESM and forces `.cjs` for any remaining CommonJS).

```js
// main.mjs  — ESM main process
import { app, BrowserWindow } from 'electron'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))  // no __dirname in ESM
```

**Main / renderer:** mostly straightforward. Remember ESM has **no `__dirname`/`require`** —
use `import.meta.url` + `fileURLToPath`, and `module.createRequire(import.meta.url)` if you
must `require` a CommonJS-only dependency.

**Preload — the important caveats:**
- An **ESM preload must use the `.mjs` extension** (the `"type": "module"` package field
  does **not** make a `.js` preload load as ESM).
- ESM preloads load **asynchronously**. With `sandbox: true` (the secure default), or with
  `nodeIntegration: false`, the preload must **not** use a top-level `await` that the
  renderer's first script depends on — there's no guarantee the renderer waits for it.
  Keep `contextBridge.exposeInMainWorld(...)` synchronous and at the top level so the API
  is present before the page runs.
- ESM is **not supported in a sandboxed preload that also needs `require`** of certain
  built-ins the same way CJS does; if you hit a wall, keeping the preload as CommonJS
  (`.cjs`) is a perfectly valid, fully-supported choice.

```js
// preload.mjs
import { contextBridge, ipcRenderer } from 'electron'
contextBridge.exposeInMainWorld('api', {           // synchronous, top-level
  ping: () => ipcRenderer.invoke('ping'),
})
```

- ✅ Use `.mjs` (or `"type": "module"`) to opt in; replace `__dirname`/`require` with
  `import.meta.url` helpers.
- ✅ Keep the preload's bridge exposure **synchronous and top-level**; avoid load-bearing
  top-level `await`.
- ❌ **NEVER** assume a `.js` preload is ESM under `"type": "module"` — preload ESM needs
  the explicit `.mjs` extension.
- ✅ When ESM fights the sandbox/preload, a `.cjs` CommonJS preload is a fine fallback.

## Validation Checklist

- [ ] One packaging tool chosen (Forge *or* electron-builder), not both
- [ ] `asar: true` enabled (bundles + lightly obscures app source)
- [ ] Makers/targets cover every OS you ship
- [ ] macOS build is signed with Developer ID **and** notarized + stapled
- [ ] Windows installer is Authenticode-signed with a timestamp
- [ ] No certs, passwords, or API keys committed to the repo
- [ ] Native modules kept external from the renderer bundle
- [ ] Store builds use the right identity (MAS = Apple Distribution + provisioning profile + App Sandbox; AppX identity matches Partner Center; Snap = strict confinement) and are tested separately from the standalone installer
- [ ] If using ESM: preload is `.mjs` with synchronous top-level `contextBridge` exposure; `__dirname`/`require` replaced via `import.meta.url`
