---
description: Audit a website URL for performance, SEO, and accessibility using the audit-website skill.
---

# /audit-site — Website Audit

Run a comprehensive website audit for performance, SEO, accessibility, security, and technical health. Uses the audit-website skill (squirrelscan CLI — 230+ rules).

## Instructions

1. Load `.agents/skills/audit-website/SKILL.md` for the full audit protocol and output format.
2. Parse `$ARGUMENTS` for the URL to audit. Example: `https://example.com`
3. If `$ARGUMENTS` is empty, ask the user: "What URL do you want to audit?"
4. Follow the skill to run the audit:
   - Execute squirrelscan against the target URL
   - Capture results across all rule categories (SEO, performance, security, technical, content, accessibility, and more)
   - Parse the LLM-optimised report output
5. Present findings as:
   - Overall health score
   - Top issues by category (critical first)
   - Quick-win recommendations (lowest effort, highest impact)
   - Full findings list if requested

## Arguments

`$ARGUMENTS` — the URL to audit (e.g., `https://example.com`). Required — prompts if empty.
