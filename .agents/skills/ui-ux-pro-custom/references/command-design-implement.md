<!-- Conditional command detail. Current project, host browser/evidence rules, and the compact /design entrypoint take precedence over examples. Paths are project-relative unless stated otherwise. -->

## Mode 2 — Implement

Apply a chosen design (from a Recommend result or a user description) as real code in the project.

### Trigger

`$ARGUMENTS` starts with `implement` — e.g.:
- `/design implement Glassmorphism Dark for src/components/Dashboard.tsx`
- `/design implement chosen palette to the whole app`

### Instructions

1. Load `.agents/skills/ui-ux-pro-custom/SKILL.md`.
2. Parse the chosen style, palette, and font from `$ARGUMENTS`. If the user references "the chosen style" or "above", use the most recent Recommend output from this conversation.
3. Detect the project's tech stack by scanning for `package.json`, `tailwind.config.*`, `vite.config.*`, or framework files. Cross-reference with the stack data in the design database.
4. Implement the design:
   - Apply CSS custom properties / Tailwind tokens for the palette
   - Apply font imports and font-family declarations
   - Apply style-specific component patterns (glassmorphism layers, gradients, shadows, border-radius, etc.) as described in the database
   - Scope changes to the file(s) or component(s) named in `$ARGUMENTS`; if none specified, apply to global styles and ask the user which components to update
5. After writing code, start the dev server if not already running:
   ```bash
   # detect start command from package.json scripts
   npm run dev 2>/dev/null || npm start 2>/dev/null
   ```
6. Use `playwright-cli` to open the running app, take a screenshot, and read it visually:
   ```bash
   playwright-cli open http://localhost:<PORT>
   playwright-cli screenshot --filename=design-impl-check.png
   ```
   Read `design-impl-check.png` with the Read tool. Confirm the design looks as expected. Fix any obvious visual regressions before reporting done.
   > This single-pass check is the lightweight variant of the shared `visual-feedback-loop` skill — for a full scored multi-iteration loop, load `.agents/skills/visual-feedback-loop/SKILL.md`.
7. Report: what was changed, what files were touched, and a one-line visual assessment.

---
