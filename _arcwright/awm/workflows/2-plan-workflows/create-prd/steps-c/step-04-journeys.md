---
name: 'step-04-journeys'
description: 'Map ALL user types that interact with the system with narrative story-based journeys'

# File References
nextStepFile: '{project-root}/_arcwright/awm/workflows/2-plan-workflows/create-prd/steps-c/step-05-domain.md'
outputFile: '{planning_artifacts}/prd.md'

# Task References
advancedElicitationTask: '{project-root}/_arcwright/core/workflows/advanced-elicitation/workflow.xml'
partyModeWorkflow: '{project-root}/_arcwright/core/workflows/party-mode/workflow.md'
---

# Step 4: User Journey Mapping

**Progress: Step 4 of 11** - Next: Domain Requirements

## YOUR TASK

Create compelling narrative user journeys that leverage existing personas from product briefs and identify additional user types needed for comprehensive coverage.

### Step-Specific Rule

CRITICAL: No journey = no functional requirements = product doesn't exist.

## JOURNEY MAPPING SEQUENCE:

### 1. Leverage Existing Users & Identify Additional Types

**Check Input Documents for Existing Personas:**
Analyze product brief, research, and brainstorming documents for user personas already defined.

**If User Personas Exist in Input Documents:**
Guide user to build on existing personas:
- Acknowledge personas found in their product brief
- Extract key persona details and backstories
- Leverage existing insights about their needs
- Prompt to identify additional user types beyond those documented
- Suggest additional user types based on product context (admins, moderators, support, API consumers, internal ops)
- Ask what additional user types should be considered

**If No Personas in Input Documents:**
Start with comprehensive user type discovery:
- Guide exploration of ALL people who interact with the system
- Consider beyond primary users: admins, moderators, support staff, API consumers, internal ops
- Ask what user types should be mapped for this specific product
- Ensure comprehensive coverage of all system interactions

### 2. Create Narrative Story-Based Journeys

For each user type, create compelling narrative journeys that tell their story:

#### Narrative Journey Creation Process:

**If Using Existing Persona from Input Documents:**
Guide narrative journey creation:
- Use persona's existing backstory from brief
- Explore how the product changes their life/situation
- Craft journey narrative: where do we meet them, how does product help them write their next chapter?

**If Creating New Persona:**
Guide persona creation with story framework:
- Name: realistic name and personality
- Situation: What's happening in their life/work that creates need?
- Goal: What do they desperately want to achieve?
- Obstacle: What's standing in their way?
- Solution: How does the product solve their story?

**Story-Based Journey Mapping:**

Guide narrative journey creation using story structure:
- **Opening Scene**: Where/how do we meet them? What's their current pain?
- **Rising Action**: What steps do they take? What do they discover?
- **Climax**: Critical moment where product delivers real value
- **Resolution**: How does their situation improve? What's their new reality?

Encourage narrative format with specific user details, emotional journey, and clear before/after contrast

### 3. Guide Journey Exploration

For each journey, facilitate detailed exploration:
- What happens at each step specifically?
- What could go wrong? What's the recovery path?
- What information do they need to see/hear?
- What's their emotional state at each point?
- Where does this journey succeed or fail?

### 4. Connect Journeys to Requirements

After each journey, explicitly state:
- This journey reveals requirements for specific capability areas
- Help user see how different journeys create different feature sets
- Connect journey needs to concrete capabilities (onboarding, dashboards, notifications, etc.)

### 5. Aim for Comprehensive Coverage

Guide toward complete journey set:

- **Primary user** - happy path (core experience)
- **Primary user** - edge case (different goal, error recovery)
- **Secondary user** (admin, moderator, support, etc.)
- **API consumer** (if applicable)

Ask if additional journeys are needed to cover uncovered user types

### 6. Generate User Journey Content

Prepare the content to append to the document:

#### Content Structure:

When saving to document, append these Level 2 and Level 3 sections:

```markdown
## User Journeys

[All journey narratives based on conversation]

### Journey Requirements Summary

[Summary of capabilities revealed by journeys based on conversation]
```

### 7. Present MENU OPTIONS

Present the user journey content for review, then display menu:
- Show the mapped user journeys (using structure from section 6)
- Highlight how each journey reveals different capabilities
- Ask if they'd like to refine further, get other perspectives, or proceed

Display: "**Select:** [A] Advanced Elicitation [P] Party Mode [AR] Adversarial Review [PL] Party Mode Loop [AL] Adversarial Review Loop [C] Continue to Domain Requirements (Step 5 of 11)"

#### Menu Handling Logic:
- IF A: Read fully and follow: {advancedElicitationTask} with the current journey content, process the enhanced journey insights that come back, ask user "Accept these improvements to the user journeys? (y/n)", if yes update content with improvements then redisplay menu, if no keep original content then redisplay menu
- IF P: Read fully and follow: {partyModeWorkflow} with the current journeys, process the collaborative journey improvements and additions, ask user "Accept these changes to the user journeys? (y/n)", if yes update content with improvements then redisplay menu, if no keep original content then redisplay menu
    - IF PL: Prompt user for loops N, then execute {project-root}/_arcwright/core/tasks/review-party-loop.xml with loops=N, then redisplay menu
    - IF AL: Prompt user for loops N, then execute {project-root}/_arcwright/core/tasks/review-adversarial-loop.xml with loops=N, then redisplay menu
- IF AR: Execute {project-root}/_arcwright/core/tasks/review-adversarial-general.xml — pass the current editPlan (or plan document in context) as the content to review; display findings with recommendations; then redisplay this menu
- IF C: Append the final content to {outputFile}, update frontmatter by adding this step name to the end of the stepsCompleted array, then read fully and follow: {nextStepFile}
- IF Any other: help user respond, then redisplay menu

DO NOT halt after presenting the menu if you have finished generating the content. You should automatically assume 'C' and proceed to {nextStepFile} unless the user explicitly interrupts. After other menu items execution, return to this menu.

## APPEND TO DOCUMENT:

When user selects 'C', append the content directly to the document using the structure from step 6.

## JOURNEY TYPES TO ENSURE:

**Minimum Coverage:**

1. **Primary User - Success Path**: Core experience journey
2. **Primary User - Edge Case**: Error recovery, alternative goals
3. **Admin/Operations User**: Management, configuration, monitoring
4. **Support/Troubleshooting**: Help, investigation, issue resolution
5. **API/Integration** (if applicable): Developer/technical user journey
