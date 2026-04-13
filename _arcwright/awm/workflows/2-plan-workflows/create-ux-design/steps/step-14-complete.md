# Step 14: Workflow Completion

Complete the UX design workflow, update status files, and suggest next steps for the project.

## WORKFLOW COMPLETION SEQUENCE

### 1. Announce Workflow Completion

"UX Design Complete, {{user_name}}!

I've successfully collaborated with you to create a comprehensive UX design specification for {{project_name}}.

**What we've accomplished:**

- Project understanding and user insights
- Core experience and emotional response definition
- UX pattern analysis and inspiration
- Design system choice and implementation strategy
- Core interaction definition and experience mechanics
- Visual design foundation (colors, typography, spacing)
- Design direction mockups and visual explorations
- User journey flows and interaction design
- Component strategy and custom component specifications
- UX consistency patterns for common interactions
- Responsive design and accessibility strategy

**The complete UX design specification is now available at:** `{planning_artifacts}/ux-design-specification.md`

**Supporting Visual Assets:**

- Color themes visualizer: `{planning_artifacts}/ux-color-themes.html`
- Design directions mockups: `{planning_artifacts}/ux-design-directions.html`

This specification is now ready to guide visual design, implementation, and development."

### 2. Append Strict Implementation Directives to Spec

Before finalizing the status update, append the following directive block to `{planning_artifacts}/ux-design-specification.md`:

```markdown
---

## Strict Implementation Directives

> These directives are BINDING constraints for any agent executing this UX specification. Non-compliance constitutes implementation failure.

### Preview Mockup Phase

- The execution agent MUST mount all new UI components as dedicated, temporary Preview Pages (e.g., `app/preview-[feature]/page.tsx`).
- After creating the page, execute the background dev server on Port 7894 using the appropriate package manager. Check `package.json` to identify the package manager:
  - **npm:** `npm run dev -- -p 7894`
  - **pnpm:** `pnpm run dev -- -p 7894`
  - **yarn:** `yarn dev -p 7894`
  - **bun:** `bun run dev -- -p 7894`
    Handle port collisions gracefully — try 7895 if 7894 is in use.
- All Preview Pages MUST use hardcoded, realistic mock JSON data (no placeholder values like "test1" or "user123"). Data must be semantically relevant (real-sounding names, addresses, dates).
- DO NOT connect Preview Pages to live APIs, databases, or global state during the review phase.

### Safe Decomposition Rule

After the user approves a Preview Page:

1. Output a detailed Decomposition Plan table mapping every part of the monolithic preview to its target permanent file.
2. Wait for explicit user validation of the Decomposition Plan before writing any permanent files.
3. Explicitly ask for permission to delete the temporary `app/preview-[feature]` directory.
4. Explicitly ask for permission to update the application's routing configuration.

### Component Structure Mandates

- All components MUST be categorized as Atom, Molecule, or Organism as defined in the Component Strategy section of this spec.
- "Dumb" Atoms and Molecules MUST receive data exclusively via props. "Smart" Organisms may fetch data via hooks or consume Context.
- Every new component MUST log a Composition Check (which existing components were evaluated before creating a new one).
```

### 3. Workflow Status Update

- Load `{status_file}` from workflow configuration (if exists)
- Update `workflow_status["create-ux-design"] = "{default_output_file}"`
- Save file, preserving all comments and structure
- Set `lastStep = 14` in document frontmatter

### 4. Suggest Next Steps

Read fully and follow: `{project-root}/_arcwright/core/tasks/help.md`

### 5. Final Completion Confirmation

Congratulate the user on completing the UX design specification together.

**Recommended Next Step Sequences:**

- **Design-focused teams:** Wireframes → Prototypes → Figma Design → Development
- **Technical teams:** Architecture → Epic Creation → Development

**Immediate Options:**

1. Wireframe Generation - Create low-fidelity layouts based on UX spec
2. Interactive Prototype - Build clickable prototypes for testing
3. Solution Architecture - Technical design with UX context
4. Figma Visual Design - High-fidelity UI implementation
5. Epic Creation - Break down UX requirements for development
