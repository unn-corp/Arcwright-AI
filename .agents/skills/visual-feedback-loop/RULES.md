# Visual Feedback Loop — Quick Rules

> Load full `SKILL.md` when executing this skill as a formal procedure.

## When to Trigger
- After ANY UI build or modification, before reporting done
- Clone mode (matching a reference): Mode 1 — Match Source
- Fresh build / spec-driven: Mode 2 — Match Intent (no reference needed)

## Loop Steps (terse checklist)
1. Detect dev server start command from `package.json` scripts — `dev` > `start` > `serve`
2. Start server, note port
3. `playwright-cli open http://localhost:<PORT>/<PATH>`
4. `playwright-cli resize 1440 900` → screenshot desktop (`vfl-iter-N-desktop.png`)
5. `playwright-cli resize 390 844` → screenshot mobile (`vfl-iter-N-mobile.png`)
6. `playwright-cli close`
7. Read both screenshots with the Read tool (Claude is multimodal)
8. Score: Layout / Colour / Typography / Components each /10
9. All >=8/10 → DONE. Otherwise list precise fixes and apply them.
10. Max 5 iterations. At cap: report scores + gaps, ask user to continue or accept.

## Score Categories
- **Layout** — structure, spacing, columns, section rhythm
- **Colour** — palette, contrast, backgrounds, text, actions
- **Typography** — font feel, size hierarchy, weight, line-height
- **Components** — shapes, borders, shadows, icons, interactive states

## Red Flags (stop and apply skill)
- About to call a UI task done without any visual check
- Implemented a design from a spec but never ran the browser
- Mode 2: build renders with broken layout, missing styles, or "placeholder" feel
- Mode 1: implementation colours/spacing look nothing like the reference
