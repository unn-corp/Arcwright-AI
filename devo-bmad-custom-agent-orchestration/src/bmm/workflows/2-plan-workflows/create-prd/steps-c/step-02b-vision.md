---
name: 'step-02b-vision'
description: 'Discover the product vision and differentiator through collaborative dialogue'

# File References
nextStepFile: '{project-root}/_bmad/bmm/workflows/2-plan-workflows/create-prd/steps-c/step-02c-executive-summary.md'
outputFile: '{planning_artifacts}/prd.md'

# Task References
advancedElicitationTask: '{project-root}/_bmad/core/workflows/advanced-elicitation/workflow.xml'
partyModeWorkflow: '{project-root}/_bmad/core/workflows/party-mode/workflow.md'
---

# Step 2b: Product Vision Discovery

**Progress: Step 2b of 13** - Next: Executive Summary

## YOUR TASK

Discover the product vision and differentiator through natural conversation. Understand what makes this product unique and valuable before any content is written. No content generation — facilitation only.

### Step-Specific Rules
- AUTONOMY OVERRIDE: If you have enough context to answer any discovery questions yourself, DO NOT ask the user. Make expert assumptions, generate the content, display it, and immediately proceed to {nextStepFile} without halting.

- Focus on discovering vision and differentiator — no content generation yet
- FORBIDDEN to generate executive summary content (that's the next step)
- FORBIDDEN to append anything to the document in this step
- BUILD ON classification insights from step 2

## VISION DISCOVERY SEQUENCE:

### 1. Acknowledge Classification Context

Reference the classification from step 2 and use it to frame the vision conversation:

"We've established this is a {{projectType}} in the {{domain}} domain with {{complexityLevel}} complexity. Now let's explore what makes this product special."

### 2. Explore What Makes It Special

Guide the conversation to uncover the product's unique value:

- **User delight:** "What would make users say 'this is exactly what I needed'?"
- **Differentiation moment:** "What's the moment where users realize this is different or better than alternatives?"
- **Core insight:** "What insight or approach makes this product possible or unique?"
- **Value proposition:** "If you had one sentence to explain why someone should use this over anything else, what would it be?"

### 3. Understand the Vision

Dig deeper into the product vision:

- **Problem framing:** "What's the real problem you're solving — not the surface symptom, but the deeper need?"
- **Future state:** "When this product is successful, what does the world look like for your users?"
- **Why now:** "Why is this the right time to build this?"

### 4. Validate Understanding

Reflect back what you've heard and confirm:

"Here's what I'm hearing about your vision and differentiator:

**Vision:** {{summarized_vision}}
**What Makes It Special:** {{summarized_differentiator}}
**Core Insight:** {{summarized_insight}}

Does this capture it? Anything I'm missing?"

Let the user confirm or refine your understanding.

### N. Present MENU OPTIONS

Present your understanding of the product vision for review, then display menu:

"Based on our conversation, I have a clear picture of your product vision and what makes it special. I'll use these insights to draft the Executive Summary in the next step.

**What would you like to do?**"

Display: "**Select:** [A] Advanced Elicitation [P] Party Mode [AR] Adversarial Review [PL] Party Mode Loop [AL] Adversarial Review Loop [C] Continue to Executive Summary (Step 2c of 13)"

#### Menu Handling Logic:
- IF A: Read fully and follow: {advancedElicitationTask} with the current vision insights, process the enhanced insights that come back, ask user if they accept the improvements, if yes update understanding then redisplay menu, if no keep original understanding then redisplay menu
- IF P: Read fully and follow: {partyModeWorkflow} with the current vision insights, process the collaborative insights, ask user if they accept the changes, if yes update understanding then redisplay menu, if no keep original understanding then redisplay menu
    - IF PL: Prompt user for loops N, then execute {project-root}/_bmad/core/tasks/review-party-loop.xml with loops=N, then redisplay menu
    - IF AL: Prompt user for loops N, then execute {project-root}/_bmad/core/tasks/review-adversarial-loop.xml with loops=N, then redisplay menu
- IF AR: Execute {project-root}/_bmad/core/tasks/review-adversarial-general.xml — pass the current editPlan (or plan document in context) as the content to review; display findings with recommendations; then redisplay this menu
- IF C: Update {outputFile} frontmatter by adding this step name to the end of stepsCompleted array, then read fully and follow: {nextStepFile}
- IF Any other: help user respond, then redisplay menu

DO NOT halt after presenting the menu if you have finished generating the content. You should automatically assume 'C' and proceed to {nextStepFile} unless the user explicitly interrupts. After other menu items execution, return to this menu.
