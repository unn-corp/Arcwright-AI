---
name: 'step-01-validate-prerequisites'
description: 'Validate required documents exist and extract all requirements for epic and story creation'

# Path Definitions
workflow_path: '{project-root}/_bmad/bmm/workflows/3-solutioning/create-epics-and-stories'

# File References
thisStepFile: './step-01-validate-prerequisites.md'
nextStepFile: './step-02-design-epics.md'
workflowFile: '{workflow_path}/workflow.md'
outputFile: '{planning_artifacts}/epics.md'
epicsTemplate: '{workflow_path}/templates/epics-template.md'

# Task References
advancedElicitationTask: '{project-root}/_bmad/core/workflows/advanced-elicitation/workflow.xml'
partyModeWorkflow: '{project-root}/_bmad/core/workflows/party-mode/workflow.md'

# Template References
epicsTemplate: '{workflow_path}/templates/epics-template.md'
---

## Step 0: Load writing-skills

Invoke `writing-skills` now. Do not proceed to Step 1 until writing-skills is loaded.

---

# Step 1: Validate Prerequisites and Extract Requirements

**Goal:** Validate required input documents exist and extract all requirements (FRs, NFRs, additional) needed for epic and story creation.

**Rules:** Read this entire file before acting. Focus only on requirements extraction — do not create epics or stories here.

---

## REQUIREMENTS EXTRACTION PROCESS

### 1. Welcome and Prerequisites

Welcome {user_name} to epic and story creation.

**Required documents:**

1. **PRD.md** — Contains FRs, NFRs, and product scope
2. **Architecture.md** — Technical decisions, API contracts, data models
3. **UX Design.md** — Interaction patterns, user flows

### 2. Document Discovery

Search for required documents (a sharded document is a folder with `index.md`; prefer whole document over sharded):

**PRD:** `{planning_artifacts}/*prd*.md` or `{planning_artifacts}/*prd*/index.md`
**Architecture:** `{planning_artifacts}/*architecture*.md` or `{planning_artifacts}/*architecture*/index.md`
**UX Design:** `{planning_artifacts}/*ux*.md` or `{planning_artifacts}/*ux*/index.md`

Ask the user if there are other documents to include or if anything found should be excluded. **Wait for user confirmation.** Once confirmed, create {outputFile} from {epicsTemplate} and list confirmed files in frontmatter `inputDocuments: []`.

### 3. Extract Functional Requirements (FRs)

Read the entire PRD and extract all FRs — numbered statements describing what the system must DO (user actions, system behaviors, business rules).

Format: `FR1: [Clear, testable requirement]`

### 4. Extract Non-Functional Requirements (NFRs)

From the PRD, extract performance, security, usability, reliability, and compliance requirements.

Format: `NFR1: [Quality/constraint requirement]`

### 5. Extract Requirements from Architecture

Review Architecture for technical requirements affecting epic/story creation:

- **Starter Template** — If specified, note prominently (impacts Epic 1 Story 1)
- Infrastructure, deployment, integration, migration, monitoring, security implementation requirements

Format: `- [Technical requirement from Architecture]`

### 6. Extract Requirements from UX (if exists)

From UX document: responsive design, accessibility, browser/device compatibility, interaction patterns, animation requirements, error handling UX.

Add to Additional Requirements list.

### 7. Initialize Template

Copy {epicsTemplate} to {outputFile}:

1. Replace `{{project_name}}` with actual project name
2. Replace `{{fr_list}}` with extracted FRs
3. Replace `{{nfr_list}}` with extracted NFRs
4. Replace `{{additional_requirements}}` with extracted additional requirements
5. Leave `{{requirements_coverage_map}}` and `{{epics_list}}` as placeholders

### 8. Present Extracted Requirements and Get Confirmation

Display to user:

- FR count with first few examples — ask if any are missing/incorrect
- Key NFRs — ask if any constraints were missed
- Summary of Architecture/UX requirements — verify completeness

Ask: **"Do these extracted requirements accurately represent what needs to be built? Any additions or corrections?"**

Update requirements based on user feedback until confirmed.

### 9. Save and Present Menu

After confirmation, update {outputFile} with the complete FR, NFR, and additional requirements lists.

Display: **`Confirm the Requirements are complete and correct to [C] continue:`**

**Menu handling:**

- **C:** Save all to {outputFile}, update frontmatter, then read fully and follow: {nextStepFile}
- **Any other input:** Respond to the question/comment, then redisplay this menu

Always halt and wait for user input at this menu.

---

## SUCCESS METRICS

- All required documents found and validated
- All FRs and NFRs extracted and correctly formatted
- Additional requirements from Architecture/UX identified
- Template initialized with requirements
- User confirms requirements are complete and accurate
