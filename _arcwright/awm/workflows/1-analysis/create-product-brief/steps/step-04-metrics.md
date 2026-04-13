---
name: 'step-04-metrics'
description: 'Define comprehensive success metrics that include user success, business objectives, and key performance indicators'

# File References
nextStepFile: '{project-root}/_arcwright/awm/workflows/1-analysis/create-product-brief/steps/step-05-scope.md'
outputFile: '{planning_artifacts}/product-brief-{{project_name}}-{{date}}.md'

# Task References
advancedElicitationTask: '{project-root}/_arcwright/core/workflows/advanced-elicitation/workflow.xml'
partyModeWorkflow: '{project-root}/_arcwright/core/workflows/party-mode/workflow.md'
---

# Step 4: Success Metrics Definition

## STEP GOAL:

Define comprehensive success metrics that include user success, business objectives, and key performance indicators through collaborative metric definition aligned with product vision and user value.

## Step-Specific Rules:

- Focus only on defining measurable success criteria and business objectives
- FORBIDDEN to create vague metrics that can't be measured or tracked
- COLLABORATIVE metric definition that drives actionable decisions

## Sequence of Instructions (Do not deviate, skip, or optimize)

### 1. Begin Success Metrics Discovery

**Opening Exploration:**
"Now that we know who {{project_name}} serves and what problem it solves, let's define what success looks like.

**Success Discovery:**

- How will we know we're succeeding for our users?
- What would make users say 'this was worth it'?
- What metrics show we're creating real value?

Let's start with the user perspective."

### 2. User Success Metrics

**User Success Questions:**
Define success from the user's perspective:

- "What outcome are users trying to achieve?"
- "How will they know the product is working for them?"
- "What's the moment where they realize this is solving their problem?"
- "What behaviors indicate users are getting value?"

**User Success Exploration:**
Guide from vague to specific metrics:

- "Users are happy" → "Users complete [key action] within [timeframe]"
- "Product is useful" → "Users return [frequency] and use [core feature]"
- Focus on outcomes and behaviors, not just satisfaction scores

### 3. Business Objectives

**Business Success Questions:**
Define business success metrics:

- "What does success look like for the business at 3 months? 12 months?"
- "Are we measuring revenue, user growth, engagement, something else?"
- "What business metrics would make you say 'this is working'?"
- "How does this product contribute to broader company goals?"

**Business Success Categories:**

- **Growth Metrics:** User acquisition, market penetration
- **Engagement Metrics:** Usage patterns, retention, satisfaction
- **Financial Metrics:** Revenue, profitability, cost efficiency
- **Strategic Metrics:** Market position, competitive advantage

### 4. Key Performance Indicators

**KPI Development Process:**
Define specific, measurable KPIs:

- Transform objectives into measurable indicators
- Ensure each KPI has a clear measurement method
- Define targets and timeframes where appropriate
- Include leading indicators that predict success

**KPI Examples:**

- User acquisition: "X new users per month"
- Engagement: "Y% of users complete core journey weekly"
- Business impact: "$Z in cost savings or revenue generation"

### 5. Connect Metrics to Strategy

**Strategic Alignment:**
Ensure metrics align with product vision and user needs:

- Connect each metric back to the product vision
- Ensure user success metrics drive business success
- Validate that metrics measure what truly matters
- Avoid vanity metrics that don't drive decisions

### 6. Generate Success Metrics Content

**Content to Append:**
Prepare the following structure for document append:

```markdown
## Success Metrics

[Success metrics content based on conversation]

### Business Objectives

[Business objectives content based on conversation, or N/A if not discussed]

### Key Performance Indicators

[Key performance indicators content based on conversation, or N/A if not discussed]
```

### 7. Present MENU OPTIONS

**Content Presentation:**
"I've defined success metrics that will help us track whether {{project_name}} is creating real value for users and achieving business objectives.

**Here's what I'll add to the document:**
[Show the complete markdown content from step 6]

**Select an Option:** [A] Advanced Elicitation [P] Party Mode [AR] Adversarial Review [C] Continue"

#### Menu Handling Logic:

- IF A: Read fully and follow: {advancedElicitationTask} with current metrics content to dive deeper into success metric insights
- IF P: Read fully and follow: {partyModeWorkflow} to bring different perspectives to validate comprehensive metrics
- IF AR: Execute {project-root}/_arcwright/core/tasks/review-adversarial-general.xml — pass the current editPlan (or plan document in context) as the content to review; display findings with recommendations; then redisplay this menu
- IF C: Save content to {outputFile}, update frontmatter with stepsCompleted: [1, 2, 3, 4], then read fully and follow: {nextStepFile}
- IF Any other comments or queries: help user respond then [Redisplay Menu Options](#7-present-menu-options)

#### EXECUTION RULES:

- ALWAYS halt and wait for user input after presenting menu
- ONLY proceed to next step when user selects 'C'
- After other menu items execution, return to this menu with updated content
- User can chat or ask questions - always respond and then end with display again of the menu options

## NEXT STEP:

When 'C' is selected and success metrics are finalized and saved to document with frontmatter updated, read fully and follow `{nextStepFile}` to begin MVP scope definition.
