---
name: ui-ux-pro-custom
description: UI/UX design intelligence. 50 styles, 21 palettes, 50 font pairings, 20 charts, 9 stacks.
---

# ui-ux-pro-custom

Comprehensive design guide for web and mobile applications. Contains 67 styles, 96 color palettes, 57 font pairings, 99 UX guidelines, and 25 chart types across 13 technology stacks. Searchable database with priority-based recommendations.

## Prerequisites

Check if Python is installed:

```bash
python3 --version || python --version
```

If Python is not installed, install it based on user's OS:

**macOS:**

```bash
brew install python3
```

**Ubuntu/Debian:**

```bash
sudo apt update && sudo apt install python3
```

**Windows:**

```powershell
winget install Python.Python.3.12
```

---

## Agent Integration Instructions

This skill is designed to be easily invoked by various AI coding agents. The primary integration method is for agents to locate and read this `SKILL.md` file, then follow its workflow.

### Antigravity

Antigravity automatically detects skills in the workspace's `.agent/skills/` directory. No further configuration is needed. When tasked with UI/UX design, Antigravity will read this `SKILL.md` file and execute the required scripts.

### Claude Code

Claude Code discovers skills from the `.claude/skills/` directory in the project root. To install this skill for Claude, run:

```bash
mkdir -p .claude/skills
cp -r .agent/skills/ui-ux-pro-custom .claude/skills/
```

Claude will automatically trigger this skill when you mention UI/UX, styling, or design in your prompts.

### Gemini CLI

Gemini CLI requires explicit instructions in a `GEMINI.md` file in your project root. Add the following block to your `GEMINI.md`:

```markdown
## UI/UX Pro Max Intelligence

For all frontend design, UI aesthetics, or UX related tasks, explicitly read and follow the workflow in `.agent/skills/ui-ux-pro-custom/SKILL.md`. Always run the `search.py --design-system` command as your FIRST step when creating interfaces. If working on iOS or Android, consult the native guidelines located within the skill's data folders.
```

---

## How to Use This Skill

When user requests UI/UX work (design, build, create, implement, review, fix, improve), follow this workflow:

### Step 1: Analyze User Requirements

Extract key information from user request:

- **Product type**: SaaS, e-commerce, portfolio, dashboard, landing page, etc.
- **Style keywords**: minimal, playful, professional, elegant, dark mode, etc.
- **Industry**: healthcare, fintech, gaming, education, etc.
- **Stack**: React, Vue, Next.js, or default to `html-tailwind`

### Step 2: Generate Design System (REQUIRED)

**Always start with `--design-system`** to get comprehensive recommendations with reasoning:

```bash
python3 skills/ui-ux-pro-custom/scripts/search.py "<product_type> <industry> <keywords>" --design-system [-p "Project Name"]
```

This command:

1. Searches 5 domains in parallel (product, style, color, landing, typography)
2. Applies reasoning rules from `ui-reasoning.csv` to select best matches
3. Returns complete design system: pattern, style, colors, typography, effects
4. Includes anti-patterns to avoid

**Example:**

```bash
python3 skills/ui-ux-pro-custom/scripts/search.py "beauty spa wellness service" --design-system -p "Serenity Spa"
```

### Step 2b: Persist Design System (Master + Overrides Pattern)

To save the design system for hierarchical retrieval across sessions, add `--persist`:

```bash
python3 skills/ui-ux-pro-custom/scripts/search.py "<query>" --design-system --persist -p "Project Name"
```

This creates:

- `design-system/MASTER.md` — Global Source of Truth with all design rules
- `design-system/pages/` — Folder for page-specific overrides

**With page-specific override:**

```bash
python3 skills/ui-ux-pro-custom/scripts/search.py "<query>" --design-system --persist -p "Project Name" --page "dashboard"
```

This also creates:

- `design-system/pages/dashboard.md` — Page-specific deviations from Master

**How hierarchical retrieval works:**

1. When building a specific page (e.g., "Checkout"), first check `design-system/pages/checkout.md`
2. If the page file exists, its rules **override** the Master file
3. If not, use `design-system/MASTER.md` exclusively

### Step 3: Supplement with Detailed Searches (as needed)

After getting the design system, use domain searches to get additional details:

```bash
python3 skills/ui-ux-pro-custom/scripts/search.py "<keyword>" --domain <domain> [-n <max_results>]
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

Get implementation-specific best practices. If user doesn't specify a stack, **default to `html-tailwind`**.

```bash
python3 skills/ui-ux-pro-custom/scripts/search.py "<keyword>" --stack html-tailwind
```

Available stacks: `html-tailwind`, `react`, `nextjs`, `vue`, `svelte`, `swiftui`, `react-native`, `flutter`, `shadcn`, `jetpack-compose`

---

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
| `prompt`     | AI prompts, CSS keywords             | (style name)                                             |

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

**Note for Swift/iOS Development:** The skill also includes a comprehensive library of Swift/iOS specific markdown guides. When working on native iOS or Swift projects, explicitly read the relevant markdown files located in the `data/swift-ios-skills/` directory using your file reading tools to access deep, platform-specific knowledge.

**Note for Android Jetpack Compose Development:** The skill includes an expert library of Android Jetpack Compose markdown guides backed by actual AndroidX source code. When working on Jetpack Compose projects, explicitly read the relevant markdown files located in the `data/jetpack-compose-expert-skill/references/` directory along with the `data/jetpack-compose-expert-skill/SKILL.md` workflow document using your file reading tools to access deep, source-backed knowledge.

**Note for Comprehensive Android Architecture:** For broader Android development patterns including Clean Architecture, MVVM, Room, Hilt, and testing strategies, consult the guidance in `data/claude-android-skill/SKILL.md` and its associated `data/claude-android-skill/references/` folder.

**Note for Web Mobile UI Layout (React/Next.js):** When creating mobile-first web pages or progressive web apps, explicitly read the `data/mobile-ui-layout.md` guide. It contains essential layout patterns, touch target requirements, safe area handling, and production-ready component code (like Bottom Sheets, Pull-to-Refresh) for mobile web layouts.

---

## Example Workflow

**User request:** "Làm landing page cho dịch vụ chăm sóc da chuyên nghiệp"

### Step 1: Analyze Requirements

- Product type: Beauty/Spa service
- Style keywords: elegant, professional, soft
- Industry: Beauty/Wellness
- Stack: html-tailwind (default)

### Step 2: Generate Design System (REQUIRED)

```bash
python3 skills/ui-ux-pro-custom/scripts/search.py "beauty spa wellness service elegant" --design-system -p "Serenity Spa"
```

**Output:** Complete design system with pattern, style, colors, typography, effects, and anti-patterns.

### Step 3: Supplement with Detailed Searches (as needed)

```bash
# Get UX guidelines for animation and accessibility
python3 skills/ui-ux-pro-custom/scripts/search.py "animation accessibility" --domain ux

# Get alternative typography options if needed
python3 skills/ui-ux-pro-custom/scripts/search.py "elegant luxury serif" --domain typography
```

### Step 4: Stack Guidelines

```bash
python3 skills/ui-ux-pro-custom/scripts/search.py "layout responsive form" --stack html-tailwind
```

**Then:** Synthesize design system + detailed searches and implement the design.

---

## Output Formats

The `--design-system` flag supports two output formats:

```bash
# ASCII box (default) - best for terminal display
python3 skills/ui-ux-pro-custom/scripts/search.py "fintech crypto" --design-system

# Markdown - best for documentation
python3 skills/ui-ux-pro-custom/scripts/search.py "fintech crypto" --design-system -f markdown
```

---

## Tips for Better Results

1. **Be specific with keywords** - "healthcare SaaS dashboard" > "app"
2. **Search multiple times** - Different keywords reveal different insights
3. **Combine domains** - Style + Typography + Color = Complete design system
4. **Always check UX** - Search "animation", "z-index", "accessibility" for common issues
5. **Use stack flag** - Get implementation-specific best practices
6. **Iterate** - If first search doesn't match, try different keywords

---

## Common Rules for Professional UI

These are frequently overlooked issues that make UI look unprofessional:

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
