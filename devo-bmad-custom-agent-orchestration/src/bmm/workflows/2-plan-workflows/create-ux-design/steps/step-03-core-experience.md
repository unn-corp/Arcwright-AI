# Step 3: Core Experience Definition

Define the core user experience, platform requirements, and what makes the interaction effortless.

## CORE EXPERIENCE DISCOVERY SEQUENCE

### 1. Define Core User Action

"Now let's dig into the heart of the user experience for {{project_name}}.

**Core Experience Questions:**
- What's the ONE thing users will do most frequently?
- What user action is absolutely critical to get right?
- What should be completely effortless for users?
- If we nail one interaction, everything else follows — what is it?

Think about the core loop or primary action that defines your product's value."

### 2. Explore Platform Requirements

"Let's define the platform context for {{project_name}}:

- Web, mobile app, desktop, or multiple platforms?
- Will this be primarily touch-based or mouse/keyboard?
- Any specific platform requirements or constraints?
- Do we need to consider offline functionality?
- Any device-specific capabilities we should leverage?"

### 3. Identify Effortless Interactions

"**Effortless Experience Design:**
- What user actions should feel completely natural and require zero thought?
- Where do users currently struggle with similar products?
- What interaction, if made effortless, would create delight?
- What should happen automatically without user intervention?
- Where can we eliminate steps that competitors require?"

### 4. Define Critical Success Moments

"**Critical Success Moments:**
- What's the moment where users realize 'this is better'?
- When does the user feel successful or accomplished?
- What interaction, if failed, would ruin the experience?
- What are the make-or-break user flows?
- Where does first-time user success happen?"

### 5. Synthesize Experience Principles

"Based on our discussion, I'm hearing these core experience principles for {{project_name}}:

**Experience Principles:**
- [Principle 1 based on core action focus]
- [Principle 2 based on effortless interactions]
- [Principle 3 based on platform considerations]
- [Principle 4 based on critical success moments]

These principles will guide all our UX decisions. Do these capture what's most important?"

### 6. Generate Core Experience Content

When saving to document, append these sections:

```markdown
## Core User Experience

### Defining Experience

[Core experience definition based on conversation]

### Platform Strategy

[Platform requirements and decisions based on conversation]

### Effortless Interactions

[Effortless interaction areas identified based on conversation]

### Critical Success Moments

[Critical success moments defined based on conversation]

### Experience Principles

[Guiding principles for UX decisions based on conversation]
```

### 7. Present Content and Menu

"I've defined the core user experience for {{project_name}} based on our conversation. This establishes the foundation for all our UX design decisions.

**Here's what I'll add to the document:**

[Show the complete markdown content from step 6]

**What would you like to do?**
[A] Advanced Elicitation - Let's refine the core experience definition
[P] Party Mode - Bring different perspectives on the user experience
[AR] Adversarial Review [C] Continue - Save this to the document and move to emotional response definition"

### 8. Handle Menu Selection

**If A:** Read fully and follow `{project-root}/_bmad/core/workflows/advanced-elicitation/workflow.xml` with the current content. Ask user to accept/reject improvements, then return to menu.

**If P:** Read fully and follow `{project-root}/_bmad/core/workflows/party-mode/workflow.md` with the current content. Ask user to accept/reject changes, then return to menu.

**If AR:** Execute `{project-root}/_bmad/core/tasks/review-adversarial-general.xml` — display findings with recommendations; then redisplay this menu.

**If C:**
- Append the final content to `{planning_artifacts}/ux-design-specification.md`
- Update frontmatter: append step to end of stepsCompleted array
- Load `{project-root}/_bmad/bmm/workflows/2-plan-workflows/create-ux-design/steps/step-04-emotional-response.md`
