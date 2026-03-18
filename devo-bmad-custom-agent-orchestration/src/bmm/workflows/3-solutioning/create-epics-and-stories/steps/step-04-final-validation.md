---
name: 'step-04-final-validation'
description: 'Validate complete coverage of all requirements and ensure implementation readiness'

# Path Definitions
workflow_path: '{project-root}/_bmad/bmm/workflows/3-solutioning/create-epics-and-stories'

# File References
thisStepFile: './step-04-final-validation.md'
workflowFile: '{workflow_path}/workflow.md'
outputFile: '{planning_artifacts}/epics.md'

# Task References
advancedElicitationTask: '{project-root}/_bmad/core/workflows/advanced-elicitation/workflow.xml'
partyModeWorkflow: '{project-root}/_bmad/core/workflows/party-mode/workflow.md'

# Template References
epicsTemplate: '{workflow_path}/templates/epics-template.md'
---

# Step 4: Final Validation

**Goal:** Validate complete requirements coverage and confirm stories are ready for development. This step is automated — run all checks and fix any issues found, then auto-proceed to completion.

---

## VALIDATION PROCESS

Run all checks sequentially. Fix any issues found before finalizing.

### 1. FR Coverage Validation

Go through each FR from the Requirements Inventory — verify it appears in at least one story with acceptance criteria that fully address it. No FRs may be uncovered.

### 2. Architecture Implementation Validation

**Starter template check:** If Architecture specifies a starter template, Epic 1 Story 1 must be "Set up initial project from starter template."

**Database validation:** Tables/entities must be created only when first needed by a story — not all upfront in Epic 1.

### 3. Story Quality Validation

Each story must:
- Be completable by a single dev agent
- Have clear acceptance criteria
- Have no forward dependencies (can only depend on previous stories)
- Be implementable without waiting for future stories

### 4. Epic Structure Validation

- Epics deliver user value, not technical milestones
- Dependencies flow naturally
- No big upfront technical work

### 5. Dependency Validation

**Epic independence:** Each epic delivers complete functionality for its domain. Epic 2 must not require Epic 3 to function.

**Within-epic story order:** Story N.2 uses only Story N.1 output; Story N.3 uses only Stories N.1 and N.2 outputs. No story references features not yet implemented.

### 6. Fix Issues and Finalize

If any validation fails, fix the issue in {outputFile} before proceeding.

When all validations pass:
- Update any remaining placeholders
- Ensure proper formatting
- Save the final {outputFile}

### 7. Complete

Write the validated output to {outputFile}, update frontmatter, then immediately load and execute: `{project-root}/_bmad/core/tasks/help.md`

Upon completion, offer to answer any questions about the Epics and Stories.

---

## SUCCESS METRICS

- All FRs covered by at least one story
- No forward story dependencies
- Epics deliver user value
- Starter template handled in Epic 1 Story 1 (if applicable)
- Document finalized and ready for development
