---
name: tauri-state-management
description: >
  Share application state across Tauri v2 commands — registering state with
  Manager::manage, accessing it via State<T> in commands, and using interior mutability
  (Mutex) for state that changes at runtime.
  USE FOR: holding a database pool, config, counters, caches, or any data multiple commands
  must read/write; debugging "state not managed" panics or borrow/mutation errors on
  shared state.
  DO NOT USE FOR: passing one-off arguments to a command (see tauri-commands-ipc), or
  pushing data to the frontend (see tauri-events).
---

# Tauri v2 State Management

When several commands need to share data — a database connection, parsed config, a counter — register it once with Tauri's managed state and inject it into commands via `State<T>`. Distilled from https://v2.tauri.app/develop/state-management/.

## When to Use This Skill

- Multiple commands read/write the same data (DB pool, config, cache, counter)
- You hit `state not managed for field of type ...` panics
- You need to mutate shared state from a command and the borrow checker rejects it

## Registering State

Call `.manage()` (from the `Manager` trait, implemented by `Builder`, `App`, and `AppHandle`) **once per type**. Tauri stores it keyed by type.

```rust
use tauri::Manager;

struct AppData {
    welcome_message: String,
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            app.manage(AppData {
                welcome_message: "Welcome!".into(),
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![greet])
        .run(tauri::generate_context!())
        .expect("error while running");
}
```

> You can manage one value per type. To store two `String`s, wrap them in distinct newtypes or a single struct. Managing the same type twice panics.

## Accessing State in a Command

Add a `State<'_, T>` parameter — Tauri injects it; it doesn't appear in the JS argument list.

```rust
use tauri::State;

#[tauri::command]
fn greet(state: State<'_, AppData>) -> String {
    state.welcome_message.clone()
}
```

```js
await invoke('greet'); // no args — state is injected by Tauri
```

> ❌ **Footgun:** asking for `State<'_, AppData>` when nothing was `manage(AppData ...)`'d **panics at runtime**, not compile time. Always pair a `State<T>` parameter with a `.manage()` of the same `T`.

Outside a command (e.g. in `setup` or an event handler) reach state via `app.state::<AppData>()`.

## Interior Mutability — Mutating Shared State

`State<T>` gives a **shared reference** (`&T`). To mutate, the managed value must use interior mutability. For state shared across threads (commands can run on different threads), use `std::sync::Mutex`:

```rust
use std::sync::Mutex;
use tauri::{Manager, State};

#[derive(Default)]
struct Counter(Mutex<u32>);

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            app.manage(Counter(Mutex::new(0)));
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![increment])
        .run(tauri::generate_context!())
        .expect("error while running");
}

#[tauri::command]
fn increment(counter: State<'_, Counter>) -> u32 {
    let mut count = counter.0.lock().unwrap();
    *count += 1;
    *count
}
```

> **Manage the `Mutex`-wrapped value, not the inner value.** `app.manage(Mutex::new(0u32))` then `State<'_, Mutex<u32>>`. Wrapping at manage time is what lets commands lock and mutate.

### Async commands and locking

`std::sync::MutexGuard` is **not `Send`**, so holding a `std::sync::Mutex` lock across an `.await` won't compile in an async command. Options:

- Lock, copy/clone what you need, and drop the guard **before** awaiting:

```rust
#[tauri::command]
async fn process(state: State<'_, Counter>) -> Result<u32, ()> {
    let current = { *state.0.lock().unwrap() }; // guard dropped here
    do_async_work(current).await;
    Ok(current)
}
```

- Or use an async-aware mutex (`tokio::sync::Mutex`) when you genuinely must hold the lock across awaits — but prefer the lock-copy-drop pattern.

## Larger State Patterns

- **Database pool:** `app.manage(pool)` once in `setup`, then `State<'_, SqlitePool>` in commands.
- **Config:** manage an immutable struct (no `Mutex` needed if read-only).
- **`AppHandle` access:** any command can take `app: AppHandle` and call `app.state::<T>()` directly.

## Validation Checklist

- [ ] Each managed type is `.manage()`'d exactly once
- [ ] Every `State<'_, T>` parameter has a matching `.manage::<T>()` (or it panics at runtime)
- [ ] Mutable state is wrapped in `Mutex` (or another interior-mutability type) **at manage time**
- [ ] Async commands don't hold a `std::sync::Mutex` guard across `.await`
- [ ] Read-only state isn't needlessly wrapped in a `Mutex`
