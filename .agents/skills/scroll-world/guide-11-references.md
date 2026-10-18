<!-- Conditional reference. The current SKILL.md and host policy take precedence. Paths are relative to this skill folder. -->

## References

- `references/prompts.md` — the intake checklist, style-preamble pattern, and every
  prompt template (scene still, dive, connector) with fill-in slots.
- `references/pipeline.md` — copy-paste batch scripts for the whole run (anchor-gated
  stills → previz → dives → frames → connectors → encode → posters → SSIM seam gate →
  mobile encode), idempotent + bash-3.2-safe.
- `references/scrub-engine.js` — the portable, config-driven scrub engine (builds DOM +
  injects CSS; blob-seek, lazy load, seam crossfade, extracted-frame posters, hidden
  `data-sw-seo` static-copy block, copy, route rail, reduced-motion, and phone hardening:
  mobile encodes, seek-coalescing, iOS priming, safe-area, no-jump resize).
- `references/index-template.html` — a minimal standalone page that mounts the engine,
  including the crawlable `data-sw-seo` copy block.
- `references/knockout.py` — border-connected background knockout for floating scenes.
- `references/gotchas.md` — the full symptom → cause → fix list, plus the canvas
  frame-sequence alternative for when video scrubbing isn't smooth enough.
