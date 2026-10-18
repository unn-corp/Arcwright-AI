<!-- Conditional reference. The current SKILL.md and host policy take precedence. Paths are relative to this skill folder. -->

## Step 1 — Interview the user

The **subject is the user's to state — ask it as an open question in plain prose**, never a
fabricated multiple-choice. A made-up list of industries biases them and reads as you
deciding their business for them; let them answer in their own words (their real business,
a client's, or any idea). Reserve the host's question tool (with options) for the genuinely
enumerable, lower-stakes choices below — art direction and brand-kit approach — and even
there, signal they can go their own way ("Other"). Ask only what you can't sensibly
default. Cover:

1. **Subject** (ask openly, not multiple-choice) — "What should this world be about? Your
   business, a client's, or any idea — a word or a sentence is fine." Capture the
   industry/product + a one-line pitch (e.g. "a bubble tea company, from leaf to last
   sip"), and a brand name if they have one; otherwise you'll propose one below.
2. **Brand kit** — offer three paths, pick one:
   - Import from a URL: `higgsfield marketing-studio brand-kits fetch --url <site> --wait`
     (pulls name, colours, tone). Then read it back with `brand-kits list --json`.
   - The user hands you palette + name + tone directly.
   - You propose a palette + name and let them approve.
   Capture **4–6 named hex values**, a display name, and a tone word or two.
3. **Art direction** — default is "soft matte low-poly **clay diorama**, isometric,
   tilt-shift miniature, warm light." Offer alternatives (flat papercraft, glossy toy,
   claymation, neon night). Whatever is chosen becomes the shared **style preamble**
   reused verbatim in every scene prompt (this is what makes the world cohesive).
4. **Budget tier — ask BEFORE proposing the journey; video generations dominate cost.**
   The bill scales with scene count and architecture: architecture A (forward take) =
   `N` videos, architecture B (dives + connectors) = `2N-1` videos, plus `N` stills and
   a ~20–30% re-roll buffer. A 6-scene arch-B run is ~17 generations — a serious bite
   out of a subscription. Use the host's question tool with concrete numbers:
   - **Lean (~8 gens)** — 4 scenes, architecture A (4 stills + 4 legs), skip previz
     (small runs re-roll cheaper than a draft pass). Same site, same continuous flight —
     just 4 beats instead of 6.
   - **Standard (~11–13 gens)** — 5 scenes; arch A (10 gens) or arch B (5 + 9 = 14).
   - **Showcase (~17+ gens)** — 6–7 scenes, full arch-B world, previz pass, mobile tiers.
   **Fewer scenes ≠ thinner site.** 3–4 well-chosen beats read as a complete world: give
   each scene more scroll distance (`scroll: 1.6–2`) and `linger`, and let the copy
   carry more per beat. A tight 4-scene world beats a budget-starved 6-scene one.
   Two more levers when the user wants the B aesthetic on a lean budget: connectors are
   **individually optional** (a `null` slot crossfades that seam directly — honest
   tradeoff: that one transition is a dissolve, not a flight; spend connectors on the
   seams around the hero scenes) and `seedance_2_0_mini` can BE the final model if the
   user accepts 720p — it frame-locks, so the site stays seamless.
5. **The journey (sections)** — the ordered scenes the camera flies through, **sized to
   the budget tier**. Propose a set derived from the subject's own value chain and let
   the user edit. Boba example (6-scene showcase): farms → pearl kitchen → flagship shop
   → delivery → community plaza → the hero product; lean 4-scene cut: farms → kitchen →
   shop → hero product. Each section needs: a short subject description (what's IN the
   diorama), an eyebrow, a headline, one line of body, and 0–3 tag pills. The last
   section is usually the hero product + the CTA.
6. **Mobile tier — ALWAYS ask this; never silently generate extra assets.** Phones get
   the full scroll animation in every tier — the engine's hardening (seek-coalescing,
   iOS priming + Low Power Mode stills fallback, safe-area CSS, data-saver downgrade)
   is always on; the tiers only decide what ASSETS exist. Use the host's question tool,
   options in this order, with the credit cost stated:
   - **Crop-safe (default, no extra cost)** — phones scrub the desktop clips,
     centre-cropped to portrait. Every prompt already composes focal subjects
     centre-safe (prompts.md), so this reads fine for most worlds.
   - **Mobile encodes (recommended, no extra credits — just encode time)** — `-m.mp4`
     siblings (720p, `-g 4`, Step 6) + `clipMobile`/`connectorsMobile`/`posterMobile`
     wiring (Step 7) + mobile QA (Step 8). Phone-class devices (NOT tablets — the
     engine tiers by screen, iPad gets the master) scrub the lighter files.
   - **Hero reframe (small extra credit cost — state it)** — mobile encodes + 9:16
     re-renders of the 1–2 scenes where the focal subject can't hold a centre crop
     (usually hero + finale). Wire per-scene as the mobile clip/poster.
   - **Full portrait chain (gold tier, ≈2× video credits — state it)** — a parallel
     9:16 chain: portrait stills, own frame handoffs, own connectors, own SSIM gate
     (aspect ratios can't mix mid-chain — a 9:16 clip can't continue a 16:9 frame).
     This is what Apple ships: the mobile asset is a differently-framed render, not a
     crop. Offer only when the user signals mobile traffic matters or the budget is
     loose.

Video model is **not** an interview question — default `seedance_2_0` silently. If the user
names a preference, honor it **only if it can frame-lock seams** (Step 4 roster:
`seedance_2_0`, `kling3_0`, `seedance_2_0_mini`). This skill only ships seamless output, so
a model that can't frame-lock is declined with a one-line why, not substituted in — use a
roster model instead.

**Close the interview with a spend estimate — get explicit go-ahead before any
generation.** State the bill in plain numbers from the chosen budget tier: `N` image
gens + video gens (`N` for architecture A, `2N-1` for B; previz adds a mini-tier chain
on showcase runs) + a re-roll budget (~20–30% extra on interiors, thanks to the NSFW
filter), plus any mobile-tier extras, and roughly how long it runs (gens are 3–8 min
each; architecture A is sequential). The user approves the spend once, here — after
that the only further gates are the anchor-still approval (Step 2) and the previz
review (Step 4), both of which exist to keep the big spend from being wasted, not to
re-ask permission.

Keep the scroll mechanic fixed (continuous fly-through) — that's the point of the skill.
See `references/prompts.md` for the intake checklist and copy structure.

---
