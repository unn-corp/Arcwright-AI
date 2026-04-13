# Step 5: UX Pattern Analysis & Inspiration

Analyze inspiring products and UX patterns to inform design decisions for the current project.

## INSPIRATION ANALYSIS SEQUENCE

### 1. Identify User's Favorite Apps

"Let's learn from products your users already love and use regularly.

**Inspiration Questions:**
- Name 2-3 apps your target users already love and USE frequently
- For each one, what do they do well from a UX perspective?
- What makes the experience compelling or delightful?
- What keeps users coming back to these apps?

Think about apps in your category or even unrelated products that have great UX."

### 2. Analyze UX Patterns and Principles

For each inspiring app:

"**For [App Name]:**
- What core problem does it solve elegantly?
- What makes the onboarding experience effective?
- How do they handle navigation and information hierarchy?
- What are their most innovative or delightful interactions?
- What visual design choices support the user experience?
- How do they handle errors or edge cases?"

### 3. Extract Transferable Patterns

"**Transferable UX Patterns:**
Looking across these inspiring apps, I see patterns we could adapt:

**Navigation Patterns:**
- [Pattern 1] - could work for your [specific use case]
- [Pattern 2] - might solve your [specific challenge]

**Interaction Patterns:**
- [Pattern 1] - excellent for [your user goal]
- [Pattern 2] - addresses [your user pain point]

**Visual Patterns:**
- [Pattern 1] - supports your [emotional goal]
- [Pattern 2] - aligns with your [platform requirements]

Which of these patterns resonate most for your product?"

### 4. Identify Anti-Patterns to Avoid

"**UX Anti-Patterns to Avoid:**
From analyzing both successes and failures in your space, here are patterns to avoid:

- [Anti-pattern 1] - users find this confusing/frustrating
- [Anti-pattern 2] - this creates unnecessary friction
- [Anti-pattern 3] - doesn't align with your [emotional goals]

Learning from others' mistakes is as important as learning from their successes."

### 5. Define Design Inspiration Strategy

"**Design Inspiration Strategy:**

**What to Adopt:**
- [Specific pattern] - because it supports [your core experience]
- [Specific pattern] - because it aligns with [user needs]

**What to Adapt:**
- [Specific pattern] - modify for [your unique requirements]
- [Specific pattern] - simplify for [your user skill level]

**What to Avoid:**
- [Specific anti-pattern] - conflicts with [your goals]
- [Specific anti-pattern] - doesn't fit [your platform]

This strategy will guide our design decisions while keeping {{project_name}} unique."

### 6. Generate Inspiration Analysis Content

When saving to document, append these sections:

```markdown
## UX Pattern Analysis & Inspiration

### Inspiring Products Analysis

[Analysis of inspiring products based on conversation]

### Transferable UX Patterns

[Transferable patterns identified based on conversation]

### Anti-Patterns to Avoid

[Anti-patterns to avoid based on conversation]

### Design Inspiration Strategy

[Strategy for using inspiration based on conversation]
```

### 7. Present Content and Menu

"I've analyzed inspiring UX patterns and products to inform our design strategy for {{project_name}}. This gives us a solid foundation of proven patterns to build upon.

**Here's what I'll add to the document:**

[Show the complete markdown content from step 6]

**What would you like to do?**
[A] Advanced Elicitation - Let's deepen our UX pattern analysis
[P] Party Mode - Bring different perspectives on inspiration sources
[AR] Adversarial Review [C] Continue - Save this to the document and move to design system choice"

### 8. Handle Menu Selection

**If A:** Read fully and follow `{project-root}/_arcwright/core/workflows/advanced-elicitation/workflow.xml` with the current content. Ask user to accept/reject improvements, then return to menu.

**If P:** Read fully and follow `{project-root}/_arcwright/core/workflows/party-mode/workflow.md` with the current content. Ask user to accept/reject changes, then return to menu.

**If AR:** Execute `{project-root}/_arcwright/core/tasks/review-adversarial-general.xml` — display findings with recommendations; then redisplay this menu.

**If C:**
- Append the final content to `{planning_artifacts}/ux-design-specification.md`
- Update frontmatter: append step to end of stepsCompleted array
- Load `{project-root}/_arcwright/awm/workflows/2-plan-workflows/create-ux-design/steps/step-06-design-system.md`
