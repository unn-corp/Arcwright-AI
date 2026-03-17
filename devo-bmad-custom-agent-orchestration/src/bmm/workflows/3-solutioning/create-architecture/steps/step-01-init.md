## Step 0: Load writing-skills

Invoke `writing-skills` now. Do not proceed to Step 1 until writing-skills is loaded.

---

# Step 1: Architecture Workflow Initialization

**Goal:** Detect continuation state, discover input documents, and set up the architecture document for collaborative decision making.

**Rules:** Read this entire file before acting. Focus only on initialization — do not make architectural decisions here. Show analysis before taking action.

- AUTONOMY OVERRIDE: If you have enough context to answer any discovery questions yourself, DO NOT ask the user. Make expert assumptions, generate the content, display it, and immediately proceed to {nextStepFile} without halting.
---

## INITIALIZATION SEQUENCE

### 1. Check for Existing Workflow

Look for `{planning_artifacts}/*architecture*.md`. If found with `stepsCompleted` in frontmatter, **immediately load and follow** `{project-root}/_bmad/bmm/workflows/3-solutioning/create-architecture/steps/step-01b-continue.md` — do not proceed with fresh initialization.

### 2. Fresh Workflow Setup

If no document exists or no `stepsCompleted` in frontmatter:

**A. Input Document Discovery**

Search for documents in: `{planning_artifacts}/**`, `{output_folder}/**`, `{product_knowledge}/**`, `docs/**`

A sharded document is a folder with `index.md` — if `*foo*.md` not found, also check `*foo*/index.md`.

Discover:
- Product Brief (`*brief*.md`)
- PRD (`*prd*.md`)
- UX Design (`*ux-design*.md`)
- Research Documents (`*research*.md`)
- Project Documentation (in `{product_knowledge}` or `docs/`)
- Project Context (`**/project-context.md`)

**Confirm what you found with the user and ask if they want to provide anything else. Wait for confirmation before loading.**

**Loading rules:**
- Load ALL confirmed files completely (no offset/limit)
- For sharded folders, load ALL files (use index.md for structure)
- Track all loaded files in frontmatter `inputDocuments` array
- Bias toward project context rules throughout the workflow

**B. Validate Required Inputs**

- No PRD found: "Architecture requires a PRD. Please run the PRD workflow first or provide the PRD path." Do NOT proceed without PRD.
- UX Spec if present: noted as providing UI/UX architectural requirements.

**C. Create Initial Document**

Copy `{installed_path}/architecture-decision-template.md` to `{planning_artifacts}/architecture.md`.

**D. Report to User**

"Welcome {user_name}! I've set up your Architecture workspace for {project_name}.

**Documents Found:**
- PRD: {count or "None found - REQUIRED"}
- UX Design: {count or "None found"}
- Research: {count or "None found"}
- Project docs: {count or "None found"}
- Project context: {rule count}

**Files loaded:** {list of specific file names}

Ready to begin architectural decision making. Any other documents to include?

[AR] Adversarial Review [PL] Party Mode Loop [AL] Adversarial Review Loop [C] Continue to project context analysis"

**Menu handling:**
- **AR:** Execute `{project-root}/_bmad/core/tasks/review-adversarial-general.xml` — display findings, then redisplay menu
- **C:** After setup is confirmed, load `{project-root}/_bmad/bmm/workflows/3-solutioning/create-architecture/steps/step-02-context.md`

DO NOT halt after generating the content. Automatically append the content and proceed to {nextStepFile} unless the user explicitly interrupts.

---

## SUCCESS METRICS

- Existing workflow correctly detected and handed to step-01b
- Fresh workflow initialized with template and frontmatter
- Input documents discovered, confirmed, and loaded
- All loaded files tracked in frontmatter `inputDocuments`
- PRD requirement validated
- User confirmed document setup before proceeding
