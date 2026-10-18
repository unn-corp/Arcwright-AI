---
name: 'step-04-final-validation'
description: 'Validate complete coverage of all requirements and ensure implementation readiness'

# Path Definitions
workflow_path: '{project-root}/_arcwright/awm/workflows/3-solutioning/create-epics-and-stories'

# File References
thisStepFile: './step-04-final-validation.md'
workflowFile: '{workflow_path}/workflow.md'
outputFile: '{planning_artifacts}/epics.md'

# Task References
advancedElicitationTask: '{project-root}/_arcwright/core/workflows/advanced-elicitation/workflow.xml'
partyModeWorkflow: '{project-root}/_arcwright/core/workflows/party-mode/workflow.md'

# Template References
epicsTemplate: '{workflow_path}/templates/epics-template.md'
---

# Step 4: Final Validation

**Goal:** Confirm complete requirements coverage and development readiness. Run checks, repair issues within the authorized scope, and auto-complete only when all required checks pass. Keep unresolved work explicitly draft.

---

## VALIDATION PROCESS

Set `{outputFile}` frontmatter `status: draft` before validation, including when revalidating an earlier final document. Track each required check by name and evidence: FR coverage, architecture/starter setup, database scope, story quality, epic value, and dependencies. Fix issues within the user's existing authorization and rerun affected checks. An unavailable required input is an open check, not a pass.

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

**Core-file churn diagnostic:** Compare the epics' intended components/files when known. If several epics repeatedly modify the same core files, assess whether the split earns its cost through risk reduction, intermediate feedback, or a context-size constraint. Record the overlap and rationale, or recommend consolidation. Shared filenames alone are not failure; do not invent a file plan or force consolidation. If no file map can be established, state that this diagnostic was not evaluated. It blocks finalization only when it exposes a real failed readiness/dependency check.

### 5. Dependency Validation

**Epic independence:** Each epic delivers complete functionality for its domain. Epic 2 must not require Epic 3 to function.

**Within-epic story order:** Story N.2 uses only Story N.1 output; Story N.3 uses only Stories N.1 and N.2 outputs. No story references features not yet implemented.

### 6. Fix Issues and Finalize

Persist unresolved required checks in `{outputFile}` frontmatter `openChecks`, each with a stable check name, missing evidence or defect, and what resolves it. Keep other frontmatter and document content intact. Use quoted YAML strings or block scalars for free text and verify the result remains parseable.

If a required check remains failed or unavailable after authorized repairs, save `status: draft`, report "epics.md saved as draft, N checks open", and list the open checks. End this validation without claiming development readiness or handing off as complete. Ask for input only when an actual unresolved decision/input is required; do not add a completion-confirmation gate.

When all validations pass:
- Update any remaining placeholders
- Ensure proper formatting
- Save the final {outputFile}
- Set `status: final` and `openChecks: []` only after every required check has passed

### 7. Complete

Only with `status: final`, write the validated output to {outputFile}, update frontmatter, then immediately load and execute: `{project-root}/_arcwright/core/tasks/help.md`. Existing authorization permits this automatic continuation; no extra confirmation is needed.

Upon completion, offer to answer any questions about the Epics and Stories.

---

## SUCCESS METRICS

- All FRs covered by at least one story
- No forward story dependencies
- Epics deliver user value
- Starter template handled in Epic 1 Story 1 (if applicable)
- Document finalized and ready for development
- Failed or unavailable required checks remain named in a saved draft

Draft-state and churn checks adapted from [BMAD v6.12.4 final validation](https://github.com/bmad-code-org/BMAD-METHOD/blob/bab9082c3e884e0d72c759bcd1a6d90bcc01be84/src/bmm-skills/plan/bmad-create-epics-and-stories/steps/step-04-final-validation.md), under [its license](../UPSTREAM-LICENSE). Arcwright retains automatic continuation.
