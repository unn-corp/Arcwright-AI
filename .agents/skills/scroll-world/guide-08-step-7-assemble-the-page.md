<!-- Conditional reference. The current SKILL.md and host policy take precedence. Paths are relative to this skill folder. -->

## Step 7 — Assemble the page

Copy `references/scrub-engine.js` (and, if you want a fully standalone page, the tiny
`references/index-template.html`) into the user's project — or adapt into their
framework. It's config-driven and self-contained:

```js
mountScrollWorld(document.getElementById('world'), {
  brand: { name: 'Pearl & Co.' },
  diveScroll: 1.3, connScroll: 0.9,          // viewport-heights of scroll per clip
  sections: [
    { id:'farm', label:'The Farms', still:'assets/farm.webp',
      poster:'assets/farm-poster.webp',          // encoded clip's extracted first frame (Step 6)
      clip:'assets/vid/farm.mp4', clipMobile:'assets/vid/farm-m.mp4',   // mobile beta only
      scroll: 1.6, linger: 0.45,   // optional pacing: longer dwell + camera settles mid-scene
      accent:'#8FB98A', eyebrow:'From leaf to last sip', title:'It starts in the hills.',
      body:'…', tags:['Single-origin','Hand-picked'] },
    // …one per section; last may carry a `cta`
  ],
  connectors:       ['assets/vid/conn1.mp4','assets/vid/conn2.mp4',   /* … length = sections-1 */],
  connectorsMobile: ['assets/vid/conn1-m.mp4','assets/vid/conn2-m.mp4' /* … same length; mobile beta only */],
});
```

The engine handles: the ordered dive/connector chain, scroll→currentTime with rAF
smoothing, blob loading, lazy prefetch of nearby clips, frame-matched crossfades, pinned
per-section copy (first section greets on landing, last holds its CTA), a route rail,
`prefers-reduced-motion`, and mobile. **Pacing per section:** `scroll` overrides
`diveScroll` for that scene (more scroll = longer dwell) and `linger` (0–1, keep ≤ 0.6)
remaps time so the camera settles mid-scene — exactly while the copy peaks — then speeds
up toward the seam; seam frames are untouched (f(0)=0, f(1)=1). Give the hero and finale
scenes a higher `scroll` + some `linger`; keep transit scenes brisk. Theme it with CSS variables (`--accent`,
`--sw-bg`, `--sw-ink`, …) — the visual identity comes from the generated clips, so the
chrome stays quiet. See the header of `scrub-engine.js` for the full config + CSS vars.

**On phones the engine adapts automatically, along two separate axes.** *Clip tier*
(which file) is decided by device class — screen short side ≤600 CSS px = phone →
`clipMobile`/`posterMobile`; tablets (iPad Pro included — coarse pointer but
desktop-class screen and decoder) and desktops get the master. *Behaviour hardening*
(how it acts) keys off coarse pointer / ≤860px viewport: **coalesced seeks** (never
queues a new `currentTime` mid-seek — what stops a fast flick freezing the clip),
poster held until the clip paints, **video priming on first touch** (iOS
blank-until-played fix), a longer scroll run per scene (`scrollMobileFactor`, default
1.2 — small viewports read the same flight as faster), dropped particles, URL-bar-safe
resizes, safe-area insets. **Automatic stills fallback:** `prefers-reduced-motion`,
Chromium data-saver, and iOS **Low Power Mode** (detected at runtime — a rejected muted
`play()` on first touch) all flip the page to stills-with-crossfades instead of frozen
video. On 2g/3g (Chromium signal) the clip prefetch window shrinks. All of this is on
by default — no config. The `clipMobile`/`connectorsMobile`/`posterMobile` encodes are
the opt-in tiers from Step 1.6: wire them only when the user picked one.

**SEO copy is not optional — this is a landing page.** The engine renders all copy
client-side, so on its own the page has zero crawlable text. Always put a plain-markup
mirror of the copy (h1 = hero line, one h2 + p per scene, real CTA links) inside the
container in a `data-sw-seo` block — the engine hides it on mount, crawlers/link
previews/no-JS visitors read it from the served HTML. `references/index-template.html`
ships the block; when adapting into a framework, server-render it.

For non-JS backends (Python/Rails/etc.): serve the assets and drop the engine `<script>`
into the rendered HTML; nothing about it is framework-specific.

---
