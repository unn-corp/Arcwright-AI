<!-- Conditional reference. The current SKILL.md and host policy take precedence. Paths are relative to this skill folder. -->

## Step 8 — QA the seams (don't skip)

**First, the machine check:** the SSIM seam gate (`references/pipeline.md` §5c) must
already be green — every seam ≥0.90 (0.75–0.90 only where you've eyeballed the
crossfade and accepted it). If you skipped it, run it now; browser QA below verifies
the *page*, the SSIM gate verifies the *assets*, and a red asset can't be QA'd into a
green page.

Then drive the page in a headless browser and **verify frame continuity at the seams**
end-to-end:

- Screenshot at scroll positions just before and just after each seam. The two frames
  must be near-identical (the dive's last frame == the connector's first frame). If they
  pop, you used the diorama still instead of the actual rendered frame (redo Step 5), or
  the crossfade band is too short.
- Confirm the first paint is clean: the poster (extracted frame) shows instantly, and
  the poster→video takeover does not shift the image (if it does, `poster` is missing
  or points at the still — Step 6).
- Check the console for errors, confirm `video.seekable.end(0) > 0` (blob working), and
  that `currentTime` tracks scroll across each clip's band.
- **Stills-mode fallbacks (every build, cheap to check):**
  - Data-saver: emulate `navigator.connection.saveData = true` (DevTools override or an
    init script) — page must render as stills-with-crossfades, zero clip fetches in the
    Network panel.
  - Low Power Mode: hardest to emulate — on a real iPhone, enable it and confirm the
    page falls back to stills on first touch instead of frozen video. Emulated proxy:
    stub `HTMLMediaElement.play` to return a rejected promise, tap, confirm stills mode.
  - Tablet tier: iPad viewport (834×1194, touch) must fetch the **desktop** clip
    (Network panel), not the `-m.mp4` — while still getting touch behaviour.
- **Mobile — full checklist only if the user picked a mobile tier (Step 1.6).**
  For a crop-safe build, just sanity-check a phone viewport once: page loads, still
  posters show, nothing overlaps — the engine's hardening covers graceful degradation.
  For the mobile tiers (do this on a real phone or an emulated one, portrait + landscape):
  - Emulate a phone viewport **with CPU throttled 4–6×** and scroll fast — the clip should
    track without freezing (the seek-coalescing + `-m.mp4` encodes are what make this hold).
  - Confirm the first scene shows immediately (its still is the poster) and the video takes
    over the instant you scroll — no blank/black scene (the iOS priming fix). Test iOS Safari
    specifically; it's the one that goes blank if this regresses.
  - Verify the `-m.mp4` variant is actually served on mobile (Network panel), and the
    heavy 1080p master on desktop.
  - Slowly scroll so the URL bar collapses — the page must **not jump** (height-only resizes
    are ignored on touch). Rotate the device — layout should recompose cleanly.
  - Portrait crops a 16:9 clip to its centre; confirm the focal subject still reads. If a
    hero scene's subject sits off-centre and gets cut, recompose it (prompts.md) or generate
    a 9:16 variant for that scene.
- Check reduced-motion (should fall back to the stills, no video, no particles).

---
