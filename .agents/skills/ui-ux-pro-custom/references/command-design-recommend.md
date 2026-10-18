<!-- Conditional command detail. Current project, host browser/evidence rules, and the compact /design entrypoint take precedence over examples. Paths are project-relative unless stated otherwise. -->

## Mode 1 — Recommend (default)

Query Arcwright's design-intelligence database for UI style, colour palette, and font pairing recommendations tailored to the project or feature described in `$ARGUMENTS`.

### Instructions

1. Load `.agents/skills/ui-ux-pro-custom/SKILL.md` for the full design-intelligence database (67 styles, 96 colour palettes, 57 font pairings, 99 UX guidelines, 25 chart types across 13 technology stacks).
2. Parse `$ARGUMENTS` as a project description or feature description. Examples:
   - "fintech dashboard dark mode"
   - "health app onboarding flow mobile"
   - "SaaS admin panel data-heavy"
3. Using the database, recommend:
   - **2–3 UI styles** that fit the described context (with reasons)
   - **3 colour palettes** ranked by fit (include primary/secondary/accent hex codes)
   - **2 font pairings** (heading + body) with stack declarations
   - **Key UX guidelines** most relevant to the context (top 5)
4. Format the output as a scannable reference card the user can hand off to a designer or use directly in code.
5. End the reference card with:
   > **Ready to implement?** Reply with `/design implement [style name]` or `/design clone [URL/photo]` to apply this design.
6. If `$ARGUMENTS` is empty, ask the user: "What is the project or feature you want design guidance for?"

---
