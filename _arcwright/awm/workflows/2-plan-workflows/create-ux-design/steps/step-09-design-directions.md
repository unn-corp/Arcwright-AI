# Step 9: Design Direction Mockups

Generate comprehensive design direction mockups showing different visual approaches for the product.

## DESIGN DIRECTIONS SEQUENCE

### 1. Commit to a Bold Aesthetic Direction

Before generating any mockups, explicitly ask the user:

"Before I generate design directions, let's commit to a bold aesthetic point-of-view for {{project_name}}. A strong design direction avoids generic 'AI slop' patterns.

**Choose an aesthetic direction (or describe your own):**

- **Brutalist Clarity** — Raw, bold typography with stark contrast and minimal decoration
- **Retro-Futuristic** — Neon accents, dark backgrounds, futuristic geometry with retro touches
- **Elegant Minimalism** — Generous whitespace, refined typography scale, premium restraint
- **Organic Warmth** — Fluid shapes, earthy tones, humanistic typography
- **High-Energy Dynamic** — Motion-forward, vibrant color, high information density
- **Something else?** — Describe your own direction

Also confirm:

- **Typography pair preference** — e.g., Clash Display + Inter, Syne + Manrope, etc.
- **What should we AVOID aesthetically?** (I'll treat these as explicit anti-patterns)"

### 2. Generate Design Direction Variations

"I'll generate 6-8 different design direction variations exploring:

- Different layout approaches and information hierarchy
- Various interaction patterns and visual weights
- Alternative color applications from our foundation
- Different density and spacing approaches
- Various navigation and component arrangements

Each mockup will show a complete vision for {{project_name}} with all our design decisions applied, guided by our chosen bold aesthetic direction."

### 3. Create HTML Design Direction Showcase

Generate and save a comprehensive HTML design direction showcase at `{planning_artifacts}/ux-design-directions.html` showing:

- 6-8 full-screen mockup variations
- Interactive states and hover effects
- Side-by-side comparison tools
- Complete UI examples with real content
- Responsive behavior demonstrations

### 4. Present Design Exploration Framework

"As you explore the design directions, look for:

- **Layout Intuitiveness** - Which information hierarchy matches your priorities?
- **Interaction Style** - Which interaction style fits your core experience?
- **Visual Weight** - Which visual density feels right for your brand?
- **Navigation Approach** - Which navigation pattern matches user expectations?
- **Component Usage** - How well do the components support your user journeys?
- **Brand Alignment** - Which direction best supports your emotional goals?

Take your time exploring — this is a crucial decision that will guide all our design work!"

### 5. Facilitate Design Direction Selection

"After exploring all the design directions:

**Which approach resonates most with you?**

- Pick a favorite direction as-is
- Combine elements from multiple directions
- Request modifications to any direction
- Use one direction as a base and iterate

**Tell me:**

- Which layout feels most intuitive for your users?
- Which visual weight matches your brand personality?
- Which interaction style supports your core experience?
- Are there elements from different directions you'd like to combine?"

### 6. Document Design Direction Decision

"Based on your exploration, I'm understanding your design direction preference:

**Chosen Direction:** [Direction number or combination]
**Key Elements:** [Specific elements you liked]
**Modifications Needed:** [Any changes requested]
**Rationale:** [Why this direction works for your product]

This will become our design foundation moving forward. Are we ready to lock this in, or do you want to explore variations?"

### 7. Generate Design Direction Content

When saving to document, append these sections:

````markdown
## Design Direction Decision

### Design Thinking Summary

> **Aesthetic Direction:** [Chosen bold name, e.g., "Retro-Futuristic", "Brutalist Clarity"]
>
> **Purpose:** [What this design must accomplish emotionally and functionally]
>
> **Tone:** [3 adjectives: e.g., Bold, Trustworthy, Energetic]
>
> **Differentiation:** [What makes this unforgettable vs. generic AI-generated UI]
>
> **Typography Pairing:** [Specific font names, e.g., "Clash Display for headings, Manrope for body"]
>
> **Google Fonts Import:** The execution agent MUST add the following `<link>` tags to the project's root layout or `_document.tsx` to activate this font pairing. If fonts are self-hosted, install via `next/font/local`. Never leave the font as a system default (e.g., Arial, sans-serif).
>
> ```html
> <!-- Replace with actual font URLs resolved from the Typography Pairing above -->
> <link rel="preconnect" href="https://fonts.googleapis.com" />
> <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
> <link
>   href="https://fonts.googleapis.com/css2?family=[HeadingFont]&family=[BodyFont]&display=swap"
>   rel="stylesheet"
> />
> ```
>
> **Explicit Anti-Patterns to Avoid:**
>
> - [e.g., Generic purple gradients on white backgrounds]
> - [e.g., Generic Space Grotesk/Inter combo with no differentiation]
> - [e.g., Predictable hero-section with centered H1 + CTA button]

### Design Directions Explored

[Summary of design directions explored based on conversation]

### Chosen Direction

[Chosen design direction based on conversation]

### Design Rationale

[Rationale for design direction choice based on conversation]

### Implementation Approach

[Implementation approach based on chosen direction]
````

### 8. Auto-Save and Advance

Without presenting a menu or waiting for user input:

- Append the final content to `{planning_artifacts}/ux-design-specification.md`
- Update frontmatter: append step to end of stepsCompleted array
- Announce: `"✅ Design Direction Decision saved. Advancing to user journeys..."`
- Immediately load and execute: `{project-root}/_arcwright/awm/workflows/2-plan-workflows/create-ux-design/steps/step-10-user-journeys.md`

> **HALT ONLY IF:** The user has not yet declared an aesthetic direction. In that case, present the direction choices from Step 1 as a one-question halt, wait for a response, then continue without any further gates.
