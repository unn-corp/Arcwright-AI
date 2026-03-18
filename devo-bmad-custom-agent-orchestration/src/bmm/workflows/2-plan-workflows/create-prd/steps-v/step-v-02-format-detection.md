---
name: 'step-v-02-format-detection'
description: 'Format Detection & Structure Analysis - Classify PRD format and route appropriately'

# File references (ONLY variables used in this step)
nextStepFile: './step-v-03-density-validation.md'
altStepFile: './step-v-02b-parity-check.md'
prdFile: '{prd_file_path}'
validationReportPath: '{validation_report_path}'
---

# Step 2: Format Detection & Structure Analysis

## YOUR TASK

Detect if PRD follows BMAD format and route appropriately — classify as BMAD Standard / BMAD Variant / Non-Standard, with optional parity check for non-standard formats.

### Step-Specific Rules

- Focus ONLY on detecting format and classifying structure
- FORBIDDEN to perform other validation checks in this step
- This is a branch step — may route to parity check for non-standard PRDs

## MANDATORY SEQUENCE

**CRITICAL:** Follow this sequence exactly. Do not skip, reorder, or improvise unless user explicitly requests a change.

### 1. Extract PRD Structure

Load the complete PRD file and extract:

**All Level 2 (##) headers:**
- Scan through entire PRD document
- Extract all ## section headers
- List them in order

**PRD frontmatter:**
- Extract classification.domain if present
- Extract classification.projectType if present
- Note any other relevant metadata

### 2. Check for BMAD PRD Core Sections

Check if the PRD contains the following BMAD PRD core sections:

1. **Executive Summary** (or variations: ## Executive Summary, ## Overview, ## Introduction)
2. **Success Criteria** (or: ## Success Criteria, ## Goals, ## Objectives)
3. **Product Scope** (or: ## Product Scope, ## Scope, ## In Scope, ## Out of Scope)
4. **User Journeys** (or: ## User Journeys, ## User Stories, ## User Flows)
5. **Functional Requirements** (or: ## Functional Requirements, ## Features, ## Capabilities)
6. **Non-Functional Requirements** (or: ## Non-Functional Requirements, ## NFRs, ## Quality Attributes)

**Count matches:**
- How many of these 6 core sections are present?
- Which specific sections are present?
- Which are missing?

### 3. Classify PRD Format

Based on core section count, classify:

**BMAD Standard:**
- 5-6 core sections present
- Follows BMAD PRD structure closely

**BMAD Variant:**
- 3-4 core sections present
- Generally follows BMAD patterns but may have structural differences
- Missing some sections but recognizable as BMAD-style

**Non-Standard:**
- Fewer than 3 core sections present
- Does not follow BMAD PRD structure
- May be completely custom format, legacy format, or from another framework

### 4. Report Format Findings to Validation Report

Append to validation report:

```markdown
## Format Detection

**PRD Structure:**
[List all ## Level 2 headers found]

**BMAD Core Sections Present:**
- Executive Summary: [Present/Missing]
- Success Criteria: [Present/Missing]
- Product Scope: [Present/Missing]
- User Journeys: [Present/Missing]
- Functional Requirements: [Present/Missing]
- Non-Functional Requirements: [Present/Missing]

**Format Classification:** [BMAD Standard / BMAD Variant / Non-Standard]
**Core Sections Present:** [count]/6
```

### 5. Route Based on Format Classification

**IF format is BMAD Standard or BMAD Variant:**

Display: "**Format Detected:** {classification}

Proceeding to systematic validation checks..."

Without delay, read fully and follow: {nextStepFile} (step-v-03-density-validation.md)

**IF format is Non-Standard (< 3 core sections):**

Display: "**Format Detected:** Non-Standard PRD

This PRD does not follow BMAD standard structure (only {count}/6 core sections present).

You have options:"

Present MENU OPTIONS below for user selection

### 6. Present MENU OPTIONS (Non-Standard PRDs Only)

**[A] Parity Check** - Analyze gaps and estimate effort to reach BMAD PRD parity
**[B] Validate As-Is** - Proceed with validation using current structure
**[C] Exit** - Exit validation and review format findings

#### Menu Handling Logic:

- IF A (Parity Check): Read fully and follow: {altStepFile} (step-v-02b-parity-check.md)
- IF B (Validate As-Is): Display "Proceeding with validation..." then read fully and follow: {nextStepFile}
- IF C (Exit): Display format findings summary and exit validation
- IF Any other: help user respond, then redisplay menu

ALWAYS halt and wait for user input after presenting menu for non-standard PRDs.
