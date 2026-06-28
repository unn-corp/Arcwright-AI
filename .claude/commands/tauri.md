---
description: Route a Tauri v2 task to the right curated Tauri skill (architecture, IPC, capabilities, plugins, distribution, mobile).
---

# /tauri — Tauri v2 skill router

Curated Tauri **v2** skills authored by Arcwright from the official
[Tauri v2 documentation](https://v2.tauri.app/) (original works, not vendored —
see `.agents/skills/SOURCES-TAURI.md`). Use this to load the right skill for a Tauri task.

## Instructions

1. Identify what the task touches, then load the matching `SKILL.md`:

   | Task | Skill |
   |------|-------|
   | Architecture, Core/WebView split, project setup, `lib.rs`/`main.rs` entry split, `tauri.conf.json`, v1→v2 migration | `.agents/skills/tauri-architecture/SKILL.md` |
   | Commands & IPC: `#[tauri::command]`, `generate_handler!`, `invoke()`, async, `Result` errors | `.agents/skills/tauri-commands-ipc/SKILL.md` |
   | Events: `emit`/`listen` both directions, `Channel` streaming | `.agents/skills/tauri-events/SKILL.md` |
   | Permissions / capabilities / ACL (the v2 flagship), scopes, missing-capability failures | `.agents/skills/tauri-capabilities/SKILL.md` |
   | Security: CSP config + the isolation pattern | `.agents/skills/tauri-security/SKILL.md` |
   | Plugins: `@tauri-apps/plugin-*` + Rust crate pairing, plugin permissions, the updater | `.agents/skills/tauri-plugins/SKILL.md` |
   | State: `Manager::manage`, `State<T>`, `Mutex` interior mutability | `.agents/skills/tauri-state-management/SKILL.md` |
   | Distribution: bundling, code signing, CI/`tauri-action`, updater flow, app stores, sidecar/`externalBin` | `.agents/skills/tauri-distribution/SKILL.md` |
   | Mobile (v2-only): iOS/Android targets, `tauri android`/`tauri ios`, mobile entry point | `.agents/skills/tauri-mobile/SKILL.md` |
   | Windowing & native UI: `WebviewWindow`, multiwebview, menus, tray, custom titlebar, splashscreen | `.agents/skills/tauri-windowing/SKILL.md` |
   | Testing: `@tauri-apps/api/mocks`, `tauri-driver` WebDriver, Rust command tests | `.agents/skills/tauri-testing/SKILL.md` |
   | Debugging: webview devtools, CrabNebula DevTools, IDE setup, Linux graphics | `.agents/skills/tauri-debugging/SKILL.md` |
   | Frontend setup: `devUrl`/`frontendDist`, static-export, Vite/Next/SvelteKit/Nuxt/Trunk wiring | `.agents/skills/tauri-frontend-setup/SKILL.md` |

2. Follow the loaded skill's procedure. For Tauri v2 the **capabilities/permissions ACL** is the
   most common source of silent failures — if an `invoke`, plugin call, or fs/shell/http operation
   does nothing, read `tauri-capabilities` first.

3. If the task spans several areas (e.g. a new app), load in order:
   architecture → commands-ipc → capabilities → plugins → distribution.

## Arguments

`$ARGUMENTS` — optional: the Tauri task or skill area. If empty, ask what the task involves.
