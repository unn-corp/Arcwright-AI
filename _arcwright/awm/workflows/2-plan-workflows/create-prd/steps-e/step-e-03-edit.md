---
name: 'step-e-03-edit'
description: 'Edit & Update - Apply changes to PRD following approved change plan'

# File references (ONLY variables used in this step)
nextStepFile: './step-e-04-complete.md'
prdFile: '{prd_file_path}'
prdPurpose: '{project-root}/_arcwright/awm/workflows/2-plan-workflows/create-prd/data/prd-purpose.md'
---

# Step E-3: Edit & Update

## YOUR TASK

Apply changes to the PRD following the approved change plan from step e-02, including content updates, structure improvements, and format conversion if needed.

### Step-Specific Rules

- Focus ONLY on implementing approved changes from step e-02
- FORBIDDEN to make changes beyond the approved plan
- Approach: Methodical, section-by-section execution

## MANDATORY SEQUENCE

**CRITICAL:** Follow this sequence exactly. Do not skip, reorder, or improvise unless user explicitly requests a change.

### 1. Retrieve Approved Change Plan

From step e-02, retrieve:
- **Approved changes:** Section-by-section list
- **Priority order:** Sequence to apply changes
- **User requirements:** Edit goals from step e-01

Display: "**Starting PRD Edits**

**Change Plan:** {summary}
**Total Changes:** {count}
**Estimated Effort:** {effort level}

**Proceeding with edits section by section...**"

### 2. Attempt Sub-Process Edits (For Complex Changes)

**Try to use Task tool with sub-agent for major sections:**

"Execute PRD edits for {section_name}:

**Context:**
- Section to edit: {section_name}
- Current content: {existing content}
- Changes needed: {specific changes from plan}
- Arcwright PRD standards: Load from prd-purpose.md

**Tasks:**
1. Read current PRD section
2. Apply specified changes
3. Ensure Arcwright PRD principles compliance:
   - High information density (no filler)
   - Measurable requirements
   - Clear structure
   - Proper markdown formatting
4. Return updated section content

Apply changes and return updated section."

**Graceful degradation (if no Task tool):**
- Perform edits directly in current context
- Load PRD section, apply changes, save

### 3. Execute Changes Section-by-Section

**For each section in approved plan (in priority order):**

**a) Load current section**
- Read the current PRD section content
- Note what exists

**b) Apply changes per plan**
- Additions: Create new sections with proper content
- Updates: Modify existing content per plan
- Removals: Remove specified content
- Restructuring: Reformat content to Arcwright standard

**c) Update PRD file**
- Apply changes to PRD
- Save updated PRD
- Verify changes applied correctly

**Display progress after each section:**
"**Section Updated:** {section_name}
Changes: {brief summary}
{More sections remaining...}"

### 4. Handle Restructuring (If Needed)

**If conversion mode is "Full restructuring" or "Both":**

**For restructuring:**
- Reorganize PRD to Arcwright standard structure
- Ensure proper ## Level 2 headers
- Reorder sections logically
- Update PRD frontmatter to match Arcwright format

**Follow Arcwright PRD structure:**
1. Executive Summary
2. Success Criteria
3. Product Scope
4. User Journeys
5. Domain Requirements (if applicable)
6. Innovation Analysis (if applicable)
7. Project-Type Requirements
8. Functional Requirements
9. Non-Functional Requirements

Display: "**PRD Restructured**
Arcwright standard structure applied.
{Sections added/reordered}"

### 5. Update PRD Frontmatter

**Ensure frontmatter is complete and accurate:**

```yaml
---
workflowType: 'prd'
workflow: 'create'  # or 'validate' or 'edit'
classification:
  domain: '{domain}'
  projectType: '{project_type}'
  complexity: '{complexity}'
inputDocuments: [list of input documents]
stepsCompleted: ['step-e-01-discovery', 'step-e-02-review', 'step-e-03-edit']
lastEdited: '{current_date}'
editHistory:
  - date: '{current_date}'
    changes: '{summary of changes}'
---
```

**Update frontmatter accordingly.**

### 6. Final Review of Changes

**Load complete updated PRD**

**Verify:**
- All approved changes applied correctly
- PRD structure is sound
- No unintended modifications
- Frontmatter is accurate

**If issues found:**
- Fix them now
- Note corrections made

**If user wants adjustments:**
- Accept feedback and make adjustments
- Re-verify after adjustments

### 7. Confirm Completion

Display:

"**PRD Edits Complete**

**Changes Applied:** {count} sections modified
**PRD Updated:** {prd_file_path}

**Summary of Changes:**
{Brief bullet list of major changes}

**PRD is ready for:**
- Use in downstream workflows (UX, Architecture)
- Validation (if not yet validated)

**What would you like to do next?**"

### 8. Present MENU OPTIONS

**[V] Run Validation** - Execute full validation workflow (steps-v/step-v-01-discovery.md)
**[S] Summary Only** - End with summary of changes (no validation)
**[A] Adjust** - Make additional edits
**[X] Exit** - Exit edit workflow

Halt and wait for user selection.

#### Menu Handling Logic:

- IF V (Validate): Display "Starting validation workflow..." then read fully and follow: steps-v/step-v-01-discovery.md
- IF S (Summary): Present edit summary and exit
- IF A (Adjust): Accept additional requirements, loop back to editing
- IF X (Exit): Display summary and exit
