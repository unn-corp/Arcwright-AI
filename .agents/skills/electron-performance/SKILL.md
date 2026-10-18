---
name: electron-performance
description: "Diagnose Electron startup delays, blocked main-process work, window flashes, or rendering jank. Use packaging and security skills for those concerns."
---

# Electron Performance

Electron carries Chromium + Node.js, so naive apps feel heavy: slow cold start, a white
flash when windows open, and a frozen UI whenever the main process is busy. The fixes are
mostly about **doing less work eagerly** and **keeping the main process free**.

The main process is single-threaded and owns every window. Block it and *all* windows
freeze. That is the cardinal rule everything else follows from.

## When to Use This Skill

- App startup feels slow
- A new window flashes white before content appears
- The whole UI freezes during some operation
- Trimming what's required/parsed at launch
- Speeding cold start with a V8 snapshot

## Defer Work at Startup

Do the minimum to show a window, then do the rest. Don't `require` heavy modules, read big
files, or hit the network on the synchronous startup path.

```js
const { app, BrowserWindow } = require('electron')

app.whenReady().then(() => {
  createMainWindow()          // get pixels on screen ASAP
})

function createMainWindow() {
  const win = new BrowserWindow({ /* ... */ })
  win.loadFile('index.html')

  // Heavy, non-critical setup runs AFTER first paint, off the critical path
  win.webContents.once('did-finish-load', () => {
    setupAutoUpdater()
    warmCaches()
    require('./analytics').init()   // lazy require — not parsed at launch
  })
}
```

- ✅ Lazy-`require` heavy/optional modules at first use, not at the top of `main.js`.
- ✅ Create secondary windows only when the user actually needs them.
- ❌ **NEVER** do synchronous file/network/crypto work before the first window paints.

## Flicker-Free Windows: `show: false` + `ready-to-show`

A window shown before its content is rendered flashes the background color. Create it
hidden and reveal it once the renderer is ready.

```js
const win = new BrowserWindow({
  show: false,                       // start hidden
  backgroundColor: '#1e1e1e',        // matches your UI; avoids white flash if shown early
  webPreferences: { preload },
})

win.loadFile('index.html')
win.once('ready-to-show', () => win.show())   // reveal only when painted
```

- ✅ `ready-to-show` fires after the first meaningful paint — the right moment to show.
- ✅ Set `backgroundColor` to your theme as a fallback.

## Never Block the Main Process

CPU-heavy or synchronous work on the main process freezes every window. Move it off.

```js
// ❌ BAD — synchronous hash blocks every window for the duration
const { ipcMain } = require('electron')
const fs = require('node:fs')
const crypto = require('node:crypto')
ipcMain.handle('hash', () => {
  const data = fs.readFileSync('big.bin')                 // sync I/O — blocks
  return crypto.createHash('sha256').update(data).digest('hex')
})

// ✅ GOOD — async I/O + offload CPU to a worker thread
const { Worker } = require('node:worker_threads')
ipcMain.handle('hash', (_e, path) =>
  new Promise((resolve, reject) => {
    const w = new Worker('./hash-worker.js', { workerData: path })
    w.once('message', resolve)
    w.once('error', reject)
  })
)
```

Options for heavy work, in order of preference:
1. Do it in the **renderer** (it has its own thread) if it's UI-adjacent.
2. Use a **`worker_threads` Worker** for CPU-bound work in Node.
3. Use **`utilityProcess`** to run a separate child process for sustained background work.

- ❌ **NEVER** use `fs.readFileSync`, `child_process.execSync`, or busy loops on the main
  process during interaction.
- ✅ Prefer the async (`fs/promises`) variants everywhere on the main process.

## Trim What Loads

- Audit dependencies: a single large transitive package can dominate parse time. Prefer
  lighter alternatives and tree-shaken builds (electron-vite bundles the renderer).
- Keep the renderer bundle small; code-split routes/features that aren't needed at launch.
- Enable `asar` packaging — fewer file-system stat calls than thousands of loose files.
- ❌ **NEVER** ship dev-only dependencies in the packaged app.

## V8 Snapshots (advanced cold-start win)

A V8 snapshot pre-executes initialization JS at *build* time and embeds the resulting heap
in the binary, so that work is skipped at launch. Best for apps with expensive,
deterministic init (large config parsing, framework bootstrap).

- Build with `@electron/snapshot-helper` / the `v8-compile-cache`-style tooling and load
  the blob via `v8.setFlagsFromString` / the Electron snapshot APIs at startup.
- Snapshot code can't touch host APIs (no `require` of native modules, no DOM/Node I/O) —
  it runs in an isolate before the runtime is fully up. Keep snapshotted code pure.
- Measure first: snapshots add build complexity and only pay off if init JS is a real
  chunk of startup time.

## Measure, Don't Guess

- Use Chromium DevTools **Performance** panel for renderer jank.
- Use `--inspect` / `--inspect-brk` on the main process to profile main-process work.
- Track `app` timing: time from `app.whenReady()` to `ready-to-show`.

## Validation Checklist

- [ ] No synchronous I/O / heavy `require` on the startup critical path
- [ ] Windows created with `show: false`, revealed on `ready-to-show`
- [ ] `backgroundColor` set to the app theme
- [ ] CPU-bound work runs in a renderer, worker thread, or utility process — not main
- [ ] Async (`fs/promises`) used on the main process; no `*Sync` during interaction
- [ ] Secondary windows created lazily; optional modules lazy-`require`d
- [ ] `asar` enabled; no dev dependencies shipped
- [ ] Startup profiled before/after changes (not guessed)
