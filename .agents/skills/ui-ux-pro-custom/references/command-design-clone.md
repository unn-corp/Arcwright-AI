<!-- Conditional command detail. Current project, host browser/evidence rules, and the compact /design entrypoint take precedence over examples. Paths are project-relative unless stated otherwise. -->

## Mode 3 — Clone

Given a source URL or one or more photo paths, reverse-engineer the visual design, implement it in the project's stack, then use a Playwright visual-comparison loop to refine until the result matches the source.

### Trigger

`$ARGUMENTS` starts with `clone` — e.g.:
- `/design clone https://stripe.com/payments`
- `/design clone ./screenshots/ref1.png ./screenshots/ref2.png`
- `/design clone https://linear.app for src/pages/Home.tsx`

### Instructions

#### Step 1 — Capture the source

**If a URL is provided:**
```bash
playwright-cli open <URL>
playwright-cli resize 1440 900
playwright-cli screenshot --filename=source-full.png
playwright-cli scroll 0 600
playwright-cli screenshot --filename=source-scroll1.png
playwright-cli resize 390 844
playwright-cli screenshot --filename=source-mobile.png
playwright-cli close
```
Read each screenshot with the Read tool immediately after capture to build a visual memory of the source.

**If photo paths are provided:**
Read each photo path with the Read tool directly — Claude is multimodal and can analyze them without Playwright.

#### Step 2 — Analyse the source design

After seeing the source (screenshots or photos), catalogue:

| Property | What to note |
|---|---|
| **Layout** | Grid/flex structure, column count, max-width, gutters, section rhythm |
| **Colour** | Background, surface, primary action, text, border, shadow hex values |
| **Typography** | Font families (guess from rendering or inspect via `playwright-cli eval "getComputedStyle(document.body).fontFamily"`), scale, weight, line-height |
| **Components** | Nav, hero, cards, buttons, badges, inputs — note shape, spacing, states |
| **Effects** | Glassmorphism, gradients, blur, shadows, border-radius values |
| **Motion cues** | Any visible transitions or animations to replicate |
| **Spacing system** | Base unit (4px / 8px / 10px?) and consistent multiples |

Cross-reference findings with the design database from `ui-ux-pro-custom` to name the closest matching style, palette, and font pairing.

#### Step 3 — Implement

1. Detect the project's tech stack (same as Implement mode step 3).
2. Write the implementation — layout, colours, typography, components — targeting the file(s) named in `$ARGUMENTS` or prompting the user if none specified.
3. Start or restart the dev server:
   ```bash
   npm run dev 2>/dev/null || npm start 2>/dev/null
   ```

#### Step 4 — Visual comparison loop (max 5 iterations)

> This is the shared `visual-feedback-loop` skill. For standalone use outside of clone mode, load `.agents/skills/visual-feedback-loop/SKILL.md`.


Repeat until the implementation matches the source or the iteration cap is reached:

```
ITERATION = 1
MAX = 5

while ITERATION <= MAX:

  1. Screenshot the implementation at the same viewport(s) used for source capture:
     playwright-cli open http://localhost:<PORT>/<PATH>
     playwright-cli resize 1440 900
     playwright-cli screenshot --filename=impl-iter-<ITERATION>.png
     playwright-cli resize 390 844
     playwright-cli screenshot --filename=impl-iter-<ITERATION>-mobile.png
     playwright-cli close

  2. Read impl-iter-<ITERATION>.png (and mobile variant) with the Read tool.
     Visually compare against the source screenshots/photos already in memory.

  3. Identify gaps — score each category:
     - Layout match (column structure, spacing proportions): /10
     - Colour match (backgrounds, buttons, text): /10
     - Typography match (font family feel, size hierarchy): /10
     - Component match (shapes, borders, shadows): /10

  4. If all scores >= 8/10 → DONE. Report final scores and exit loop.

  5. Otherwise, list the specific corrections needed (be precise: "button border-radius
     should be ~6px not 12px", "background should be #0A0A0A not #1A1A1A", etc.)
     and apply those code fixes now.

  ITERATION += 1
```

**If max iterations reached without all scores >= 8/10:** Report current scores, list remaining gaps, and ask the user: "Shall I continue for more passes, or is this close enough?"

#### Step 5 — Final report

Output:
- **Matched style:** [name from design database]
- **Palette used:** [hex values]
- **Fonts used:** [family names]
- **Files changed:** [list]
- **Iteration scores (final):** Layout X/10 · Colour X/10 · Typography X/10 · Components X/10
- **Remaining gaps (if any):** [list or "none"]

---

## Arguments

`$ARGUMENTS` — one of:
- A project/feature description (Recommend mode)
- `implement [style] [for file/component]` (Implement mode)
- `clone [URL] [and/or photo paths] [for file/component]` (Clone mode)
