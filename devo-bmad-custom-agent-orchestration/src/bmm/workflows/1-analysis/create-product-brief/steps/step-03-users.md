---
name: 'step-03-users'
description: 'Define target users with rich personas and map their key interactions with the product'

# File References
nextStepFile: '{project-root}/_bmad/bmm/workflows/1-analysis/create-product-brief/steps/step-04-metrics.md'
outputFile: '{planning_artifacts}/product-brief-{{project_name}}-{{date}}.md'

# Task References
advancedElicitationTask: '{project-root}/_bmad/core/workflows/advanced-elicitation/workflow.xml'
partyModeWorkflow: '{project-root}/_bmad/core/workflows/party-mode/workflow.md'
---

# Step 3: Target Users Discovery

## STEP GOAL:

Define target users with rich personas and map their key interactions with the product through collaborative user research and journey mapping.

## Step-Specific Rules:

- Focus only on defining who this product serves and how they interact with it
- FORBIDDEN to create generic user profiles without specific details
- COLLABORATIVE persona development, not assumption-based user creation

## Sequence of Instructions (Do not deviate, skip, or optimize)

### 1. Begin User Discovery

**Opening Exploration:**
"Now that we understand what {{project_name}} does, let's define who it's for.

**User Discovery:**

- Who experiences the problem we're solving?
- Are there different types of users with different needs?
- Who gets the most value from this solution?
- Are there primary users and secondary users we should consider?

Let's start by identifying the main user groups."

### 2. Primary User Segment Development

**Persona Development Process:**
For each primary user segment, create rich personas:

**Name & Context:**

- Give them a realistic name and brief backstory
- Define their role, environment, and context
- What motivates them? What are their goals?

**Problem Experience:**

- How do they currently experience the problem?
- What workarounds are they using?
- What are the emotional and practical impacts?

**Success Vision:**

- What would success look like for them?
- What would make them say "this is exactly what I needed"?

**Primary User Questions:**

- "Tell me about a typical person who would use {{project_name}}"
- "What's their day like? Where does our product fit in?"
- "What are they trying to accomplish that's hard right now?"

### 3. Secondary User Segment Exploration

**Secondary User Considerations:**

- "Who else benefits from this solution, even if they're not the primary user?"
- "Are there admin, support, or oversight roles we should consider?"
- "Who influences the decision to adopt or purchase this product?"
- "Are there partner or stakeholder users who matter?"

### 4. User Journey Mapping

**Journey Elements:**
Map key interactions for each user segment:

- **Discovery:** How do they find out about the solution?
- **Onboarding:** What's their first experience like?
- **Core Usage:** How do they use the product day-to-day?
- **Success Moment:** When do they realize the value?
- **Long-term:** How does it become part of their routine?

**Journey Questions:**

- "Walk me through how [Persona Name] would discover and start using {{project_name}}"
- "What's their 'aha!' moment?"
- "How does this product change how they work or live?"

### 5. Generate Target Users Content

**Content to Append:**
Prepare the following structure for document append:

```markdown
## Target Users

### Primary Users

[Primary user segment content based on conversation]

### Secondary Users

[Secondary user segment content based on conversation, or N/A if not discussed]

### User Journey

[User journey content based on conversation, or N/A if not discussed]
```

### 6. Present MENU OPTIONS

**Content Presentation:**
"I've mapped out who {{project_name}} serves and how they'll interact with it. This helps us ensure we're building something that real people will love to use.

**Here's what I'll add to the document:**
[Show the complete markdown content from step 5]

**Select an Option:** [A] Advanced Elicitation [P] Party Mode [AR] Adversarial Review [C] Continue"

#### Menu Handling Logic:

- IF A: Read fully and follow: {advancedElicitationTask} with current user content to dive deeper into personas and journeys
- IF P: Read fully and follow: {partyModeWorkflow} to bring different perspectives to validate user understanding
- IF AR: Execute {project-root}/_bmad/core/tasks/review-adversarial-general.xml — pass the current editPlan (or plan document in context) as the content to review; display findings with recommendations; then redisplay this menu
- IF C: Save content to {outputFile}, update frontmatter with stepsCompleted: [1, 2, 3], then read fully and follow: {nextStepFile}
- IF Any other comments or queries: help user respond then [Redisplay Menu Options](#6-present-menu-options)

#### EXECUTION RULES:

- ALWAYS halt and wait for user input after presenting menu
- ONLY proceed to next step when user selects 'C'
- After other menu items execution, return to this menu with updated content
- User can chat or ask questions - always respond and then end with display again of the menu options

## NEXT STEP:

When 'C' is selected and user personas are finalized and saved to document with frontmatter updated, read fully and follow `{nextStepFile}` to begin success metrics definition.
