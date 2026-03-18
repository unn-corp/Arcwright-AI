# Step 1B: UX Design Workflow Continuation

Resume the UX design workflow from where it was left off.

## CONTINUATION SEQUENCE

### 1. Analyze Current State

Review the frontmatter to understand:
- `stepsCompleted`: Which steps are already done
- `lastStep`: The most recently completed step number
- `inputDocuments`: What context was already loaded
- All other frontmatter variables

### 2. Load All Input Documents

Reload each document listed in `inputDocuments` completely. Do not discover new documents — only reload what was previously processed.

### 3. Summarize Current Progress

"Welcome back {{user_name}}! I'm resuming our UX design collaboration for {{project_name}}.

**Current Progress:**
- Steps completed: {stepsCompleted}
- Last worked on: Step {lastStep}
- Context documents available: {len(inputDocuments)} files

**Document Status:**
- Current UX design document is ready with all completed sections

Does this look right, or do you want to make any adjustments before we proceed?"

### 4. Determine Next Step

Based on `lastStep` value, determine which step to load next:
- If `lastStep = 1` → Load step-02-discovery.md
- If `lastStep = 2` → Load step-03-core-experience.md
- If `lastStep = 3` → Load step-04-emotional-response.md
- Continue this pattern for all steps
- If `lastStep` indicates final step → Workflow already complete (see below)

### 5. Present Continuation Options

"Ready to continue with Step {nextStepNumber}: {nextStepTitle}?

[AR] Adversarial Review [C] Continue to Step {nextStepNumber}"

After user selects [C], load the appropriate next step file.

## WORKFLOW ALREADY COMPLETE?

If `lastStep` indicates the final step is completed:

"Great news! It looks like we've already completed the UX design workflow for {{project_name}}.

The final UX design specification is ready at `{output_folder}/ux-design-specification.md` with all sections completed through step {finalStepNumber}.

Would you like me to:
- Review the completed UX design specification with you
- Suggest next workflow steps (like wireframe generation or architecture)
- Start a new UX design revision

What would be most helpful?"
