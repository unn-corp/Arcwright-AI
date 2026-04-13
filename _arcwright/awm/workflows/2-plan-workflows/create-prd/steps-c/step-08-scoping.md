---
name: 'step-08-scoping'
description: 'Define MVP boundaries and prioritize features across development phases'

# File References
nextStepFile: '{project-root}/_arcwright/awm/workflows/2-plan-workflows/create-prd/steps-c/step-09-functional.md'
outputFile: '{planning_artifacts}/prd.md'

# Task References
advancedElicitationTask: '{project-root}/_arcwright/core/workflows/advanced-elicitation/workflow.xml'
partyModeWorkflow: '{project-root}/_arcwright/core/workflows/party-mode/workflow.md'
---

# Step 8: Scoping Exercise - MVP & Future Features

**Progress: Step 8 of 11** - Next: Functional Requirements

## YOUR TASK

Conduct comprehensive scoping exercise to define MVP boundaries and prioritize features across development phases.

### Step-Specific Rules
- AUTONOMY OVERRIDE: If you have enough context to answer any discovery questions yourself, DO NOT ask the user. Make expert assumptions, generate the content, display it, and immediately proceed to {nextStepFile} without halting.

- Review the complete PRD document built so far before making scoping decisions
- EMPHASIZE lean MVP thinking while preserving long-term vision

## SCOPING SEQUENCE:

### 1. Review Current PRD State

Analyze everything documented so far:
- Present synthesis of established vision, success criteria, journeys
- Assess domain and innovation focus
- Evaluate scope implications: simple MVP, medium, or complex project
- Ask if initial assessment feels right or if they see it differently

### 2. Define MVP Strategy

Facilitate strategic MVP decisions:
- Explore MVP philosophy options: problem-solving, experience, platform, or revenue MVP
- Ask critical questions:
  - What's the minimum that would make users say 'this is useful'?
  - What would make investors/partners say 'this has potential'?
  - What's the fastest path to validated learning?
- Guide toward appropriate MVP approach for their product

### 3. Scoping Decision Framework

Use structured decision-making for scope:

**Must-Have Analysis:**
- Guide identification of absolute MVP necessities
- For each journey and success criterion, ask:
  - Without this, does the product fail?
  - Can this be manual initially?
  - Is this a deal-breaker for early adopters?
- Analyze journeys for MVP essentials

**Nice-to-Have Analysis:**
- Identify what could be added later:
  - Features that enhance but aren't essential
  - User types that can be added later
  - Advanced functionality that builds on MVP
- Ask what features could be added in versions 2, 3, etc.

### 4. Progressive Feature Roadmap

Create phased development approach:
- Guide mapping of features across development phases
- Structure as Phase 1 (MVP), Phase 2 (Growth), Phase 3 (Vision)
- Ensure clear progression and dependencies

- Core user value delivery
- Essential user journeys
- Basic functionality that works reliably

**Phase 2: Growth**

- Additional user types
- Enhanced features
- Scale improvements

**Phase 3: Expansion**

- Advanced capabilities
- Platform features
- New markets or use cases

**Where does your current vision fit in this development sequence?**"

### 5. Risk-Based Scoping

Identify and mitigate scoping risks:

**Technical Risks:**
"Looking at your innovation and domain requirements:

- What's the most technically challenging aspect?
- Could we simplify the initial implementation?
- What's the riskiest assumption about technology feasibility?"

**Market Risks:**

- What's the biggest market risk?
- How does the MVP address this?
- What learning do we need to de-risk this?"

**Resource Risks:**

- What if we have fewer resources than planned?
- What's the absolute minimum team size needed?
- Can we launch with a smaller feature set?"

### 6. Generate Scoping Content

Prepare comprehensive scoping section:

#### Content Structure:

```markdown
## Project Scoping & Phased Development

### MVP Strategy & Philosophy

**MVP Approach:** {{chosen_mvp_approach}}
**Resource Requirements:** {{mvp_team_size_and_skills}}

### MVP Feature Set (Phase 1)

**Core User Journeys Supported:**
{{essential_journeys_for_mvp}}

**Must-Have Capabilities:**
{{list_of_essential_mvp_features}}

### Post-MVP Features

**Phase 2 (Post-MVP):**
{{planned_growth_features}}

**Phase 3 (Expansion):**
{{planned_expansion_features}}

### Risk Mitigation Strategy

**Technical Risks:** {{mitigation_approach}}
**Market Risks:** {{validation_approach}}
**Resource Risks:** {{contingency_approach}}
```

### 7. Present MENU OPTIONS

Present the scoping decisions for review, then display menu:
- Show strategic scoping plan (using structure from step 6)
- Highlight MVP boundaries and phased roadmap
- Ask if they'd like to refine further, get other perspectives, or proceed

Display: "**Select:** [A] Advanced Elicitation [P] Party Mode [AR] Adversarial Review [PL] Party Mode Loop [AL] Adversarial Review Loop [C] Continue to Functional Requirements (Step 9 of 11)"

#### Menu Handling Logic:
- IF A: Read fully and follow: {advancedElicitationTask} with the current scoping analysis, process the enhanced insights that come back, ask user if they accept the improvements, if yes update content then redisplay menu, if no keep original content then redisplay menu
- IF P: Read fully and follow: {partyModeWorkflow} with the scoping context, process the collaborative insights on MVP and roadmap decisions, ask user if they accept the changes, if yes update content then redisplay menu, if no keep original content then redisplay menu
    - IF PL: Prompt user for loops N, then execute {project-root}/_arcwright/core/tasks/review-party-loop.xml with loops=N, then redisplay menu
    - IF AL: Prompt user for loops N, then execute {project-root}/_arcwright/core/tasks/review-adversarial-loop.xml with loops=N, then redisplay menu
- IF AR: Execute {project-root}/_arcwright/core/tasks/review-adversarial-general.xml — pass the current editPlan (or plan document in context) as the content to review; display findings with recommendations; then redisplay this menu
- IF C: Append the final content to {outputFile}, update frontmatter by adding this step name to the end of the stepsCompleted array, then read fully and follow: {nextStepFile}
- IF Any other: help user respond, then redisplay menu

DO NOT halt after presenting the menu if you have finished generating the content. You should automatically assume 'C' and proceed to {nextStepFile} unless the user explicitly interrupts. After other menu items execution, return to this menu.

## APPEND TO DOCUMENT:

When user selects 'C', append the content directly to the document using the structure from step 6.
