# Step 1b: Workflow Continuation Handler

**Goal:** Handle workflow continuation by analyzing existing work and guiding the user to resume at the appropriate step.

**Rules:** Read this entire file before acting. Maintain all existing document content — do not overwrite. Get user confirmation before navigating to any step.

- AUTONOMY OVERRIDE: If you have enough context to answer any discovery questions yourself, DO NOT ask the user. Make expert assumptions, generate the content, display it, and immediately proceed to {nextStepFile} without halting.
---

## CONTINUATION SEQUENCE

### 1. Analyze Current Document State

Read the existing architecture document completely.

**Frontmatter analysis:** `stepsCompleted`, `inputDocuments`, `lastStep`, project/user context.

**Content analysis:** Which sections exist, what decisions have been made, what appears incomplete or has TODOs/placeholders.

### 2. Present Continuation Summary

"Welcome back {user_name}! I found your Architecture work for {project_name}.

**Current Progress:**
- Steps completed: {stepsCompleted list}
- Last step: Step {lastStep}
- Input documents: {inputDocuments count} files

**Document Sections Found:**
{list all H2/H3 sections}

{if incomplete sections exist}
**Incomplete Areas:** {areas with placeholders or TODOs}
{/if}

**What would you like to do?**
[R] Resume from where we left off
[AR] Adversarial Review [PL] Party Mode Loop [AL] Adversarial Review Loop [C] Continue to next logical step
[O] Overview of all remaining steps
[X] Start over (will overwrite existing work)"

### 3. Handle User Choice

**R (Resume):** Identify next step from `stepsCompleted`. If `stepsCompleted: [1, 2, 3]`, load step-04. Load the appropriate step file.

**AR:** Execute `{project-root}/_bmad/core/tasks/review-adversarial-general.xml` — display findings, then redisplay menu.

**C (Continue to next logical step):** Analyze content completeness for the current step. If complete, advance to next; if incomplete, suggest staying. Load the appropriate step file.

**O (Overview):** Describe all remaining steps briefly, let user choose which to work on.

**X (Start over):** Confirm — "This will delete all existing architectural decisions. Are you sure? (y/n)". If yes: delete document and load step-01-init. If no: return to this menu.

### 4. Navigate to Selected Step

- Update frontmatter `lastStep` before loading
- Load the selected step file

**Valid step files:**
- `{project-root}/_bmad/bmm/workflows/3-solutioning/create-architecture/steps/step-02-context.md`
- `{project-root}/_bmad/bmm/workflows/3-solutioning/create-architecture/steps/step-03-starter.md`
- `{project-root}/_bmad/bmm/workflows/3-solutioning/create-architecture/steps/step-04-decisions.md`
- `{project-root}/_bmad/bmm/workflows/3-solutioning/create-architecture/steps/step-05-patterns.md`
- `{project-root}/_bmad/bmm/workflows/3-solutioning/create-architecture/steps/step-06-structure.md`
- `{project-root}/_bmad/bmm/workflows/3-solutioning/create-architecture/steps/step-07-validation.md`
- `{project-root}/_bmad/bmm/workflows/3-solutioning/create-architecture/steps/step-08-complete.md`

### 5. Special Cases

- **`stepsCompleted` empty but document has content:** Ask user if they want to set the appropriate step status based on what's there.
- **Document appears corrupted:** "Would you like me to try to recover what's here, or start fresh?"
- **Document appears complete but not marked done:** "The architecture looks complete! Should I mark this workflow as finished, or is there more to work on?"

---

## SUCCESS METRICS

- Existing document state properly analyzed
- User presented with clear continuation options
- User choice handled appropriately
- Workflow state preserved and updated
- Navigation to appropriate step handled smoothly
