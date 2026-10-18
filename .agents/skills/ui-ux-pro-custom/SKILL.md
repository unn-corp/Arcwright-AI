---
name: ui-ux-pro-custom
description: Use when designing or refining web/mobile interfaces, selecting visual tokens, or consulting platform UI guidance.
---

# UI/UX design guidance

Use the shipped searchable product/style/palette/type/chart/platform data to make
concrete design decisions. Read only the relevant domain or platform guide, not the
entire collection. Treat recommendations as candidates that must fit the existing
product, stack and supported framework versions.

## Canonical design and hard constraints

Read root `DESIGN.md` first. Its merged YAML tokens and prose are canonical; inherit
accepted page deviations and unspecified root values. Skip regeneration for ordinary
UI fixes. Generate a new design system only when none exists or a rebrand is
requested. Preserve these local rules over every database result:

- No eyebrow/kicker/overline text above headings. Lead with the heading itself.
- No em-dash character in frontend/user-facing copy; use commas, parentheses or
  separate sentences.

Extract the product, audience, required states, visual direction and existing stack.
Use `html-tailwind` only when no stack exists or is chosen. Preserve the project's
animation library; a GSAP search result does not require a replacement.

## Search only for a decision you need

Resolve the installed bundle path and available Python interpreter. Do not install
Python or copy skill bundles as part of routine design execution. If unavailable,
report the prerequisite and use the readable data/guidance already present.

```bash
python3 "/installed/ui-ux-pro-custom/scripts/search.py" "product industry style" --design-system -p "Project Name"
python3 "/installed/ui-ux-pro-custom/scripts/search.py" "animation accessibility" --domain ux -n 3
python3 "/installed/ui-ux-pro-custom/scripts/search.py" "forms responsive" --stack html-tailwind
```

Run `search.py --help` when current domains/stacks/flags matter. Use one focused
query first; search again only for missing or unsuitable results. Optional
variance/motion/density dials bias recommendations but cannot override `DESIGN.md`.
Keep scripts, helper modules and CSV schemas together in the read-only bundle.

For persisted candidate recommendations, pass `--persist --output-dir` explicitly
pointing to host-provided evidence storage or the active project's unique
`_arcwright/_memory/skill-runs/ui-ux-pro-custom-<id>/` area. Defaults must not write
into an installed bundle. Read existing files before an intentional `--force`.
`--json` includes text, design-system and persistence results.

When creating an accepted root `DESIGN.md`, follow `design-md`: concrete semantic
colors including `primary`, typography, shape/spacing/components plus Overview,
Colors, Typography, Layout, Elevation & Depth, Shapes, Components, Do's and Don'ts.
Define each top-level YAML key once. Generated MASTER/page files remain candidates;
accepted deviations may live in `design-system/pages/<page>.md`.

## Deliver and verify

Implement coherent tokens, spacing, iconography and complete loading/error/empty/
success states. Use correct SVG/brand icons, stable hover feedback, visible keyboard
focus, labeled forms, appropriate alt text, sufficient contrast and reduced motion.
Account for fixed navigation/safe areas and validate responsive layouts without
horizontal overflow. Test existing light/dark modes and meaningful viewport sizes.

Inspect the running UI using the host browser/device workflow. Use `test-quality`
for actual test changes; screenshots or mocked tests alone do not prove interaction.
Report checks and unavailable runtime coverage without adding a new harness for a
cosmetic edit.

## Conditional detail

- [Search domains/stacks](references/workflow-guide.md#search-reference) and
  [design generation/persistence](references/workflow-guide.md#how-to-use-this-skill).
- Relevant installed Swift/iOS skill under `data/swift-ios-skills/`, or
  [Jetpack Compose](data/jetpack-compose-expert-skill/SKILL.md) for native platforms.
- [Mobile web layouts](data/mobile-ui-layout.md) for safe areas/touch/layout work.
- [Local business conversion](data/conversion-landing-local-business.md) for that
  site type; verify schema eligibility against current consumer documentation.
