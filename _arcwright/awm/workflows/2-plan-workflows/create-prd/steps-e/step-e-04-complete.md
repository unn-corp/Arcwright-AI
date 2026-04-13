---
name: 'step-e-04-complete'
description: 'Complete & Validate - Present options for next steps including full validation'

# File references (ONLY variables used in this step)
prdFile: '{prd_file_path}'
validationWorkflow: '../steps-v/step-v-01-discovery.md'
---

# Step E-4: Complete & Validate

## YOUR TASK

Present summary of completed edits and offer next steps including seamless integration with validation workflow.

### Step-Specific Rules

- Focus ONLY on presenting summary and options
- FORBIDDEN to make additional changes
- This is the final edit step — halt and wait for user selection after presenting menu

## MANDATORY SEQUENCE

**CRITICAL:** Follow this sequence exactly. Do not skip, reorder, or improvise unless user explicitly requests a change.

### 1. Compile Edit Summary

From step e-03 change execution, compile:

**Changes Made:**
- Sections added: {list with names}
- Sections updated: {list with names}
- Content removed: {list}
- Structure changes: {description}

**Edit Details:**
- Total sections affected: {count}
- Mode: {restructure/targeted/both}
- Priority addressed: {Critical/High/Medium/Low}

**PRD Status:**
- Format: {Arcwright Standard / Arcwright Variant / Legacy (converted)}
- Completeness: {assessment}
- Ready for: {downstream use cases}

### 2. Present Completion Summary

Display:

"**PRD Edit Complete**

**Updated PRD:** {prd_file_path}

**Changes Summary:**
{Present bulleted list of major changes}

**Edit Mode:** {mode}
**Sections Modified:** {count}

**PRD Format:** {format}

**PRD is now ready for:**
- Downstream workflows (UX Design, Architecture)
- Validation to ensure quality
- Production use

**What would you like to do next?**"

### 3. Present MENU OPTIONS

Display:

**[V] Run Full Validation** - Execute complete validation workflow (steps-v) to verify PRD quality
**[E] Edit More** - Make additional edits to the PRD
**[S] Summary** - End with detailed summary of changes
**[X] Exit** - Exit edit workflow

Halt and wait for user selection.

### 4. Menu Handling Logic

- **IF V (Run Full Validation):**
  - Display: "**Starting Validation Workflow**"
  - Display: "This will run all 13 validation checks on the updated PRD."
  - Display: "Preparing to validate: {prd_file_path}"
  - Display: "**Proceeding to validation...**"
  - Read fully and follow: {validationWorkflow} (steps-v/step-v-01-discovery.md)

- **IF E (Edit More):**
  - Display: "**Additional Edits**"
  - Ask: "What additional edits would you like to make?"
  - Accept input, then display: "**Returning to edit step...**"
  - Read fully and follow: step-e-03-edit.md

- **IF S (Summary):**
  - Display detailed summary including:
    - Complete list of all changes made
    - Before/after comparison (key improvements)
    - Recommendations for next steps
  - Display: "**Edit Workflow Complete**"
  - Exit

- **IF X (Exit):**
  - Display summary
  - Display: "**Edit Workflow Complete**"
  - Exit

- **IF Any other:** Help user, then redisplay menu
