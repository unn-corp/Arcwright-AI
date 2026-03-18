---
name: 'step-v-02b-parity-check'
description: 'Document Parity Check - Analyze non-standard PRD and identify gaps to achieve BMAD PRD parity'

# File references (ONLY variables used in this step)
nextStepFile: './step-v-03-density-validation.md'
prdFile: '{prd_file_path}'
validationReportPath: '{validation_report_path}'
---

# Step 2B: Document Parity Check

## YOUR TASK

Analyze non-standard PRD and identify gaps to achieve BMAD PRD parity, presenting user with options for how to proceed.

### Step-Specific Rules

- Focus ONLY on analyzing gaps and estimating parity effort
- FORBIDDEN to perform other validation checks in this step
- This is an optional branch step — user chooses next action

## MANDATORY SEQUENCE

**CRITICAL:** Follow this sequence exactly. Do not skip, reorder, or improvise unless user explicitly requests a change.

### 1. Analyze Each BMAD PRD Section

For each of the 6 BMAD PRD core sections, analyze:

**Executive Summary:**
- Does PRD have vision/overview?
- Is problem statement clear?
- Are target users identified?
- Gap: [What's missing or incomplete]

**Success Criteria:**
- Are measurable goals defined?
- Is success clearly defined?
- Gap: [What's missing or incomplete]

**Product Scope:**
- Is scope clearly defined?
- Are in-scope items listed?
- Are out-of-scope items listed?
- Gap: [What's missing or incomplete]

**User Journeys:**
- Are user types/personas identified?
- Are user flows documented?
- Gap: [What's missing or incomplete]

**Functional Requirements:**
- Are features/capabilities listed?
- Are requirements structured?
- Gap: [What's missing or incomplete]

**Non-Functional Requirements:**
- Are quality attributes defined?
- Are performance/security/etc. requirements documented?
- Gap: [What's missing or incomplete]

### 2. Estimate Effort to Reach Parity

For each missing or incomplete section, estimate:

**Effort Level:**
- Minimal - Section exists but needs minor enhancements
- Moderate - Section missing but content exists elsewhere in PRD
- Significant - Section missing, requires new content creation

**Total Parity Effort:**
- Based on individual section estimates
- Classify overall: Quick / Moderate / Substantial effort

### 3. Report Parity Analysis to Validation Report

Append to validation report:

```markdown
## Parity Analysis (Non-Standard PRD)

### Section-by-Section Gap Analysis

**Executive Summary:**
- Status: [Present/Missing/Incomplete]
- Gap: [specific gap description]
- Effort to Complete: [Minimal/Moderate/Significant]

**Success Criteria:**
- Status: [Present/Missing/Incomplete]
- Gap: [specific gap description]
- Effort to Complete: [Minimal/Moderate/Significant]

**Product Scope:**
- Status: [Present/Missing/Incomplete]
- Gap: [specific gap description]
- Effort to Complete: [Minimal/Moderate/Significant]

**User Journeys:**
- Status: [Present/Missing/Incomplete]
- Gap: [specific gap description]
- Effort to Complete: [Minimal/Moderate/Significant]

**Functional Requirements:**
- Status: [Present/Missing/Incomplete]
- Gap: [specific gap description]
- Effort to Complete: [Minimal/Moderate/Significant]

**Non-Functional Requirements:**
- Status: [Present/Missing/Incomplete]
- Gap: [specific gap description]
- Effort to Complete: [Minimal/Moderate/Significant]

### Overall Parity Assessment

**Overall Effort to Reach BMAD Standard:** [Quick/Moderate/Substantial]
**Recommendation:** [Brief recommendation based on analysis]
```

### 4. Present Parity Analysis and Options

Display:

"**Parity Analysis Complete**

Your PRD is missing {count} of 6 core BMAD PRD sections. The overall effort to reach BMAD standard is: **{effort level}**

**Quick Summary:**
[2-3 sentence summary of key gaps]

**Recommendation:**
{recommendation from analysis}

**How would you like to proceed?**"

### 5. Present MENU OPTIONS

**[AR] Adversarial Review [C] Continue Validation** - Proceed with validation using current structure
**[E] Exit & Review** - Exit validation and review parity report
**[S] Save & Exit** - Save parity report and exit

#### Menu Handling Logic:

- IF C (Continue): Display "Proceeding with validation..." then read fully and follow: {nextStepFile}
- IF E (Exit): Display parity summary and exit validation
- IF S (Save): Confirm saved, display summary, exit
- IF Any other: help user respond, then redisplay menu

ALWAYS halt and wait for user input. Only proceed based on user selection.
