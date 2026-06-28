---
description: Route an Electron task to the right curated Electron skill (security, IPC, packaging, updates, performance, native modules).
---

# /electron — Electron skill router

Curated Electron skills authored by Arcwright from the official
[Electron documentation](https://www.electronjs.org/docs/latest) (original works, not vendored —
see `.agents/skills/SOURCES-ELECTRON.md`). Use this to load the right skill for an Electron task.

## Instructions

1. Identify what the task touches, then load the matching `SKILL.md`:

   | Task | Skill |
   |------|-------|
   | Process model, `contextIsolation`/`sandbox`/`nodeIntegration`, CSP, navigation/`shell.openExternal` allowlisting, Fuses | `.agents/skills/electron-security/SKILL.md` |
   | IPC: `contextBridge`, `invoke`/`handle` vs `send`/`on`, typed preload API, sender validation | `.agents/skills/electron-ipc/SKILL.md` |
   | Packaging & code signing: Electron Forge vs electron-builder, electron-vite, notarization/Authenticode | `.agents/skills/electron-packaging/SKILL.md` |
   | Auto-updates: `update-electron-app`, `autoUpdater`, electron-updater, signed channels | `.agents/skills/electron-updates/SKILL.md` |
   | Performance: lazy windows, `show:false` + `ready-to-show`, not blocking the main process, V8 snapshots | `.agents/skills/electron-performance/SKILL.md` |
   | Native modules: N-API/node-gyp, ABI mismatches, `@electron/rebuild`, per-platform builds | `.agents/skills/electron-native-modules/SKILL.md` |
   | Native UI: menus, tray, notifications, dialogs, `globalShortcut`, clipboard, dark mode | `.agents/skills/electron-native-ui/SKILL.md` |
   | Window management & customization: lifecycle, frameless, title-bar overlay, vibrancy, multi/modal windows | `.agents/skills/electron-windows/SKILL.md` |
   | App lifecycle: `app` events, single-instance lock, deep linking / protocol handlers, file associations | `.agents/skills/electron-app-lifecycle/SKILL.md` |
   | Testing & debugging: Playwright, WebDriverIO, headless CI, `--inspect`, `crashReporter` | `.agents/skills/electron-testing/SKILL.md` |

2. Follow the loaded skill's procedure. Security is foundational — when in doubt, read
   `electron-security` first; IPC and packaging both assume its secure-defaults baseline.

3. If the task spans several areas (e.g. a new app), load the relevant skills in order:
   security → ipc → packaging → updates.

## Arguments

`$ARGUMENTS` — optional: the Electron task or skill area. If empty, ask what the task involves.
