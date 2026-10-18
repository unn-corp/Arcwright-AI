---
name: electron-windows
description: "Create and manage Electron BrowserWindow instances, multiple/modal windows, custom title bars, transparency, vibrancy, saved window state, and display placement."
---

# Electron Windows

`BrowserWindow` is the main-process object that owns a native OS window and the Chromium
`webContents` inside it. This skill covers creating windows, relating them (parent/child,
modal), customizing their chrome (frameless, custom title bar, transparency, vibrancy), and
positioning/persisting them across displays and restarts.

All `BrowserWindow` work happens in the **main** process after `app.whenReady()`. Keep a
reference to every window you create — a `BrowserWindow` whose JS reference is dropped can
be garbage-collected and closed.

## When to Use This Skill

- Creating a `BrowserWindow` and wiring its lifecycle events
- Managing multiple windows, or parent/child and modal relationships
- Building a frameless window with a custom (HTML) title bar that still has native controls
- Making a window transparent, or applying macOS vibrancy/material
- Saving and restoring window bounds across app restarts
- Placing or sizing a window relative to a specific display via the `screen` API

## BrowserWindow Lifecycle

```js
const { app, BrowserWindow } = require('electron')
const path = require('node:path')

let mainWindow // keep the reference alive

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    minWidth: 640,
    minHeight: 480,
    webPreferences: { preload: path.join(__dirname, 'preload.js') },
  })

  mainWindow.loadFile('index.html') // or loadURL('https://…')

  mainWindow.on('closed', () => {
    mainWindow = null // released; recreate on demand
  })
}

app.whenReady().then(() => {
  createWindow()

  // macOS: re-create a window when the dock icon is clicked and none are open
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Windows/Linux: quit when all windows close; macOS apps usually stay alive
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
```

> Use `show: false` + the `ready-to-show` event to avoid a white flash on load. That
> pattern is covered in **electron-performance** — cross-reference, not repeated here.

- ✅ Set `minWidth`/`minHeight` so users can't shrink the window into an unusable state.
- ❌ **DON'T** drop the only reference to a window you still need — store it (a variable,
  array, or `Map`) for its lifetime.

## Multiple Windows

Track windows in a collection rather than scattered globals:

```js
const windows = new Set()

function createSecondaryWindow(route) {
  const win = new BrowserWindow({ width: 800, height: 600 })
  win.loadFile('index.html', { hash: route })
  windows.add(win)
  win.on('closed', () => windows.delete(win))
  return win
}
```

- ✅ Use `BrowserWindow.fromWebContents(event.sender)` in IPC handlers to find which window
  sent a message.

## Parent / Child and Modal Windows

A child window stays above its `parent`; a modal window additionally blocks input to the
parent until closed. A modal window **must** have a parent.

```js
const child = new BrowserWindow({
  parent: mainWindow, // child: moves/minimizes with the parent, always on top of it
  modal: true,        // blocks the parent until closed (requires parent)
  width: 420,
  height: 260,
})
child.loadFile('settings.html')
child.once('ready-to-show', () => child.show())
```

- ✅ Set `modal: true` only together with `parent` — a modal without a parent is ignored.
- ✅ Use child windows for tool palettes; modal windows for blocking prompts/settings.

## Frameless Windows and Custom Title Bars

For a custom-chrome look, you have two routes. Prefer `titleBarStyle: 'hidden'` +
`titleBarOverlay` over fully frameless (`frame: false`) because it **keeps the native
window controls** (close/min/max) while letting you style the title bar area.

```js
const win = new BrowserWindow({
  width: 1024,
  height: 768,
  titleBarStyle: 'hidden', // hides the OS title bar, keeps the traffic lights (macOS)
  // On Windows/Linux, show native controls in an overlay you can color to match your UI:
  titleBarOverlay: {
    color: '#1e1e1e',      // title bar background behind the controls
    symbolColor: '#ffffff', // the control glyphs
    height: 36,
  },
})
```

In the renderer, mark your custom title bar region as draggable with the CSS app-region
property, and exclude interactive controls from dragging:

```css
.titlebar       { -webkit-app-region: drag; height: 36px; }
.titlebar button { -webkit-app-region: no-drag; } /* clickable, not a drag handle */
```

To detect/read the overlay geometry at runtime (so your layout avoids the native controls),
the renderer can use `navigator.windowControlsOverlay`.

- ✅ Prefer `titleBarStyle: 'hidden'` + `titleBarOverlay` so close/minimize/maximize still
  work natively.
- ✅ Mark interactive elements `-webkit-app-region: no-drag`, or they become un-clickable.
- ❌ **DON'T** reach for `frame: false` unless you intend to reimplement window controls
  yourself — you lose the native close/minimize/maximize buttons.

## Transparency

```js
const win = new BrowserWindow({
  transparent: true,
  frame: false,        // transparency requires a frameless window
  backgroundColor: '#00000000', // fully transparent base
})
```

- ✅ Transparency requires `frame: false` and is best with `backgroundColor: '#00000000'`.
- ❌ **DON'T** toggle `transparent` after creation — it can only be set at construction.
- ❌ **DON'T** assume the window is resizable while transparent — resize handles disappear
  with the frame; add your own or set `resizable` expectations accordingly.

## Vibrancy (macOS)

Vibrancy gives the macOS "frosted glass" blur behind the window. It is macOS-only and is
ignored elsewhere.

```js
const win = new BrowserWindow({
  vibrancy: 'under-window', // e.g. 'sidebar', 'menu', 'hud', 'fullscreen-ui'
  visualEffectState: 'active',
  backgroundColor: '#00000000', // let the blur show through
})
```

- ✅ Pair vibrancy with a transparent/clear `backgroundColor` so the blur is visible.
- ✅ Guard the option with `process.platform === 'darwin'` if you build per-platform configs.

## Window State Persistence

Electron does not remember window bounds — persist them yourself. Save on resize/move
(debounced) and restore on creation, validating against currently-connected displays.

```js
const { screen } = require('electron')
const Store = require('electron-store') // or your own JSON file
const store = new Store()

function createWindow() {
  const saved = store.get('windowBounds')
  const opts = { width: 1024, height: 768, ...(saved ?? {}) }

  // Discard a saved position that lands off all current displays (unplugged monitor)
  if (saved) {
    const visible = screen.getAllDisplays().some(d => {
      const a = d.workArea
      return saved.x >= a.x && saved.y >= a.y &&
             saved.x < a.x + a.width && saved.y < a.y + a.height
    })
    if (!visible) { delete opts.x; delete opts.y }
  }

  const win = new BrowserWindow(opts)
  const save = () => { if (!win.isMinimized()) store.set('windowBounds', win.getBounds()) }
  win.on('resize', save)
  win.on('move', save)
  return win
}
```

- ✅ Validate restored coordinates against `screen.getAllDisplays()` so an unplugged
  monitor doesn't strand the window offscreen.
- ✅ Persist `getBounds()` (x/y/width/height together), not just size.

## The screen / display API

`screen` reports connected displays and pointer position. **It can only be used after the
app is `ready`** (requiring it earlier is fine, calling its methods early is not).

```js
const { screen } = require('electron')

app.whenReady().then(() => {
  const primary = screen.getPrimaryDisplay()
  const { width, height } = primary.workAreaSize // excludes taskbar/dock

  // Center a window on whichever display currently holds the cursor
  const cursor = screen.getCursorScreenPoint()
  const active = screen.getDisplayNearestPoint(cursor)
  const win = new BrowserWindow({ width: 800, height: 600 })
  win.setBounds({
    x: active.workArea.x + (active.workArea.width - 800) / 2,
    y: active.workArea.y + (active.workArea.height - 600) / 2,
    width: 800,
    height: 600,
  })

  // React to monitors being added/removed/rescaled
  screen.on('display-added', recomputeLayout)
  screen.on('display-removed', recomputeLayout)
  screen.on('display-metrics-changed', recomputeLayout)
})
```

- ✅ Use `workArea` / `workAreaSize` (not `bounds`/`size`) when placing windows so you
  avoid the taskbar/dock.
- ✅ Account for `display.scaleFactor` (HiDPI) when doing pixel math.
- ❌ **DON'T** call `screen` methods before `app.whenReady()` — it throws.

## Validation Checklist

- [ ] Every needed `BrowserWindow` is referenced for its lifetime; `closed` clears the ref
- [ ] `window-all-closed` / `activate` handle the macOS vs Windows/Linux quit conventions
- [ ] Modal windows always have a `parent`
- [ ] Custom chrome uses `titleBarStyle: 'hidden'` + `titleBarOverlay` (native controls kept) unless full reimplementation is intended
- [ ] Draggable title bar uses `-webkit-app-region: drag`; controls use `no-drag`
- [ ] `transparent: true` is paired with `frame: false` and set only at construction
- [ ] Vibrancy is treated as macOS-only and paired with a clear background color
- [ ] Window bounds are persisted and validated against current displays on restore
- [ ] `screen` is only used after `app.whenReady()`, using `workArea` for placement
