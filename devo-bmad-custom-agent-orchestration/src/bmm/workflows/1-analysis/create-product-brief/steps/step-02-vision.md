---
name: 'step-02-vision'
description: 'Discover and define the core product vision, problem statement, and unique value proposition'

# File References
nextStepFile: '{project-root}/_bmad/bmm/workflows/1-analysis/create-product-brief/steps/step-03-users.md'
outputFile: '{planning_artifacts}/product-brief-{{project_name}}-{{date}}.md'

# Task References
advancedElicitationTask: '{project-root}/_bmad/core/workflows/advanced-elicitation/workflow.xml'
partyModeWorkflow: '{project-root}/_bmad/core/workflows/party-mode/workflow.md'
---

# Step 2: Product Vision Discovery

## STEP GOAL:

Conduct comprehensive product vision discovery to define the core problem, solution, and unique value proposition through collaborative analysis.

## Step-Specific Rules:

- Focus only on product vision, problem, and solution discovery
- FORBIDDEN to generate vision without real user input and collaboration
- COLLABORATIVE discovery, not assumption-based vision crafting

## Sequence of Instructions (Do not deviate, skip, or optimize)

### 1. Begin Vision Discovery

**Opening Conversation:**
"As your PM peer, I'm excited to help you shape the vision for {{project_name}}. Let's start with the foundation.

**Tell me about the product you envision:**

- What core problem are you trying to solve?
- Who experiences this problem most acutely?
- What would success look like for the people you're helping?
- What excites you most about this solution?

Let's start with the problem space before we get into solutions."

### 2. Deep Problem Understanding

**Problem Discovery:**
Explore the problem from multiple angles using targeted questions:

- How do people currently solve this problem?
- What's frustrating about current solutions?
- What happens if this problem goes unsolved?
- Who feels this pain most intensely?

### 3. Current Solutions Analysis

**Competitive Landscape:**

- What solutions exist today?
- Where do they fall short?
- What gaps are they leaving open?
- Why haven't existing solutions solved this completely?

### 4. Solution Vision

**Collaborative Solution Crafting:**

- If we could solve this perfectly, what would that look like?
- What's the simplest way we could make a meaningful difference?
- What makes your approach different from what's out there?
- What would make users say 'this is exactly what I needed'?

### 5. Unique Differentiators

**Competitive Advantage:**

- What's your unfair advantage?
- What would be hard for competitors to copy?
- What insight or approach is uniquely yours?
- Why is now the right time for this solution?

### 6. Generate Executive Summary Content

**Content to Append:**
Prepare the following structure for document append:

```markdown
## Executive Summary

[Executive summary content based on conversation]

---

## Core Vision

### Problem Statement

[Problem statement content based on conversation]

### Problem Impact

[Problem impact content based on conversation]

### Why Existing Solutions Fall Short

[Analysis of existing solution gaps based on conversation]

### Proposed Solution

[Proposed solution description based on conversation]

### Key Differentiators

[Key differentiators based on conversation]
```

### 7. Present MENU OPTIONS

**Content Presentation:**
"I've drafted the executive summary and core vision based on our conversation. This captures the essence of {{project_name}} and what makes it special.

**Here's what I'll add to the document:**
[Show the complete markdown content from step 6]

**Select an Option:** [A] Advanced Elicitation [P] Party Mode [AR] Adversarial Review [C] Continue"

#### Menu Handling Logic:

- IF A: Read fully and follow: {advancedElicitationTask} with current vision content to dive deeper and refine
- IF P: Read fully and follow: {partyModeWorkflow} to bring different perspectives to positioning and differentiation
- IF AR: Execute {project-root}/_bmad/core/tasks/review-adversarial-general.xml — pass the current editPlan (or plan document in context) as the content to review; display findings with recommendations; then redisplay this menu
- IF C: Save content to {outputFile}, update frontmatter with stepsCompleted: [1, 2], then read fully and follow: {nextStepFile}
- IF Any other comments or queries: help user respond then [Redisplay Menu Options](#7-present-menu-options)

#### EXECUTION RULES:

- ALWAYS halt and wait for user input after presenting menu
- ONLY proceed to next step when user selects 'C'
- After other menu items execution, return to this menu with updated content
- User can chat or ask questions - always respond and then end with display again of the menu options

## NEXT STEP:

When 'C' is selected and vision content is finalized and saved to document with frontmatter updated, read fully and follow `{nextStepFile}` to begin target user discovery.
