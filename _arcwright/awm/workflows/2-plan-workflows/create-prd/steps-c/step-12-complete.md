---
name: 'step-12-complete'
description: 'Complete the PRD workflow, update status files, and suggest next steps including validation'

# File References
outputFile: '{planning_artifacts}/prd.md'
validationFlow: '../steps-v/step-v-01-discovery.md'
---

# Step 12: Workflow Completion

**Final Step - Complete the PRD**

## YOUR TASK

Complete the PRD workflow, update status files, offer validation options, and suggest next steps for the project.

### Step-Specific Rules
- AUTONOMY OVERRIDE: If you have enough context to answer any discovery questions yourself, DO NOT ask the user. Make expert assumptions, generate the content, display it, and immediately proceed to {nextStepFile} without halting.

- THIS IS A FINAL STEP — workflow completion required
- NO content generation — this is a wrap-up step
- UPDATE workflow status files with completion information
- DO NOT load additional steps after this one

## WORKFLOW COMPLETION SEQUENCE:

### 1. Announce Workflow Completion

Inform user that the PRD is complete and polished:
- Celebrate successful completion of comprehensive PRD
- Summarize all sections that were created
- Highlight that document has been polished for flow and coherence
- Emphasize document is ready for downstream work

### 2. Workflow Status Update

Update the main workflow status file if there is one:

- Load `{status_file}` from workflow configuration (if exists)
- Update workflow_status["prd"] = "{default_output_file}"
- Save file, preserving all comments and structure
- Mark current timestamp as completion time

### 3. Validation Workflow Options

Offer validation workflows to ensure PRD is ready for implementation:

**Available Validation Workflows:**

**Option 1: Check Implementation Readiness** (`{checkImplementationReadinessWorkflow}`)
- Validates PRD has all information needed for development
- Checks epic coverage completeness
- Reviews UX alignment with requirements
- Assesses epic quality and readiness
- Identifies gaps before architecture/design work begins

**When to use:** Before starting technical architecture or epic breakdown

**Option 2: Skip for Now**
- Proceed directly to next workflows (architecture, UX, epics)
- Validation can be done later if needed
- Some teams prefer to validate during architecture reviews

### 4. Suggest Next Workflows

PRD complete. Read fully and follow: `{project-root}/_arcwright/core/tasks/help.md`

### 5. Final Completion Confirmation

- Confirm completion with user and summarize what has been accomplished
- Document now contains: Executive Summary, Success Criteria, User Journeys, Domain Requirements (if applicable), Innovation Analysis (if applicable), Project-Type Requirements, Functional Requirements (capability contract), Non-Functional Requirements, and has been polished for flow and coherence
- Ask if they'd like to run validation workflow or proceed to next workflows

## FINAL REMINDER to give the user:

The polished PRD serves as the foundation for all subsequent product development activities. All design, architecture, and development work should trace back to the requirements and vision documented in this PRD - update it also as needed as you continue planning.

**Congratulations on completing the Product Requirements Document for {{project_name}}!** 🎉
