---
name: 'step-01b-continue'
description: 'Resume the product brief workflow from where it was left off, ensuring smooth continuation'

# File References
outputFile: '{planning_artifacts}/product-brief-{{project_name}}-{{date}}.md'
---

# Step 1B: Product Brief Continuation

## STEP GOAL:

Resume the product brief workflow from where it was left off, ensuring smooth continuation with full context restoration.

## Step-Specific Rules:

- Focus only on understanding where we left off and continuing appropriately
- FORBIDDEN to modify content completed in previous steps
- FORBIDDEN to discover new input documents during continuation — only reload what was previously processed

## Sequence of Instructions (Do not deviate, skip, or optimize)

### 1. Analyze Current State

**State Assessment:**
Review the frontmatter to understand:

- `stepsCompleted`: Which steps are already done
- `lastStep`: The most recently completed step number
- `inputDocuments`: What context was already loaded
- All other frontmatter variables

### 2. Restore Context Documents

**Context Reloading:**

- For each document in `inputDocuments`, load the complete file
- This ensures you have full context for continuation
- Don't discover new documents - only reload what was previously processed
- Maintain the same context as when workflow was interrupted

### 3. Present Current Progress

**Progress Report to User:**
"Welcome back {{user_name}}! I'm resuming our product brief collaboration for {{project_name}}.

**Current Progress:**

- Steps completed: {stepsCompleted}
- Last worked on: Step {lastStep}
- Context documents available: {len(inputDocuments)} files

**Document Status:**

- Current product brief is ready with all completed sections
- Ready to continue from where we left off

Does this look right, or do you want to make any adjustments before we proceed?"

### 4. Determine Continuation Path

**Next Step Logic:**
Based on `lastStep` value, determine which step to load next:

- If `lastStep = 1` → Load `{project-root}/_bmad/bmm/workflows/1-analysis/create-product-brief/steps/step-02-vision.md`
- If `lastStep = 2` → Load `{project-root}/_bmad/bmm/workflows/1-analysis/create-product-brief/steps/step-03-users.md`
- If `lastStep = 3` → Load `{project-root}/_bmad/bmm/workflows/1-analysis/create-product-brief/steps/step-04-metrics.md`
- Continue this pattern for all steps
- If `lastStep = 6` → Workflow already complete

### 5. Handle Workflow Completion

**If workflow already complete (`lastStep = 6`):**
"Great news! It looks like we've already completed the product brief workflow for {{project_name}}.

The final document is ready at `{outputFile}` with all sections completed through step 6.

Would you like me to:

- Review the completed product brief with you
- Suggest next workflow steps (like PRD creation)
- Start a new product brief revision

What would be most helpful?"

### 6. Present MENU OPTIONS

**If workflow not complete:**
Display: "Ready to continue with Step {nextStepNumber}: {nextStepTitle}?

**Select an Option:** [AR] Adversarial Review [C] Continue to Step {nextStepNumber}"

#### Menu Handling Logic:

- IF AR: Execute {project-root}/_bmad/core/tasks/review-adversarial-general.xml — pass the current editPlan (or plan document in context) as the content to review; display findings with recommendations; then redisplay this menu
- IF C: Read fully and follow the appropriate next step file based on `lastStep`
- IF Any other comments or queries: respond and redisplay menu

#### EXECUTION RULES:

- ALWAYS halt and wait for user input after presenting menu
- ONLY proceed to next step when user selects 'C'
- User can chat or ask questions about current progress

## NEXT STEP:

When user selects 'C' and current state is confirmed, read fully and follow the appropriate next step file to resume the workflow.
