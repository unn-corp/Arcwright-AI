# Step 11: Component Strategy

Define component library strategy and design custom components not covered by the design system.

## COMPONENT STRATEGY SEQUENCE

### 1. Analyze Design System Coverage

"Based on our chosen design system [design system from step 6], let's identify what components are already available and what we need to create custom.

**Available from Design System:**
[List of components available in chosen design system]

**Components Needed for {{project_name}}:**
Looking at our user journeys and design direction, we need:

- [Component need 1 from journey analysis]
- [Component need 2 from design requirements]
- [Component need 3 from core experience]

**Gap Analysis:**

- [Gap 1 - needed but not available]
- [Gap 2 - needed but not available]"

### 2. Design Custom Components

For each custom component needed, first ask:

"**[Component Name] — Let's define its Atomic classification:**

Using Atomic Design, every component maps to a specific tier:

- **Atom** — A single logicless UI element (Button, Icon, Input, Label). Must be a stateless pure function receiving only props.
- **Molecule** — 2+ atoms composed together (SearchBar = Input + Button). Must be stateless/dumb, receives data via props only.
- **Organism** — A complex section with its own state or data-fetching. May consume Context or call hooks.

For [Component Name]:

- Which tier does this belong to? (Atom / Molecule / Organism)
- **Purpose:** What does this component do for users?
- **Content:** What information or data does it display?
- **Actions:** What can users do with this component?
- **States:** What different states does it have? (default, hover, active, disabled, error, etc.)
- **Variants:** Are there different sizes or styles needed?
- **Accessibility:** What ARIA labels and keyboard support (tabIndex, Enter/Space) needed?

Let's walk through each custom component systematically."

### 3. Document Component Specifications

Use this template for each component:

```markdown
### [Component Name] — [Atom | Molecule | Organism]

**Atomic Tier:** [Atom | Molecule | Organism]
**Data Pattern:** [Props-only (dumb) | Fetches via hook (smart)]
**Purpose:** [Clear purpose statement]
**Usage:** [When and how to use]
**Composition:** [For Molecules: list constituent Atoms. For Organisms: list Molecules/Atoms used]
**Composition Check:** [Which existing Atoms/Molecules were evaluated and why they could/could not be reused]
**States:** [All possible states with descriptions]
**Variants:** [Different sizes/styles if applicable]
**Accessibility:** [ARIA labels, keyboard navigation, tabIndex, Enter/Space keypresses where appropriate]
**Content Guidelines:** [What content works best]
**Interaction Behavior:** [How users interact]
```

### 4. Define Component Strategy

"**Component Strategy:**

**Foundation Components:** (from design system)

- [Foundation component 1]
- [Foundation component 2]

**Custom Components:** (designed in this step)

- [Custom component 1 with rationale]
- [Custom component 2 with rationale]

**Implementation Approach:**

- Build custom components using design system tokens
- Ensure consistency with established patterns
- Follow accessibility best practices
- Create reusable patterns for common use cases"

### 5. Plan Implementation Roadmap

"**Implementation Roadmap:**

**Phase 1 - Core Components:**

- [Component 1] - needed for [critical flow]
- [Component 2] - needed for [critical flow]

**Phase 2 - Supporting Components:**

- [Component 3] - enhances [user experience]
- [Component 4] - supports [design pattern]

**Phase 3 - Enhancement Components:**

- [Component 5] - optimizes [user journey]
- [Component 6] - adds [special feature]

This roadmap helps prioritize development based on user journey criticality."

### 6. Generate Component Strategy Content

When saving to document, append these sections:

```markdown
## Component Strategy

### Design System Components

[Analysis of available design system components based on conversation — list which design system components will be used AS-IS without modification]

### Custom Components

> **Classification Rule:** All custom components MUST be categorized under exactly ONE of the three Atomic Design tiers below. Components that span tiers must be split. Execution agents must reject any component that does not fit cleanly.

#### Atoms (Logicless, Stateless)

[Atom component specifications from conversation — each using the component template above]

#### Molecules (Stateless Compositions of Atoms)

[Molecule component specifications from conversation — each listing its constituent Atoms]

#### Organisms (Stateful or Context-Consuming)

[Organism component specifications from conversation — each listing its constituent Molecules/Atoms and the data it fetches or the Context it consumes]

### Composition Audit

> **Mandate:** Before any new component was defined above, the existing component library was evaluated. This section documents that check.

| Component Name       | Existing Component Evaluated | Outcome                                 |
| -------------------- | ---------------------------- | --------------------------------------- |
| [New component name] | [Existing component checked] | [Reused / Modified / New — explain why] |

### Component Implementation Strategy

[Component implementation strategy based on conversation]

### Implementation Roadmap

[Implementation roadmap based on conversation — ordered by user journey criticality, not implementation convenience]
```

### 7. Auto-Save and Advance

Without presenting a menu or waiting for user input:

- Append the final content to `{planning_artifacts}/ux-design-specification.md`
- Update frontmatter: append step to end of stepsCompleted array
- Announce: `"✅ Component Strategy saved. Advancing to UX Patterns..."`
- Immediately load and execute: `{project-root}/_bmad/bmm/workflows/2-plan-workflows/create-ux-design/steps/step-12-ux-patterns.md`

> **HALT ONLY IF:** A component cannot be classified into any Atomic tier (Atom/Molecule/Organism). In that case, ask once: "I couldn't classify [component name] — can you clarify its scope and responsibilities?" Then continue without further gates.
