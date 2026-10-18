---
name: tauri-architecture
description: "Design or navigate Tauri frontend/Rust boundaries, process structure, and application architecture."
---

# Tauri v2 Architecture

Tauri builds desktop and mobile apps from a web frontend driving a Rust backend. Unlike Electron, it does **not** bundle a browser engine — it uses the OS's native WebView, so binaries are small. This skill is distilled from the official Tauri v2 documentation (https://v2.tauri.app).

## When to Use This Skill

- Setting up a new Tauri v2 project or auditing an existing one
- Deciding whether logic belongs in the Rust core or the web frontend
- Understanding why `lib.rs` exists and how it differs from `main.rs`
- Editing `tauri.conf.json`
- Migrating a Tauri v1 codebase to v2

## The Two-Process Split

A Tauri app runs as **two cooperating sides**:

| Side | Language | Runs | Responsibilities |
|------|----------|------|------------------|
| **Core** | Rust | Native process | Window/lifecycle management, system access, IPC routing, security enforcement, plugins |
| **WebView(s)** | HTML/CSS/JS | OS WebView (WRY) | UI rendering, user interaction; calls into Core via IPC |

The Core is the trusted, privileged side; the WebView is treated as untrusted. Anything sensitive (filesystem, network beyond fetch, spawning processes) must be done in Rust and exposed deliberately through commands gated by capabilities.

Underlying libraries: **TAO** (windowing/event loop) and **WRY** (WebView abstraction). The Core is multi-threaded and event-driven; multiple WebView windows can exist, each isolated.

## Project Layout

```
my-app/
├─ src/                      # frontend (any framework or vanilla)
├─ src-tauri/
│  ├─ src/
│  │  ├─ lib.rs              # app definition — the run() fn lives here
│  │  └─ main.rs             # thin desktop entry; calls the lib
│  ├─ capabilities/          # permission grants (v2 flagship — see tauri-capabilities)
│  ├─ icons/
│  ├─ tauri.conf.json        # the app manifest
│  ├─ Cargo.toml
│  └─ build.rs               # runs tauri_build::build()
└─ package.json
```

## The lib.rs / main.rs Entry Split (v2-specific)

In Tauri v2 the application is defined in **`lib.rs`**, not `main.rs`. This is what makes a single codebase target both desktop and mobile — mobile platforms load the app as a library, so the entry point must be a library function.

```rust
// src-tauri/src/lib.rs
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {name}!")
}
```

```rust
// src-tauri/src/main.rs — desktop binary entry only
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    app_lib::run();   // crate name comes from the `name` in [lib] / Cargo.toml
}
```

> ✅ **DO** put your `Builder` setup in `run()` inside `lib.rs`.
> ❌ **DON'T** put the `Builder` in `main.rs` — mobile targets never call `main`, so the app would have no entry point on iOS/Android.

The `#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]` line in `main.rs` suppresses the extra console window on Windows in release builds.

## tauri.conf.json (the manifest)

The central config. Key top-level keys in v2:

```json
{
  "$schema": "https://schema.tauri.app/config/2",
  "productName": "my-app",
  "version": "0.1.0",
  "identifier": "com.example.myapp",
  "build": {
    "frontendDist": "../dist",
    "devUrl": "http://localhost:5173",
    "beforeDevCommand": "npm run dev",
    "beforeBuildCommand": "npm run build"
  },
  "app": {
    "windows": [{ "title": "my-app", "width": 800, "height": 600 }],
    "security": {
      "csp": null
    }
  },
  "bundle": {
    "active": true,
    "targets": "all",
    "icon": ["icons/icon.png"]
  }
}
```

v1 → v2 renames worth knowing: `tauri` → split into `app` + `bundle`; `build.distDir` → `build.frontendDist`; `build.devPath` → `build.devUrl`; `package.productName`/`package.version` → top-level `productName`/`version`; `tauri.bundle.identifier` → top-level `identifier`. The whole `allowlist` block is **gone** (replaced by capabilities).

## Getting Started

```bash
# scaffold (interactive — pick a frontend)
npm create tauri-app@latest

# run in dev
npm run tauri dev

# build a release bundle
npm run tauri build
```

The `@tauri-apps/cli` provides the `tauri` command; `tauri-build` (build dependency) and the `tauri` crate are the Rust side.

---

## Migrating from Tauri v1 to v2

The official automated path:

```bash
npm install @tauri-apps/cli@latest
npm run tauri migrate
```

`tauri migrate` updates `Cargo.toml`/`package.json` dependencies, rewrites `tauri.conf.json` to the v2 schema, and scaffolds a `capabilities/` file from your old allowlist. Manual follow-ups:

| v1 | v2 |
|----|----|
| `tauri.conf.json` `allowlist` | **Capabilities** — `src-tauri/capabilities/*.json` + plugin permissions (see tauri-capabilities) |
| Built-in APIs (`@tauri-apps/api/fs`, `/dialog`, `/shell`, …) | **Separate plugins** — `@tauri-apps/plugin-fs`, `-dialog`, `-shell`, etc. (see tauri-plugins) |
| `import { invoke } from '@tauri-apps/api/tauri'` | `import { invoke } from '@tauri-apps/api/core'` |
| App defined in `main.rs` | App defined in `lib.rs` with `#[cfg_attr(mobile, tauri::mobile_entry_point)]` |
| `app.handle()` returns `AppHandle` | `app.handle()` returns `&AppHandle`; clone with `.clone()` to move into threads/closures |
| `Manager::get_window` | `Manager::get_webview_window` (`Window` → `WebviewWindow`) |
| `window.emit` payload via `emit(event, payload)` | same call shape, but `emit` is on `Emitter` trait — `use tauri::Emitter;` |
| `tauri::api::*` modules | moved into plugins or `tauri::*` submodules |

> ❌ Common migration footgun: after migrating, frontend calls silently fail because the old `allowlist` permissions weren't translated into a capability file. Every command/plugin API now needs an explicit permission grant.

## Configuration Files Deep-Dive

`tauri.conf.json` is the central manifest, but it's one of three files that together define the project, and it can be layered and overridden at several points.

### Per-platform config and merge order

Alongside the base `tauri.conf.json`, Tauri reads an optional **platform-specific** config and merges it on top:

| Platform | JSON file | TOML alternative |
|----------|-----------|------------------|
| Linux | `tauri.linux.conf.json` | `Tauri.linux.toml` |
| Windows | `tauri.windows.conf.json` | `Tauri.windows.toml` |
| macOS | `tauri.macos.conf.json` | `Tauri.macos.toml` |
| Android | `tauri.android.conf.json` | `Tauri.android.toml` |
| iOS | `tauri.ios.conf.json` | `Tauri.ios.toml` |

The platform file is merged into the base config using **JSON Merge Patch (RFC 7396)** — platform values override the matching base keys, and anything not mentioned is inherited unchanged. For example, a `tauri.windows.conf.json` can redefine just `productName` or `bundle.resources` while everything else comes from `tauri.conf.json`:

```json
// src-tauri/tauri.windows.conf.json
{
  "productName": "my-app (Windows)",
  "bundle": { "resources": ["windows-only.dll"] }
}
```

> ✅ **DO** keep cross-platform settings in `tauri.conf.json` and put only the deltas in the per-platform file.
> ❌ **DON'T** duplicate the whole config per platform — merge patch means you only specify what changes.

### tauri.conf.json ↔ Cargo.toml ↔ package.json

Three files, three jobs — keep them aligned:

| File | Owns | Tauri-relevant content |
|------|------|------------------------|
| `tauri.conf.json` | Runtime behavior, bundling, plugins, windows, security | Read by the Tauri runtime **and** the CLI |
| `src-tauri/Cargo.toml` | Rust dependencies | `tauri` + `tauri-build` versions — keep them aligned with your CLI version |
| `package.json` | Node frontend deps + scripts | `dev`/`build` scripts referenced by `build.beforeDevCommand` / `build.beforeBuildCommand` |

The `build.beforeDevCommand` / `beforeBuildCommand` keys in `tauri.conf.json` invoke the frontend scripts defined in `package.json`; `build.frontendDist` / `build.devUrl` point at the output those scripts produce.

### Env-var & CLI config overrides (`--config`)

The CLI `--config` argument applies a further JSON Merge Patch on top of the resolved config. It accepts either a path to a file or a raw JSON string — useful for shipping app flavors (beta/nightly) with a different `identifier` and `productName`:

```bash
# merge an overlay file (note the `--` separating npm args from tauri args)
npm run tauri build -- --config src-tauri/tauri.beta.conf.json

# or inline JSON
npm run tauri build -- --config '{"productName":"my-app Beta"}'
```

### JSON schema

The config supports a `$schema` reference for editor autocompletion and validation:

```json
{ "$schema": "https://schema.tauri.app/config/2" }
```

The default config format is JSON; **JSON5** (comments, trailing commas) and **TOML** (`Tauri.toml`, kebab-case keys, comments) can be enabled via Cargo feature flags (`config-json5` / `config-toml`).

## App Icons

Tauri ships an icon generator that turns one source image into every platform-specific icon format:

```bash
# defaults to ./app-icon.png if no path is given
npm run tauri icon ./app-icon.png
# or: yarn / pnpm / deno tauri icon …  /  cargo tauri icon ./app-icon.png
```

Source should be a **squared PNG or SVG with transparency** (1024×1024 recommended). The command writes into `src-tauri/icons/` and generates:

- **macOS** — `icon.icns`
- **Windows** — `icon.ico`
- **Linux** — `*.png` at multiple sizes (`32x32.png`, `128x128.png`, `128x128@2x.png`)
- **Mobile** — placed directly into the Xcode / Android Studio projects

Reference the generated files in the `bundle.icon` array so they're embedded in the build:

```json
{
  "bundle": {
    "icon": [
      "icons/32x32.png",
      "icons/128x128.png",
      "icons/128x128@2x.png",
      "icons/icon.icns",
      "icons/icon.ico"
    ]
  }
}
```

> The `.ico` and `.icns` entries are what give the built executable and installer their app icon — don't drop them from the array.

## Updating Dependencies & Prerequisites

### Updating Tauri dependencies

Because the JavaScript APIs call into matching Rust code, **both sides must be upgraded together**. Keep `@tauri-apps/api` (npm) and `tauri` (cargo) on matching minor versions, and keep each plugin pair at exact version parity (e.g. `@tauri-apps/plugin-fs` and `tauri-plugin-fs` both `2.2.1`).

```bash
# npm side — CLI + API
npm install @tauri-apps/cli@latest @tauri-apps/api@latest
npm outdated @tauri-apps/cli          # check first

# cargo side — bump versions in src-tauri/Cargo.toml, then:
cd src-tauri && cargo update
# or, with cargo-edit installed: cargo upgrade
```

For a v1 → v2 jump use `npm run tauri migrate` (see the migration section above) rather than a plain version bump.

### Desktop prerequisites (consolidated)

**Rust** (all platforms):

```bash
# Linux / macOS
curl --proto '=https' --tlsv1.2 https://sh.rustup.rs -sSf | sh
# Windows
winget install --id Rustlang.Rustup     # ensure the MSVC toolchain is the default
```

**System WebView / build deps by OS:**

| OS | What to install |
|----|-----------------|
| **Debian/Ubuntu** | `libwebkit2gtk-4.1-dev`, `build-essential`, `curl`, `wget`, `file`, `libxdo-dev`, `libssl-dev`, `libayatana-appindicator3-dev`, `librsvg2-dev` |
| **Arch** | `webkit2gtk-4.1`, `base-devel`, `curl`, `wget`, `file`, `openssl`, `appmenu-gtk-module`, `libappindicator-gtk3`, `librsvg`, `xdotool` |
| **Fedora** | `webkit2gtk4.1-devel`, `openssl-devel`, `curl`, `wget`, `file`, `libappindicator-gtk3-devel`, `librsvg2-devel`, `libxdo-devel` + the C development group |
| **macOS** | Xcode (App Store) for full dev, or `xcode-select --install` for command-line tools (desktop-only) |
| **Windows** | Microsoft C++ Build Tools ("Desktop development with C++") + **WebView2 Runtime** (pre-installed on Windows 10 v1803+); the VBSCRIPT feature is needed only for MSI installer creation |

> On Linux the WebView is `webkit2gtk`; on Windows it's **WebView2** (Edge/Chromium); on macOS it's the system WKWebView — this is why Tauri binaries are small but you need the right native webview dev package per OS.

## Validation Checklist

- [ ] App logic is in `lib.rs::run()`, `main.rs` only calls it
- [ ] `#[cfg_attr(mobile, tauri::mobile_entry_point)]` is on `run()`
- [ ] `tauri.conf.json` uses the v2 schema (`identifier` at top level, `app`/`bundle` split)
- [ ] Frontend imports `invoke` from `@tauri-apps/api/core`, not `/tauri`
- [ ] A `capabilities/` file exists granting the permissions the app actually uses
