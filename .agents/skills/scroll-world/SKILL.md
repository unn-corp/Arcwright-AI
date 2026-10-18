---
name: scroll-world
description: Build a scroll-scrubbed cinematic or diorama landing page with cohesive scenes, connected camera clips, and a framework-independent scrub engine.
allowed-tools: Bash, Read, Write, Edit
---

# Scroll world

Use an existing brief and `DESIGN.md` before asking questions. Establish the
subject, story beats, available imagery, camera style, target stack, and agreed
scope. Ask only for missing choices that materially change the result.

## Execution

1. Check the required media-generation tools and their current capabilities. Follow
   the host's image/video tool rules; use the user's authorized provider and budget.
   Do not install tools, start paid generation, or invent credentials as a side effect.
2. Plan a short scene chain with a consistent brand kit and one camera architecture:
   a continuous grounded take, or the aerial/diorama connector flow. Read only the
   relevant scene and camera guides below before generating clips.
3. Generate cohesive scene stills, then the required start/end-frame clips. Match
   the last frame of each segment to the next; inspect every join. Optional floating
   scenes and aerial connectors apply only to the chosen architecture.
4. Follow the encoding guide for scrub-friendly output. Use the existing scripts
   and portable scrub engine described in the assembly guide, adapting paths and
   commands to the installed tool versions and project stack.
5. Verify on desktop and phone: scrolling, seams, loading, sizing, controls,
   keyboard access, reduced motion, and a readable non-video fallback. Prefer
   native Arcwright Code/T3 Code preview tools. Fix observed problems within scope.

Keep installed files read-only. Store prompts, frames, clips, encoding experiments,
and review notes under `_arcwright/_memory/skill-runs/scroll-world-<run>/`;
use host-managed capture storage when exposed. Promote selected final media into
normal app assets. Keep content real, omit AI attribution, retain required credits,
and report the observed checks and any unverified seams or generation limitations.

## Conditional detail

Load only the guide for the current decision, then any specific reference it names.
Do not preload all guides or repeat their examples in the output.

| Topic | Guide |
| --- | --- |
| scroll-world | [guide-00-scroll-world.md](guide-00-scroll-world.md) |
| Step 0 — Bootstrap | [guide-01-step-0-bootstrap.md](guide-01-step-0-bootstrap.md) |
| Step 1 — Interview the user | [guide-02-step-1-interview-the-user.md](guide-02-step-1-interview-the-user.md) |
| Step 2 — Generate the scene stills | [guide-03-step-2-generate-the-scene-stills.md](guide-03-step-2-generate-the-scene-stills.md) |
| Step 3 — (Optional) Float the scenes | [guide-04-step-3-optional-float-the-scenes.md](guide-04-step-3-optional-float-the-scenes.md) |
| Step 4 — Camera architecture (pick one — this makes or breaks the feel) | [guide-05-step-4-camera-architecture-pick-one-this-makes-or-breaks-the-fee.md](guide-05-step-4-camera-architecture-pick-one-this-makes-or-breaks-the-fee.md) |
| Step 5 — Connectors (architecture B only) | [guide-06-step-5-connectors-architecture-b-only.md](guide-06-step-5-connectors-architecture-b-only.md) |
| Step 6 — Encode for smooth scrubbing | [guide-07-step-6-encode-for-smooth-scrubbing.md](guide-07-step-6-encode-for-smooth-scrubbing.md) |
| Step 7 — Assemble the page | [guide-08-step-7-assemble-the-page.md](guide-08-step-7-assemble-the-page.md) |
| Step 8 — QA the seams (don't skip) | [guide-09-step-8-qa-the-seams-don-t-skip.md](guide-09-step-8-qa-the-seams-don-t-skip.md) |
| Gotchas — top 5 inline; full list in `references/gotchas.md` | [guide-10-gotchas-top-5-inline-full-list-in-references-gotchas-md.md](guide-10-gotchas-top-5-inline-full-list-in-references-gotchas-md.md) |
| References | [guide-11-references.md](guide-11-references.md) |
