---
name: electron-native-ui
description: "Build Electron application/context menus, tray icons, native notifications/dialogs, global shortcuts, clipboard, and OS theme integration outside the renderer. Window lifecycle uses electron-windows."
---

# Electron Native UI

Beyond the web page it renders, an Electron app integrates with the host OS through a set
of **main-process** modules: `Menu`, `Tray`, `Notification`, `dialog`, `globalShortcut`,
`clipboard`, and `nativeTheme`. These are what make an Electron app feel native rather than
"a website in a window."

Almost all of these APIs live in the **main process** and must be used after the `app`
`ready` event (`app.whenReady()`). `clipboard` is the exception — it is available in both
main and renderer. None of these belong in untrusted renderer code; drive them from main
and expose only what you need over a preload bridge (see `electron-ipc`).

## When to Use This Skill

- Building the application menu bar, a dock/tray menu, or a right-click context menu
- Adding a system tray icon with tooltip and menu
- Showing native OS notifications from an Electron app
- Opening native file-open, file-save, or message-box dialogs
- Registering app-wide (global) keyboard shortcuts and cleaning them up on quit
- Reading from or writing to the system clipboard
- Making the app follow (or override) the OS light/dark theme

## Application Menu and Roles

Build menus from a template with `Menu.buildFromTemplate`, then install it with
`Menu.setApplicationMenu`. Prefer **roles** over hand-written click handlers — roles get
the correct label, accelerator, and platform behavior (copy/paste, window controls, the
macOS app menu) for free.

```js
const { app, Menu } = require('electron')

const isMac = process.platform === 'darwin'

const template = [
  // macOS expects a leading app menu named after the app
  ...(isMac ? [{ role: 'appMenu' }] : []),
  {
    label: 'File',
    submenu: [
      { label: 'Open…', accelerator: 'CmdOrCtrl+O', click: () => openFile() },
      { type: 'separator' },
      isMac ? { role: 'close' } : { role: 'quit' },
    ],
  },
  { role: 'editMenu' },   // undo/redo/cut/copy/paste/selectAll, correct per OS
  { role: 'viewMenu' },   // reload, devtools, zoom, fullscreen
  { role: 'windowMenu' },
]

app.whenReady().then(() => {
  Menu.setApplicationMenu(Menu.buildFromTemplate(template))
})
```

- ✅ Use `CmdOrCtrl` in accelerators so one string works on macOS and Windows/Linux.
- ✅ Use `role: 'appMenu' | 'editMenu' | 'viewMenu' | 'windowMenu'` for standard sections.
- ❌ **DON'T** hand-roll copy/paste click handlers — `role: 'copy'` etc. wire the native
  edit actions and keep them enabled/disabled correctly.

### Context (right-click) menus

A context menu is just a `Menu` shown on demand with `menu.popup()`. Trigger it from the
`context-menu` event on a window's `webContents`:

```js
const { Menu } = require('electron')

win.webContents.on('context-menu', (_event, params) => {
  const menu = Menu.buildFromTemplate([
    { label: 'Copy', role: 'copy', enabled: params.editFlags.canCopy },
    { label: 'Paste', role: 'paste', enabled: params.editFlags.canPaste },
    { type: 'separator' },
    { label: 'Inspect Element', click: () => win.webContents.inspectElement(params.x, params.y) },
  ])
  menu.popup({ window: win })
})
```

## Tray

A `Tray` lives in the system notification area / menu bar. Always keep a reference to the
`Tray` instance at module scope — if it is garbage-collected the icon disappears.

```js
const { app, Tray, Menu, nativeImage } = require('electron')
const path = require('node:path')

let tray // module scope — DO NOT let this go out of scope

app.whenReady().then(() => {
  const icon = nativeImage.createFromPath(path.join(__dirname, 'trayTemplate.png'))
  tray = new Tray(icon)
  tray.setToolTip('My App')

  tray.setContextMenu(Menu.buildFromTemplate([
    { label: 'Show', click: () => mainWindow.show() },
    { type: 'separator' },
    { role: 'quit' },
  ]))

  // Left-click behavior is opt-in
  tray.on('click', () => mainWindow.show())
})
```

- ✅ On macOS, name the icon `…Template.png` (a black+alpha "template image") so it adapts
  to light/dark menu bars automatically.
- ✅ Provide a tooltip and a context menu — a bare icon with no menu is a dead end.
- ❌ **DON'T** declare `tray` as a local inside `whenReady` and forget it — keep it rooted
  for the app's lifetime, or the icon vanishes when GC runs.

## Notifications

Use the `Notification` class from the main process. `Notification.isSupported()` guards
platforms/configs where notifications are unavailable.

```js
const { Notification } = require('electron')

function notify(title, body) {
  if (!Notification.isSupported()) return
  const n = new Notification({ title, body, silent: false })
  n.on('click', () => mainWindow.show())
  n.show()
}
```

### Windows AppUserModelID gotcha (critical for unpackaged apps)

On Windows, a notification is silently suppressed unless the app has a registered
**AppUserModelID (AUMID)**. A packaged app (installed via Squirrel/NSIS with a Start Menu
shortcut) gets this automatically. An **unpackaged app you run from `electron .` or a bare
`.exe` will show no toast at all** until you set one explicitly:

```js
const { app } = require('electron')

if (process.platform === 'win32') {
  app.setAppUserModelId('com.example.myapp') // call early, before showing notifications
}
```

- ✅ Call `app.setAppUserModelId(...)` once at startup on Windows.
- ✅ Use a stable reverse-DNS string that matches your installer's AUMID in production.
- ❌ **DON'T** debug "notifications don't appear on Windows" as a code bug first — confirm
  the AUMID is set. This is the single most common cause.

## Dialogs

`dialog` shows native OS dialogs from the main process. The `show*` methods return Promises.

```js
const { dialog } = require('electron')

// Open file(s)
const { canceled, filePaths } = await dialog.showOpenDialog(win, {
  title: 'Choose images',
  properties: ['openFile', 'multiSelections'],
  filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'webp'] }],
})
if (!canceled) loadImages(filePaths)

// Save file
const { canceled: cancelSave, filePath } = await dialog.showSaveDialog(win, {
  defaultPath: 'export.json',
  filters: [{ name: 'JSON', extensions: ['json'] }],
})
if (!cancelSave && filePath) writeExport(filePath)

// Message box — response is the index of the clicked button
const { response } = await dialog.showMessageBox(win, {
  type: 'warning',
  buttons: ['Cancel', 'Discard'],
  defaultId: 0,
  cancelId: 0,
  message: 'Discard unsaved changes?',
})
if (response === 1) discard()
```

- ✅ Pass the parent `win` as the first arg so the dialog is **modal** to that window.
- ✅ Always check `canceled` before using `filePaths` / `filePath`.
- ✅ Set both `defaultId` and `cancelId` on message boxes so keyboard/Esc behave correctly.
- ❌ **DON'T** use the synchronous `showMessageBoxSync` / `showOpenDialogSync` on the hot
  path — they block the main process (and thus every window).

## Global Shortcuts

`globalShortcut` registers OS-wide accelerators that fire even when the app is not focused.
Register after `ready`, and **always unregister on quit** — leaked global shortcuts can
hold the combo from other apps until the OS cleans up.

```js
const { app, globalShortcut } = require('electron')

app.whenReady().then(() => {
  const ok = globalShortcut.register('CommandOrControl+Shift+K', () => {
    toggleQuickCapture()
  })
  if (!ok) console.warn('Shortcut already taken by another app')
})

app.on('will-quit', () => {
  globalShortcut.unregisterAll() // REQUIRED cleanup
})
```

- ✅ Check the boolean return of `register` — another app may already own the combo.
- ✅ Unregister in `will-quit` (or `unregister` individually when a feature turns off).
- ❌ **DON'T** use `globalShortcut` for in-window shortcuts — use a menu `accelerator` or
  the renderer's keydown handling instead; global shortcuts steal the combo system-wide.

## Clipboard

`clipboard` reads/writes text, HTML, images, and RTF. It works in both processes, but for
untrusted renderers prefer doing it in main and exposing a narrow bridge.

```js
const { clipboard, nativeImage } = require('electron')

clipboard.writeText('hello')
const text = clipboard.readText()

clipboard.write({ text: 'fallback', html: '<b>rich</b>' })
const img = clipboard.readImage() // a NativeImage; .isEmpty() if none
clipboard.writeImage(nativeImage.createFromPath('/path/to/pic.png'))
```

- ✅ Use `clipboard.write({...})` to set multiple formats at once (text + html).
- ❌ **DON'T** assume `readImage()` is non-empty — check `.isEmpty()`.

## Dark Mode and nativeTheme

`nativeTheme` reports and controls the OS theme. Read `shouldUseDarkColors`, and listen for
`updated` to react when the user flips their system theme.

```js
const { nativeTheme, ipcMain } = require('electron')

ipcMain.handle('theme:isDark', () => nativeTheme.shouldUseDarkColors)

nativeTheme.on('updated', () => {
  mainWindow?.webContents.send('theme:changed', nativeTheme.shouldUseDarkColors)
})

// Force a theme regardless of the OS (e.g. an in-app theme toggle):
nativeTheme.themeSource = 'dark' // 'system' | 'light' | 'dark'
```

In the renderer's CSS, pair this with the standard media query so the page restyles even
without JS:

```css
@media (prefers-color-scheme: dark) {
  :root { color-scheme: dark; background: #1e1e1e; color: #eee; }
}
```

- ✅ Set `themeSource = 'system'` (the default) unless the app offers its own toggle.
- ✅ Combine `nativeTheme` (for native UI like menus/dialogs) with the CSS media query
  (for page content) — they cover different surfaces.
- ❌ **DON'T** poll for theme changes — subscribe to the `updated` event.

## Validation Checklist

- [ ] Menus/Tray/Notification/dialog/globalShortcut are built in the **main** process after `app.whenReady()`
- [ ] Application menu uses `role`s for standard items; accelerators use `CmdOrCtrl`/`CommandOrControl`
- [ ] The `Tray` instance is held at module scope (not GC'd) and has a tooltip + context menu
- [ ] On Windows, `app.setAppUserModelId(...)` is called at startup so notifications appear
- [ ] `Notification.isSupported()` is checked before constructing notifications
- [ ] Dialogs pass the parent window (modal) and check `canceled` before using paths
- [ ] Async dialog methods are used on hot paths, not the `*Sync` variants
- [ ] Every `globalShortcut.register` is matched by `unregisterAll()` in `will-quit`
- [ ] Theme handling subscribes to `nativeTheme` `updated`; renderer also honors `prefers-color-scheme`
