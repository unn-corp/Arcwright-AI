<!-- Conditional reference. The current SKILL.md and host policy take precedence. Paths are relative to this skill folder. -->

# scroll-world

Produces a landing page where **scroll drives a camera**: it dives from outside a scene
into its interior, then flies out and into the next scene, continuously, with no visible
cuts. The visuals are AI-generated (Higgsfield); the page just scrubs pre-rendered video
by scroll position. This is the same technique behind Apple's scroll-through product
pages — the camera genuinely moves, scroll only drives time.

**What you generate:** N scene stills (anchor-gated) → N "dive-in" camera clips → N-1
"connector" clips that join consecutive scenes seamlessly → encoded clips + extracted
posters → an automated SSIM seam check → a portable scrub engine that plays the whole
chain as one flight. Chain clips render on the cheap previz tier first by default;
full-model credits are spent only after the user approves the draft.

**The one rule that makes or breaks it:** seams must be *frame-identical*. Read
[The seamless chain](#step-5--the-seamless-chain-the-critical-part) before generating any
connector. Getting this wrong is the single most common failure and produces a visible
"pop" between scenes.

Do not assume a frontend framework. The scrub engine in `references/scrub-engine.js` is
self-contained vanilla JS (it builds its own DOM + injects its own CSS into a container
you give it), so it drops into plain HTML, Next.js, Vue, a Python-served page, anything.
The value of this skill is the Higgsfield pipeline, the prompts, and the seam method —
not the framework.

---
