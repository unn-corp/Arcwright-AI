---
name: tauri-events
description: "Implement or debug Tauri event listeners, emission, payloads, and listener cleanup."
---

# Tauri v2 Events & Channels

Commands are request/response. **Events** are fire-and-forget messages, ideal for pushing data *from* Rust to the frontend without the frontend asking. **Channels** are a faster path for streaming many ordered messages from a single command. Distilled from https://v2.tauri.app/develop/calling-frontend/.

## When to Use This Skill

- The Rust core needs to notify the frontend of something it didn't request (progress, a finished background job, a system event)
- Broadcasting between multiple windows
- Streaming a sequence of values (download bytes, log lines, partial results)
- Listening in Rust for events emitted by the frontend

## Emitting from Rust

`emit` and `emit_to` live on the **`Emitter`** trait — you must `use tauri::Emitter;`. `AppHandle` and `WebviewWindow` both implement it.

```rust
use tauri::{AppHandle, Emitter};

#[derive(Clone, serde::Serialize)]
struct Progress { step: u32, total: u32 }

#[tauri::command]
fn start_job(app: AppHandle) {
    std::thread::spawn(move || {
        for step in 1..=5 {
            // global emit — every listener in every window receives it
            app.emit("job-progress", Progress { step, total: 5 }).unwrap();
            std::thread::sleep(std::time::Duration::from_millis(200));
        }
    });
}
```

Target a specific window with `emit_to`:

```rust
app.emit_to("main", "job-progress", Progress { step: 1, total: 5 }).unwrap();
```

> Payloads must be `Clone + Serialize`. `emit` broadcasts to all webviews; `emit_to(label, ...)` targets one. For finer routing use `emit_filter`.

## Listening on the Frontend

```js
import { listen } from '@tauri-apps/api/event';

const unlisten = await listen('job-progress', (event) => {
  // event.payload is the deserialized struct
  console.log(`${event.payload.step} / ${event.payload.total}`);
});

// Always clean up — especially in component teardown — to avoid leaks/duplicates
unlisten();
```

> ❌ **DON'T** register a `listen` on every component re-render without calling the returned `unlisten` — you'll stack duplicate handlers.
> ✅ **DO** store the `unlisten` function and call it on teardown. Use `once` for a single-shot listener.

`getCurrentWebviewWindow().listen(...)` (from `@tauri-apps/api/webviewWindow`) scopes a listener to events targeted at that specific window.

## Emitting from the Frontend

```js
import { emit } from '@tauri-apps/api/event';
await emit('frontend-ready', { ok: true });
```

## Listening in Rust

`listen` is on the **`Listener`** trait — `use tauri::Listener;`.

```rust
use tauri::{Listener, Manager};

pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            app.listen("frontend-ready", |event| {
                println!("frontend says: {}", event.payload());
            });
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running");
}
```

`event.payload()` returns the raw JSON string; deserialize with `serde_json::from_str` if needed. Use `listen_any` to catch events regardless of target window.

## Channels — Efficient Streaming

Events go through JSON serialization and are best for occasional messages. For **high-throughput ordered streaming** from a single command (download progress, streaming a file, log tailing), use `tauri::ipc::Channel<T>`, which is faster and preserves ordering.

```rust
use tauri::ipc::Channel;

#[derive(Clone, serde::Serialize)]
#[serde(rename_all = "camelCase", tag = "event", content = "data")]
enum DownloadEvent {
    Started { url: String, content_length: usize },
    Progress { chunk_length: usize },
    Finished,
}

#[tauri::command]
fn download(url: String, on_event: Channel<DownloadEvent>) {
    on_event.send(DownloadEvent::Started { url, content_length: 1000 }).unwrap();
    for _ in 0..10 {
        on_event.send(DownloadEvent::Progress { chunk_length: 100 }).unwrap();
    }
    on_event.send(DownloadEvent::Finished).unwrap();
}
```

```js
import { invoke, Channel } from '@tauri-apps/api/core';

const onEvent = new Channel();
onEvent.onmessage = (message) => {
  // message matches the serialized DownloadEvent enum
  console.log(message.event, message.data);
};

await invoke('download', { url: 'https://example.com/file', onEvent });
```

> Pick **channels** for many ordered messages tied to one invocation; pick **events** for broadcast/global notifications and frontend→Rust signals.

## Validation Checklist

- [ ] `use tauri::Emitter;` is in scope when calling `emit` / `emit_to`
- [ ] `use tauri::Listener;` is in scope when calling `listen` in Rust
- [ ] Event payloads derive `Clone + Serialize`
- [ ] Frontend `listen` calls store and invoke the returned `unlisten`
- [ ] High-throughput streams use `Channel<T>`, not repeated `emit`
