---
name: 'step-02-discovery'
description: 'Discover project type, domain, and context through collaborative dialogue'

# File References
nextStepFile: '{project-root}/_bmad/bmm/workflows/2-plan-workflows/create-prd/steps-c/step-02b-vision.md'
outputFile: '{planning_artifacts}/prd.md'

# Data Files
projectTypesCSV: '../data/project-types.csv'
domainComplexityCSV: '../data/domain-complexity.csv'

# Task References
advancedElicitationTask: '{project-root}/_bmad/core/workflows/advanced-elicitation/workflow.xml'
partyModeWorkflow: '{project-root}/_bmad/core/workflows/party-mode/workflow.md'
---

# Step 2: Project Discovery

**Progress: Step 2 of 13** - Next: Product Vision

## YOUR TASK

Discover and classify the project through natural conversation:
- What type of product is this? (web app, API, mobile, etc.)
- What domain does it operate in? (healthcare, fintech, e-commerce, etc.)
- What's the project context? (greenfield new product vs brownfield existing system)
- How complex is this domain? (low, medium, high)

### Step-Specific Rules
- AUTONOMY OVERRIDE: If you have enough context to answer any discovery questions yourself, DO NOT ask the user. Make expert assumptions, generate the content, display it, and immediately proceed to {nextStepFile} without halting.

- Focus on classification and understanding — no content generation yet
- FORBIDDEN to generate executive summary or vision statements (that's next steps)
- APPROACH: Natural conversation to understand the project
- LOAD classification data BEFORE starting discovery conversation

## DISCOVERY SEQUENCE:

### 1. Check Document State

Read the frontmatter from `{outputFile}` to get document counts:
- `briefCount` - Product briefs available
- `researchCount` - Research documents available
- `brainstormingCount` - Brainstorming docs available
- `projectDocsCount` - Existing project documentation

**Announce your understanding:**

"From step 1, I have loaded:
- Product briefs: {{briefCount}}
- Research: {{researchCount}}
- Brainstorming: {{brainstormingCount}}
- Project docs: {{projectDocsCount}}

{{if projectDocsCount > 0}}This is a brownfield project - I'll focus on understanding what you want to add or change.{{else}}This is a greenfield project - I'll help you define the full product vision.{{/if}}"

### 2. Load Classification Data

**Attempt subprocess data lookup:**

**Project Type Lookup:**
"Your task: Lookup data in {projectTypesCSV}

**Search criteria:**
- Find row where project_type matches {{detectedProjectType}}

**Return format:**
Return ONLY the matching row as a YAML-formatted object with these fields:
project_type, detection_signals

**Do NOT return the entire CSV - only the matching row.**"

**Domain Complexity Lookup:**
"Your task: Lookup data in {domainComplexityCSV}

**Search criteria:**
- Find row where domain matches {{detectedDomain}}

**Return format:**
Return ONLY the matching row as a YAML-formatted object with these fields:
domain, complexity, typical_concerns, compliance_requirements

**Do NOT return the entire CSV - only the matching row.**"

**Graceful degradation (if Task tool unavailable):**
- Load the CSV files directly
- Find the matching rows manually
- Extract required fields
- Keep in memory for intelligent classification

### 3. Begin Discovery Conversation

**Start with what you know:**

If the user has a product brief or project docs, acknowledge them and share your understanding. Then ask clarifying questions to deepen your understanding.

If this is a greenfield project with no docs, start with open-ended discovery:
- What problem does this solve?
- Who's it for?
- What excites you about building this?

**Listen for classification signals:**

As the user describes their product, match against:
- **Project type signals** (API, mobile, SaaS, etc.)
- **Domain signals** (healthcare, fintech, education, etc.)
- **Complexity indicators** (regulated industries, novel technology, etc.)

### 4. Confirm Classification

Once you have enough understanding, share your classification:

"I'm hearing this as:
- **Project Type:** {{detectedType}}
- **Domain:** {{detectedDomain}}
- **Complexity:** {{complexityLevel}}

Does this sound right to you?"

Let the user confirm or refine your classification.

### 5. Save Classification to Frontmatter

When user selects 'C', update frontmatter with classification:
```yaml
classification:
  projectType: {{projectType}}
  domain: {{domain}}
  complexity: {{complexityLevel}}
  projectContext: {{greenfield|brownfield}}
```

### N. Present MENU OPTIONS

Present the project classification for review, then display menu:

"Based on our conversation, I've discovered and classified your project.

**Here's the classification:**

**Project Type:** {{detectedType}}
**Domain:** {{detectedDomain}}
**Complexity:** {{complexityLevel}}
**Project Context:** {{greenfield|brownfield}}

**What would you like to do?**"

Display: "**Select:** [A] Advanced Elicitation [P] Party Mode [AR] Adversarial Review [PL] Party Mode Loop [AL] Adversarial Review Loop [C] Continue to Product Vision (Step 2b of 13)"

#### Menu Handling Logic:
- IF A: Read fully and follow: {advancedElicitationTask} with the current classification, process the enhanced insights that come back, ask user if they accept the improvements, if yes update classification then redisplay menu, if no keep original classification then redisplay menu
- IF P: Read fully and follow: {partyModeWorkflow} with the current classification, process the collaborative insights, ask user if they accept the changes, if yes update classification then redisplay menu, if no keep original classification then redisplay menu
    - IF PL: Prompt user for loops N, then execute {project-root}/_bmad/core/tasks/review-party-loop.xml with loops=N, then redisplay menu
    - IF AL: Prompt user for loops N, then execute {project-root}/_bmad/core/tasks/review-adversarial-loop.xml with loops=N, then redisplay menu
- IF AR: Execute {project-root}/_bmad/core/tasks/review-adversarial-general.xml — pass the current editPlan (or plan document in context) as the content to review; display findings with recommendations; then redisplay this menu
- IF C: Save classification to {outputFile} frontmatter, add this step name to the end of stepsCompleted array, then read fully and follow: {nextStepFile}
- IF Any other: help user respond, then redisplay menu

DO NOT halt after presenting the menu if you have finished generating the content. You should automatically assume 'C' and proceed to {nextStepFile} unless the user explicitly interrupts. After other menu items execution, return to this menu.
