---
name: 'step-07-project-type'
description: 'Conduct project-type specific discovery using CSV-driven guidance'

# File References
nextStepFile: '{project-root}/_arcwright/awm/workflows/2-plan-workflows/create-prd/steps-c/step-08-scoping.md'
outputFile: '{planning_artifacts}/prd.md'

# Data Files
projectTypesCSV: '../data/project-types.csv'

# Task References
advancedElicitationTask: '{project-root}/_arcwright/core/workflows/advanced-elicitation/workflow.xml'
partyModeWorkflow: '{project-root}/_arcwright/core/workflows/party-mode/workflow.md'
---

# Step 7: Project-Type Deep Dive

**Progress: Step 7 of 11** - Next: Scoping

## YOUR TASK

Conduct project-type specific discovery using CSV-driven guidance to define technical requirements.

### Step-Specific Rules
- AUTONOMY OVERRIDE: If you have enough context to answer any discovery questions yourself, DO NOT ask the user. Make expert assumptions, generate the content, display it, and immediately proceed to {nextStepFile} without halting.

- Focus on project-type specific requirements and technical considerations
- DATA-DRIVEN: Use CSV configuration to guide discovery

## PROJECT-TYPE DISCOVERY SEQUENCE:

### 1. Load Project-Type Configuration Data

**Attempt subprocess data lookup:**

"Your task: Lookup data in {projectTypesCSV}

**Search criteria:**
- Find row where project_type matches {{projectTypeFromStep02}}

**Return format:**
Return ONLY the matching row as a YAML-formatted object with these fields:
project_type, key_questions, required_sections, skip_sections, innovation_signals

**Do NOT return the entire CSV - only the matching row.**"

**Graceful degradation (if Task tool unavailable):**
- Load the CSV file directly
- Find the matching row manually
- Extract required fields:
  - `key_questions` (semicolon-separated list of discovery questions)
  - `required_sections` (semicolon-separated list of sections to document)
  - `skip_sections` (semicolon-separated list of sections to skip)
  - `innovation_signals` (already explored in step-6)

### 2. Conduct Guided Discovery Using Key Questions

Parse `key_questions` from CSV and explore each:

#### Question-Based Discovery:

For each question in `key_questions` from CSV:

- Ask the user naturally in conversational style
- Listen for their response and ask clarifying follow-ups
- Connect answers to product value proposition

**Example Flow:**
If key_questions = "Endpoints needed?;Authentication method?;Data formats?;Rate limits?;Versioning?;SDK needed?"

Ask naturally:

- "What are the main endpoints your API needs to expose?"
- "How will you handle authentication and authorization?"
- "What data formats will you support for requests and responses?"

### 3. Document Project-Type Specific Requirements

Based on user answers to key_questions, synthesize comprehensive requirements:

#### Requirement Categories:

Cover the areas indicated by `required_sections` from CSV:

- Synthesize what was discovered for each required section
- Document specific requirements, constraints, and decisions
- Connect to product differentiator when relevant

#### Skip Irrelevant Sections:

Skip areas indicated by `skip_sections` from CSV to avoid wasting time on irrelevant aspects.

### 4. Generate Dynamic Content Sections

Parse `required_sections` list from the matched CSV row. For each section name, generate corresponding content:

#### Common CSV Section Mappings:

- "endpoint_specs" or "endpoint_specification" → API endpoints documentation
- "auth_model" or "authentication_model" → Authentication approach
- "platform_reqs" or "platform_requirements" → Platform support needs
- "device_permissions" or "device_features" → Device capabilities
- "tenant_model" → Multi-tenancy approach
- "rbac_matrix" or "permission_matrix" → Permission structure

#### Template Variable Strategy:

- For sections matching common template variables: generate specific content
- For sections without template matches: include in main project_type_requirements
- Hybrid approach balances template structure with CSV-driven flexibility

### 5. Generate Project-Type Content

Prepare the content to append to the document:

#### Content Structure:

When saving to document, append these Level 2 and Level 3 sections:

```markdown
## [Project Type] Specific Requirements

### Project-Type Overview

[Project type summary based on conversation]

### Technical Architecture Considerations

[Technical architecture requirements based on conversation]

[Dynamic sections based on CSV and conversation]

### Implementation Considerations

[Implementation specific requirements based on conversation]
```

### 6. Present MENU OPTIONS

"Based on our conversation and best practices for this product type, I've documented the {project_type}-specific requirements for {{project_name}}.

**Here's what I'll add to the document:**

[Show the complete markdown content from section 5]

**What would you like to do?**"

Display: "**Select:** [A] Advanced Elicitation [P] Party Mode [AR] Adversarial Review [PL] Party Mode Loop [AL] Adversarial Review Loop [C] Continue to Scoping (Step 8 of 11)"

#### Menu Handling Logic:
- IF A: Read fully and follow: {advancedElicitationTask} with the current project-type content, process the enhanced technical insights that come back, ask user "Accept these improvements to the technical requirements? (y/n)", if yes update content with improvements then redisplay menu, if no keep original content then redisplay menu
- IF P: Read fully and follow: {partyModeWorkflow} with the current project-type requirements, process the collaborative technical expertise and validation, ask user "Accept these changes to the technical requirements? (y/n)", if yes update content with improvements then redisplay menu, if no keep original content then redisplay menu
    - IF PL: Prompt user for loops N, then execute {project-root}/_arcwright/core/tasks/review-party-loop.xml with loops=N, then redisplay menu
    - IF AL: Prompt user for loops N, then execute {project-root}/_arcwright/core/tasks/review-adversarial-loop.xml with loops=N, then redisplay menu
- IF AR: Execute {project-root}/_arcwright/core/tasks/review-adversarial-general.xml — pass the current editPlan (or plan document in context) as the content to review; display findings with recommendations; then redisplay this menu
- IF C: Append the final content to {outputFile}, update frontmatter by adding this step name to the end of the stepsCompleted array, then read fully and follow: {nextStepFile}
- IF Any other: help user respond, then redisplay menu

DO NOT halt after presenting the menu if you have finished generating the content. You should automatically assume 'C' and proceed to {nextStepFile} unless the user explicitly interrupts. After other menu items execution, return to this menu.

## APPEND TO DOCUMENT:

When user selects 'C', append the content directly to the document using the structure from previous steps.

## PROJECT-TYPE EXAMPLES:

**For api_backend:**

- Focus on endpoints, authentication, data schemas, rate limiting
- Skip visual design and user journey sections
- Generate API specification documentation

**For mobile_app:**

- Focus on platform requirements, device permissions, offline mode
- Skip API endpoint documentation unless needed
- Generate mobile-specific technical requirements

**For saas_b2b:**

- Focus on multi-tenancy, permissions, integrations
- Skip mobile-first considerations unless relevant
- Generate enterprise-specific requirements
