---
name: visual-feedback-loop
description: Render-and-self-correct loop for any UI build. Starts dev server, screenshots at desktop + mobile viewports via playwright-cli, reads screenshots visually, scores against intent or reference, fixes code, repeats up to 5 iterations until all scores >=8/10.
allowed-tools: Bash, Read, Edit, Write, Glob
---

# Visual Feedback Loop

> The step that makes it actually look right. Browser-rendered verification beats theoretical compliance — run this after any UI build or modification before reporting done.

---

## When to Use

- After implementing or modifying any rendered UI component, page, or layout.
- Before marking a frontend task complete.
- When cloning a reference design (Mode 1 — Match Source).
- When verifying a fresh build looks correct and polished (Mode 2 — Match Intent).

---

## Two Modes

### Mode 1 — Match Source (Clone)
Compare the implementation against reference screenshots or photos already in memory. Use when you have a visual target (URL screenshots captured earlier, or provided photo paths).

### Mode 2 — Match Intent (Verify)
No reference. Verify the build renders correctly, looks polished, and contains no visual regressions at both viewports. Use after implementing any UI from a spec or description.

---

## The Loop

### Pre-loop: Start the Dev Server

```bash
# Detect start command from package.json scripts
# Prefer: dev > start > serve
npm run dev 2>/dev/null || npm start 2>/dev/null || npm run serve 2>/dev/null
```

Note the port from the output (default: 3000, Vite: 5173). Substitute `<PORT>` below.

---

### Loop (max 5 iterations)

```
ITERATION = 1
MAX = 5

while ITERATION <= MAX:

  1. Screenshot both viewports:
       playwright-cli open http://localhost:<PORT>/<PATH>
       playwright-cli resize 1440 900
       playwright-cli screenshot --filename=vfl-iter-<ITERATION>-desktop.png
       playwright-cli resize 390 844
       playwright-cli screenshot --filename=vfl-iter-<ITERATION>-mobile.png
       playwright-cli close

  2. Read both screenshots with the Read tool (Claude is multimodal — read them visually).

  3. Score each category:
       Layout     — structure, spacing, column rhythm, section proportions: /10
       Colour     — palette match, contrast, background/text/action colours: /10
       Typography — font family feel, size hierarchy, weight, line-height: /10
       Components — shapes, borders, shadows, icon quality, interactive states: /10

     Mode 1 (Match Source): compare against reference screenshots/photos in memory.
     Mode 2 (Match Intent): assess whether the design looks intentional, polished,
       correct, and free of visual regressions (no broken layouts, missing styles,
       white-flash sections, or "vibe-coded" placeholder feel).

  4. If ALL scores >= 8/10 → DONE. Report final scores and exit loop.

  5. Otherwise, list specific corrections with precise values:
       e.g. "button border-radius should be ~6px not 12px"
            "hero background should be #0A0A0A not #1A1A1A"
            "mobile nav overflows viewport — add overflow-hidden to container"
     Apply those code fixes now.

  ITERATION += 1
```

**If max iterations reached without all scores >= 8/10:**
Report current scores, list remaining gaps, and ask: "Shall I continue for more passes, or is this close enough?"

---

## Final Report (after loop exits)

```
Visual Feedback Loop — Final Result
Mode: [Match Source | Match Intent]
Iterations: X / 5
Scores (final): Layout X/10 · Colour X/10 · Typography X/10 · Components X/10
Status: [PASSED | MAX ITERATIONS REACHED]
Remaining gaps (if any): [list or "none"]
Files changed: [list]
```

---

## Notes

- Keep `playwright-cli` as the tool — consistent with `/design` and the `playwright-cli` skill.
- Screenshot filenames are scoped to `vfl-iter-*` to avoid collision with other tools.
- If the dev server is already running, skip the start step.
- For reference capture (Mode 1), use the exact same viewports used when capturing the source (typically 1440x900 desktop + 390x844 mobile).
- Optional: Chrome DevTools MCP is an alternative to playwright-cli for users who prefer browser-based visual debugging. See `.agents/skills/visual-feedback-loop/recommended-frontend-mcps.md`.
