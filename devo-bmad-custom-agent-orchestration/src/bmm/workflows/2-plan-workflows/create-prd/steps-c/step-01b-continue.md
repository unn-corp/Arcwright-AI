---
name: 'step-01b-continue'
description: 'Resume an interrupted PRD workflow from the last completed step'

# File References
outputFile: '{planning_artifacts}/prd.md'
---

# Step 1B: Workflow Continuation

## YOUR TASK

Resume the PRD workflow from where it was left off, ensuring smooth continuation with full context restoration.

### Step-Specific Rules
- AUTONOMY OVERRIDE: If you have enough context to answer any discovery questions yourself, DO NOT ask the user. Make expert assumptions, generate the content, display it, and immediately proceed to {nextStepFile} without halting.

- FOCUS on understanding where we left off and continuing appropriately
- FORBIDDEN to modify content completed in previous steps
- Only reload documents that were already tracked in `inputDocuments`
- FORBIDDEN to discover new input documents during continuation

## Sequence of Instructions (Do not deviate, skip, or optimize)

### 1. Analyze Current State

**State Assessment:**
Review the frontmatter to understand:

- `stepsCompleted`: Array of completed step filenames
- Last element of `stepsCompleted` array: The most recently completed step
- `inputDocuments`: What context was already loaded
- All other frontmatter variables

### 2. Restore Context Documents

**Context Reloading:**

- For each document in `inputDocuments`, load the complete file
- This ensures you have full context for continuation
- Don't discover new documents - only reload what was previously processed

### 3. Determine Next Step

**Simplified Next Step Logic:**
1. Get the last element from the `stepsCompleted` array (this is the filename of the last completed step, e.g., "step-03-success.md")
2. Load that step file and read its frontmatter
3. Extract the `nextStepFile` value from the frontmatter
4. That's the next step to load!

**Example:**
- If `stepsCompleted = ["step-01-init.md", "step-02-discovery.md", "step-03-success.md"]`
- Last element is `"step-03-success.md"`
- Load `{project-root}/_bmad/bmm/workflows/2-plan-workflows/create-prd/steps-c/step-03-success.md`, read its frontmatter
- Read fully and follow: `{project-root}/_bmad/bmm/workflows/2-plan-workflows/create-prd/steps-c/step-04-journeys.md`

### 4. Handle Workflow Completion

**If `stepsCompleted` array contains `"step-11-complete.md"`:**
"Great news! It looks like we've already completed the PRD workflow for {{project_name}}.

The final document is ready at `{outputFile}` with all sections completed.

Would you like me to:

- Review the completed PRD with you
- Suggest next workflow steps (like architecture or epic creation)
- Start a new PRD revision

What would be most helpful?"

### 5. Present Current Progress

**If workflow not complete:**
"Welcome back {{user_name}}! I'm resuming our PRD collaboration for {{project_name}}.

**Current Progress:**
- Last completed: {last step filename from stepsCompleted array}
- Next up: {nextStepFile determined from that step's frontmatter}
- Context documents available: {len(inputDocuments)} files

**Document Status:**
- Current PRD document is ready with all completed sections
- Ready to continue from where we left off

Does this look right, or do you want to make any adjustments before we proceed?"

### 6. Present MENU OPTIONS

Display: "**Select an Option:** [AR] Adversarial Review [PL] Party Mode Loop [AL] Adversarial Review Loop [C] Continue to {next step name}"

#### Menu Handling Logic:

    - IF PL: Prompt user for loops N, then execute {project-root}/_bmad/core/tasks/review-party-loop.xml with loops=N, then redisplay menu
    - IF AL: Prompt user for loops N, then execute {project-root}/_bmad/core/tasks/review-adversarial-loop.xml with loops=N, then redisplay menu
- IF AR: Execute {project-root}/_bmad/core/tasks/review-adversarial-general.xml — pass the current editPlan (or plan document in context) as the content to review; display findings with recommendations; then redisplay this menu
- IF C: Read fully and follow the {nextStepFile} determined in step 3
- IF Any other comments or queries: respond and redisplay menu

DO NOT halt after presenting the menu if you have finished generating the content. You should automatically assume 'C' and proceed to {nextStepFile} unless the user explicitly interrupts.
