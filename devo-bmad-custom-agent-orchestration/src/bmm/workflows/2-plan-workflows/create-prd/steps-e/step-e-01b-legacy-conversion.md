---
name: 'step-e-01b-legacy-conversion'
description: 'Legacy PRD Conversion Assessment - Analyze legacy PRD and propose conversion strategy'

# File references (ONLY variables used in this step)
nextStepFile: './step-e-02-review.md'
prdFile: '{prd_file_path}'
prdPurpose: '{project-root}/_bmad/bmm/workflows/2-plan-workflows/create-prd/data/prd-purpose.md'
---

# Step E-1B: Legacy PRD Conversion Assessment

## YOUR TASK

Analyze legacy PRD against BMAD standards, identify gaps, propose conversion strategy, and let user choose how to proceed.

### Step-Specific Rules

- Focus ONLY on conversion assessment and proposal
- FORBIDDEN to perform conversion yet (that comes in edit step)
- This is a branch step — user chooses conversion path

## MANDATORY SEQUENCE

**CRITICAL:** Follow this sequence exactly. Do not skip, reorder, or improvise unless user explicitly requests a change.

### 1. Attempt Sub-Process Assessment

**Try to use Task tool with sub-agent:**

"Perform legacy PRD conversion assessment:

**Load the PRD and prd-purpose.md**

**For each BMAD PRD section, analyze:**
1. Does PRD have this section? (Executive Summary, Success Criteria, Product Scope, User Journeys, Functional Requirements, Non-Functional Requirements)
2. If present: Is it complete and well-structured?
3. If missing: What content exists that could migrate to this section?
4. Effort to create/complete: Minimal / Moderate / Significant

**Identify:**
- Core sections present: {count}/6
- Content gaps in each section
- Overall conversion effort: Quick / Moderate / Substantial
- Recommended approach: Full restructuring vs targeted improvements

Return conversion assessment with gap analysis and effort estimate."

**Graceful degradation (if no Task tool):**
- Manually check PRD for each BMAD section
- Note what's present and what's missing
- Estimate conversion effort
- Identify best conversion approach

### 2. Build Gap Analysis

**For each BMAD core section:**

**Executive Summary:**
- Present: [Yes/No/Partial]
- Gap: [what's missing or incomplete]
- Effort to Complete: [Minimal/Moderate/Significant]

**Success Criteria:**
- Present: [Yes/No/Partial]
- Gap: [what's missing or incomplete]
- Effort to Complete: [Minimal/Moderate/Significant]

**Product Scope:**
- Present: [Yes/No/Partial]
- Gap: [what's missing or incomplete]
- Effort to Complete: [Minimal/Moderate/Significant]

**User Journeys:**
- Present: [Yes/No/Partial]
- Gap: [what's missing or incomplete]
- Effort to Complete: [Minimal/Moderate/Significant]

**Functional Requirements:**
- Present: [Yes/No/Partial]
- Gap: [what's missing or incomplete]
- Effort to Complete: [Minimal/Moderate/Significant]

**Non-Functional Requirements:**
- Present: [Yes/No/Partial]
- Gap: [what's missing or incomplete]
- Effort to Complete: [Minimal/Moderate/Significant]

**Overall Assessment:**
- Sections Present: {count}/6
- Total Conversion Effort: [Quick/Moderate/Substantial]
- Recommended: [Full restructuring / Targeted improvements]

### 3. Present Conversion Assessment

Display:

"**Legacy PRD Conversion Assessment**

**Current PRD Structure:**
- Core sections present: {count}/6
{List which sections are present/missing}

**Gap Analysis:**

{Present gap analysis table showing each section's status and effort}

**Overall Conversion Effort:** {effort level}

**Your Edit Goals:**
{Reiterate user's stated edit requirements}

**Recommendation:**
{Based on effort and user goals, recommend best approach}

**How would you like to proceed?**"

### 4. Present MENU OPTIONS

**[R] Restructure to BMAD** - Full conversion to BMAD format, then apply your edits
**[I] Targeted Improvements** - Apply your edits to existing structure without restructuring
**[E] Edit & Restructure** - Do both: convert format AND apply your edits
**[X] Exit** - Review assessment and decide

Halt and wait for user selection.

#### Menu Handling Logic:

- IF R (Restructure): Note conversion mode, then load next step
- IF I (Targeted): Note targeted mode, then load next step
- IF E (Edit & Restructure): Note both mode, then load next step
- IF X (Exit): Display summary, exit

### 5. Document Conversion Strategy

Store conversion decision for next step:

- **Conversion mode:** [Full restructuring / Targeted improvements / Both]
- **Edit requirements:** [user's requirements from step e-01]
- **Gap analysis:** [summary of gaps identified]

Display: "**Conversion Strategy Documented**

Mode: {conversion mode}
Edit goals: {summary}

**Proceeding to deep review...**"

Read fully and follow: {nextStepFile} (step-e-02-review.md)
