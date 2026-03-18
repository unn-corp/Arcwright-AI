---
name: 'step-11-polish'
description: 'Optimize and polish the complete PRD document for flow, coherence, and readability'

# File References
nextStepFile: '{project-root}/_bmad/bmm/workflows/2-plan-workflows/create-prd/steps-c/step-12-complete.md'
outputFile: '{planning_artifacts}/prd.md'
purposeFile: '{project-root}/_bmad/bmm/workflows/2-plan-workflows/create-prd/data/prd-purpose.md'

# Task References
advancedElicitationTask: '{project-root}/_bmad/core/workflows/advanced-elicitation/workflow.xml'
partyModeWorkflow: '{project-root}/_bmad/core/workflows/party-mode/workflow.md'
---

# Step 11: Document Polish

**Progress: Step 11 of 12** - Next: Complete PRD

## YOUR TASK

Optimize the complete PRD document for flow, coherence, and professional presentation while preserving all essential information.

### Step-Specific Rules
- AUTONOMY OVERRIDE: If you have enough context to answer any discovery questions yourself, DO NOT ask the user. Make expert assumptions, generate the content, display it, and immediately proceed to {nextStepFile} without halting.

- CRITICAL: Load the ENTIRE document before making changes
- This is a POLISH step — optimize existing content
- PRESERVE user's voice and intent
- MAINTAIN all essential information while improving presentation

## DOCUMENT POLISH SEQUENCE:

### 1. Load Context and Document

**CRITICAL:** Load the PRD purpose document first:

- Read `{purposeFile}` to understand what makes a great BMAD PRD
- Internalize the philosophy: information density, traceability, measurable requirements
- Keep the dual-audience nature (humans + LLMs) in mind

**Then Load the PRD Document:**

- Read `{outputFile}` completely from start to finish
- Understand the full document structure and content
- Identify all sections and their relationships
- Note areas that need attention

### 2. Document Quality Review

Review the entire document with PRD purpose principles in mind:

**Information Density:**
- Are there wordy phrases that can be condensed?
- Is conversational padding present?
- Can sentences be more direct and concise?

**Flow and Coherence:**
- Do sections transition smoothly?
- Are there jarring topic shifts?
- Does the document tell a cohesive story?
- Is the progression logical for readers?

**Duplication Detection:**
- Are ideas repeated across sections?
- Is the same information stated multiple times?
- Can redundant content be consolidated?
- Are there contradictory statements?

**Header Structure:**
- Are all main sections using ## Level 2 headers?
- Is the hierarchy consistent (##, ###, ####)?
- Can sections be easily extracted or referenced?
- Are headers descriptive and clear?

**Readability:**
- Are sentences clear and concise?
- Is the language consistent throughout?
- Are technical terms used appropriately?
- Would stakeholders find this easy to understand?

### 3. Optimization Actions

Make targeted improvements:

**Improve Flow:**
- Add transition sentences between sections
- Smooth out jarring topic shifts
- Ensure logical progression
- Connect related concepts across sections

**Reduce Duplication:**
- Consolidate repeated information
- Keep content in the most appropriate section
- Use cross-references instead of repetition
- Remove redundant explanations

**Enhance Coherence:**
- Ensure consistent terminology throughout
- Align all sections with product differentiator
- Maintain consistent voice and tone
- Verify scope consistency across sections

**Optimize Headers:**
- Ensure all main sections use ## Level 2
- Make headers descriptive and action-oriented
- Check that headers follow consistent patterns
- Verify headers support document navigation

### 4. Preserve Critical Information

**While optimizing, ensure NOTHING essential is lost:**

**Must Preserve:**
- All user success criteria
- All functional requirements (capability contract)
- All user journey narratives
- All scope decisions (MVP, Growth, Vision)
- All non-functional requirements
- Product differentiator and vision
- Domain-specific requirements
- Innovation analysis (if present)

**Can Consolidate:**
- Repeated explanations of the same concept
- Redundant background information
- Multiple versions of similar content
- Overlapping examples

### 5. Generate Optimized Document

Create the polished version:

**Polishing Process:**
1. Start with original document
2. Apply all optimization actions
3. Review to ensure nothing essential was lost
4. Verify improvements enhance readability
5. Prepare optimized version for review

### 6. Present MENU OPTIONS

Present the polished document for review, then display menu:
- Show what changed in the polish
- Highlight improvements made (flow, duplication, headers)
- Ask if they'd like to refine further, get other perspectives, or proceed

Display: "**Select:** [A] Advanced Elicitation [P] Party Mode [AR] Adversarial Review [PL] Party Mode Loop [AL] Adversarial Review Loop [C] Continue to Complete PRD (Step 12 of 12)"

#### Menu Handling Logic:
- IF A: Read fully and follow: {advancedElicitationTask} with the polished document, process the enhanced refinements that come back, ask user "Accept these polish improvements? (y/n)", if yes update content with improvements then redisplay menu, if no keep original polish then redisplay menu
- IF P: Read fully and follow: {partyModeWorkflow} with the polished document, process the collaborative refinements to flow and coherence, ask user "Accept these polish changes? (y/n)", if yes update content with improvements then redisplay menu, if no keep original polish then redisplay menu
    - IF PL: Prompt user for loops N, then execute {project-root}/_bmad/core/tasks/review-party-loop.xml with loops=N, then redisplay menu
    - IF AL: Prompt user for loops N, then execute {project-root}/_bmad/core/tasks/review-adversarial-loop.xml with loops=N, then redisplay menu
- IF AR: Execute {project-root}/_bmad/core/tasks/review-adversarial-general.xml — pass the current editPlan (or plan document in context) as the content to review; display findings with recommendations; then redisplay this menu
- IF C: Save the polished document to {outputFile}, update frontmatter by adding this step name to the end of the stepsCompleted array, then read fully and follow: {nextStepFile}
- IF Any other: help user respond, then redisplay menu

DO NOT halt after presenting the menu if you have finished generating the content. You should automatically assume 'C' and proceed to {nextStepFile} unless the user explicitly interrupts. After other menu items execution, return to this menu.

## APPEND TO DOCUMENT:

When user selects 'C', replace the entire document content with the polished version.
