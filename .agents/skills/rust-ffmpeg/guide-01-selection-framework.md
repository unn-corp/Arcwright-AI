<!-- Conditional reference. The current SKILL.md and host policy take precedence. Paths are relative to this skill folder. -->

## Selection Framework

| Library | Use When | Async | Safety | Trade-off |
|---------|----------|-------|--------|-----------|
| ez-ffmpeg | General tasks, CLI migration, RTMP server, custom Rust + WGSL GPU filters, native subtitle burn-in, detection/measurement, one-shot recipes, custom I/O, in-memory frame/sample export + frame push (VideoWriter), typed per-output progress | ✅ Yes | Safe | Requires FFmpeg libs |
| ffmpeg-next | Frame-level control, codec internals, safe stream I/O (any `Read`/`Write`/`Seek`) | ❌ No | Safe | More boilerplate |
| ffmpeg-sys-next | Zero-copy, custom memory I/O, max performance | ❌ No | Unsafe | Manual memory mgmt |
| ffmpeg-sidecar | No FFmpeg installation possible | ❌ No | Safe | Process overhead, no custom I/O |
