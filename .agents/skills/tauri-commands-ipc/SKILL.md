---
name: tauri-commands-ipc
description: >
  Call Rust from the frontend in Tauri v2 — defining #[tauri::command] functions,
  registering them with generate_handler!, invoking them from JavaScript, async commands,
  passing arguments, and returning Result for error handling.
  USE FOR: exposing Rust functionality to the web frontend, debugging "command not found"
  or argument-mismatch errors, async/fallible commands, accessing AppHandle/Window/State
  inside a command.
  DO NOT USE FOR: Rust → frontend communication (see tauri-events), the permission gate
  that must allow each command (see tauri-capabilities), or managing shared state
  (see tauri-state-management).
---

# Tauri v2 Commands & IPC

Commands are the primary way the WebView asks the Rust core to do something. You annotate a Rust function, register it, and call it by name from JS. Distilled from https://v2.tauri.app/develop/calling-rust/.

## When to Use This Skill

- Exposing a Rust function to the frontend
- Debugging `Command <name> not found` or arguments that arrive as `undefined`
- Writing async or fallible (`Result`) commands
- Accessing `AppHandle`, the calling `WebviewWindow`, or managed `State` from inside a command

## The Three-Step Pattern

### 1. Define the command

```rust
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {name}!")
}
```

### 2. Register it — the #1 footgun

Every command **must** be listed in `generate_handler!`. Forgetting this is the single most common Tauri mistake: the build succeeds, but the call fails at runtime.

```rust
// src-tauri/src/lib.rs
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![greet]) // <-- register here
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

> ❌ **DON'T** define a command and forget to register it:
> ```rust
> #[tauri::command]
> fn greet(name: &str) -> String { format!("Hi {name}") }
> // ...generate_handler![]  <-- greet missing → "Command greet not found"
> ```
> ✅ **DO** add every command name to the macro: `generate_handler![greet, save_file, load_config]`. Multiple modules: list them with paths, e.g. `generate_handler![commands::greet, commands::save]`. You can only call `invoke_handler` **once** — pass all commands to a single `generate_handler!`.

### 3. Invoke from JavaScript

```js
import { invoke } from '@tauri-apps/api/core'; // v2: /core, NOT /tauri

const message = await invoke('greet', { name: 'World' });
// "Hello, World!"
```

`invoke` always returns a `Promise`.

## Passing Arguments

JS argument keys are **camelCase**, Rust parameters are **snake_case** — Tauri converts automatically.

```rust
#[tauri::command]
fn login(user_name: String, remember_me: bool) -> bool { /* ... */ true }
```

```js
await invoke('login', { userName: 'ada', rememberMe: true });
```

> To keep snake_case (or another style) on the JS side, override per command:
> ```rust
> #[tauri::command(rename_all = "snake_case")]
> fn login(user_name: String) {}
> // JS: invoke('login', { user_name: 'ada' })
> ```

Argument and return types must implement `serde::Deserialize` / `serde::Serialize`. Define structs with `#[derive(serde::Deserialize)]` for complex inputs.

## Returning Results & Error Handling

A command can fail by returning `Result<T, E>` where `E: Serialize`. On `Err`, the JS `Promise` **rejects** — handle it with `try/catch`. Returning a plain value never rejects.

`std::error::Error` types are **not** `Serialize`, so define a serializable error type (or return `Result<T, String>` for quick cases):

```rust
#[derive(Debug, thiserror::Error)]
enum Error {
    #[error(transparent)]
    Io(#[from] std::io::Error),
}

// Tell serde how to serialize it (errors aren't Serialize by default)
impl serde::Serialize for Error {
    fn serialize<S: serde::Serializer>(&self, s: S) -> Result<S::Ok, S::Error> {
        s.serialize_str(self.to_string().as_ref())
    }
}

#[tauri::command]
fn read_config(path: String) -> Result<String, Error> {
    let contents = std::fs::read_to_string(path)?; // `?` works via #[from]
    Ok(contents)
}
```

```js
try {
  const cfg = await invoke('read_config', { path: 'app.toml' });
} catch (err) {
  console.error('command failed:', err); // err is the serialized Error string
}
```

## Async Commands

Make a command `async` for non-blocking work; Tauri runs it on a separate thread so the WebView never blocks. This is required for any long-running or I/O-bound work.

```rust
#[tauri::command]
async fn fetch_data(url: String) -> Result<String, String> {
    // awaiting real async work
    reqwest::get(&url).await.map_err(|e| e.to_string())?
        .text().await.map_err(|e| e.to_string())
}
```

> Borrowed args (e.g. `&str`) in an `async` command cause lifetime errors. Use owned types (`String`) instead, or wrap in `Result` to satisfy the macro. The reference docs note: when an async command takes a reference, you must return a `Result`.

## Accessing AppHandle, Window, and State

Add these as parameters in **any order** — Tauri injects them, and they don't appear in the JS argument list:

```rust
use tauri::{AppHandle, Manager, State, Window, ipc::Request};

#[tauri::command]
fn context_demo(
    app: AppHandle,
    window: Window,            // the calling window
    state: State<'_, MyState>, // managed state (see tauri-state-management)
    user_arg: String,          // <-- only this comes from JS
) {
    let _ = app.get_webview_window("main");
    println!("called from window {}", window.label());
}
```

```js
await invoke('context_demo', { userArg: 'hi' }); // only user_arg passed
```

## Remember the Permission Gate

Custom commands are allowed by `core:default` in development scaffolds, but in production each command path is governed by the capability/permission system. If a registered command "does nothing" with no error in the console, check the capabilities file (see tauri-capabilities). Plugin commands always require their plugin's permission to be granted.

## Validation Checklist

- [ ] Every `#[tauri::command]` is listed in a single `generate_handler!`
- [ ] Frontend imports `invoke` from `@tauri-apps/api/core`
- [ ] JS argument keys match Rust params (camelCase ↔ snake_case, or `rename_all`)
- [ ] Fallible commands return `Result<T, E>` with a `Serialize` error type
- [ ] Long-running/I/O commands are `async`
- [ ] The command's capability is granted (no silent no-ops)
