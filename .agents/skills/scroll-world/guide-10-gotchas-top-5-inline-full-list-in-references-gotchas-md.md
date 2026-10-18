<!-- Conditional reference. The current SKILL.md and host policy take precedence. Paths are relative to this skill folder. -->

## Gotchas — top 5 inline; full list in `references/gotchas.md`

Read `references/gotchas.md` the moment any generation fails or any QA check reads
wrong — it maps symptom → cause → fix for every failure seen in production (encode,
theming, phone, iOS, Kling flags, portrait crops, and more). The five that block runs
most often:

- **Seam pop** → connector endpoints were the diorama stills, not the neighbouring
  clips' actual frames. Always extract real frames (Step 5); the SSIM gate (pipeline
  §5c) catches this before a browser ever opens.
- **Seam stutter / camera "jumps backward"** → camera *velocity reverses* across a seam
  (inherent to architecture B's pull-outs). Grounded walkthroughs must use
  architecture A (Step 4).
- **NSFW false-positives (Seedance `status "nsfw"`)** → flags innocuous interiors
  (bedroom/pool/spa; words like "bed", "wine", "swim"). In order: re-roll (often passes
  2nd–3rd try) → strip trigger words + add "empty, unoccupied, no people, architectural"
  → regenerate that one clip on `kling3_0` with the same start/end frames → set the
  connector slot to `null` (engine crossfades that seam directly). Budget re-rolls on
  interiors.
- **Frozen video / stuck at frame 0** → host doesn't serve byte ranges, `seekable=[0,0]`.
  Blob URLs fix it (engine does this).
- **Concurrent gens 503 / "not_enough_credits" race** → transient under parallel launch;
  re-roll the individual failure (verify credits with `higgsfield workspace list`).
