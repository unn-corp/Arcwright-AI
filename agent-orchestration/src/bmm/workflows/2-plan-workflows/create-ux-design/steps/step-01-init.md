## Step 0: Load writing-skills

Invoke `writing-skills` now. Do not proceed to Step 1 until writing-skills is loaded.

---

# Step 1: UX Design Workflow Initialization

Initialize the UX design workflow by detecting continuation state and setting up the design specification document.

## INITIALIZATION SEQUENCE

### 1. Check for Existing Workflow

Check if the output document already exists at `{planning_artifacts}/*ux-design-specification*.md`.

- If it exists and has frontmatter with `stepsCompleted`: **STOP** and load `{project-root}/_bmad/bmm/workflows/2-plan-workflows/create-ux-design/steps/step-01b-continue.md` immediately.
- If no document exists, proceed with fresh workflow setup below.

### 2. Fresh Workflow Setup

#### A. Input Document Discovery

Discover and load context documents from these locations: `{planning_artifacts}/**`, `{output_folder}/**`, `{product_knowledge}/**`, `docs/**`.

Documents can be a single markdown file or a folder with an index and multiple files. If searching for `*foo*.md` and not found, also search for a folder called `*foo*/index.md`.

Try to discover:
- Product Brief (`*brief*.md`)
- Research Documents (`*prd*.md`)
- Project Documentation (generally multiple documents in `{product_knowledge}` or `docs`)
- Project Context (`**/project-context.md`)

<critical>Confirm what you have found with the user, along with asking if the user wants to provide anything else. Only after this confirmation will you proceed to follow the loading rules.</critical>

**Loading Rules:**
- Load ALL confirmed files completely (no offset/limit)
- If there is a project context, bias the remainder of the workflow accordingly
- For sharded folders, load ALL files using the index first to understand each document
- Track all successfully loaded files in frontmatter `inputDocuments` array

#### B. Create Initial Document

Copy the template from `{installed_path}/ux-design-template.md` to `{planning_artifacts}/ux-design-specification.md` and initialize frontmatter.

#### C. Report to User

"Welcome {{user_name}}! I've set up your UX design workspace for {{project_name}}.

**Documents Found:**
- PRD: {number of PRD files loaded or "None found"}
- Product brief: {number of brief files loaded or "None found"}
- Other context: {number of other files loaded or "None found"}

**Files loaded:** {list of specific file names or "No additional documents found"}

Do you have any other documents you'd like me to include, or shall we continue to the next step?

[AR] Adversarial Review [C] Continue to UX discovery"

## NEXT STEP

After user selects [C]: ensure `{planning_artifacts}/ux-design-specification.md` has been created and saved with `stepsCompleted: [1]` in frontmatter, then load `{project-root}/_bmad/bmm/workflows/2-plan-workflows/create-ux-design/steps/step-02-discovery.md`.
