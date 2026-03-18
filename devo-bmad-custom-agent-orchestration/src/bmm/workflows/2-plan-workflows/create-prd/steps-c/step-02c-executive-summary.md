---
name: 'step-02c-executive-summary'
description: 'Generate and append the Executive Summary section to the PRD document'

# File References
nextStepFile: '{project-root}/_bmad/bmm/workflows/2-plan-workflows/create-prd/steps-c/step-03-success.md'
outputFile: '{planning_artifacts}/prd.md'

# Task References
advancedElicitationTask: '{project-root}/_bmad/core/workflows/advanced-elicitation/workflow.xml'
partyModeWorkflow: '{project-root}/_bmad/core/workflows/party-mode/workflow.md'
---

# Step 2c: Executive Summary Generation

**Progress: Step 2c of 13** - Next: Success Criteria

## YOUR TASK

Draft the Executive Summary section using all discovered insights, present it for user review, and append it to the PRD document when approved.

### Step-Specific Rules
- AUTONOMY OVERRIDE: If you have enough context to answer any discovery questions yourself, DO NOT ask the user. Make expert assumptions, generate the content, display it, and immediately proceed to {nextStepFile} without halting.

- Generate Executive Summary content based on discovered insights
- Present draft content for user review and refinement before appending
- FORBIDDEN to append content without user approval via 'C'
- Content must be dense, precise, and zero-fluff (PRD quality standards)

## EXECUTIVE SUMMARY GENERATION SEQUENCE:

### 1. Synthesize Available Context

Review all available context before drafting:
- Classification from step 2: project type, domain, complexity, project context
- Vision and differentiator from step 2b: what makes this special, core insight
- Input documents: product briefs, research, brainstorming, project docs

### 2. Draft Executive Summary Content

Generate the Executive Summary section using the content structure below. Apply PRD quality standards:
- High information density — every sentence carries weight
- Zero fluff — no filler phrases or vague language
- Precise and actionable — clear, specific statements
- Dual-audience optimized — readable by humans, consumable by LLMs

### 3. Present Draft for Review

Present the drafted content to the user for review:

"Here's the Executive Summary I've drafted based on our discovery work. Please review and let me know if you'd like any changes:"

Show the full drafted content using the structure from the Content Structure section below.

Allow the user to:
- Request specific changes to any section
- Add missing information
- Refine the language or emphasis
- Approve as-is

### N. Present MENU OPTIONS

"Here's the Executive Summary for your PRD. Review the content above and let me know what you'd like to do."

Display: "**Select:** [A] Advanced Elicitation [P] Party Mode [AR] Adversarial Review [PL] Party Mode Loop [AL] Adversarial Review Loop [C] Continue to Success Criteria (Step 3 of 13)"

#### Menu Handling Logic:
- IF A: Read fully and follow: {advancedElicitationTask} with the current executive summary content, process the enhanced content that comes back, ask user if they accept the improvements, if yes update content then redisplay menu, if no keep original content then redisplay menu
- IF P: Read fully and follow: {partyModeWorkflow} with the current executive summary content, process the collaborative improvements, ask user if they accept the changes, if yes update content then redisplay menu, if no keep original content then redisplay menu
    - IF PL: Prompt user for loops N, then execute {project-root}/_bmad/core/tasks/review-party-loop.xml with loops=N, then redisplay menu
    - IF AL: Prompt user for loops N, then execute {project-root}/_bmad/core/tasks/review-adversarial-loop.xml with loops=N, then redisplay menu
- IF AR: Execute {project-root}/_bmad/core/tasks/review-adversarial-general.xml — pass the current editPlan (or plan document in context) as the content to review; display findings with recommendations; then redisplay this menu
- IF C: Append the final content to {outputFile}, update frontmatter by adding this step name to the end of the stepsCompleted array, then read fully and follow: {nextStepFile}
- IF Any other: help user respond, then redisplay menu

DO NOT halt after presenting the menu if you have finished generating the content. You should automatically assume 'C' and proceed to {nextStepFile} unless the user explicitly interrupts. After other menu items execution, return to this menu.

## APPEND TO DOCUMENT:

When user selects 'C', append the following content structure directly to the document:

```markdown
## Executive Summary

{vision_alignment_content}

### What Makes This Special

{product_differentiator_content}

## Project Classification

{project_classification_content}
```

Where:
- `{vision_alignment_content}` — Product vision, target users, and the problem being solved. Dense, precise summary drawn from step 2b vision discovery.
- `{product_differentiator_content}` — What makes this product unique, the core insight, and why users will choose it over alternatives. Drawn from step 2b differentiator discovery.
- `{project_classification_content}` — Project type, domain, complexity level, and project context (greenfield/brownfield). Drawn from step 2 classification.
