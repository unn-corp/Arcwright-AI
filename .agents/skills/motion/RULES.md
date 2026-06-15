# Motion (React animation) — Quick Rules

> Load full `SKILL.md` when executing this skill as a formal procedure.

## Core Rules
- Use **Motion** (`motion`, formerly `framer-motion`) by default for any JS-driven animation — gestures, drag, scroll/parallax, layout/shared-element transitions, exit animations, springs, staggered reveals. Prefer it over hand-rolled CSS keyframes, `requestAnimationFrame`, GSAP, or react-spring unless the project already standardizes on another.
- Import from `motion/react`; install with `npm install motion`. Types are bundled.
- Plain CSS `transition` is fine for a single static hover/color tween with no JS state. Use `auto-animate` only for simple list add/remove/reorder. 3D → Three.js / R3F.
- `AnimatePresence` must stay mounted and **wrap** the conditional (never be wrapped by it); every child needs a unique `key`. This is the #1 exit-animation bug.
- Next.js App Router: animated component files need `"use client"`.
- Tailwind: remove `transition-*` classes from Motion-animated elements (they conflict).
- Cloudflare Workers: use `framer-motion` v12.23.24 instead (Wrangler build issue with `motion`).
- Accessibility is required: wrap the app in `<MotionConfig reducedMotion="user">` and use `whileFocus` for keyboard parity, not hover alone.
- Prefer orchestrated staggered reveals (variants + `staggerChildren`) over scattered per-element animations.
- Watch bundle size: `LazyMotion` + `m` drops ~34 KB → ~4.6 KB; virtualize lists of 50+ animated items.

## Red Flags (stop and apply skill)
- Hand-writing `@keyframes` / `requestAnimationFrame` / manual class-toggling for an animation Motion expresses declaratively
- `AnimatePresence` wrapped by the conditional, or children missing `key` props
- Animated component in Next.js App Router with no `"use client"`
- Motion-animated element still carrying Tailwind `transition-*` utilities
- No `prefers-reduced-motion` handling on a motion-heavy UI
- Reaching for a different animation library without checking the project already standardizes on it
