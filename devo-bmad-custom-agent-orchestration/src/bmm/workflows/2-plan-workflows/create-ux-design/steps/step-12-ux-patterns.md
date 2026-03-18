# Step 12: UX Consistency Patterns

Establish UX consistency patterns for common situations like buttons, forms, navigation, and feedback.

## UX PATTERNS SEQUENCE

### 1. Identify Pattern Categories

"Let's establish consistency patterns for how {{project_name}} behaves in common situations.

**Pattern Categories to Define:**

- Button hierarchy and actions
- Feedback patterns (success, error, warning, info)
- Form patterns and validation
- Navigation patterns
- Modal and overlay patterns
- Empty states and loading states
- Search and filtering patterns

Which categories are most critical for your product? We can go through each thoroughly or focus on the most important ones."

### 2. Define Critical Patterns First

For each priority pattern category:

"**[Pattern Type] Patterns:**
What should users see/do when they need to [pattern action]?

**Considerations:**

- Visual hierarchy (primary vs. secondary actions)
- Feedback mechanisms
- Error recovery
- Accessibility requirements
- Mobile vs. desktop considerations

**Examples:**

- [Example 1 for this pattern type]
- [Example 2 for this pattern type]

How should {{project_name}} handle [pattern type] interactions?"

### 3. Establish Pattern Guidelines

Use this template for each pattern:

```markdown
### [Pattern Type]

**When to Use:** [Clear usage guidelines]
**Visual Design:** [How it should look]
**Behavior:** [How it should interact]
**Accessibility:** [A11y requirements]
**Mobile Considerations:** [Mobile-specific needs]
**Variants:** [Different states or styles if applicable]
```

### 4. Design System Integration

"**Integration with [Design System]:**

- How do these patterns complement our design system components?
- What customizations are needed?
- How do we maintain consistency while meeting unique needs?

**Custom Pattern Rules:**

- [Custom rule 1]
- [Custom rule 2]
- [Custom rule 3]"

### 5. Generate UX Patterns Content

When saving to document, append these sections:

```markdown
## UX Consistency Patterns

> **Non-Negotiable Execution Constraint:** ALL navigation in this product MUST use the project's native routing primitives (`<Link href>` in Next.js, `<Link to>` in React Router, or framework equivalent). Hardcoded `<a href>` anchor tags for internal navigation are FORBIDDEN. This mandate applies to every component generated from this specification.

### Button Hierarchy

[Button hierarchy patterns based on conversation]

### Feedback Patterns

[Feedback patterns based on conversation]

### Form Patterns

[Form patterns based on conversation]

### Navigation Patterns

[Navigation patterns based on conversation]

### Modal & Overlay Patterns

[Modal and overlay patterns based on conversation — include explicit z-index strategy and focus-trap requirements]

### Empty & Loading States

[Empty state and loading state patterns based on conversation]

### Additional Patterns

[Additional patterns based on conversation]

### Optimistic UI Rules

**Default Behavior:** All mutating actions (create, update, delete) MUST implement optimistic UI updates by default to provide instant user feedback.

**Mandatory Rollback Strategy:** For every mutating endpoint, define a rollback strategy. If the Epic/PRD does not define one for a specific endpoint, the execution agent MUST halt and request it before proceeding.

> **Completeness Rule:** The table below MUST contain an entry for EVERY mutating endpoint defined in this project's Epics and PRD. A partial table is a compliance failure.

| Mutation            | Optimistic Action                    | Success State                  | Rollback Strategy                       |
| ------------------- | ------------------------------------ | ------------------------------ | --------------------------------------- |
| [e.g., Create item] | [e.g., Add to list immediately]      | [e.g., Persist with server ID] | [e.g., Remove item + error toast]       |
| [e.g., Delete item] | [e.g., Remove from list immediately] | [e.g., Delete confirmed]       | [e.g., Re-add item + error toast]       |
| [e.g., Update item] | [e.g., Show new value immediately]   | [e.g., Confirm update]         | [e.g., Restore old value + error toast] |
```

### 6. Auto-Save and Advance

Without presenting a menu or waiting for user input:

- Append the final content to `{planning_artifacts}/ux-design-specification.md`
- Update frontmatter: append step to end of stepsCompleted array
- Announce: `"✅ UX Consistency Patterns saved. Advancing to Responsive & Accessibility..."`
- Immediately load and execute: `{project-root}/_bmad/bmm/workflows/2-plan-workflows/create-ux-design/steps/step-13-responsive-accessibility.md`

> **HALT ONLY IF:** A mutating endpoint has no rollback strategy in the Epic/PRD. In that case, ask once: "The PRD doesn't define a rollback strategy for [endpoint]. How should we handle failures?" Then continue without further gates.
