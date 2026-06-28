---
name: electron-testing
description: >
  Test, debug, and instrument Electron apps: end-to-end automation with Playwright (the
  current standard), WebdriverIO as an alternative, running on headless CI, debugging the
  main process and renderer, and shipping crash reports with crashReporter.
  USE FOR: writing automated Electron E2E tests, choosing a test framework, running
  Electron tests in CI without a display, attaching a debugger to the main process,
  opening renderer DevTools, or wiring up crash/minidump collection.
  DO NOT USE FOR: unit-testing pure JS modules (use a normal test runner directly),
  Electron security hardening (see electron-security), or app lifecycle wiring (see
  electron-app-lifecycle).
---

# Electron Testing & Debugging

Electron apps need testing at the boundary that matters: a real Electron binary launching
real windows, not a mocked DOM. The current standard for end-to-end automation is
**Playwright**, which can launch and drive Electron directly. This skill also covers
running headless on CI, debugging both processes, and collecting crash reports from the
field.

Targets current Electron (30+).

> **Spectron is dead.** Spectron was officially deprecated in 2022 and is end-of-life — it
> only ever supported Electron up to v13 and does not work with modern Electron. Do **not**
> start new projects on it, and migrate existing Spectron suites to Playwright or
> WebdriverIO.

## When to Use This Skill

- Writing automated end-to-end tests that launch the actual app
- Choosing between Playwright and WebdriverIO
- Getting Electron tests to run on headless CI (no physical display)
- Attaching a debugger to the main process or opening renderer DevTools
- Adding crash reporting / minidump upload to a shipped app

## Automated testing with Playwright (standard)

Playwright ships first-class Electron support via its `_electron` API. It launches the
real binary, lets you `evaluate` code in the main process, and drives windows as ordinary
Playwright pages.

```bash
npm install --save-dev @playwright/test
```

```js
import { test, expect, _electron as electron } from '@playwright/test'

test('launches and shows the first window', async () => {
  const electronApp = await electron.launch({ args: ['.'] })

  // Run code IN the Electron main process and read a value back
  const isPackaged = await electronApp.evaluate(async ({ app }) => app.isPackaged)
  expect(isPackaged).toBe(false)

  const window = await electronApp.firstWindow()   // first BrowserWindow as a Page
  await expect(window.locator('h1')).toHaveText('Welcome')
  await window.screenshot({ path: 'intro.png' })

  await electronApp.close()
})
```

Run with `npx playwright test`.

- ✅ Use `electronApp.evaluate(({ app, BrowserWindow }) => …)` to reach into the **main**
  process — the only way to assert on app/window state from a test.
- ✅ `args: ['.']` launches the project as the OS would; point it at your built output for
  packaged-build tests.
- ❌ **Don't** drive a window before `firstWindow()` (or `waitForEvent('window')`) resolves
  — there is no page to act on yet.

## Alternative: WebdriverIO

WebdriverIO (WDIO) has an official Electron service and is a good fit if you already use
the WDIO ecosystem (reporters, services, cloud grids).

```bash
npm init wdio@latest ./
```

Pick the **Electron** service in the wizard; it sets `browserName: 'electron'` and can take
an `appBinaryPath` for testing a packaged binary. Tests then use the standard WebDriver/WDIO
`$`/`$$` selectors against your renderer.

Rule of thumb: **Playwright** for new projects (simpler, faster, built-in main-process
`evaluate`); **WebdriverIO** when you need its plugin ecosystem or WebDriver compatibility.

## Running on headless CI

CI runners usually have no display. On **Linux**, run the Electron binary under a virtual
framebuffer (Xvfb) — Electron still needs an X server even when nothing is visible.

```yaml
# GitHub Actions (Linux)
- run: |
    sudo apt-get update && sudo apt-get install -y xvfb
    xvfb-run --auto-servernum npx playwright test
```

```jsonc
// package.json
"scripts": {
  "test:e2e": "xvfb-run --auto-servernum playwright test"
}
```

- ✅ macOS and Windows CI runners have a display server already — no Xvfb needed there.
- ❌ **Don't** expect a normal headless flag to suffice on Linux; the GPU/window layer
  still requires Xvfb (or a similar virtual display).

## Debugging the main process

The main process is plain Node, so attach the Node inspector. Use `--inspect=<port>` to
attach lazily, or `--inspect-brk=<port>` to pause on the first line until a debugger joins.

```bash
electron --inspect=5858 .       # attach any time
electron --inspect-brk=5858 .   # halt at startup, wait for debugger
```

```jsonc
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Main Process",
      "type": "node",
      "request": "launch",
      "cwd": "${workspaceFolder}",
      "runtimeExecutable": "${workspaceFolder}/node_modules/.bin/electron",
      "windows": { "runtimeExecutable": "${workspaceFolder}/node_modules/.bin/electron.cmd" },
      "args": ["."],
      "outputCapture": "std"
    }
  ]
}
```

For the **renderer**, just open Chrome DevTools: `win.webContents.openDevTools()`, or
`Ctrl/Cmd+Shift+I`. The renderer is a Chromium page, so its DevTools work exactly like the
browser's.

## Crash reporting

Collect native crashes (minidumps) from main and renderer processes and optionally upload
them to a Crashpad/Breakpad-compatible endpoint (e.g. a Sentry/Backtrace/self-hosted
collector). **Start it as early as possible — before `app` ready and before any renderer
launches** — or those processes won't be monitored.

```js
// Top of main.js, before app is ready
const { crashReporter } = require('electron')

crashReporter.start({
  submitURL: 'https://crashes.example.com/post',  // required unless uploadToServer:false
  uploadToServer: true,        // false = collect locally only (dev / opt-in builds)
  compress: true,              // gzip the upload (default true)
  globalExtra: { build: app.getVersion() },       // sent with every process's crash
})
```

- ✅ Call `crashReporter.start()` once, at the very top of the main process.
- ✅ To expose it to a sandboxed renderer, surface needed calls through a `contextBridge`
  preload (not by enabling Node in the renderer).
- ✅ Key names ≤ 39 bytes, values ≤ 127 bytes for `extra`/`globalExtra`.
- ❌ **Don't** set `uploadToServer: true` without a real `submitURL`, and respect user
  consent before uploading crash data.
- 🔎 Inspect collected dumps with `app.getPath('crashDumps')`.

## Validation Checklist

- [ ] E2E suite launches a real Electron binary (Playwright `_electron.launch` or WDIO)
- [ ] Not using Spectron (deprecated/EOL)
- [ ] Main-process assertions go through `electronApp.evaluate(...)`
- [ ] Linux CI wraps the run in `xvfb-run`
- [ ] A VS Code / `--inspect-brk` config exists for main-process debugging
- [ ] `crashReporter.start()` runs before app ready, in the main process
- [ ] Renderer crash reporting exposed via preload, not Node integration
- [ ] Crash upload has a valid `submitURL` and honors user consent
