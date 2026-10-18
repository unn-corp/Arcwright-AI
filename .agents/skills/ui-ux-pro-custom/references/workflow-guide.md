<!-- Conditional reference. Read only the heading needed for the current task; SKILL.md defines the execution and authorization contract. -->

# ui-ux-pro-custom

Comprehensive design guide for web and mobile applications. Includes curated style, semantic-palette, typography, chart and platform data; use the shipped search/configuration for available domains and stacks. Searchable database with priority-based recommendations.

## Front-end Copy & UI: HARD RULES (non-negotiable)

These override every style, template, and recommendation in this database:

- **NEVER build eyebrow text.** That is the small kicker/overline/label line above a heading (e.g. a tiny, often uppercase, "OUR SERVICES" sitting above an `<h2>`). Lead with the heading itself; do not add an overline/kicker/eyebrow element.
- **NEVER use em-dashes (the `—` character) in front-end / user-facing copy.** Rewrite with commas, parentheses, or a shorter sentence. Hyphens in compound words are fine.

## Prerequisites

Resolve the installed bundle and an existing Python interpreter. Installation/global discovery is a separate authorized setup task, not a required step during design work. Keep the installed scripts/data together and read-only.

## How to Use This Skill

When user requests UI/UX work (design, build, create, implement, review, fix, improve), follow this workflow:

### Step 1: Analyze User Requirements

Extract key information from user request:

- **Product type**: SaaS, e-commerce, portfolio, dashboard, landing page, etc.
- **Style keywords**: minimal, playful, professional, elegant, dark mode, etc.
- **Industry**: healthcare, fintech, gaming, education, etc.
- **Stack**: React, Vue, Next.js, or default to `html-tailwind`

### Step 0: Check for an existing DESIGN.md (REQUIRED first)

Before generating anything, check for `DESIGN.md` at the repo root (see the `design-md` skill).
If it exists, it is the canonical design system: use its merged YAML tokens and prose as the
source of truth and skip regeneration unless the user explicitly asks for a rebrand. Only
generate a new design system (Step 2) when `DESIGN.md` is absent or a rebrand is requested.

### Step 2: Generate a design system when needed

When `DESIGN.md` is absent or a rebrand is requested, start with `--design-system` to get recommendations with reasoning:

```bash
python3 .agents/skills/ui-ux-pro-custom/scripts/search.py "<product_type> <industry> <keywords>" --design-system [-p "Project Name"]
```

This command:

1. Searches 5 domains in parallel (product, style, color, landing, typography)
2. Applies reasoning rules from `ui-reasoning.csv` to select best matches
3. Returns complete design system: pattern, style, colors, typography, effects
4. Includes anti-patterns to avoid

**Example:**

```bash
python3 .agents/skills/ui-ux-pro-custom/scripts/search.py "beauty spa wellness service" --design-system -p "Serenity Spa"
```

### Step 2b: Persist Design System (Master + Overrides Pattern)

Pass `--output-dir <run-dir>` when persisting candidate recommendations. Use host evidence or `_arcwright/_memory/skill-runs/ui-ux-pro-custom-<id>/` inside the active project, not the installed bundle or its parent. Accepted `DESIGN.md`/page deviations remain authorized project source. Existing files are preserved by default; read them before using `--force` for an intended replacement. The Python helper now returns `text`, `design_system` and `persistence`; CLI `--json` exposes the data and persistence result. Resolve the actual installed skill directory if these repository-relative commands are used elsewhere.

To save the design system for hierarchical retrieval across sessions, add `--persist`:

```bash
python3 .agents/skills/ui-ux-pro-custom/scripts/search.py "<query>" --design-system --persist --output-dir "/path/to/project/_arcwright/_memory/skill-runs/ui-ux-pro-custom-<id>" -p "Project Name"
```

This creates:

- `design-system/<project-slug>/MASTER.md` — Candidate recommendations to reconcile with root `DESIGN.md`
- `design-system/<project-slug>/pages/` — Generated page recommendations

### Step 2c: Emit the canonical DESIGN.md (REQUIRED)

Transcribe the generated design system into a `DESIGN.md` at the repo root, following the
`design-md` skill: YAML tokens (frontmatter, interleaved fenced YAML blocks, or both) with concrete values (colors incl.
required `primary`, typography, rounded, spacing, components) plus the markdown body sections
(Overview, Colors, Typography, Layout, Elevation & Depth, Shapes, Components, Do's and Don'ts,
in that order). `DESIGN.md` is the sole canonical visual-design source of truth; the
Accepted page deviations may live in `design-system/pages/<page>.md`. Use the same tokens-plus-prose shape, define each top-level YAML key once, and inherit unspecified values from root `DESIGN.md`.

**With page-specific override:**

```bash
python3 .agents/skills/ui-ux-pro-custom/scripts/search.py "<query>" --design-system --persist --output-dir "/path/to/project/_arcwright/_memory/skill-runs/ui-ux-pro-custom-<id>" -p "Project Name" --page "dashboard"
```

This also creates:

- `design-system/<project-slug>/pages/dashboard.md` — Generated page recommendations

**How hierarchical retrieval works:**

1. Read root `DESIGN.md` first; it remains canonical.
2. Read any applicable page deviation, which inherits unspecified values from root `DESIGN.md`.
3. Treat generated `design-system/<project-slug>/MASTER.md` as candidate recommendations, not a replacement for the root contract.

### Step 3: Supplement with Detailed Searches (as needed)

After getting the design system, use domain searches to get additional details:

```bash
python3 .agents/skills/ui-ux-pro-custom/scripts/search.py "<keyword>" --domain <domain> [-n <max_results>]
```

**When to use detailed searches:**

| Need                  | Domain       | Example                                 |
| --------------------- | ------------ | --------------------------------------- |
| More style options    | `style`      | `--domain style "glassmorphism dark"`   |
| Chart recommendations | `chart`      | `--domain chart "real-time dashboard"`  |
| UX best practices     | `ux`         | `--domain ux "animation accessibility"` |
| Alternative fonts     | `typography` | `--domain typography "elegant luxury"`  |
| Landing structure     | `landing`    | `--domain landing "hero social-proof"`  |

### Step 4: Stack Guidelines (Default: html-tailwind)

Get implementation-specific best practices. Keep the existing/chosen stack; use `html-tailwind` only if neither exists.

```bash
python3 .agents/skills/ui-ux-pro-custom/scripts/search.py "<keyword>" --stack html-tailwind
```

Available stacks include the existing web/mobile stacks plus the shipped desktop/platform CSVs. Run `search.py --help` for the current list. Match row applicability to installed framework versions and verify fast-moving APIs against official docs.

---

The generator uses semantic colors (`Accent`, `On Accent`, `Foreground`, surfaces and roles). Keep scripts, helper modules and CSV schemas together. Optional `--variance`, `--motion` and `--density` dials bias recommendations; they do not override root `DESIGN.md`. A `gsap` domain result is an implementation option, not a requirement to replace the project's animation library.

## Search Reference

### Available Domains

| Domain       | Use For                              | Example Keywords                                         |
| ------------ | ------------------------------------ | -------------------------------------------------------- |
| `product`    | Product type recommendations         | SaaS, e-commerce, portfolio, healthcare, beauty, service |
| `style`      | UI styles, colors, effects           | glassmorphism, minimalism, dark mode, brutalism          |
| `typography` | Font pairings, Google Fonts          | elegant, playful, professional, modern                   |
| `color`      | Color palettes by product type       | saas, ecommerce, healthcare, beauty, fintech, service    |
| `landing`    | Page structure, CTA strategies       | hero, hero-centric, testimonial, pricing, social-proof   |
| `chart`      | Chart types, library recommendations | trend, comparison, timeline, funnel, pie                 |
| `ux`         | Best practices, anti-patterns        | animation, accessibility, z-index, loading               |
| `react`      | React/Next.js performance            | waterfall, bundle, suspense, memo, rerender, cache       |
| `web`        | Web interface guidelines             | aria, focus, keyboard, semantic, virtualize              |
| `gsap`       | Optional motion recipes              | scroll, reveal, subtle                                   |
| `google-fonts` | Approved font catalog               | family, category, language                               |
| `icons`      | Icon identities and imports          | close, search, navigation                                |

### Available Stacks

| Stack             | Focus                                                 |
| ----------------- | ----------------------------------------------------- |
| `html-tailwind`   | Tailwind utilities, responsive, a11y (DEFAULT)        |
| `react`           | State, hooks, performance, patterns                   |
| `nextjs`          | SSR, routing, images, API routes                      |
| `vue`             | Composition API, Pinia, Vue Router                    |
| `svelte`          | Runes, stores, SvelteKit                              |
| `swiftui`         | Views, State, Navigation, Animation                   |
| `react-native`    | Components, Navigation, Lists                         |
| `flutter`         | Widgets, State, Layout, Theming                       |
| `shadcn`          | shadcn/ui components, theming, forms, patterns        |
| `jetpack-compose` | Composables, Modifiers, State Hoisting, Recomposition |

**Note for Swift/iOS Development:** The skill also includes a comprehensive library of Swift/iOS specific markdown guides. When working on native iOS or Swift projects, read only the relevant markdown files located in the `data/swift-ios-skills/` directory using your file reading tools to access deep, platform-specific knowledge.

**Note for Android Jetpack Compose Development:** The skill includes an expert library of Android Jetpack Compose markdown guides backed by actual AndroidX source code. When working on Jetpack Compose projects, read only the relevant markdown files located in the `data/jetpack-compose-expert-skill/references/` directory along with the `data/jetpack-compose-expert-skill/SKILL.md` workflow document using your file reading tools to access deep, source-backed knowledge.

**Note for Web Mobile UI Layout (React/Next.js):** When creating mobile-first web pages or progressive web apps, explicitly read the `data/mobile-ui-layout.md` guide. It contains essential layout patterns, touch target requirements, safe area handling, and production-ready component code (like Bottom Sheets, Pull-to-Refresh) for mobile web layouts.

**Note for Local Business / Lead-Gen / Service-Area Marketing Sites:** When building a marketing site, service page, city page, or any lead-gen landing page for a local service business (plumber, HVAC, electrician, contractor, home services), explicitly read the `data/conversion-landing-local-business.md` guide. It contains above-the-fold mobile checklists, city and service page templates, sticky tap-to-call patterns, copy-pasteable LocalBusiness + AggregateRating JSON-LD schema, performance targets, and a full anti-pattern list.

---

## Example Workflow

**User request:** "Làm landing page cho dịch vụ chăm sóc da chuyên nghiệp"

### Step 1: Analyze Requirements

- Product type: Beauty/Spa service
- Style keywords: elegant, professional, soft
- Industry: Beauty/Wellness
- Stack: html-tailwind (default)

### Step 2: Generate a design system when needed

```bash
python3 .agents/skills/ui-ux-pro-custom/scripts/search.py "beauty spa wellness service elegant" --design-system -p "Serenity Spa"
```

**Output:** Complete design system with pattern, style, colors, typography, effects, and anti-patterns.

### Step 3: Supplement with Detailed Searches (as needed)

```bash
# Get UX guidelines for animation and accessibility
python3 .agents/skills/ui-ux-pro-custom/scripts/search.py "animation accessibility" --domain ux

# Get alternative typography options if needed
python3 .agents/skills/ui-ux-pro-custom/scripts/search.py "elegant luxury serif" --domain typography
```

### Step 4: Stack Guidelines

```bash
python3 .agents/skills/ui-ux-pro-custom/scripts/search.py "layout responsive form" --stack html-tailwind
```

**Then:** Synthesize design system + detailed searches and implement the design.

---

## Output Formats

The `--design-system` flag supports two output formats:

```bash
# ASCII box (default) - best for terminal display
python3 .agents/skills/ui-ux-pro-custom/scripts/search.py "fintech crypto" --design-system

# Markdown - best for documentation
python3 .agents/skills/ui-ux-pro-custom/scripts/search.py "fintech crypto" --design-system -f markdown
```

---

## Tips for Better Results

1. **Be specific with keywords** - "healthcare SaaS dashboard" > "app"
2. **Search multiple times** - Different keywords reveal different insights
3. **Combine domains** - Style + Typography + Color = Complete design system
4. **Check changed UX contracts** - Search a concrete missing animation, layering or accessibility decision; skip redundant queries
5. **Use stack flag** - Get implementation-specific best practices
6. **Iterate** - If first search doesn't match, try different keywords

---

## Common Rules for Professional UI

These examples address common visual/interaction issues. Apply them to the actual design contract; examples such as a floating navbar are not a requirement to redesign an existing navigation pattern:

### Icons & Visual Elements

| Rule                       | Do                                              | Don't                                  |
| -------------------------- | ----------------------------------------------- | -------------------------------------- |
| **No emoji icons**         | Use SVG icons (Heroicons, Lucide, Simple Icons) | Use emojis like 🎨 🚀 ⚙️ as UI icons   |
| **Stable hover states**    | Use color/opacity transitions on hover          | Use scale transforms that shift layout |
| **Correct brand logos**    | Research official SVG from Simple Icons         | Guess or use incorrect logo paths      |
| **Consistent icon sizing** | Use fixed viewBox (24x24) with w-6 h-6          | Mix different icon sizes randomly      |

### Interaction & Cursor

| Rule                   | Do                                                    | Don't                                        |
| ---------------------- | ----------------------------------------------------- | -------------------------------------------- |
| **Cursor pointer**     | Add `cursor-pointer` to all clickable/hoverable cards | Leave default cursor on interactive elements |
| **Hover feedback**     | Provide visual feedback (color, shadow, border)       | No indication element is interactive         |
| **Smooth transitions** | Use `transition-colors duration-200`                  | Instant state changes or too slow (>500ms)   |

### Light/Dark Mode Contrast

| Rule                      | Do                                  | Don't                                   |
| ------------------------- | ----------------------------------- | --------------------------------------- |
| **Glass card light mode** | Use `bg-white/80` or higher opacity | Use `bg-white/10` (too transparent)     |
| **Text contrast light**   | Use `#0F172A` (slate-900) for text  | Use `#94A3B8` (slate-400) for body text |
| **Muted text light**      | Use `#475569` (slate-600) minimum   | Use gray-400 or lighter                 |
| **Border visibility**     | Use `border-gray-200` in light mode | Use `border-white/10` (invisible)       |

### Layout & Spacing

| Rule                     | Do                                  | Don't                                  |
| ------------------------ | ----------------------------------- | -------------------------------------- |
| **Floating navbar**      | Add `top-4 left-4 right-4` spacing  | Stick navbar to `top-0 left-0 right-0` |
| **Content padding**      | Account for fixed navbar height     | Let content hide behind fixed elements |
| **Consistent max-width** | Use same `max-w-6xl` or `max-w-7xl` | Mix different container widths         |

---

## Pre-Delivery Checklist

Before delivering UI code, verify these items:

### Visual Quality

- [ ] No emojis used as icons (use SVG instead)
- [ ] All icons from consistent icon set (Heroicons/Lucide)
- [ ] Brand logos are correct (verified from Simple Icons)
- [ ] Hover states don't cause layout shift
- [ ] Use theme colors directly (bg-primary) not var() wrapper

### Interaction

- [ ] All clickable elements have `cursor-pointer`
- [ ] Hover states provide clear visual feedback
- [ ] Transitions are smooth (150-300ms)
- [ ] Focus states visible for keyboard navigation

### Light/Dark Mode

- [ ] Light mode text has sufficient contrast (4.5:1 minimum)
- [ ] Glass/transparent elements visible in light mode
- [ ] Borders visible in both modes
- [ ] Test both modes before delivery

### Layout

- [ ] Floating elements have proper spacing from edges
- [ ] No content hidden behind fixed navbars
- [ ] Responsive at 375px, 768px, 1024px, 1440px
- [ ] No horizontal scroll on mobile

### Accessibility

- [ ] All images have alt text
- [ ] Form inputs have labels
- [ ] Color is not the only indicator
- [ ] `prefers-reduced-motion` respected
