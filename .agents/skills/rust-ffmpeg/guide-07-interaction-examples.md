<!-- Conditional reference. The current SKILL.md and host policy take precedence. Paths are relative to this skill folder. -->

## Interaction Examples

**User**: "I need frame-level access to decode H.264 and apply custom processing"
**Claude**: Identify → frame-level + custom processing → ez-ffmpeg FrameFilter (safe, simple) or ffmpeg-next (codec internals) → ask user preference if unclear → load `ffmpeg_next.md` or `ez_ffmpeg/filters.md` → generate decode loop with proper EAGAIN handling

**User**: "Can this video trimming code be converted to ez-ffmpeg? Fall back to ffmpeg-next if not"
**Claude**: Identify → library migration feasibility → load `library_selection.md` + `video_transcoding.md` → review existing code against ez-ffmpeg API → assess feasibility → provide migration path or explain why ffmpeg-next is needed

**User**: "Can you just run this ffmpeg command from Rust instead of me hand-writing the builder chain?"
**Claude**: Identify → automatic CLI translation → load `cli_compat.md` → if the command matches one of the 6 verified shapes, use `cli::from_cli_args`/`emit_rust_code`, flagging the FFmpeg-7.1-only runtime gate on execution → otherwise fall back to the manual `cli_migration.md` tables
