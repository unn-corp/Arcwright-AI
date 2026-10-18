---
name: electron-app-lifecycle
description: "Implement Electron startup, shutdown, single-instance handling, deep links, or OS lifecycle events. Excludes renderer layout, IPC contracts, and window security."
---

# Electron App Lifecycle

The `app` module is the main process's control surface for the application's whole
lifetime — from "should I even keep running?" through ready, re-activation, and a clean
shutdown. Getting this layer right is mostly about respecting **per-platform conventions**:
macOS keeps an app alive with no windows; Windows and Linux don't. A correct lifecycle is
also a security boundary — deep links and file-open events deliver attacker-influenced
strings straight into your process, and they must be validated.

Targets current Electron (30+). All code here is main-process unless noted.

## When to Use This Skill

- Writing or restructuring `main.js` startup / shutdown logic
- Deciding what `window-all-closed` and `activate` should do per platform
- Adding a single-instance lock so a second launch focuses the existing window
- Registering a custom URL scheme (`myapp://…`) and handling the inbound link
- Implementing "Open With" file associations or a Recent Documents menu
- Reacting to sleep/resume/lock with `powerMonitor`

## Startup: whenReady, not the raw event

Create windows only after the app is ready. Prefer the promise.

```js
const { app, BrowserWindow } = require('electron')

app.whenReady().then(() => {
  createWindow()

  // macOS: re-open a window when the dock icon is clicked and none are open
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})
```

```js
// ❌ Don't create windows at module load — GPU/Chromium isn't ready yet
const win = new BrowserWindow()   // throws or misbehaves before ready
```

## Quitting: window-all-closed vs activate

These two events encode the core platform difference. On macOS, apps and their menu bar
stay active until the user explicitly quits (Cmd+Q); on Windows/Linux, closing the last
window quits the app.

```js
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()   // keep running on macOS
})
```

- ❌ **Don't** unconditionally `app.quit()` on `window-all-closed` — it breaks the
  expected macOS behavior where the app survives with no windows.
- ✅ Pair `window-all-closed` (quit elsewhere) with `activate` (re-create on macOS).

## Graceful shutdown sequence

Quit fires three events in order. Use them deliberately:

| Event | When | Use it for |
|-------|------|-----------|
| `before-quit` | Before windows start closing | Flag "we're quitting"; start async saves |
| `will-quit` | All windows closed, before exit | Last-chance cleanup; `event.preventDefault()` to defer |
| `quit` | Process is exiting | Final, non-blocking logging only |

```js
let isQuitting = false
app.on('before-quit', () => { isQuitting = true })

// Example: keep the app alive in the tray instead of quitting on window close
mainWindow.on('close', (event) => {
  if (!isQuitting) { event.preventDefault(); mainWindow.hide() }
})
```

`app.quit()` requests the graceful sequence (windows can veto via their `close`).
`app.exit(code)` skips it and exits immediately — reserve it for fatal errors.

## Single-instance lock

Ensure only one copy runs; route a second launch back to the first instance. This is also
where Windows/Linux deep links arrive.

```js
const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
  app.quit()                 // a second instance: hand off and exit
} else {
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    // Someone tried to run a second instance — focus our window instead
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
    // On Windows/Linux the deep link is the last arg (validate before use)
    handleDeepLink(commandLine.pop())
  })

  app.whenReady().then(createWindow)
}
```

- ❌ **Don't** call `requestSingleInstanceLock()` after creating windows — call it first.
- ✅ Treat `commandLine` as untrusted input; never `exec`/`shell.openExternal` it raw.

## Deep linking / custom protocol handlers

Register a scheme, then handle the URL differently per OS. In dev the executable is
Electron itself, so pass `process.execPath` plus the script path.

```js
const path = require('node:path')

if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient('myapp', process.execPath, [path.resolve(process.argv[1])])
  }
} else {
  app.setAsDefaultProtocolClient('myapp')
}

// macOS delivers the link via open-url (NOT argv / second-instance)
app.on('open-url', (event, url) => {
  event.preventDefault()
  handleDeepLink(url)
})
```

```js
// ALWAYS validate the inbound URL — it is attacker-controllable
function handleDeepLink(raw) {
  if (!raw) return
  let url
  try { url = new URL(raw) } catch { return }      // reject garbage
  if (url.protocol !== 'myapp:') return            // reject unexpected schemes
  // route only known, allowlisted actions — never eval/exec the payload
  if (url.hostname === 'open') openDocument(url.searchParams.get('id'))
}
```

- ❌ **Don't** assume the deep link path is a real local file or safe action.
- ✅ macOS uses `open-url`; Windows/Linux deliver it through `second-instance`
  (cold start: read `process.argv`). Handle all three.

### Privileged custom schemes (serving app content)

To serve your own app over a scheme (e.g. `app://`) with standard-origin/`fetch`
semantics, declare it privileged **before** ready, then implement it with `protocol.handle`.

```js
const { app, protocol, net } = require('electron')

protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true } },
])

app.whenReady().then(() => {
  protocol.handle('app', (request) => {
    const { pathname } = new URL(request.url)
    // Resolve and clamp to your app dir; reject path traversal before serving
    return net.fetch(`file://${path.join(app.getAppPath(), 'renderer', pathname)}`)
  })
})
```

- ❌ **Don't** join a request path into the filesystem without normalizing and confirming
  it stays inside the intended directory (`..` traversal).

## File associations & recent documents

When the OS opens a file with your app, the path arrives the same way as deep links —
`open-file` on macOS, `process.argv` / `second-instance` on Windows/Linux.

```js
app.on('open-file', (event, filePath) => {   // macOS
  event.preventDefault()
  openDocument(filePath)
})

// Add to the OS "Recent" list (Jump List on Windows, Dock menu on macOS)
app.addRecentDocument('/Users/me/notes/today.md')
// app.clearRecentDocuments()   // wipe the list
```

## powerMonitor

Available only after the app is ready. React to system power state.

```js
app.whenReady().then(() => {
  const { powerMonitor } = require('electron')
  powerMonitor.on('suspend', () => pauseSync())
  powerMonitor.on('resume', () => resumeSync())
  powerMonitor.on('lock-screen', () => lockSensitiveViews())
  // powerMonitor.getSystemIdleState(60)  // 'active' | 'idle' | 'locked' | 'unknown'
})
```

## Validation Checklist

- [ ] Windows created inside `whenReady()`, never at module load
- [ ] `window-all-closed` quits only when `process.platform !== 'darwin'`
- [ ] `activate` re-creates a window when none are open (macOS)
- [ ] `requestSingleInstanceLock()` called first; second instance focuses the window
- [ ] Deep links handled on all three OSes (`open-url`, `second-instance`, cold `argv`)
- [ ] Every inbound URL/file path parsed, scheme-checked, and action-allowlisted
- [ ] Privileged custom schemes declared before ready; `protocol.handle` guards traversal
- [ ] `powerMonitor` accessed only after ready
- [ ] Cleanup runs in `before-quit`/`will-quit`, not `quit`
