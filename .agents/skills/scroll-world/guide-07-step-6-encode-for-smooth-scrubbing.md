<!-- Conditional reference. The current SKILL.md and host policy take precedence. Paths are relative to this skill folder. -->

## Step 6 — Encode for smooth scrubbing

Scrubbing = setting `video.currentTime` from scroll. Two things matter, and they are
often gotten wrong:

1. **Seekability, not keyframe density, is what makes scrubbing work.** Many static
   hosts (and `python -m http.server`) don't serve HTTP byte-range requests, which pins
   `video.seekable` to `[0,0]` and clamps *every* seek to frame 0 — the video looks
   frozen. The robust fix is to **fetch each clip as a `Blob` and play it from an
   in-memory object URL** (blobs are always fully seekable). The engine does this.
   Because of it, you do **not** need all-intra video.
2. **Don't shrink quality to get smooth seeks.** Encode at the **native resolution**
   (1080p from Seedance — don't downscale), `crf ~20`, a **small GOP** (`-g 8`) rather
   than all-intra (all-intra bloats an 8s clip to ~25 MB; GOP 8 is ~8 MB and scrubs
   fine via blob). Strip audio, add faststart, and a light `unsharp` counters video
   softness:

```bash
ffmpeg -i src.mp4 -an -vf "unsharp=5:5:0.8:5:5:0.0" \
  -c:v libx264 -preset slow -crf 20 -pix_fmt yuv420p \
  -g 8 -keyint_min 8 -sc_threshold 0 -movflags +faststart out.mp4
```

Encode all 2N-1 clips (dives + connectors) with the same settings for uniform quality.

**Extract posters from the ENCODED clips** (`references/pipeline.md` §5b). The still is
a 3:2 image; the clip is a 16:9 *re-render* of it — if the still is the loading poster,
the first video paint visibly jumps (crop + render drift) on the very first scene a
visitor sees. Same doctrine as the connectors, applied to seam zero: the poster must be
the clip's own extracted first frame. Wire it as `sections[k].poster` (Step 7); keep the
still as the reduced-motion artwork.

Then run the **automated seam check** (`references/pipeline.md` §5c) before touching a
browser — every seam SSIM ≥0.90 or you have a redo, not a QA note.

**Mobile encodes (only if the user picked a tier beyond crop-safe at Step 1.6).** Phone
video decoders seek far slower than a laptop's, and seek cost scales with GOP length, so
the 1080p `-g 8` master that scrubs smoothly on desktop can stutter on a phone. Produce a
lighter `-m.mp4` sibling for every clip — **720p, `-g 4`** (more keyframes = cheaper
seeks; keyframe-every-4-to-10 is the industry recipe for scrub-smooth mobile video), crf
23 — and wire them as `clipMobile` / `connectorsMobile` (Step 7). Extract each mobile
encode's first frame as its `posterMobile` (same doctrine as §5b — the poster must match
the encode the device actually gets). The engine serves mobile files on phone-class
devices only (screen short side ≤600 CSS px — tablets and iPads get the master) and
falls back to the desktop clip when absent. Scripts in `references/pipeline.md` §6; for
the hero-reframe / portrait-chain tiers see §7. If the user chose crop-safe, skip this —
the engine still hardens phone scrubbing regardless (seek-coalescing, iOS priming, Low
Power Mode stills fallback), so the page degrades gracefully rather than breaking.

---
