---
name: tauri-windowing
description: >
  Create and manage native windows and UI chrome in Tauri v2 — WebviewWindow
  (Rust WebviewWindowBuilder + JS WebviewWindow), multiple windows/multiwebview,
  native menus (Menu/Submenu/MenuItem/PredefinedMenuItem), tray icons
  (TrayIconBuilder), window customization (decorations false, transparency, custom
  titlebar with data-tauri-drag-region), and the splashscreen pattern.
  USE FOR: opening extra windows at runtime, building an application or context
  menu, adding a system tray icon with a menu and click events, removing native
  decorations and drawing a custom titlebar, hiding the main window behind a
  splashscreen, and wiring the matching core:window / core:menu / core:tray
  permissions.
  DO NOT USE FOR: calling Rust from JS (see tauri-commands-ipc), Rust → frontend
  events (see tauri-events), or the general permission model (see
  tauri-capabilities).
---

# Tauri v2 Windowing & Native UI

In Tauri v2 a window is a `WebviewWindow` — an OS window with a webview inside it. The same object is built from Rust (`WebviewWindowBuilder`) or created from JS (`WebviewWindow`). Menus, tray icons, and custom titlebars are layered on top. Every one of these is gated by a `core:` permission — forget the permission and the call silently no-ops. Distilled from https://v2.tauri.app/learn/window-customization/, /learn/system-tray/, /learn/window-menu/, /learn/splashscreen/, and the `@tauri-apps/api/webviewWindow` reference.

## When to Use This Skill

- Opening a second/extra window at runtime (Rust or JS)
- Building an application menu, window menu, or context menu
- Adding a system tray icon with a menu and click handling
- Removing native decorations and drawing a custom HTML titlebar
- Hiding the main window behind a splashscreen until setup completes
- Debugging a window/menu/tray call that does nothing (usually a missing permission)

## Creating & Managing Windows

### Rust — WebviewWindowBuilder

```rust
use tauri::{WebviewWindowBuilder, WebviewUrl};

tauri::Builder::default()
    .setup(|app| {
        let _win = WebviewWindowBuilder::new(
            app,
            "settings",                              // unique window label
            WebviewUrl::App("settings.html".into()), // page bundled in frontendDist
        )
        .title("Settings")
        .inner_size(800.0, 600.0)
        .resizable(true)
        .build()?;
        Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
```

Inside a command, build from the `AppHandle`. Use `WebviewUrl::External(url.parse()?)` to load a remote URL.

### JS — WebviewWindow

```js
import { WebviewWindow } from '@tauri-apps/api/webviewWindow';

const win = new WebviewWindow('settings', {
  url: 'settings.html',
  title: 'Settings',
  width: 800,
  height: 600,
});

win.once('tauri://created', () => { /* window ready */ });
win.once('tauri://error', (e) => console.error('failed to create window', e));

// Reach an existing window by label:
const existing = await WebviewWindow.getByLabel('settings');
```

> ❌ **DON'T** reuse a label that is already open — labels are unique; creation fails with `tauri://error`.
> ✅ **DO** call `WebviewWindow.getByLabel(label)` first and focus it if it already exists.

**Required permission** (multiwindow at runtime):

```json
{ "permissions": ["core:webview:allow-create-webview-window", "core:window:allow-create"] }
```

## Native Menus

```rust
use tauri::menu::{MenuBuilder, SubmenuBuilder, MenuItem, PredefinedMenuItem};

tauri::Builder::default()
    .setup(|app| {
        let open = MenuItem::with_id(app, "open", "Open…", true, Some("CmdOrCtrl+O"))?;
        let file = SubmenuBuilder::new(app, "File")
            .item(&open)
            .separator()
            .item(&PredefinedMenuItem::quit(app, Some("Quit"))?)
            .build()?;
        let menu = MenuBuilder::new(app).item(&file).build()?;
        app.set_menu(menu)?;             // sets the app menu
        Ok(())
    })
    .on_menu_event(|app, event| {
        if event.id() == "open" {
            // handle the click
        }
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
```

`PredefinedMenuItem` gives you OS-native items (`quit`, `copy`, `paste`, `separator`, …). From JS:

```js
import { Menu, Submenu, MenuItem, PredefinedMenuItem } from '@tauri-apps/api/menu';

const menu = await Menu.new({
  items: [
    await Submenu.new({
      text: 'File',
      items: [
        await MenuItem.new({ id: 'open', text: 'Open…', action: () => {} }),
        await PredefinedMenuItem.new({ item: 'Quit' }),
      ],
    }),
  ],
});
await menu.setAsAppMenu();
```

**Required permission:**

```json
{ "permissions": ["core:menu:default"] }
```

## Tray Icon

```rust
use tauri::{
    menu::{Menu, MenuItem},
    tray::{TrayIconBuilder, TrayIconEvent, MouseButton, MouseButtonState},
    Manager,
};

tauri::Builder::default()
    .setup(|app| {
        let quit = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
        let menu = Menu::with_items(app, &[&quit])?;

        TrayIconBuilder::new()
            .icon(app.default_window_icon().unwrap().clone())
            .menu(&menu)
            .show_menu_on_left_click(false)
            .on_menu_event(|app, event| {
                if event.id.as_ref() == "quit" {
                    app.exit(0);
                }
            })
            .on_tray_icon_event(|tray, event| {
                if let TrayIconEvent::Click {
                    button: MouseButton::Left,
                    button_state: MouseButtonState::Up,
                    ..
                } = event
                {
                    if let Some(win) = tray.app_handle().get_webview_window("main") {
                        let _ = win.show();
                        let _ = win.set_focus();
                    }
                }
            })
            .build(app)?;
        Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
```

The Rust tray API needs the `tray-icon` Cargo feature: `tauri = { version = "2", features = ["tray-icon"] }`. The JS counterpart is `import { TrayIcon } from '@tauri-apps/api/tray'` → `await TrayIcon.new(options)`.

**Required permission:**

```json
{ "permissions": ["core:tray:default"] }
```

## Window Customization — Custom Titlebar

Remove native chrome in `tauri.conf.json`:

```json
{ "app": { "windows": [{ "label": "main", "decorations": false, "transparent": false }] } }
```

Draw your own titlebar — `data-tauri-drag-region` makes a region drag the window:

```html
<div data-tauri-drag-region class="titlebar">
  <button id="titlebar-minimize">–</button>
  <button id="titlebar-maximize">▢</button>
  <button id="titlebar-close">✕</button>
</div>
```

```js
import { getCurrentWindow } from '@tauri-apps/api/window';
const appWindow = getCurrentWindow();
document.getElementById('titlebar-minimize')?.addEventListener('click', () => appWindow.minimize());
document.getElementById('titlebar-maximize')?.addEventListener('click', () => appWindow.toggleMaximize());
document.getElementById('titlebar-close')?.addEventListener('click', () => appWindow.close());
```

> ❌ **DON'T** set `decorations: false` and ship without granting the drag/control permissions — the buttons do nothing and the window can't be moved.
> ✅ **DO** grant the matching permissions:

```json
{
  "permissions": [
    "core:window:allow-start-dragging",
    "core:window:allow-minimize",
    "core:window:allow-toggle-maximize",
    "core:window:allow-close"
  ]
}
```

For a transparent window, also set `"transparent": true` (macOS additionally requires `macOSPrivateApi` enabled in config).

## Splashscreen Pattern

Hide the main window and show a splash window until setup finishes:

```json
{
  "app": {
    "windows": [
      { "label": "main", "visible": false },
      { "label": "splashscreen", "url": "/splashscreen" }
    ]
  }
}
```

```rust
use tauri::{AppHandle, Manager};

#[tauri::command]
async fn finish_setup(app: AppHandle) -> Result<(), ()> {
    if let Some(splash) = app.get_webview_window("splashscreen") {
        splash.close().unwrap();
    }
    app.get_webview_window("main").unwrap().show().unwrap();
    Ok(())
}
```

```js
import { invoke } from '@tauri-apps/api/core';
window.addEventListener('DOMContentLoaded', async () => {
  // …run frontend setup work…
  await invoke('finish_setup');
});
```

`get_webview_window` / `app.show()` here are Rust-side and need no JS permission, but if the frontend calls `window.show()`/`window.close()` directly, grant `core:window:allow-show` / `core:window:allow-close`.

## Validation Checklist

- [ ] Each window has a unique `label`; runtime creation checks `getByLabel` first
- [ ] Multiwindow grants `core:webview:allow-create-webview-window`
- [ ] Menus grant `core:menu:default`; the tray grants `core:tray:default` (+ `tray-icon` feature)
- [ ] `on_menu_event`/`on_tray_icon_event` match item IDs exactly
- [ ] `decorations: false` is paired with `core:window:allow-start-dragging` + minimize/maximize/close grants
- [ ] `data-tauri-drag-region` is on the draggable titlebar element
- [ ] Splashscreen config sets `main` to `visible: false` and closes the splash once setup completes
