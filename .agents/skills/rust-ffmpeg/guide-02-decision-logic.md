<!-- Conditional reference. The current SKILL.md and host policy take precedence. Paths are relative to this skill folder. -->

## Decision Logic

### Layer 1: Integration Method

**Default: Library Integration** (ez-ffmpeg/ffmpeg-next/ffmpeg-sys-next)
- Better performance, type-safe API, direct Frame access

**Alternative: Binary Approach** (ffmpeg-sidecar) - consider when:
- Cannot install FFmpeg development libraries
- Restricted CI/CD environment without admin access
- Pure CLI batch processing (no real-time needs)

If installation constrained → Load [ffmpeg_sidecar.md](references/ffmpeg_sidecar.md)

### Layer 2: Scenario Detection

| User Mentions | Load Reference |
|---------------|----------------|
| "convert format", "remux", "trim", "resize", "crop", "simple" | [video_transcoding.md](references/scenarios/video_transcoding.md) |
| "extract audio", "audio only", "audio track", "mp3 extract", "loudnorm", "normalize audio", "volume" | [audio_extraction.md](references/scenarios/audio_extraction.md) |
| "thumbnail", "first frame", "fast thumbnail", "skip_frame", "nokey", "keyframe-only", "multi-output", "concat", "watermark", "pipeline", "filter graph" | [pipelines_multi_output.md](references/scenarios/pipelines_multi_output.md) — for a one-shot thumbnail prefer `recipes::thumbnail` in [image_sequences.md](references/scenarios/image_sequences.md); for the fastest keyframe-only path (`skip_frame=nokey`, snaps to next keyframe) see [ez_ffmpeg/video.md](references/ez_ffmpeg/video.md#thumbnail-extraction) |
| "real-time", "RTMP", "HLS", "live", "stream", "capture", "webcam", "buffer", "backpressure", "jitter buffer", "network jitter", "ABR ladder", "HLS ladder", "adaptive bitrate", "master playlist", "VOD packaging" | [streaming_rtmp_hls.md](references/scenarios/streaming_rtmp_hls.md) |
| "GPU", "NVENC", "VideoToolbox", "hardware", "VAAPI", "QSV", "wgpu", "WGSL", "custom shader", "GPU filter", "compute shader", "libplacebo", "beauty filter", "chroma key", "green screen" | [hardware_acceleration.md](references/scenarios/hardware_acceleration.md) |
| "batch", "multiple files", "bulk", "parallel" | [batch_processing.md](references/scenarios/batch_processing.md) |
| "subtitles", "srt", "captions", "burn subs", "burn-in", "hardsub", "ass", "vtt", "native subtitle", "without libass", "no libass" | [subtitles.md](references/scenarios/subtitles.md) |
| "AV1", "AVIF", "HDR", "10-bit", "modern codec", "HDR to SDR", "tone mapping", "tonemap", "washed out colors", "PQ", "HLG" | [modern_codecs.md](references/scenarios/modern_codecs.md) |
| "debug", "ffprobe", "inspect", "metadata", "error", "troubleshoot", "probe", "duration", "resolution", "corrupt", "integrity" | [debugging.md](references/scenarios/debugging.md) |
| "detect black frames", "silence detect", "scene detect", "scene change", "cropdetect", "EBU R128", "LUFS", "measure loudness", "true peak", "content analysis", "QC", "blackdetect", "silencedetect" | [detection_analysis.md](references/scenarios/detection_analysis.md) (typed `analysis` API) |
| "filter", "effect", "scale", "crop", "overlay", "watermark", "blur", "sharpen", "color", "brightness", "rotate", "flip", "fade", "speed", "slow motion" | [filters_effects.md](references/scenarios/filters_effects.md) |
| "image sequence", "frame extraction", "video to images", "images to video", "timelapse", "frame by frame", "sprite sheet", "storyboard", "contact sheet", "thumbnail grid" | [image_sequences.md](references/scenarios/image_sequences.md) |
| "one-shot recipe", "recipes module", "quick thumbnail", "thumbnail recipe", "sprite sheet recipe", "gif recipe", "HLS ladder recipe" (ez-ffmpeg `recipes`, no feature flag) | [image_sequences.md](references/scenarios/image_sequences.md) (thumbnail/sprite), [gif_creation.md](references/scenarios/gif_creation.md) (gif), [streaming_rtmp_hls.md](references/scenarios/streaming_rtmp_hls.md) (HLS ladder) |
| "test", "validate", "verify", "golden file", "checksum", "generate test video", "testsrc" | [testing.md](references/scenarios/testing.md) |
| "web server", "API", "S3", "async job", "integration", "tracing", "logging", "log callback", "av_log", "log redirect" | [integration.md](references/scenarios/integration.md) |
| "gif", "animated gif", "video to gif", "gif from video", "gif loop", "gif palette" | [gif_creation.md](references/scenarios/gif_creation.md) |
| "metadata", "chapter", "tag", "media info", "title", "artist", "album", "chapter marker" | [metadata_chapters.md](references/scenarios/metadata_chapters.md) |
| "screen capture", "webcam", "camera capture", "record screen", "avfoundation", "directshow", "v4l2", "device capture" | [capture.md](references/scenarios/capture.md) |
| "AVPacket", "AVFrame", "keyframe", "GOP", "NALU", "bitstream", "EAGAIN", "decode loop", "memory", "packet" | [ffmpeg_next.md](references/ffmpeg_next.md) + [ffmpeg_sys_next.md](references/ffmpeg_sys_next.md) |
| "avformat_find_stream_info", "AVSEEK_SIZE", "AVFormatContext", "AVCodecID", "raw C API", "FFI" | [ffmpeg_sys_next.md](references/ffmpeg_sys_next.md) + [custom_io.md](references/ffmpeg_sys_next/custom_io.md) |
| "custom io", "read callback", "write callback", "StreamIo", "memory input/output", "Read/Write/Seek source" | Safe APIs: [advanced.md](references/ez_ffmpeg/advanced.md#custom-io-sources) (ez-ffmpeg callbacks) or [ffmpeg_next.md](references/ffmpeg_next.md) (`StreamIo`) |
| "AVIOContext", "io context", "raw io callback", "zero-copy custom io" | [custom_io.md](references/ffmpeg_sys_next/custom_io.md) (unsafe FFI) |
| "extract frames to memory", "decode to RGB", "frames for AI/ML", "frame to tensor", "frame export", "video to frames for a model", "FrameExtractor", "whisper PCM", "audio to f32", "SampleExtractor", "ASR ingest", "uniform N frames" | [frame_io.md](references/ez_ffmpeg/frame_io.md) (experimental, ez-ffmpeg 0.14) |
| "VideoWriter", "push frames", "generate video from frames", "procedural video", "render frames to video", "in-memory mp4", "encode from memory", "frames to video" | [frame_io.md](references/ez_ffmpeg/frame_io.md) (experimental, ez-ffmpeg 0.14) |
| "WHIP", "WebRTC output", "SRT output", "capability probe", "is_muxer_available", "output protocol available", "fMP4 HLS", "fragmented mp4 segments" | [streaming.md](references/ez_ffmpeg/streaming.md) (WHIP/SRT/capabilities) + [streaming_rtmp_hls.md](references/scenarios/streaming_rtmp_hls.md) (fMP4 ladder) |
| "encoded packet export", "packet sink", "PacketSink", "webcodecs", "EncodedVideoChunk", "EncodedAudioChunk", "h.264 access units", "aac frames", "avcC", "AudioSpecificConfig", "rtp packetizer", "fmp4 segmenter", "job failure", "on_job_failed", "JobFailureSummary" | [packet_sink.md](references/ez_ffmpeg/packet_sink.md) (experimental, ez-ffmpeg 0.15; job-failure summaries 0.16) |
| "progress", "progress bar", "percent complete", "ETA", "how far along", "encoding speed", "progress_handle", "ProgressHandle", "progress snapshot" | [advanced.md](references/ez_ffmpeg/advanced.md#progress-monitoring); batch per-file counting: [batch_processing.md](references/scenarios/batch_processing.md) |
| "per-stream encoder", "different codec per stream", "StreamMap", "-c:v:0", "indexed stream options", "per-stream codec options" | [video.md](references/ez_ffmpeg/video.md#per-stream-encoder-selection-streammap) (ez-ffmpeg 0.16) |
| "run ffmpeg command in rust", "from_cli_args", "emit_rust_code", "translate ffmpeg command", "cli feature", "cli-compat", "verified shape" | [cli_compat.md](references/ez_ffmpeg/cli_compat.md) (`cli` feature); manual mapping: [cli_migration.md](references/ez_ffmpeg/cli_migration.md) |
| "version compatibility", "FFmpeg 7 vs 8", "linking error", "build fails", "links = ffmpeg", "install", "vcpkg" | [installation.md](references/installation.md) |
| "which library", "compare", "vs", "migrate to", "port to", "convert to", "switch from", "rewrite using", "feasibility", "should I use", "best library", "evaluate", "review FFmpeg code", "can this work with" | [library_selection.md](references/library_selection.md) |

> Multiple rows can match one request — load **all** applicable references, then follow the most specific row's target first.

### Layer 3: Library Selection

> **CLI Migration**: Both ez-ffmpeg and ffmpeg-sidecar support CLI-style APIs. Choose based on constraints below.
> - ez-ffmpeg: [CLI Migration Guide](references/ez_ffmpeg/cli_migration.md) — library integration, native performance
> - ffmpeg-sidecar: [CLI to Rust Migration](references/ffmpeg_sidecar.md#cli-to-rust-migration) — process wrapper, no FFmpeg libs needed

1. **Need async/await?** → ez-ffmpeg (only library with native async)
2. **Need custom Rust frame processing?** → ez-ffmpeg FrameFilter (safe, simple API)
3. **Need custom GPU shaders (WGSL)?** → ez-ffmpeg `wgpu` feature (`WgpuFrameFilter`, headless, no display server) — check the built-in `wgpu_filter::effects` catalog first (13 typed effects, 0.13+); for native hardware filters (`scale_cuda`/`scale_vaapi`/`libplacebo`) probe with `get_gpu_filter_backends()`
4. **Need to burn in subtitles without libass?** → ez-ffmpeg `subtitle` feature (`SubtitleFilter`, pure-Rust ASS/SRT renderer, no `--enable-libass`)
5. **Need typed detection/measurement (black/silence/scene/crop/EBU R128)?** → ez-ffmpeg `analysis` module (`Analysis` one-shot or `MetadataEventFilter` streaming — no feature flag)
6. **Need a one-shot thumbnail / sprite sheet / GIF / HLS ABR ladder?** → ez-ffmpeg `recipes` module (no feature flag)
7. **Need frame-level codec control?** → ffmpeg-next for codec internals
8. **Need custom I/O from memory?** → ez-ffmpeg (read/write/seek callbacks), or ffmpeg-next **safe** stream I/O (`input_from_stream`/`output_to_stream`, any `Read`/`Write`/`Seek`); ffmpeg-sys-next for lowest-level control
9. **Need zero-copy or max performance?** → ffmpeg-sys-next (requires unsafe code)
10. **Cannot install FFmpeg libs?** → ffmpeg-sidecar (process-based, stdin/stdout only, no custom I/O)
11. **Need decoded frames/audio in memory for AI/CV/ASR?** → ez-ffmpeg `frame_export` (`FrameExtractor` → packed RGB, `SampleExtractor::for_whisper` → 16 kHz mono f32; no feature flag; experimental, 0.14) — see [frame_io.md](references/ez_ffmpeg/frame_io.md)
12. **Need to generate/push video from Rust-rendered frames?** → ez-ffmpeg `VideoWriter` (frame push into encode/mux/stream, no demuxer; experimental, 0.14) — see [frame_io.md](references/ez_ffmpeg/frame_io.md)
13. **Need to feed a WebCodecs decoder, RTP/SRT packetizer, or hand-rolled fMP4 segmenter straight from the encoder?** → ez-ffmpeg `packet_sink` (`PacketSink`, strict H.264-only/AAC tier, no container; no feature flag; experimental, 0.15) — see [packet_sink.md](references/ez_ffmpeg/packet_sink.md)
14. **Need to run or auto-translate an existing ffmpeg CLI command?** → ez-ffmpeg `cli` feature (`from_cli_args`/`emit_rust_code`, narrow golden-tested subset — 6 verified shapes; 0.15) — see [cli_compat.md](references/ez_ffmpeg/cli_compat.md); anything outside that subset still needs the manual [cli_migration.md](references/ez_ffmpeg/cli_migration.md) tables

> **Note**: FrameFilter (custom Rust frame processing) is separate from custom I/O callbacks (custom data sources/sinks). ez-ffmpeg supports both.
