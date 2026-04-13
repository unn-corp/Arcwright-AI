---
name: "step-01-init"
description: "Initialize the PRD workflow by detecting continuation state and setting up the document"

# File References
nextStepFile: "./step-02-discovery.md"
continueStepFile: "./step-01b-continue.md"
outputFile: "{planning_artifacts}/prd.md"

# Template Reference
prdTemplate: "../templates/prd-template.md"
---

## Step 0: Load writing-skills

Invoke `writing-skills` now. Do not proceed to Step 1 until writing-skills is loaded.

---

# Step 1: Workflow Initialization

**Progress: Step 1 of 11** - Next: Project Discovery

## YOUR TASK

Initialize the PRD workflow by detecting continuation state, discovering input documents, and setting up the document structure for collaborative product requirement discovery.

### Step-Specific Rules
- AUTONOMY OVERRIDE: If you have enough context to answer any discovery questions yourself, DO NOT ask the user. Make expert assumptions, generate the content, display it, and immediately proceed to {nextStepFile} without halting.

- Focus only on initialization and setup — no content generation yet
- FORBIDDEN to look ahead to future steps or assume knowledge from them
- Detect existing workflow state and handle continuation properly

## Sequence of Instructions (Do not deviate, skip, or optimize)

### 1. Check for Existing Workflow State

First, check if the output document already exists:

**Workflow State Detection:**

- Look for file at `{outputFile}`
- If exists, read the complete file including frontmatter
- If not exists, this is a fresh workflow

### 2. Handle Continuation (If Document Exists)

If the document exists and has frontmatter with `stepsCompleted` BUT `step-11-complete` is NOT in the list, follow the Continuation Protocol since the document is incomplete:

**Continuation Protocol:**

- **STOP immediately** and load `{continueStepFile}`
- Do not proceed with any initialization tasks
- Let step-01b handle all continuation logic
- This is an auto-proceed situation - no user choice needed

### 3. Fresh Workflow Setup (If No Document)

If no document exists or no `stepsCompleted` in frontmatter:

#### A. Input Document Discovery

Discover and load context documents using smart discovery. Documents can be in the following locations:

- {planning_artifacts}/\*\*
- {output_folder}/\*\*
- {product_knowledge}/\*\*
- docs/\*\*

Also - when searching - documents can be a single markdown file, or a folder with an index and multiple files. For Example, if searching for `*foo*.md` and not found, also search for a folder called _foo_/index.md (which indicates sharded content)

Try to discover the following:

- Product Brief (`*brief*.md`)
- Research Documents (`/*research*.md`)
- Project Documentation (generally multiple documents might be found for this in the `{product_knowledge}` or `docs` folder.)
- Project Context (`**/project-context.md`)

<critical>Confirm what you have found with the user, along with asking if the user wants to provide anything else. Only after this confirmation will you proceed to follow the loading rules</critical>

**Loading Rules:**

- Load ALL discovered files completely that the user confirmed or provided (no offset/limit)
- If there is a project context, whatever is relevant should try to be biased in the remainder of this whole workflow process
- For sharded folders, load ALL files to get complete picture, using the index first to potentially know the potential of each document
- index.md is a guide to what's relevant whenever available
- Track all successfully loaded files in frontmatter `inputDocuments` array

#### B. Create Initial Document

**Document Setup:**

- Copy the template from `{prdTemplate}` to `{outputFile}`
- Initialize frontmatter with proper structure including inputDocuments array.

#### C. Present Initialization Results

**Setup Report to User:**

"Welcome {{user_name}}! I've set up your PRD workspace for {{project_name}}.

**Document Setup:**

- Created: `{outputFile}` from template
- Initialized frontmatter with workflow state

**Input Documents Discovered:**

- Product briefs: {{briefCount}} files {if briefCount > 0}✓ loaded{else}(none found){/if}
- Research: {{researchCount}} files {if researchCount > 0}✓ loaded{else}(none found){/if}
- Brainstorming: {{brainstormingCount}} files {if brainstormingCount > 0}✓ loaded{else}(none found){/if}
- Project docs: {{projectDocsCount}} files {if projectDocsCount > 0}✓ loaded (brownfield project){else}(none found - greenfield project){/if}

**Files loaded:** {list of specific file names or "No additional documents found"}

{if projectDocsCount > 0}
📋 **Note:** This is a **brownfield project**. Your existing project documentation has been loaded. In the next step, I'll ask specifically about what new features or changes you want to add to your existing system.
{/if}

Do you have any other documents you'd like me to include, or shall we continue to the next step?"

### 4. Present MENU OPTIONS

Display menu after setup report:

"[AR] Adversarial Review [PL] Party Mode Loop [AL] Adversarial Review Loop [C] Continue - Save this and move to Project Discovery (Step 2 of 11) [Parallel] Parallel Document Gen - Spawn Analyst and Tech Writer to draft sections concurrently"

#### Menu Handling Logic:

    - IF PL: Prompt user for loops N, then execute {project-root}/_arcwright/core/tasks/review-party-loop.xml with loops=N, then redisplay menu
    - IF AL: Prompt user for loops N, then execute {project-root}/_arcwright/core/tasks/review-adversarial-loop.xml with loops=N, then redisplay menu
- IF AR: Execute {project-root}/\_arcwright/core/tasks/review-adversarial-general.xml — pass the current editPlan (or plan document in context) as the content to review; display findings with recommendations; then redisplay this menu
- IF C: Update output file frontmatter, adding this step name to the end of the list of stepsCompleted, then read fully and follow: {nextStepFile}
- IF Parallel: Instruct the orchestrator (master-orchestrator) to spawn the PM Agent, Analyst Agent, and Tech Writer Agent in parallel according to the Parallel Document Generation Protocol. Display the exact command: "Spawn three teammate agents in parallel to draft this PRD. Teammate 1 (PM): draft Core/Business; Teammate 2 (Analyst): draft Market/Domain; Teammate 3 (Tech Writer): draft NFRs/Glossary."
- IF user provides additional files: Load them, update inputDocuments and documentCounts, redisplay report
- IF user asks questions: Answer and redisplay menu

DO NOT halt after generating the content. Automatically append the content and proceed to {nextStepFile}. ONLY proceed to next step when user selects 'C' or 'Parallel'.
