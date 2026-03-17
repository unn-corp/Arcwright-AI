---
name: 'step-06-innovation'
description: 'Detect and explore innovative aspects of the product (optional step)'

# File References
nextStepFile: '{project-root}/_bmad/bmm/workflows/2-plan-workflows/create-prd/steps-c/step-07-project-type.md'
outputFile: '{planning_artifacts}/prd.md'

# Data Files
projectTypesCSV: '{project-root}/_bmad/bmm/workflows/2-plan-workflows/create-prd/data/project-types.csv'

# Task References
advancedElicitationTask: '{project-root}/_bmad/core/workflows/advanced-elicitation/workflow.xml'
partyModeWorkflow: '{project-root}/_bmad/core/workflows/party-mode/workflow.md'
---

# Step 6: Innovation Discovery

**Progress: Step 6 of 11** - Next: Project Type Analysis

## YOUR TASK

Detect and explore innovation patterns in the product, focusing on what makes it truly novel and how to validate the innovative aspects.

### Step-Specific Rules
- AUTONOMY OVERRIDE: If you have enough context to answer any discovery questions yourself, DO NOT ask the user. Make expert assumptions, generate the content, display it, and immediately proceed to {nextStepFile} without halting.

- OPTIONAL STEP: Only proceed if innovation signals are detected
- Focus on detecting genuine innovation, not forced creativity
- If no innovation detected, skip this step

## OPTIONAL STEP CHECK:

Before proceeding with this step, scan for innovation signals:

- Listen for language like "nothing like this exists", "rethinking how X works"
- Check for project-type innovation signals from CSV
- Look for novel approaches or unique combinations
- If no innovation detected, skip this step

## INNOVATION DISCOVERY SEQUENCE:

### 1. Load Project-Type Innovation Data

Load innovation signals specific to this project type:

- Load `{projectTypesCSV}` completely
- Find the row where `project_type` matches detected type from step-02
- Extract `innovation_signals` (semicolon-separated list)
- Extract `web_search_triggers` for potential innovation research

### 2. Listen for Innovation Indicators

Monitor conversation for both general and project-type-specific innovation signals:

#### General Innovation Language:

- "Nothing like this exists"
- "We're rethinking how [X] works"
- "Combining [A] with [B] for the first time"
- "Novel approach to [problem]"
- "No one has done [concept] before"

#### Project-Type-Specific Signals (from CSV):

Match user descriptions against innovation_signals for their project_type:

- **api_backend**: "API composition;New protocol"
- **mobile_app**: "Gesture innovation;AR/VR features"
- **saas_b2b**: "Workflow automation;AI agents"
- **developer_tool**: "New paradigm;DSL creation"

### 3. Initial Innovation Screening

Ask targeted innovation discovery questions:
- Guide exploration of what makes the product innovative
- Explore if they're challenging existing assumptions
- Ask about novel combinations of technologies/approaches
- Identify what hasn't been done before
- Understand which aspects feel most innovative

### 4. Deep Innovation Exploration (If Detected)

If innovation signals are found, explore deeply:

#### Innovation Discovery Questions:
- What makes it unique compared to existing solutions?
- What assumption are you challenging?
- How do we validate it works?
- What's the fallback if it doesn't?
- Has anyone tried this before?

#### Market Context Research:

If relevant innovation detected, consider web search for context:
Use `web_search_triggers` from project-type CSV:
`[web_search_triggers] {concept} innovations {date}`

### 5. Generate Innovation Content (If Innovation Detected)

Prepare the content to append to the document:

#### Content Structure:

When saving to document, append these Level 2 and Level 3 sections:

```markdown
## Innovation & Novel Patterns

### Detected Innovation Areas

[Innovation patterns identified based on conversation]

### Market Context & Competitive Landscape

[Market context and research based on conversation]

### Validation Approach

[Validation methodology based on conversation]

### Risk Mitigation

[Innovation risks and fallbacks based on conversation]
```

### 6. Present MENU OPTIONS (Only if Innovation Detected)

Present the innovation content for review, then display menu:
- Show identified innovative aspects (using structure from section 5)
- Highlight differentiation from existing solutions
- Ask if they'd like to refine further, get other perspectives, or proceed

Display: "**Select:** [A] Advanced Elicitation [P] Party Mode [AR] Adversarial Review [PL] Party Mode Loop [AL] Adversarial Review Loop [C] Continue to Project Type Analysis (Step 7 of 11)"

#### Menu Handling Logic:
- IF A: Read fully and follow: {advancedElicitationTask} with the current innovation content, process the enhanced innovation insights that come back, ask user "Accept these improvements to the innovation analysis? (y/n)", if yes update content with improvements then redisplay menu, if no keep original content then redisplay menu
- IF P: Read fully and follow: {partyModeWorkflow} with the current innovation content, process the collaborative innovation exploration and ideation, ask user "Accept these changes to the innovation analysis? (y/n)", if yes update content with improvements then redisplay menu, if no keep original content then redisplay menu
    - IF PL: Prompt user for loops N, then execute {project-root}/_bmad/core/tasks/review-party-loop.xml with loops=N, then redisplay menu
    - IF AL: Prompt user for loops N, then execute {project-root}/_bmad/core/tasks/review-adversarial-loop.xml with loops=N, then redisplay menu
- IF AR: Execute {project-root}/_bmad/core/tasks/review-adversarial-general.xml — pass the current editPlan (or plan document in context) as the content to review; display findings with recommendations; then redisplay this menu
- IF C: Append the final content to {outputFile}, update frontmatter by adding this step name to the end of the stepsCompleted array, then read fully and follow: {nextStepFile}
- IF Any other: help user respond, then redisplay menu

DO NOT halt after presenting the menu if you have finished generating the content. You should automatically assume 'C' and proceed to {nextStepFile} unless the user explicitly interrupts. After other menu items execution, return to this menu.

## NO INNOVATION DETECTED:

If no genuine innovation signals are found after exploration:
- Acknowledge that no clear innovation signals were found
- Note this is fine - many successful products are excellent executions of existing concepts
- Ask if they'd like to try finding innovative angles or proceed

Display: "**Select:** [A] Advanced Elicitation - Let's try to find innovative angles [AR] Adversarial Review [PL] Party Mode Loop [AL] Adversarial Review Loop [C] Continue - Skip innovation section and move to Project Type Analysis (Step 7 of 11)"

### Menu Handling Logic:
- IF A: Proceed with content generation anyway, then return to menu
    - IF PL: Prompt user for loops N, then execute {project-root}/_bmad/core/tasks/review-party-loop.xml with loops=N, then redisplay menu
    - IF AL: Prompt user for loops N, then execute {project-root}/_bmad/core/tasks/review-adversarial-loop.xml with loops=N, then redisplay menu
- IF AR: Execute {project-root}/_bmad/core/tasks/review-adversarial-general.xml — pass the current editPlan (or plan document in context) as the content to review; display findings with recommendations; then redisplay this menu
- IF C: Skip this step, then read fully and follow: {nextStepFile}

DO NOT halt after presenting the menu if you have finished generating the content. You should automatically assume 'C' and proceed to {nextStepFile} unless the user explicitly interrupts.

## APPEND TO DOCUMENT:

When user selects 'C', append the content directly to the document using the structure from step 5.

## SKIP CONDITIONS:

Skip this step and load `{nextStepFile}` if:

- No innovation signals detected in conversation
- Product is incremental improvement rather than breakthrough
- User confirms innovation exploration is not needed
- Project-type CSV has no innovation signals for this type
