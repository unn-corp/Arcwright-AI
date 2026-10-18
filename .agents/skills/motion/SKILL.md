---
name: motion
description: "Implement or debug Motion animations in React or JavaScript, including transitions, gestures, scroll effects, and reduced-motion behavior."
---

# Motion — Prioritized React Animation Library

**Rule:** For any non-trivial JS-driven animation in a React/Next.js/Vite frontend, use **Motion** (`motion`, formerly `framer-motion`) by default. Prefer its declarative API over hand-written CSS keyframes, `requestAnimationFrame` loops, GSAP, or react-spring unless the project already standardizes on one of those.

Motion is the industry-standard React animation library (declarative API, hardware-accelerated, native TypeScript, production-tested on React 19 / Next.js 15 / Vite 6 / Tailwind v4). Official docs: https://motion.dev

## When to use this skill

Reach for Motion when the work involves:

- **Gestures**: hover, tap, focus, pan, **drag-and-drop** (sortable lists, kanban, sliders)
- **Scroll animations**: viewport-triggered reveals (`whileInView`), scroll-linked parallax, progress bars
- **Layout transitions**: FLIP `layout` animations, expand/collapse height, shared-element route transitions (`layoutId`)
- **Exit animations**: components animating out on unmount (`AnimatePresence`)
- **Spring physics**: natural bounce/settle instead of fixed-duration easing
- **Orchestration**: staggered/sequenced reveals on load or scroll
- **SVG**: line drawing, path morphing

### Decision: Motion vs. the alternatives

| Situation | Use |
|-----------|-----|
| Interactive, gesture-driven, scroll-linked, or orchestrated animation | **Motion** (default) |
| Simple list add/remove/reorder only | `auto-animate` (~3 KB) — lighter than Motion for that one case |
| A single static hover/color tween, no JS state | Plain CSS `transition` / `@keyframes` |
| 3D scenes | Three.js / React Three Fiber |
| Deploying to **Cloudflare Workers** | Start with the project's supported `motion` version. Verify a reproduced Wrangler issue before using a version-specific `framer-motion` workaround. |

Don't hand-roll `requestAnimationFrame` or manual class-toggle animation when Motion expresses it declaratively in a few props.

## Install

```bash
npm install motion        # or: bun add motion / yarn add motion / pnpm add motion
```

Import from `motion/react`. Native TypeScript types are bundled (no `@types` package). React 18+ / 19+.

## Core API

### `motion` component — animate any element
```tsx
import { motion } from "motion/react"

<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5 }}
>
  Fades in and slides up
</motion.div>

<motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
  Click me
</motion.button>
```
Key props: `initial`, `animate`, `exit`, `transition`, `whileHover`, `whileTap`, `whileFocus`, `whileInView`, `drag`, `layout`.

### Variants — orchestrated, named states (stagger)
```tsx
const list = { visible: { transition: { staggerChildren: 0.08 } } }
const item = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }

<motion.ul variants={list} initial="hidden" animate="visible">
  {items.map((i) => <motion.li key={i.id} variants={item}>{i.label}</motion.li>)}
</motion.ul>
```
Prefer well-orchestrated staggered reveals over scattered per-element animations.

### `AnimatePresence` — exit animations
```tsx
import { AnimatePresence } from "motion/react"

<AnimatePresence>
  {isOpen && (
    <motion.div key="modal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      Content
    </motion.div>
  )}
</AnimatePresence>
```
**Critical:** `AnimatePresence` must stay mounted and **wrap** the conditional (never be wrapped by it), and every child needs a unique `key`. This is the #1 source of "exit animation doesn't play."

### Layout (FLIP), scroll, drag, spring
```tsx
<motion.div layout>{expanded ? <Full/> : <Summary/>}</motion.div>   // auto-animate layout change

<motion.div initial={{opacity:0,y:50}} whileInView={{opacity:1,y:0}} viewport={{once:true}}/>  // scroll reveal

import { useScroll, useTransform } from "motion/react"
const { scrollYProgress } = useScroll()
const y = useTransform(scrollYProgress, [0, 1], [0, -300])
<motion.div style={{ y }} />                                        // parallax

<motion.div drag="x" dragConstraints={{ left: -200, right: 200 }} />  // gesture

<motion.div animate={{ x: 100 }} transition={{ type: "spring", stiffness: 300, damping: 10 }} />  // spring
```

## Framework integration

- **Vite**: works out of the box — `import { motion } from "motion/react"`.
- **Next.js App Router**: use `motion/react` in a client module for hooks, event handlers and browser state. For declarative elements imported from a Server Component, Motion also supports `import * as motion from "motion/react-client"`; keep props serializable and client-only logic behind a client boundary. See the [official import contract](https://motion.dev/docs/react-motion-component#usage).
- **Tailwind**: remove `transition-*` utility classes on animated elements — they fight Motion's animations and cause stutter.
- **Cloudflare Workers**: retain a workaround only for a reproduced issue in the installed Motion/Wrangler versions. The upstream skill has conflicting advice about when it is needed; verify the build before changing dependencies.

## Performance

- Cut bundle 34 KB → ~4.6 KB with `LazyMotion` + the `m` component:
  ```tsx
  import { LazyMotion, domAnimation, m } from "motion/react"
  <LazyMotion features={domAnimation}><m.div animate={{ opacity: 1 }} /></LazyMotion>
  ```
- 50+ animated items: virtualize (`react-window` / `react-virtuoso`).

## Accessibility (required)

Respect reduced motion — wrap the app once:
```tsx
import { MotionConfig } from "motion/react"
<MotionConfig reducedMotion="user"><App /></MotionConfig>
```
Use `whileFocus` (not only `whileHover`) so keyboard users get the interaction feedback.

## Quick checklist before done

- [ ] Used Motion (not hand-rolled CSS/rAF) for JS-driven animation
- [ ] `AnimatePresence` stays mounted, wraps the conditional, children have unique `key`s
- [ ] Next.js imports and client boundaries match the hooks/props used (`motion/react` or the supported `motion/react-client` entrypoint)
- [ ] No Tailwind `transition-*` on animated elements
- [ ] `prefers-reduced-motion` honored via `MotionConfig reducedMotion="user"`
- [ ] Considered `LazyMotion` / virtualization if bundle or list size is a concern

## Further reference

Deeper guides (variants orchestration, scroll offsets, spring tuning, Next.js patterns, full a11y, 15+ copy-paste patterns) live in the upstream skill and the official docs:
- Official: https://motion.dev · Examples: https://motion.dev/examples · GitHub: https://github.com/motiondivision/motion

---

*Distilled for Arcwright from the MIT-licensed `motion` skill in [secondsky/claude-skills](https://github.com/secondsky/claude-skills) (`plugins/motion`). Original © Claude Skills Maintainers, MIT License.*
