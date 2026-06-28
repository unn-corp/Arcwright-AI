# Electron skills (electron-*) — original works

The `electron-*` skill directories in this folder are **original Arcwright works**,
written from scratch and distilled from the **official Electron documentation**. They are
**not** copied from any third-party skill repository — only facts, API names, and behavior
are sourced from the docs; all prose, structure, examples, and checklists are original.

- Primary source: https://www.electronjs.org/docs/latest (current Electron, 30+)
- License of the underlying docs: MIT — Copyright (c) Electron contributors / OpenJS
  Foundation. The skill text here is Arcwright-authored.

The shared `electron-` directory prefix lets the Arcwright installer include or exclude
the whole group as one unit via the `--electron` opt-in flag.

## Skills and their primary sources

| Skill dir | Topic | Primary source URL |
|---|---|---|
| `electron-security` | Process model + security baseline (contextIsolation, sandbox, CSP, navigation guards, Fuses) | https://www.electronjs.org/docs/latest/tutorial/security · /tutorial/process-model · /tutorial/fuses |
| `electron-ipc` | Safe IPC: contextBridge, invoke/handle vs send/on, sender validation | https://www.electronjs.org/docs/latest/tutorial/ipc · /tutorial/context-isolation |
| `electron-packaging` | Forge vs electron-builder, electron-vite, code signing & notarization | https://www.electronjs.org/docs/latest/tutorial/application-distribution · https://www.electronforge.io |
| `electron-updates` | autoUpdater, update-electron-app, electron-updater, signed channels | https://www.electronjs.org/docs/latest/tutorial/updates |
| `electron-performance` | Lazy startup, ready-to-show, unblocking main, V8 snapshots | https://www.electronjs.org/docs/latest/tutorial/performance |
| `electron-native-modules` | N-API/node-gyp, ABI mismatches, @electron/rebuild, per-platform builds | https://www.electronjs.org/docs/latest/tutorial/using-native-node-modules |
| `electron-native-ui` | Menus, tray, notifications, dialogs, globalShortcut, clipboard, dark mode | https://www.electronjs.org/docs/latest/api/menu · /api/tray · /tutorial/notifications · /api/dialog · /api/global-shortcut · /api/clipboard |
| `electron-windows` | Window lifecycle & customization: frameless, title-bar overlay, vibrancy, multi/modal windows, screen API | https://www.electronjs.org/docs/latest/tutorial/window-customization · /api/browser-window · /api/screen |
| `electron-app-lifecycle` | `app` lifecycle/events, single-instance lock, deep linking / protocol handlers, file associations, powerMonitor | https://www.electronjs.org/docs/latest/api/app · /tutorial/launch-app-from-url-in-another-app · /tutorial/recent-documents |
| `electron-testing` | Playwright & WebDriverIO testing (Spectron is EOL), headless CI, --inspect debugging, crashReporter | https://www.electronjs.org/docs/latest/tutorial/automated-testing · /tutorial/testing-on-headless-ci · /api/crash-reporter |

## Maintenance

Electron's secure defaults and APIs evolve with Chromium release cadence. When updating
these skills, re-check each tutorial page above against the **latest** Electron release and
keep code samples on current APIs (e.g. `setWindowOpenHandler`, `LibraryImport`-free
`contextBridge`, `@electron/rebuild`, `@electron/fuses`). Then re-run `node build/build.js`.
