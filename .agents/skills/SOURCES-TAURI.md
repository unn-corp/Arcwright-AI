# Tauri v2 skills (tauri-*)

The `tauri-*` skill directories in this folder are **original Arcwright works**,
authored from scratch and distilled from the **official Tauri v2 documentation**:

- Primary source: https://v2.tauri.app
- Tauri is licensed under Apache-2.0 / MIT; the documentation is the canonical
  reference for the APIs described here.

These skills are **NOT vendored** from any third-party skill repository. In
particular, no text was copied from `dchuk/claude-code-tauri-skills` (which ships
without a license) or any other community collection. APIs, config keys, command
names, and behaviors are facts drawn from the official docs; all prose, examples,
do/don't framing, and checklists are original to Arcwright.

The shared `tauri-` directory prefix (and matching `name:` field) groups these
skills so the Arcwright installer can include/exclude them as one unit via the
`--tauri` opt-in flag.

## The skills

| Skill dir | Topic | Primary Tauri v2 docs |
|---|---|---|
| `tauri-architecture` | Core/WebView split, multi-process model, project layout, lib.rs/main.rs entry split, tauri.conf.json, **v1→v2 migration** | v2.tauri.app/concept/architecture/, /concept/process-model/, /start/, /reference/config/, /start/migrate/from-tauri-1/ |
| `tauri-commands-ipc` | `#[tauri::command]`, `generate_handler!`, `invoke()`, async commands, `Result` error handling, argument passing | v2.tauri.app/develop/calling-rust/ |
| `tauri-events` | Event system both directions (emit/listen), Channels for streaming | v2.tauri.app/develop/calling-frontend/ |
| `tauri-capabilities` | Permissions/capabilities/ACL, capability files, permission identifiers, scopes, runtime authority, v1 allowlist contrast | v2.tauri.app/security/, /security/permissions/, /security/capabilities/, /security/scope/ |
| `tauri-security` | CSP configuration + the Isolation pattern | v2.tauri.app/security/csp/, /security/isolation/ |
| `tauri-plugins` | Official `@tauri-apps/plugin-*` + Rust crate pairing, per-plugin permissions, the updater plugin | v2.tauri.app/plugin/, /plugin/updater/ |
| `tauri-state-management` | `Manager::manage` / `State<T>`, interior mutability (Mutex), accessing state in commands | v2.tauri.app/develop/state-management/ |
| `tauri-distribution` | Bundling, code signing, cross-compilation, binary size, sidecar/`externalBin` | v2.tauri.app/distribute/, /develop/sidecar/ |
| `tauri-mobile` | v2-only iOS/Android targets, `tauri ios`/`tauri android`, lib.rs mobile entry point, mobile plugin permissions | v2.tauri.app/develop/ (mobile), /distribute/ (mobile) |
| `tauri-windowing` | `WebviewWindow` management, multiwebview, native menus & tray, custom titlebar, splashscreen (+ required capabilities) | v2.tauri.app/learn/window-customization/, /learn/system-tray/, /learn/window-menu/, /learn/splashscreen/ |
| `tauri-testing` | Mocking `@tauri-apps/api/mocks`, WebDriver via `tauri-driver`, Rust command tests, CI | v2.tauri.app/develop/tests/, /develop/tests/mocking/, /develop/tests/webdriver/ |
| `tauri-debugging` | Webview devtools, CrabNebula DevTools, IDE setup, Linux/WebKitGTK graphics troubleshooting | v2.tauri.app/develop/debug/, /develop/debug/crabnebula-devtools/ |
| `tauri-frontend-setup` | `devUrl`/`frontendDist`/before-commands, static-export requirement, Vite/Next/SvelteKit/Nuxt/Trunk wiring | v2.tauri.app/start/frontend/ |

## Maintenance

Tauri v2 evolves; verify command names, config keys, and permission identifiers
against the current docs at https://v2.tauri.app when refreshing. These target
**Tauri v2 specifically** and flag v1→v2 differences where relevant — do not
re-introduce v1 patterns (global `allowlist`, `@tauri-apps/api/tauri` import path,
app definition in `main.rs`).
