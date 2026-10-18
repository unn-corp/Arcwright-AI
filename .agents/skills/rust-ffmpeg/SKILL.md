---
name: rust-ffmpeg
description: Implement or debug Rust media processing with FFmpeg; choose or migrate ez-ffmpeg, ffmpeg-next, ffmpeg-sys-next, or ffmpeg-sidecar for the required workload.
license: MIT
metadata:
  author: Yeauty
  github: https://github.com/YeautyYE
  version: "2026-10-16-arcwright"
---

# Rust FFmpeg

Identify the actual media operation, deployment platform, installed crate/FFmpeg
versions, performance requirements, and existing integration. Follow the project's
current library unless requirements justify a change. Never treat similarly named
crate versions or optional CLI features as interchangeable.

- Prefer `ez-ffmpeg` for ergonomic in-process workflows, `ffmpeg-next` for mature
  wrapper-level control, `ffmpeg-sys-next` for direct unsafe FFI needs, and
  `ffmpeg-sidecar` for a subprocess boundary. Confirm support against the installed
  version before selecting an API.
- Read the selection/version guides below only when choosing or migrating a library.
  For implementation, go directly to the matching
  [scenario references](references/installation.md) and library guide; use
  [quick start](references/quick_start.md) for initial setup.
- Read the specific operation reference for filters, frames/packets, audio/video,
  muxing, streaming, hardware acceleration, subtitles, capture, or custom I/O.
  The full scenario-to-reference map remains in the decision guide below.
- Verify ownership/lifetimes, codec support, time bases/timestamps, draining/flushing,
  error handling, and actual input/output behavior. Use a small representative
  media fixture and the relevant probe/playback check; do not claim output works
  from successful compilation alone.
- Preserve existing authorization for system installs, downloads, and live resources.
  Report the selected integration, observed validation, and compatibility limitations.

## Conditional detail

Load only the guide for the current decision, then any specific reference it names.
Do not preload all guides or repeat their examples in the output.

| Topic | Guide |
| --- | --- |
| Rust FFmpeg | [guide-00-rust-ffmpeg.md](guide-00-rust-ffmpeg.md) |
| Selection Framework | [guide-01-selection-framework.md](guide-01-selection-framework.md) |
| Decision Logic | [guide-02-decision-logic.md](guide-02-decision-logic.md) |
| Quick Start | [guide-03-quick-start.md](guide-03-quick-start.md) |
| Library References | [guide-04-library-references.md](guide-04-library-references.md) |
| Version Compatibility | [guide-05-version-compatibility.md](guide-05-version-compatibility.md) |
| Implementation workflow | [guide-06-guidelines-for-claude.md](guide-06-guidelines-for-claude.md) |
| Interaction Examples | [guide-07-interaction-examples.md](guide-07-interaction-examples.md) |
| Best Practices | [guide-08-best-practices.md](guide-08-best-practices.md) |
