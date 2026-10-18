---
name: tauri-testing
description: "Test Tauri frontend/Rust integration and application behavior using the existing project harness."
---

# Tauri v2 Testing

A Tauri app is a web frontend talking to a Rust core over an IPC bridge. Standard web test tooling never sees that bridge — in jsdom/Node there is no native webview, so any `invoke()` call hangs or throws. You either **mock** the bridge (fast, in-process) or **drive** a real built app over **WebDriver** (slow, real). Distilled from https://v2.tauri.app/develop/tests/.

## When to Use This Skill

- Writing frontend unit/component tests that call `invoke()` or read window labels
- Standing up end-to-end tests that click through the real packaged app
- Unit-testing a `#[tauri::command]` in Rust without launching a webview
- Diagnosing tests that hang or fail because the Tauri API isn't available in the test runner
- Wiring Tauri tests into CI (Linux/Windows)

## The Three Test Layers

| Layer | What it tests | Tool | Speed |
|-------|---------------|------|-------|
| Frontend mocked | JS/TS that calls `invoke`/`event`/windows | `@tauri-apps/api/mocks` + Vitest/Jest | fast |
| Rust unit | `#[tauri::command]` logic | `tauri::test` mock runtime | fast |
| End-to-end | The whole built binary | `tauri-driver` + Selenium/WebdriverIO | slow |

## Layer 1 — Mocking the IPC Bridge (frontend)

Import the mock helpers from `@tauri-apps/api/mocks` (note: the package is `@tauri-apps/api`, NOT a separate one). `mockIPC` intercepts every `invoke` and lets you return whatever the backend would. `clearMocks` resets state between tests.

```js
import { afterEach, beforeAll, expect, test } from 'vitest';
import { mockIPC, mockWindows, clearMocks } from '@tauri-apps/api/mocks';
import { invoke } from '@tauri-apps/api/core'; // v2: /core, NOT /tauri

afterEach(() => {
  clearMocks(); // reset after EVERY test or state leaks across tests
});

test('invoke add is mocked', async () => {
  mockIPC((cmd, args) => {
    if (cmd === 'add') return args.a + args.b;
  });
  expect(await invoke('add', { a: 12, b: 15 })).toBe(27);
});
```

`mockWindows('main', 'settings')` fakes the set of window labels so code that calls `getCurrentWindow()` or enumerates windows works under test. The first label is treated as the current window.

> ❌ **DON'T** forget `clearMocks()` — leftover IPC mocks bleed into later tests and produce confusing passes/failures.
> ✅ **DO** call it in `afterEach`, and re-register `mockIPC` per test with only the commands that test needs.

> ❌ **DON'T** import from `@tauri-apps/api/tauri` (that path is Tauri v1). In v2, `invoke` is in `@tauri-apps/api/core` and mocks are in `@tauri-apps/api/mocks`.

### jsdom needs a crypto shim

`mockIPC` uses the WebCrypto API to correlate calls. jsdom has no WebCrypto, so polyfill it before the tests run:

```js
import { beforeAll } from 'vitest';
import { randomFillSync } from 'crypto'; // Node's crypto module

beforeAll(() => {
  Object.defineProperty(window, 'crypto', {
    value: { getRandomValues: (buffer) => randomFillSync(buffer) },
  });
});
```

The `happy-dom` environment and modern Node test runners often provide `crypto` already — only add this shim if you see "crypto is not defined".

## Layer 2 — Rust Unit Tests (the mock runtime)

The `tauri::test` module ships a headless mock runtime so you can build an `App` and exercise commands without a real webview. Enable it with the `test` feature on `tauri` (dev-only):

```toml
# src-tauri/Cargo.toml
[dev-dependencies]
tauri = { version = "2", features = ["test"] }
```

Factor app construction so tests and `run()` share it, then build with `mock_builder()`:

```rust
use tauri::test::{mock_builder, mock_context, noop_assets};

#[tauri::command]
fn greet(name: String) -> String {
    format!("Hello, {name}")
}

fn create_app<R: tauri::Runtime>(builder: tauri::Builder<R>) -> tauri::App<R> {
    builder
        .invoke_handler(tauri::generate_handler![greet])
        .build(mock_context(noop_assets())) // no real assets needed
        .expect("failed to build mock app")
}

#[cfg(test)]
mod tests {
    use tauri::Manager;

    #[test]
    fn greet_returns_greeting() {
        let app = super::create_app(tauri::test::mock_builder());
        let webview = tauri::WebviewWindowBuilder::new(&app, "main", Default::default())
            .build()
            .unwrap();

        let res = tauri::test::get_ipc_response(
            &webview,
            tauri::webview::InvokeRequest {
                cmd: "greet".into(),
                callback: tauri::ipc::CallbackFn(0),
                error: tauri::ipc::CallbackFn(1),
                url: "http://tauri.localhost".parse().unwrap(),
                body: tauri::ipc::InvokeBody::default(),
                headers: Default::default(),
                invoke_key: tauri::test::INVOKE_KEY.to_string(),
            },
        );
        assert!(res.is_ok());
    }
}
```

For most logic, the cleanest approach is to keep command bodies thin and put real logic in plain functions you can unit-test directly — reserve the mock runtime for tests that genuinely need the IPC/`State`/`AppHandle` plumbing.

## Layer 3 — End-to-End with WebDriver

`tauri-driver` is a cross-platform wrapper around the OS-native WebDriver server, giving Selenium/WebdriverIO a standard interface to your built app.

```bash
cargo install tauri-driver --locked
```

> ❌ **Platform reality:** WebDriver E2E works on **Linux and Windows only**. macOS has no WKWebView driver, so there is no desktop E2E path there. (Mobile goes through Appium 2.)

Per-platform driver dependency:

- **Linux:** `WebKitWebDriver` — on Debian/Ubuntu install `webkit2gtk-driver`.
- **Windows:** **Microsoft Edge Driver** matching your installed Edge version exactly. A version mismatch makes the suite **hang on connect** rather than error.

You test the **built** binary, so build first (`tauri build` or a debug build), then point the WebDriver session at the binary path. Both Selenium (any language) and WebdriverIO are supported; the official `tauri-apps/webdriver-example` repo has runnable setups plus a GitHub Actions config.

> ❌ **DON'T** point WebDriver at the dev server URL — E2E drives the compiled app, not `tauri dev`.

## CI

- **Frontend mocks + Rust unit tests:** run anywhere (no display) — `vitest run` / `cargo test`. Put these in the fast PR gate.
- **WebDriver E2E (Linux):** needs a display — run under `xvfb-run -a` (or `Xvfb`) and install `webkit2gtk-driver`. Start `tauri-driver` before the suite.
- **WebDriver E2E (Windows):** install the matching Edge Driver version; let the build pull Edge if absent.
- Keep slow E2E on a separate job/stage so unit tests stay the quick feedback loop.

## Validation Checklist

- [ ] Frontend tests import mocks from `@tauri-apps/api/mocks` and `invoke` from `@tauri-apps/api/core`
- [ ] `clearMocks()` runs in `afterEach`
- [ ] jsdom runs have a `window.crypto.getRandomValues` shim (only if needed)
- [ ] Rust tests enable `tauri = { features = ["test"] }` under `[dev-dependencies]`
- [ ] Command logic is unit-testable as plain functions where possible; mock runtime used only when IPC/state is needed
- [ ] E2E targets the built binary, not the dev server
- [ ] E2E only attempted on Linux/Windows; Edge Driver version matches Edge on Windows
- [ ] CI separates fast (mock/unit) from slow (WebDriver) stages; Linux E2E runs under a virtual display
