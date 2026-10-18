---
name: tauri-plugins
description: "Add, configure, or implement a Tauri plugin and its frontend/Rust integration."
---

# Tauri v2 Plugins

In v2, most functionality that was built into v1 (fs, dialog, shell, http, notifications…) moved into **separate plugins**. Each plugin has up to three pieces that must all be wired up: the **Rust crate**, the **JS package**, and its **permissions**. Distilled from https://v2.tauri.app/plugin/ and /plugin/updater/.

## When to Use This Skill

- Adding a capability provided by an official plugin (fs, dialog, shell, http, store, notification, opener, os, clipboard-manager, updater, …)
- A plugin's frontend API rejects or its `init()` panics
- Setting up auto-updates with the updater plugin

## The Three Pieces of a Plugin

Every plugin requires:

1. **Rust crate** — added to `src-tauri/Cargo.toml` and registered on the `Builder`
2. **JS package** — `@tauri-apps/plugin-<name>`, imported in the frontend
3. **Permissions** — granted in a `capabilities/*.json` file (see tauri-capabilities)

Miss any one and the plugin won't work.

## Adding a Plugin

The CLI wires up crate + JS + a default permission automatically:

```bash
npm run tauri add fs
# equivalent to:
#   cargo add tauri-plugin-fs           (in src-tauri)
#   npm install @tauri-apps/plugin-fs
#   + adds "fs:default" to a capability
```

Then register it in `lib.rs`:

```rust
// src-tauri/src/lib.rs
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

Use it from the frontend:

```js
import { readTextFile, BaseDirectory } from '@tauri-apps/plugin-fs';

const text = await readTextFile('config.toml', { baseDir: BaseDirectory.AppConfig });
```

Grant the permission (CLI usually does the `*:default` for you):

```json
// src-tauri/capabilities/default.json
{ "permissions": ["fs:default", "fs:allow-read-text-file", "dialog:default"] }
```

> ❌ **DON'T** `cargo add` the crate but forget `.plugin(..init())` — the plugin's commands won't be registered.
> ❌ **DON'T** register the plugin but forget the permission — the JS API will be denied.
> ✅ **DO** treat crate + `init()` + permission as one atomic change. Prefer `tauri add` so all three happen together.

## The Full Official Plugin Catalog

The complete set of official plugins from the v2 plugin index (https://v2.tauri.app/plugin/). Add any with `npm run tauri add <name>` (the first column). Crate = `tauri-plugin-<name>`; JS package = `@tauri-apps/plugin-<name>` unless noted **(Rust-only — no JS package)**. The **Platforms** column shows where the plugin is supported: **both** = desktop (Win/Mac/Linux) + mobile (Android/iOS), **desktop** = desktop-only, **mobile** = mobile-only (Android/iOS).

> ⚠️ **Each plugin ships its OWN permissions.** Adding the crate + `init()` is not enough — you must enable that plugin's permission identifiers (`<plugin>:default`, `<plugin>:allow-<command>`, `<plugin>:deny-<command>`) in a capability file. See **tauri-capabilities** for the permission/capability model in depth.

### Cross-platform (desktop + mobile)

| `tauri add` | Rust crate | JS package | Purpose | Platforms |
|-------------|-----------|-----------|---------|-----------|
| clipboard-manager | `tauri-plugin-clipboard-manager` | `@tauri-apps/plugin-clipboard-manager` | Read/write the system clipboard (text, HTML, image) | both |
| deep-link | `tauri-plugin-deep-link` | `@tauri-apps/plugin-deep-link` | Register & handle custom URL schemes / deep links | both |
| fs | `tauri-plugin-fs` | `@tauri-apps/plugin-fs` | Scoped filesystem access | both |
| geolocation | `tauri-plugin-geolocation` | `@tauri-apps/plugin-geolocation` | Device location & position watching | both |
| http | `tauri-plugin-http` | `@tauri-apps/plugin-http` | `fetch`-style HTTP client | both |
| log | `tauri-plugin-log` | `@tauri-apps/plugin-log` | Structured logging to stdout/file/webview | both |
| notification | `tauri-plugin-notification` | `@tauri-apps/plugin-notification` | System / push-style notifications | both |
| os | `tauri-plugin-os` | `@tauri-apps/plugin-os` | OS, arch, version, locale info | both |
| persisted-scope | `tauri-plugin-persisted-scope` | *(Rust-only — no JS package)* | Persist fs/asset runtime scope across restarts | both |
| process | `tauri-plugin-process` | `@tauri-apps/plugin-process` | Exit / relaunch the app | both |
| sql | `tauri-plugin-sql` | `@tauri-apps/plugin-sql` | SQLite / MySQL / PostgreSQL access | both |
| store | `tauri-plugin-store` | `@tauri-apps/plugin-store` | Persistent key-value store | both |
| stronghold | `tauri-plugin-stronghold` | `@tauri-apps/plugin-stronghold` | Encrypted secret/database vault (IOTA Stronghold) | both |
| updater | `tauri-plugin-updater` | `@tauri-apps/plugin-updater` | App auto-updates | both |
| upload | `tauri-plugin-upload` | `@tauri-apps/plugin-upload` | File upload/download with progress | both |
| websocket | `tauri-plugin-websocket` | `@tauri-apps/plugin-websocket` | WebSocket client driven from Rust | both |

### Desktop-only (Windows / macOS / Linux)

| `tauri add` | Rust crate | JS package | Purpose | Platforms |
|-------------|-----------|-----------|---------|-----------|
| autostart | `tauri-plugin-autostart` | `@tauri-apps/plugin-autostart` | Launch the app at system login | desktop |
| cli | `tauri-plugin-cli` | `@tauri-apps/plugin-cli` | Parse CLI args / subcommands | desktop |
| dialog | `tauri-plugin-dialog` | `@tauri-apps/plugin-dialog` | Native open/save/message dialogs | desktop |
| global-shortcut | `tauri-plugin-global-shortcut` | `@tauri-apps/plugin-global-shortcut` | Register system-wide hotkeys | desktop |
| localhost | `tauri-plugin-localhost` | *(Rust-only — no JS package)* | Serve frontend assets over a localhost HTTP server | desktop |
| opener | `tauri-plugin-opener` | `@tauri-apps/plugin-opener` | Open paths/URLs in the default app | desktop |
| positioner | `tauri-plugin-positioner` | `@tauri-apps/plugin-positioner` | Move windows to common positions (tray, corners) | desktop |
| shell | `tauri-plugin-shell` | `@tauri-apps/plugin-shell` | Spawn programs / open URLs | desktop |
| single-instance | `tauri-plugin-single-instance` | *(Rust-only — no JS package)* | Enforce a single running app instance | desktop |
| window-state | `tauri-plugin-window-state` | `@tauri-apps/plugin-window-state` | Save & restore window size/position | desktop |

### Mobile-only (Android / iOS)

| `tauri add` | Rust crate | JS package | Purpose | Platforms |
|-------------|-----------|-----------|---------|-----------|
| barcode-scanner | `tauri-plugin-barcode-scanner` | `@tauri-apps/plugin-barcode-scanner` | Scan QR / barcodes with the camera | mobile |
| biometric | `tauri-plugin-biometric` | `@tauri-apps/plugin-biometric` | Fingerprint / Face ID authentication | mobile |
| haptics | `tauri-plugin-haptics` | `@tauri-apps/plugin-haptics` | Haptic feedback / vibration | mobile |
| nfc | `tauri-plugin-nfc` | `@tauri-apps/plugin-nfc` | Read/write NFC tags | mobile |

Each plugin's own permission identifiers follow `<plugin>:default`, `<plugin>:allow-<command>`, `<plugin>:deny-<command>` — enable them per the **tauri-capabilities** skill.

## Plugins with Configuration

Some plugins take builder config in `lib.rs` and/or a section in `tauri.conf.json`'s `plugins` key:

```rust
.plugin(tauri_plugin_store::Builder::default().build())
```

```json
// tauri.conf.json
{ "plugins": { "updater": { "endpoints": ["https://releases.example.com/{{target}}/{{arch}}/{{current_version}}"], "pubkey": "..." } } }
```

## The Updater Plugin

Auto-update for desktop. Setup:

```bash
npm run tauri add updater
```

1. **Generate a signing keypair** — updates must be signed:

```bash
npm run tauri signer generate -- -w ~/.tauri/myapp.key
```

Keep the private key (and its password) secret; put the **public** key in config.

2. **Configure** `tauri.conf.json`:

```json
{
  "plugins": {
    "updater": {
      "pubkey": "<PUBLIC KEY FROM signer generate>",
      "endpoints": [
        "https://releases.example.com/{{target}}/{{arch}}/{{current_version}}"
      ]
    }
  }
}
```

`{{target}}`, `{{arch}}`, `{{current_version}}` are substituted at check time. The endpoint returns JSON describing the latest version, notes, pub date, and a signed download URL.

3. **Grant the permission** — `"updater:default"` in a capability.

4. **Check and install** from the frontend:

```js
import { check } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';

const update = await check();
if (update) {
  await update.downloadAndInstall();
  await relaunch();
}
```

Or from Rust with `app.updater()?.check().await?`.

> The updater verifies the bundle signature against `pubkey` before installing — a release built without the matching private key will be rejected. Sign release artifacts with the **same** key whose public half is in config. The updater covers desktop; mobile updates go through the app stores.

## Writing Your Own Plugin

When no official plugin covers your need, scaffold a custom one. Distilled from https://v2.tauri.app/develop/plugins/ and /develop/plugins/develop-mobile/.

### Scaffold

```bash
npx @tauri-apps/cli plugin new <name>
# → creates a `tauri-plugin-<name>/` directory
# Add mobile platforms now (or later with `plugin android add` / `plugin ios add`):
npx @tauri-apps/cli plugin new <name> --android --ios
```

### Project structure

```
tauri-plugin-<name>/
├── src/
│   ├── lib.rs          # init() + Builder, registers the invoke_handler
│   ├── commands.rs     # the plugin's #[tauri::command] functions
│   ├── desktop.rs      # desktop implementation
│   ├── mobile.rs       # mobile implementation (Kotlin/Swift bridge)
│   ├── models.rs       # shared request/response types
│   └── error.rs        # plugin Error / Result
├── permissions/        # permission definitions (autogenerated + hand-written)
├── guest-js/           # TypeScript source for the JS API
├── dist-js/            # built JS bindings (@tauri-apps/plugin-<name>)
├── android/            # Android (Kotlin) plugin code   (if --android)
├── ios/                # iOS (Swift) plugin code        (if --ios)
├── build.rs            # declares COMMANDS → autogenerated permissions
├── Cargo.toml
└── package.json
```

### Defining commands

Commands are regular Tauri commands in `src/commands.rs` (they may take `AppHandle`, `Window`, state, and params), registered on the plugin's `invoke_handler` in `src/lib.rs`:

```rust
// src/lib.rs
pub fn init<R: Runtime>() -> TauriPlugin<R> {
    Builder::new("<name>")
        .invoke_handler(tauri::generate_handler![commands::upload])
        .build()
}
```

Then expose them to the frontend from `guest-js/index.ts` (wrapping `invoke('plugin:<name>|<command>', …)`).

### Permissions: `build.rs` + `permissions/`

Each command you want callable from JS needs a permission. List your commands in the `COMMANDS` constant in `build.rs`; the build step autogenerates an `allow-<command>` and `deny-<command>` permission for each:

```rust
// build.rs
const COMMANDS: &[&str] = &["upload", "download"];

fn main() {
    tauri_plugin::Builder::new(COMMANDS).build();
}
```

The autogenerated permissions land in `permissions/autogenerated/`. Hand-write a **`default`** permission set in `permissions/default.toml` listing the commands a consumer should get out of the box (the `default` set is what `<name>:default` grants — the same set `tauri add` enables for official plugins):

```toml
# permissions/default.toml
[default]
description = "Allows the core commands of the <name> plugin"
permissions = ["allow-upload", "allow-download"]
```

Consumers then enable `<name>:default` (or finer-grained `<name>:allow-upload`) in their capability files — exactly like an official plugin.

### Mobile plugin development

Implementing Android (Kotlin) / iOS (Swift) native code, the `mobile.rs` bridge, the `tauri::plugin::PluginHandle`, and `run_mobile_plugin` calls is covered in the dedicated guide: **https://v2.tauri.app/develop/plugins/develop-mobile/** (`/develop/plugins/develop-mobile/`).

## Validation Checklist

- [ ] Plugin crate added **and** registered with `.plugin(..::init())` in `lib.rs`
- [ ] JS package installed and imported from `@tauri-apps/plugin-<name>`
- [ ] The plugin's permission(s) granted in a capability file
- [ ] Configurable plugins have their `tauri.conf.json` `plugins` section / builder config
- [ ] Updater: signing keypair generated, `pubkey` + `endpoints` set, `updater:default` granted, release artifacts signed with the matching key
