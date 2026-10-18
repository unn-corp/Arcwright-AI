<!-- Conditional reference. The current SKILL.md and host policy take precedence. Paths are relative to this skill folder. -->

## Version Compatibility

| Library | Version | FFmpeg | Rust MSRV |
|---------|---------|--------|-----------|
| ez-ffmpeg | 0.18.0 | 7.1–8.x | 1.80+ (wgpu: 1.85+) |
| ffmpeg-next | 8.1.0 | 7.0–8.x | unspecified |
| ffmpeg-sys-next | 8.1.0 | 7.0–8.x | unspecified |
| ffmpeg-sidecar | 2.5.2 | Any | 1.79+ |

**Source**: [crates.io](https://crates.io)

**FFmpeg 7 vs 8**: all four libraries build against both majors with the current crate versions above — no crate-major-to-system-major matching. Guard: when pulling `ffmpeg-next` **alongside** ez-ffmpeg, keep it at `8.1.0` — a `7.1.0` mixed in collides via the `links = "ffmpeg"` key. Bindgen mechanics, the legacy 7.1-pin rationale, and the rust-ffmpeg #246 history: see [installation.md](references/installation.md#version-compatibility).

**Installation Issues**: [installation.md](references/installation.md) — includes the Windows vcpkg static-link `unresolved external symbol` fix (extra system libs in your app's `build.rs`; `VCPKG_ROOT` must be set in the shell, not via `std::env::set_var` in `build.rs`)
