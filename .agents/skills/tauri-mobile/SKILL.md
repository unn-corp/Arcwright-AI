---
name: tauri-mobile
description: "Build or adapt a Tauri app for Android or iOS, including platform integration and mobile-specific configuration."
---

# Tauri v2 Mobile (iOS & Android)

Mobile support is **new in Tauri v2** — the same Rust + web codebase that builds desktop apps can target iOS and Android. The enabler is the `lib.rs` entry point: mobile platforms load the app as a library and call its mobile entry function. Distilled from https://v2.tauri.app/develop/ (mobile) and /distribute/ (mobile).

## When to Use This Skill

- Adding iOS and/or Android targets to a Tauri v2 app
- Running on a simulator/emulator or a physical device
- Understanding why `lib.rs` and `#[cfg_attr(mobile, tauri::mobile_entry_point)]` matter
- Granting mobile-only plugin permissions

## The Mobile Entry Point

On mobile, there is no `main()` — the OS instantiates your app from a generated native shell (an Xcode project / Android Studio Gradle project) that calls into your Rust **library**. That's why the `Builder` must live in `lib.rs::run()` with the mobile entry attribute:

```rust
// src-tauri/src/lib.rs
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

The `mobile` cfg is set automatically when building for iOS/Android; on desktop the attribute is a no-op and `main.rs` calls `run()`. If your app was generated as v1-style with everything in `main.rs`, it **cannot** build for mobile until the app definition moves to `lib.rs` (see tauri-architecture).

## Prerequisites

| Platform | Need |
|----------|------|
| **Android** | Android Studio, the **Android SDK** + **NDK**, a JDK; env vars `ANDROID_HOME` (SDK) and `NDK_HOME`; Rust Android targets (`aarch64-linux-android`, `armv7-linux-androideabi`, `i686-linux-android`, `x86_64-linux-android`) |
| **iOS** (macOS host only) | Xcode + command-line tools, Homebrew, CocoaPods; Rust iOS targets (`aarch64-apple-ios`, `x86_64-apple-ios`, `aarch64-apple-ios-sim`) |

iOS development requires a Mac. Android can be developed on Windows/macOS/Linux.

## Initialize the Platforms

Run once per project; this generates the native projects under `src-tauri/gen/`:

```bash
npm run tauri android init
npm run tauri ios init     # macOS only
```

## Dev (hot reload on device/emulator)

```bash
npm run tauri android dev
npm run tauri ios dev
```

These build the app, start the frontend dev server, deploy to a running emulator/simulator (or connected device), and hot-reload on changes. Pass a device/emulator name to target a specific one, e.g. `tauri ios dev "iPhone 15"`. You can also open the generated native project directly (`tauri android open` / `tauri ios open`) to run from Android Studio / Xcode.

## Build for Release / Distribution

```bash
npm run tauri android build   # produces .apk / .aab
npm run tauri ios build       # produces .ipa (macOS only)
```

Distribution then follows the platforms' own rules:

- **Android:** sign the `.aab`/`.apk` with a keystore, upload to Google Play (or distribute the APK).
- **iOS:** signing uses your Apple Developer team/provisioning profile (configured in Xcode); distribute via TestFlight / App Store Connect.

> Mobile apps update through the app stores, **not** the Tauri updater plugin (the updater is desktop-only — see tauri-plugins).

## Mobile-Specific Plugins & Permissions

Some plugins are mobile-only or behave differently on mobile (e.g. `barcode-scanner`, `biometric`, `nfc`, `haptics`, push/notification). They add native permissions and may require platform manifest entries (Android `AndroidManifest.xml`, iOS `Info.plist` usage strings).

Restrict a capability to mobile platforms with `platforms`:

```json
// src-tauri/capabilities/mobile.json
{
  "identifier": "mobile",
  "platforms": ["iOS", "android"],
  "windows": ["main"],
  "permissions": [
    "barcode-scanner:allow-scan",
    "barcode-scanner:allow-cancel"
  ]
}
```

> ✅ **DO** keep mobile-only permissions in a `platforms: ["iOS", "android"]` capability so desktop builds don't pull in mobile plugin commands.
> ❌ **DON'T** forget required `Info.plist` usage strings (camera, location…) — iOS rejects the app or the API silently fails without them.

## Common Footguns

- **App won't build for mobile** because the `Builder` is in `main.rs`, not `lib.rs::run()` with `#[cfg_attr(mobile, tauri::mobile_entry_point)]`.
- **`NDK_HOME` / `ANDROID_HOME` unset** → Android init/build fails. Export them before running the CLI.
- **iOS commands on Linux/Windows** → unsupported; iOS requires macOS + Xcode.
- **Generated native projects (`src-tauri/gen/`)** are part of the build — re-run `init` after major upgrades; commit or regenerate per your team's convention.

## Validation Checklist

- [ ] App definition is in `lib.rs::run()` with `#[cfg_attr(mobile, tauri::mobile_entry_point)]`
- [ ] Platform SDKs/toolchains installed; `ANDROID_HOME`/`NDK_HOME` set for Android
- [ ] Rust mobile targets added via `rustup target add`
- [ ] `tauri android init` / `tauri ios init` run (native projects generated)
- [ ] Mobile-only permissions isolated in a `platforms`-restricted capability
- [ ] iOS `Info.plist` / Android manifest entries present for sensitive APIs
