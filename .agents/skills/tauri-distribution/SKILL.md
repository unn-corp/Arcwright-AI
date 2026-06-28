---
name: tauri-distribution
description: >
  Ship a Tauri v2 desktop app — building and bundling installers, code signing per OS,
  cross-compilation realities, reducing binary size, and embedding helper binaries via
  the sidecar (externalBin) mechanism.
  USE FOR: producing release installers (.msi/.exe/.dmg/.app/.deb/.rpm/.AppImage),
  code-signing and notarization, shrinking the binary, or bundling/running an external
  executable (a sidecar) alongside the app.
  DO NOT USE FOR: auto-updates (see tauri-plugins, updater section), mobile builds (see
  tauri-mobile), or dev-time config (see tauri-architecture).
---

# Tauri v2 Distribution

Turning a Tauri project into signed, installable artifacts. Distilled from https://v2.tauri.app/distribute/ and /develop/sidecar/.

## When to Use This Skill

- Producing release installers for Windows/macOS/Linux
- Code signing and (macOS) notarization
- Cross-compilation questions
- Shrinking the release binary
- Bundling and invoking a sidecar (external) executable

## Building & Bundling

```bash
npm run tauri build
```

This runs `beforeBuildCommand`, compiles Rust in release mode, then bundles installers configured under `bundle` in `tauri.conf.json`:

```json
{
  "bundle": {
    "active": true,
    "targets": "all",
    "icon": ["icons/32x32.png", "icons/128x128.png", "icons/icon.icns", "icons/icon.ico"],
    "resources": ["assets/*"],
    "externalBin": ["binaries/my-sidecar"]
  }
}
```

Default bundle targets per OS:

| OS | Artifacts |
|----|-----------|
| Windows | `.msi` (WiX) and/or `.exe` (NSIS) |
| macOS | `.app` and `.dmg` |
| Linux | `.deb`, `.rpm`, `.AppImage` |

Set `targets` to `"all"` or an explicit list (e.g. `["deb", "appimage"]`). Use `tauri build --target <triple>` / `--bundles <list>` to override per invocation.

## Code Signing (per OS)

Signing is **per platform** and required for a trusted install (and for the updater).

- **Windows:** sign with a code-signing certificate. Configure `bundle.windows.certificateThumbprint` (or use Azure Trusted Signing / a signing command). Unsigned apps trigger SmartScreen warnings.
- **macOS:** sign with a Developer ID certificate, then **notarize** with Apple. Provide `APPLE_CERTIFICATE`, `APPLE_SIGNING_IDENTITY`, and notarization credentials (`APPLE_ID` + app-specific password, or an API key) via environment variables; the bundler signs and can notarize/staple. Unsigned/un-notarized apps are blocked by Gatekeeper.
- **Linux:** AppImages can be GPG-signed; `.deb`/`.rpm` follow distro signing conventions.

> Sign release artifacts before distribution. For the **updater**, also sign the bundle with the Tauri updater key (separate from OS code signing) — see tauri-plugins.

## Cross-Compilation Reality

Tauri relies on the OS's native WebView and platform toolchains, so **cross-compiling is limited**. Practical guidance:

- Build each target **on its own OS** (or a matching CI runner) — this is the recommended path.
- macOS can build both `x86_64-apple-darwin` and `aarch64-apple-darwin` (and a "universal" macOS binary via `--target universal-apple-darwin`).
- Windows ARM64 and Linux ARM cross-builds are possible but fiddly; CI matrices (GitHub Actions with `tauri-action`) are the usual answer for multi-platform releases.

> ❌ **DON'T** expect to bundle a macOS `.dmg` or Windows `.msi` from Linux. ✅ **DO** use a per-OS CI matrix.

## Reducing Binary Size

Tauri binaries are already small (no bundled browser), but you can trim further. Add a release profile to the **workspace/root `Cargo.toml`**:

```toml
[profile.release]
codegen-units = 1   # better optimization
lto = true          # link-time optimization
opt-level = "s"     # optimize for size ("z" = even smaller)
strip = true        # strip symbols
panic = "abort"     # smaller, no unwinding
```

Also: minify/treeshake the frontend bundle, and keep capabilities/plugins to what you use.

## Sidecar / External Binaries

A **sidecar** is an external executable bundled with and shipped inside your app (e.g. a Python server, an ML runtime, a CLI). Declare it in `bundle.externalBin`:

```json
{ "bundle": { "externalBin": ["binaries/my-server"] } }
```

The binary file on disk **must** be suffixed with the Rust target triple, e.g. `binaries/my-server-x86_64-pc-windows-msvc.exe`, `binaries/my-server-aarch64-apple-darwin`. Find your triple with `rustc -Vv` (look at `host:`). Tauri strips the triple at runtime so you reference it by its base name.

Run it via the **shell plugin** (`tauri add shell`), using `sidecar`:

```rust
use tauri_plugin_shell::ShellExt;

#[tauri::command]
async fn run_sidecar(app: tauri::AppHandle) -> Result<String, String> {
    let sidecar = app.shell().sidecar("my-server").map_err(|e| e.to_string())?;
    let output = sidecar.output().await.map_err(|e| e.to_string())?;
    Ok(String::from_utf8_lossy(&output.stdout).into_owned())
}
```

From the frontend:

```js
import { Command } from '@tauri-apps/plugin-shell';
const command = Command.sidecar('binaries/my-server', ['--port', '8080']);
const output = await command.execute();
```

> Sidecar execution is gated by **shell permissions** with a scope — grant `shell:allow-execute` (or the sidecar-specific permission) in a capability, or the spawn is denied (see tauri-capabilities). Pass arguments through the scoped `args` allowlist.

`resources` (in `bundle`) embeds non-executable files (data, models, assets), accessed at runtime via the path API resolving `$RESOURCE`.

## CI / GitHub Actions with `tauri-action`

The canonical multi-platform release path is a GitHub Actions matrix driving [`tauri-apps/tauri-action`](https://v2.tauri.app/distribute/pipelines/github/). One job per OS builds and uploads its native artifacts to a draft GitHub Release.

```yaml
name: 'release'
on:
  push:
    tags: ['v*']

jobs:
  publish-tauri:
    permissions:
      contents: write
    strategy:
      fail-fast: false
      matrix:
        include:
          - platform: 'macos-latest'   # Apple Silicon
            args: '--target aarch64-apple-darwin'
          - platform: 'macos-latest'   # Intel
            args: '--target x86_64-apple-darwin'
          - platform: 'ubuntu-22.04'
            args: ''
          - platform: 'windows-latest'
            args: ''

    runs-on: ${{ matrix.platform }}
    steps:
      - uses: actions/checkout@v4

      - name: install Linux dependencies
        if: matrix.platform == 'ubuntu-22.04'
        run: |
          sudo apt-get update
          sudo apt-get install -y libwebkit2gtk-4.1-dev libappindicator3-dev \
            librsvg2-dev patchelf

      - uses: actions/setup-node@v4
        with:
          node-version: lts/*

      - uses: dtolnay/rust-toolchain@stable
        with:
          targets: ${{ matrix.platform == 'macos-latest' && 'aarch64-apple-darwin,x86_64-apple-darwin' || '' }}

      - run: npm ci

      - uses: tauri-apps/tauri-action@v0
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          # --- Updater signing (Tauri key, separate from OS code signing) ---
          TAURI_SIGNING_PRIVATE_KEY: ${{ secrets.TAURI_SIGNING_PRIVATE_KEY }}
          TAURI_SIGNING_PRIVATE_KEY_PASSWORD: ${{ secrets.TAURI_SIGNING_PRIVATE_KEY_PASSWORD }}
          # --- macOS code signing + notarization ---
          APPLE_CERTIFICATE: ${{ secrets.APPLE_CERTIFICATE }}
          APPLE_CERTIFICATE_PASSWORD: ${{ secrets.APPLE_CERTIFICATE_PASSWORD }}
          APPLE_SIGNING_IDENTITY: ${{ secrets.APPLE_SIGNING_IDENTITY }}
          APPLE_ID: ${{ secrets.APPLE_ID }}
          APPLE_PASSWORD: ${{ secrets.APPLE_PASSWORD }}
          APPLE_TEAM_ID: ${{ secrets.APPLE_TEAM_ID }}
        with:
          tagName: ${{ github.ref_name }}
          releaseName: 'App v__VERSION__'
          releaseBody: 'See the assets to download and install this version.'
          releaseDraft: true
          prerelease: false
          args: ${{ matrix.args }}
```

Notes:
- `permissions: contents: write` is required for the action to create/edit the Release.
- `tauri-action` substitutes `__VERSION__` from `tauri.conf.json`.
- `TAURI_SIGNING_PRIVATE_KEY` (+ `_PASSWORD`) are the **updater** key — they make the action emit `.sig` files and a `latest.json`. They are independent of the per-OS code-signing certificates above.
- Windows code signing (`certificateThumbprint`, Azure Trusted Signing, or a custom `signCommand`) is wired per the Windows signing guide; macOS uses the `APPLE_*` env vars consumed by the bundler.

## Updater Distribution Flow (release side)

This is the **release/hosting** side of updates — distinct from the in-app updater plugin mechanics (see tauri-plugins). The app checks one of two endpoint shapes:

**1. Static `latest.json` manifest** — host a single JSON file (e.g. on GitHub Releases or a CDN) listing every platform. `tauri-action` can generate it for you when the signing key is present.

```json
{
  "version": "1.0.0",
  "notes": "Update notes here",
  "pub_date": "2024-01-15T10:30:00Z",
  "platforms": {
    "linux-x86_64":   { "signature": "<contents of .sig>", "url": "https://example.com/app-1.0.0-x86_64.AppImage" },
    "windows-x86_64": { "signature": "<contents of .sig>", "url": "https://example.com/app-setup-1.0.0.exe" },
    "darwin-x86_64":  { "signature": "<contents of .sig>", "url": "https://example.com/app-1.0.0.app.tar.gz" },
    "darwin-aarch64": { "signature": "<contents of .sig>", "url": "https://example.com/app-1.0.0-aarch64.app.tar.gz" }
  }
}
```

Required per platform: `version`, `platforms.<target>.url`, `platforms.<target>.signature`. The `signature` value is the **content** of the `.sig` file generated next to each bundle at build time — not a path or URL.

**2. Dynamic update server** — point the updater at an endpoint that returns the manifest for the requesting client. Tauri substitutes these into the configured URL:

| Variable | Value |
|----------|-------|
| `{{target}}` | OS — `linux`, `windows`, `darwin` |
| `{{arch}}` | CPU — `x86_64`, `i686`, `aarch64`, `armv7` |
| `{{current_version}}` | the version the running app reports |

```jsonc
// tauri.conf.json → plugins.updater.endpoints
"https://releases.myapp.com/{{target}}/{{arch}}/{{current_version}}"
```

The server replies **HTTP 200** with a manifest (`version`, `url`, `signature`, `pub_date`, `notes`) when an update exists, or **HTTP 204 No Content** when the client is already current. End to end: build with the updater key set → host the signed artifact + its `.sig` content → publish/serve `latest.json` (static) or compute the response from the substituted path (dynamic).

## App Store & Additional Targets

Beyond the default installers, Tauri documents several store and packaging targets:

- **macOS App Store (MAS)** — build a `universal-apple-darwin` bundle. Provide an `Entitlements.plist` (referenced via `bundle.macOS.entitlements`) containing `com.apple.security.app-sandbox: true`, `com.apple.application-identifier` (`$TEAM_ID.$IDENTIFIER`), and `com.apple.developer.team-identifier`. App Store builds require the hardened runtime, a "Mac App Store Connect" **provisioning profile** (embedded via `bundle.macOS.files`), a set `bundle.category`, and an `Info.plist` declaring `ITSAppUsesNonExemptEncryption`. Sign the `.pkg` with a *Mac Installer Distribution* certificate (`xcrun productbuild --sign`) and upload via `xcrun altool` using App Store Connect API credentials (`APPLE_API_KEY_ID`, `APPLE_API_ISSUER`).
- **Microsoft Store** — Tauri emits EXE/MSI installers, **not MSIX**, so the Store listing links to your installer (register the app as "EXE or MSI app" in Partner Center). Use the **offline** WebView install mode and ensure silent install support (NSIS `/S`, MSI `/quiet`). Keep a separate `tauri.microsoftstore.conf.json` merged at bundle time so Store-specific settings don't affect normal distribution; the app must be code-signed and handle its own auto-update.
- **Snapcraft (Snap)** — author a `snapcraft.yaml` (`base: core22`, `confinement: strict`, `grade: stable`). Build deps include `libwebkit2gtk-4.1-dev`, `libssl-dev`, `libxdo-dev`, `librsvg2-dev` plus `rustup`/`node`; runtime deps include `libwebkit2gtk-4.1-0` and `libayatana-appindicator3-1`. The `override-build` step runs the npm + `tauri build` flow and extracts the `.deb`. Build with `snapcraft`, then `snapcraft login` and `snapcraft upload --release=stable <snap>`; or connect the repo for automated builds.
- **AUR (Arch)** — ship a `PKGBUILD` with runtime `depends` (cairo, desktop-file-utils, gdk-pixbuf2, glib2, gtk3, hicolor-icon-theme, libsoup, pango, `webkit2gtk-4.1`). Two paths: repackage the prebuilt `.deb` (extract binaries, ship a `.install` script to refresh icon/desktop caches), or build from source with `makedepends` (git, cargo, pnpm, nodejs) and a `pkgver()` function. Generate `.SRCINFO` (`makepkg --printsrcinfo > .SRCINFO`), test with `makepkg`, then push to the AUR git repo.
- **Google Play** — for Android builds; see the dedicated /distribute/google-play/ guide (pairs with tauri-mobile).

## Custom Sign Command & Entitlements

For non-default toolchains or hosted signing services, Tauri supports a **custom `signCommand`** (e.g. `bundle.windows.signCommand`, and the macOS sign config) — the bundler invokes your command with the artifact path instead of its built-in signing, letting you delegate to cloud HSMs, `osslsigncode`, or vendor CLIs.

macOS specifics:
- `bundle.macOS.signingIdentity` (or env `APPLE_SIGNING_IDENTITY`) selects the certificate; find it with `security find-identity -v -p codesigning`. Use `"signingIdentity": "-"` for ad-hoc signing (no Apple credentials, minimal Gatekeeper benefit).
- `bundle.macOS.entitlements` points at the `.plist` enabling the **hardened runtime** entitlements (required for notarization).
- CI signing env: `APPLE_CERTIFICATE` (base64 `.p12`), `APPLE_CERTIFICATE_PASSWORD`, `KEYCHAIN_PASSWORD`. Notarize via App Store Connect API (`APPLE_API_ISSUER`, `APPLE_API_KEY`, `APPLE_API_KEY_PATH`) or Apple ID (`APPLE_ID`, `APPLE_PASSWORD`, `APPLE_TEAM_ID`).

## CrabNebula Cloud (managed option)

[CrabNebula Cloud](https://v2.tauri.app/distribute/crabnebula-cloud/) is Tauri's official managed distribution platform — a global CDN that hosts your installers and updates cost-effectively, integrates directly with the Tauri updater plugin, and exposes download metrics and multiple release channels, so you avoid hosting your own `latest.json`/update server. Setup is sign in via GitHub → create an org and application → upload bundles with the provided CLI or GitHub Action.

## Validation Checklist

- [ ] `bundle.active: true` and `targets` set to the formats you want
- [ ] Icons provided for every platform (`.ico`, `.icns`, PNGs)
- [ ] Each platform's artifacts are built on (or in CI for) that platform
- [ ] Release artifacts are code-signed (and macOS notarized)
- [ ] Sidecar files are suffixed with the correct target triple and listed in `externalBin`
- [ ] Sidecar/shell execution has a matching scoped capability permission
- [ ] Size-sensitive builds set a `[profile.release]` with `lto`/`strip`/`opt-level`
