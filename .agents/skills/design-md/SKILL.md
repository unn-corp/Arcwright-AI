---
name: design-md
description: "Create or update a DESIGN.md with reusable visual decisions from project references, screenshots, or an existing interface."
allowed-tools: Read, Grep, Glob, Bash, Write, Edit
version: 1.1.0
author: arcwright
tags: [ux, design-system, design-tokens, design-md, visual-identity]
---

# DESIGN.md

`DESIGN.md` is a single plain-text file at the repo root that describes a product's visual identity so it persists across AI design sessions, agents, and tools. It is not a component library or a CSS framework, it is the context document an agent reads before making any styling decision. Format: Google Labs' design.md (Apache-2.0, see [source notes](../SOURCES-DESIGNMD.md)).

## The protocol (every UX skill and agent MUST follow this)

Before any color, typography, spacing, radius, elevation, or component-styling decision:

1. **Check for `DESIGN.md` at the repo root** (Glob or `ls`).
2. **If it exists: read it in full first.** The merged YAML tokens are normative, generated code that contradicts them is a defect, not a style choice. The prose (Overview, Do's and Don'ts) governs tone and negative constraints. Do NOT improvise a look that ignores it.
3. **If it does not exist: create it** at the repo root before shipping the first significant UI surface (see Authoring below).
4. **Keep it current:** whenever a change introduces a token, palette, or component pattern not yet in `DESIGN.md`, add it (the YAML token AND a prose line explaining it) in the same change. A stale `DESIGN.md` is tech debt, flag it, do not silently drift from it.

## Required: all tokens and values live IN the file

`DESIGN.md` MUST be self-contained. Every token and its concrete value goes in YAML within the file: frontmatter, interleaved fenced `yaml` blocks under the relevant sections, or both. Use actual hex/oklch colors, px/rem sizes and weights, spacing and radius values, and per-component values. Do NOT reference an external theme file, a Tailwind config, or "see the design system", the file IS the design system. The prose body explains the "why"; the merged token tree carries the normative values. An agent or the `@google/design.md export` command derives Tailwind/CSS/DTCG output FROM this file, never the reverse.

All YAML blocks merge into one token tree. Define each **top-level key at most once** across the whole file: splitting `colors` between frontmatter and a later block is an error even when the nested names differ. Put metadata in frontmatter and whole token groups in section blocks when this improves reading. A valid existing layout does not need reformatting.

## YAML token schema

```yaml
---
version: alpha            # optional
name: <product name>      # required
description: <optional>
omitted:                 # optional: sections deliberately outside this design system
  - section: elevation
    reason: "A flat layout uses borders rather than shadows."
colors:                   # `primary` is required; add as many roles as needed
  primary: "#1A1C1E"
  secondary: "#5B5F62"
  surface: "#FFFFFF"
  on-surface: "#1A1C1E"
  error: "#B3261E"
typography:               # one entry per role, all fields concrete
  headline-lg:
    fontFamily: "Georgia, serif"
    fontSize: 32px
    fontWeight: 700
    lineHeight: 1.2       # unitless = multiple of fontSize
    letterSpacing: -0.5px
  body-md:
    fontFamily: "Inter, sans-serif"
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0
rounded:                  # sm/md/lg/xl/full are conventional, any key valid
  sm: 4px
  md: 8px
  lg: 16px
  full: 9999px
spacing:                  # a numeric scale
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 40px
components:               # per-component concrete values; may reference tokens with {path}
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.surface}"
    typography: "{typography.body-md}"
    rounded: "{rounded.md}"
    padding: 12px 20px
---
```

Notes: colors accept any valid CSS color (hex, rgb, hsl, oklch, lab, color-mix). Token references use `{path.to.token}` and must point to a primitive, except inside `components`, where composite refs like `{typography.body-md}` are allowed. Unknown keys are accepted (forward-compatible); a duplicate top-level YAML key or `##` heading is an error. Use `omitted` (section names or `{section, reason}` objects) to document intentionally absent sections; do not manufacture tokens to silence a warning. Recommended token names: colors `primary/secondary/tertiary/neutral/surface/on-surface/error`; typography `headline-display/headline-lg/headline-md/body-lg/body-md/body-sm/label-lg/label-md/label-sm`; rounded `none/sm/md/lg/xl/full`.

## Body sections (H2 headings, only present ones, in THIS order)

1. **Overview** (or Brand & Style), brand personality, audience, emotional register. This is what guides decisions when no explicit token covers them. Anchor it to a specific stylistic reference ("a 1970s graduate lecture handout"), not adjectives ("modern, clean, premium"), a reference is a point, adjectives are a fuzzy region.
2. **Colors**, name and explain each palette role and where it is used.
3. **Typography**, the font family/weight rationale per role.
4. **Layout** (or Layout & Spacing), grid model, spacing rhythm, whitespace philosophy.
5. **Elevation & Depth**, shadow/tonal-layer strategy, or the flat alternative (borders/contrast).
6. **Shapes**, corner-radius philosophy per component class.
7. **Components**, per-component narrative guidance (buttons, chips, lists, inputs, plus your domain components).
8. **Do's and Don'ts**, the negative constraints. If a specific reference was chosen in Overview, these come nearly for free; a long rambling don't-list is a sign the reference was too vague.

## Authoring (create-if-missing)

1. Choose a **specific stylistic reference** from the user’s direction or existing product context. Ask only if a missing visual decision materially changes the result.
2. Write the **prose first**, per the section order.
3. **Derive the YAML tokens from the prose** (not the reverse) and write every value concretely.
4. If Arcwright's `ui-ux-pro-custom` skill is available, use its style/palette/typography intelligence to source the reference and token values, then emit them into `DESIGN.md`.
5. Validate if the CLI is available: `npx @google/design.md lint DESIGN.md` (checks broken refs, missing `primary`, WCAG contrast on component color pairs, section order, orphaned tokens).
6. Compare revisions when useful: `npx @google/design.md diff before/DESIGN.md after/DESIGN.md` (check installed CLI help for flags).
7. Export on demand once locked: `npx @google/design.md export DESIGN.md --format css-tailwind|json-tailwind|dtcg`.

## Canonicality

`DESIGN.md` at the repo root is the SOLE canonical visual-design source of truth. Page-specific deviations may live in `design-system/pages/<page>.md` but MUST use the same tokens-plus-prose shape and defer to root `DESIGN.md` for anything they do not override.

## See also

- `ui-ux-pro-custom` (the style/palette/token intelligence that sources the content), `ux-audit` (audits code against DESIGN.md tokens), `frontend-responsive-design-standards` (defers to DESIGN.md spacing/rounded), `visual-feedback-loop` (scores rendered UI against DESIGN.md), `_arcwright/awm/agents/ux-designer.md` (the UX persona that owns it).
- [Source notes](../SOURCES-DESIGNMD.md) for the Google Labs design.md format.
