---
name: tauri-debugging
description: >
  Debug a Tauri v2 app across both halves — opening the webview devtools inspector in dev
  and in production builds, logging and breakpoint-debugging the Rust core, inspecting IPC
  with CrabNebula DevTools, and fixing Linux/WebKitGTK rendering failures.
  USE FOR: opening or programmatically toggling devtools, enabling the inspector in a
  release build, setting up VS Code launch configs for Rust + frontend, tracing IPC calls
  and events, and diagnosing blank/white windows or crashes on resize on Linux.
  DO NOT USE FOR: writing automated tests or mocking IPC (see tauri-testing), defining
  commands (see tauri-commands-ipc), or the permission/capability system.
---

# Tauri v2 Debugging

A Tauri bug lives in one of two places: the **webview** (your HTML/JS, debugged like any web app) or the **Rust core** (debugged like any Rust binary). The hard part is the seam between them — the IPC bridge — plus platform-specific webview quirks. This skill covers both halves and the seam. Distilled from https://v2.tauri.app/develop/debug/.

## When to Use This Skill

- Opening the webview inspector, or enabling it in a production/release build
- Toggling devtools from Rust at startup
- Setting breakpoints in the Rust core from VS Code
- Watching IPC commands, events, payloads, and spans flow through the app
- Fixing a window that opens blank/white, flickers, or crashes on resize (Linux)

## Webview DevTools

### In development

The inspector is built into dev builds — open it with:

- **Right-click → Inspect Element** in the webview, or
- **`Ctrl + Shift + I`** (Linux/Windows) / **`Cmd + Option + I`** (macOS).

The inspector is platform-native: WebKitGTK's inspector on Linux, Safari's Web Inspector on macOS, Edge DevTools on Windows. So a JS bug that only reproduces on one platform must be inspected on that platform's webview.

### In production builds

DevTools are stripped from release builds by default. To ship a build that can open them, add the `devtools` Cargo feature:

```toml
# src-tauri/Cargo.toml
[dependencies]
tauri = { version = "2", features = ["devtools"] }
```

> ❌ **DON'T** enable the `devtools` feature for an App Store macOS build — it uses private APIs and Apple will reject the app. Gate it to non-store release channels.

### Toggle from Rust

Open/close the inspector programmatically (useful for headless repro or a hidden debug menu):

```rust
use tauri::Manager;

tauri::Builder::default()
    .setup(|app| {
        #[cfg(debug_assertions)] // only in debug builds
        {
            let window = app.get_webview_window("main").unwrap();
            window.open_devtools();
            // window.close_devtools();
        }
        Ok(())
    });
```

`open_devtools()` / `close_devtools()` are available whenever the inspector is compiled in — i.e. in debug builds, or in release builds with the `devtools` feature.

## Rust-Side Debugging

### Logging

`println!()` / `eprintln!()` / `dbg!()` go to the terminal where `tauri dev` runs (the Rust **core** stdout), NOT the browser console. The browser console shows only frontend logs.

For full panic backtraces:

```bash
RUST_BACKTRACE=1 tauri dev          # Linux/macOS
$env:RUST_BACKTRACE=1; tauri dev     # Windows PowerShell
```

> ❌ **DON'T** expect a panic in a `#[tauri::command]` to surface in the webview console — check the core terminal. A command that panics rejects the JS promise with an opaque error; the real stack is in the Rust stdout.

For structured logging across both sides, the `tauri-plugin-log` plugin can fan logs to stdout, a file, and the webview console.

### Breakpoints in VS Code

Install **CodeLLDB** (`vadimcn.vscode-lldb`) for cross-platform native debugging; on Windows the C/C++ extension + Visual Studio debugger is an alternative. The pattern is a `launch.json` that builds the Rust binary via `cargo` and a `tasks.json` that starts the frontend dev server first.

```jsonc
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "lldb",
      "request": "launch",
      "name": "Tauri Development Debug",
      "cargo": {
        "args": ["build", "--manifest-path=./src-tauri/Cargo.toml", "--no-default-features"]
      },
      "preLaunchTask": "ui:dev" // start the frontend dev server first
    }
  ]
}
```

```jsonc
// .vscode/tasks.json — the dev server must stay running in the background
{
  "version": "2.0.0",
  "tasks": [
    { "label": "ui:dev", "type": "shell", "isBackground": true, "command": "<your beforeDevCommand>" },
    { "label": "ui:build", "type": "shell", "command": "<your beforeBuildCommand>" }
  ]
}
```

Set breakpoints in `src-tauri/src/lib.rs` / `main.rs` and press F5. Swap the cargo args to `--release` for a production-config debug session.

## CrabNebula DevTools — inspecting the IPC seam

The browser inspector cannot see the Rust side of IPC. **CrabNebula DevTools** is the official companion inspector that instruments the app and visualizes commands, events, their payloads/responses, log events (including from dependencies), and execution **spans** (command timing/performance) in a live web UI.

```bash
cargo add tauri-plugin-devtools@2.0.0
```

Initialize it as early as possible, and only in debug builds:

```rust
// src-tauri/src/lib.rs
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    #[cfg(debug_assertions)]
    let devtools = tauri_plugin_devtools::init(); // attach first

    let mut builder = tauri::Builder::default();
    #[cfg(debug_assertions)]
    {
        builder = builder.plugin(devtools);
    }

    builder
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

> ❌ **DON'T** ship the devtools plugin in release — gate it behind `#[cfg(debug_assertions)]` so it's compiled out of production binaries.
> ✅ **DO** use it (not `println!` spelunking) when you need to see exactly what payload a command received, why an event didn't fire, or which command is slow.

## Linux / WebKitGTK Troubleshooting

WebKitGTK rendering is the most common platform-specific Tauri failure. Symptoms: window opens **blank/white**, flickers on resize, or crashes on resize with little output; console mentions `AcceleratedSurfaceDMABuf` framebuffer failures. These are environment/driver issues, not app bugs — try these env vars in order:

| Env var | Fixes | Cost |
|---------|-------|------|
| `__NV_DISABLE_EXPLICIT_SYNC=1` | Wayland `Error 71` protocol errors on NVIDIA | minimal — try first |
| `WEBKIT_DISABLE_DMABUF_RENDERER=1` | DMABUF framebuffer errors, Wayland crashes, blank window | disables the fast HW render path |
| `WEBKIT_DISABLE_COMPOSITING_MODE=1` | Silent crashes on window resize (last resort) | disables accelerated compositing |

```bash
WEBKIT_DISABLE_DMABUF_RENDERER=1 tauri dev
```

> ⚠️ WebGL contexts can silently fall back to a slow software path on Linux with no error. If a WebGL-heavy UI is mysteriously sluggish, suspect this and provide a non-WebGL fallback.

When you find the var that fixes it, you can set it for end users from Rust early in `run()` (before the webview is created) with `std::env::set_var`, or document it in your packaging — but treat it as a workaround for specific driver stacks, not a default.

## Validation Checklist

- [ ] Devtools opened via right-click/shortcut in dev, or `devtools` feature added for a release build that needs them
- [ ] `devtools` feature NOT enabled for an App Store macOS build
- [ ] Rust logs read from the `tauri dev` terminal, not the browser console; `RUST_BACKTRACE=1` set when chasing panics
- [ ] VS Code uses CodeLLDB with a `preLaunchTask` that starts the frontend dev server (`isBackground: true`)
- [ ] CrabNebula `tauri-plugin-devtools` gated behind `#[cfg(debug_assertions)]` and initialized early
- [ ] Linux blank/crash issues triaged with `__NV_DISABLE_EXPLICIT_SYNC` → `WEBKIT_DISABLE_DMABUF_RENDERER` → `WEBKIT_DISABLE_COMPOSITING_MODE`
