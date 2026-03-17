# Step 6: Design System Choice

Choose appropriate design system approach based on project requirements and constraints.

## DESIGN SYSTEM CHOICE SEQUENCE

### 1. Present Design System Options

"For {{project_name}}, we need to choose a design system foundation. Think of design systems like LEGO blocks for UI — they provide proven components and patterns, ensuring consistency and speeding development.

**Design System Approaches:**

**1. Custom Design System**

- Complete visual uniqueness
- Full control over every component
- Higher initial investment
- Perfect for established brands with unique needs

**2. Established System (Material Design, Ant Design, etc.)**

- Fast development with proven patterns
- Great defaults and accessibility built-in
- Less visual differentiation
- Ideal for startups or internal tools

**3. Themeable System (MUI, Chakra UI, Tailwind UI)**

- Customizable with strong foundation
- Brand flexibility with proven components
- Moderate learning curve
- Good balance of speed and uniqueness

Which direction feels right for your project?"

### 2. Analyze Project Requirements

"**Let's consider your specific needs:**

**Based on our previous conversations:**

- Platform: [platform from step 3]
- Timeline: [inferred from user conversation]
- Team Size: [inferred from user conversation]
- Brand Requirements: [inferred from user conversation]
- Technical Constraints: [inferred from user conversation]

**Decision Factors:**

- Need for speed vs. need for uniqueness
- Brand guidelines or existing visual identity
- Team's design expertise
- Long-term maintenance considerations
- Integration requirements with existing systems"

### 3. Explore Specific Design System Options

"**Recommended Options Based on Your Needs:**

**For [Your Platform Type]:**

- [Option 1] - [Key benefit] - [Best for scenario]
- [Option 2] - [Key benefit] - [Best for scenario]
- [Option 3] - [Key benefit] - [Best for scenario]

**Considerations:**

- Component library size and quality
- Documentation and community support
- Customization capabilities
- Accessibility compliance
- Performance characteristics
- Learning curve for your team"

### 4. Facilitate Decision Process

"**Decision Framework:**

1. What's most important: Speed, uniqueness, or balance?
2. How much design expertise does your team have?
3. Are there existing brand guidelines to follow?
4. What's your timeline and budget?
5. Long-term maintenance needs?

Let's evaluate options based on your answers to these questions."

### 5. Finalize Design System Choice

"Based on our analysis, I recommend [Design System Choice] for {{project_name}}.

**Rationale:**

- [Reason 1 based on project needs]
- [Reason 2 based on constraints]
- [Reason 3 based on team considerations]

Does this design system choice feel right to you?"

### 6. Generate Design System Content

When saving to document, append these sections:

```markdown
## Design System Foundation

### Design System Choice

[Design system choice based on conversation]

### Rationale for Selection

[Rationale for design system selection based on conversation]

### Implementation Approach

[Implementation approach based on chosen system]

### Customization Strategy

[Customization strategy based on project needs]

### Design Token Mapping

The execution agent MUST explicitly search for the project's design token definitions before generating any component code. Required search targets:

- `tailwind.config.ts` or `tailwind.config.js` — for Tailwind token colors, spacing, fonts
- `globals.css` or `variables.css` — for CSS custom property tokens
- `theme.ts` or `themes/index.ts` — for JS-defined theme objects

After searching the token files above, populate this table completely. A row with "TBD" is a compliance failure — every role MUST be resolved before generating any components:

| Role        | Token Name                   | Value            |
| ----------- | ---------------------------- | ---------------- |
| Primary     | [resolved from token search] | [hex or CSS var] |
| Secondary   | [resolved from token search] | [hex or CSS var] |
| Background  | [resolved from token search] | [hex or CSS var] |
| Foreground  | [resolved from token search] | [hex or CSS var] |
| Muted       | [resolved from token search] | [hex or CSS var] |
| Accent      | [resolved from token search] | [hex or CSS var] |
| Destructive | [resolved from token search] | [hex or CSS var] |
| Border      | [resolved from token search] | [hex or CSS var] |

> **Completeness Rule:** NEVER generate component code with hardcoded hex values or arbitrary CSS. All style values MUST reference the mapped token names. If a token file cannot be found, explicitly report it to the user and ask how to proceed.
```

### 7. Auto-Initialize Design System via Script

Immediately attempt to auto-initialize the design system. Do NOT ask the user for permission — run the script silently:

```bash
python skills/ui-ux-pro-custom/scripts/search.py "<product_type> <industry> <keywords>" --design-system -p "Project Name"
# If python fails, try python3
```

- **On success:** Announce `"✅ Design system initialized from ui-ux-pro-custom intelligence."` and incorporate the generated tokens into the Design Token Mapping table.
- **On failure:** Announce `"⚠️ Script unavailable — continuing with manual token definition."` and proceed with the manually defined tokens from conversation. Do NOT halt.

### 8. Auto-Save and Advance

Without presenting a menu or waiting for user input:

- Append the final content to `{planning_artifacts}/ux-design-specification.md`
- Update frontmatter: append step to end of stepsCompleted array
- Announce: `"✅ Design System Foundation saved. Advancing to next step..."`
- Immediately load and execute: `{project-root}/_bmad/bmm/workflows/2-plan-workflows/create-ux-design/steps/step-07-defining-experience.md`

> **HALT ONLY IF:** The design token search found zero token files AND the user has provided no token information. In that case, ask once: "I couldn't find any design token files in this project. Can you point me to your token definitions, or shall I use Tailwind defaults?"
