---
description: Query the design-intelligence database for style, palette, and font recommendations for a project or feature. Optionally implement the chosen design in code, or clone a website/photos into code using a Playwright visual-feedback loop.
---

# Design

Use `$ARGUMENTS` and the conversation to select a mode. Read `DESIGN.md` first;
keep the existing design system unless a new direction or rebrand was requested.
If the task is clear, execute it without a menu or another confirmation.

| Request | Action | Conditional detail |
| --- | --- | --- |
| Recommendations | Search the UI/UX database for a few suitable styles, palettes, type pairings, and relevant UX constraints. | `.agents/skills/ui-ux-pro-custom/references/command-design-recommend.md` |
| Implement a selected design | Apply the chosen tokens and components to the requested scope; do not query or restyle the whole app unnecessarily. | `.agents/skills/ui-ux-pro-custom/references/command-design-implement.md` |
| Clone a URL or supplied image | Inspect the actual reference, identify layout/type/assets, implement the requested scope, then compare renders. | `.agents/skills/ui-ux-pro-custom/references/command-design-clone.md` |

Load only the selected mode's detail. Use `ui-ux-pro-custom` for database queries,
`design-taste-frontend` for a new public-page art direction, and the existing stack
skills only when their guidance is needed. Do not add an interview when the brief
already gives the answer, or a dependency for a simple styling change.

For implementation or cloning, use native Arcwright Code/T3 Code preview tools
first. Inspect desktop and phone screenshots, real controls, focus, and reduced
motion; correct substantive mismatches within scope. Keep working captures and
notes in host evidence storage or the project's Arcwright run, never an installed
skill. Preserve required media credits. No eyebrows, em dashes in user-facing copy,
or AI attribution in deliverables. Report the actual changes and observed checks.
