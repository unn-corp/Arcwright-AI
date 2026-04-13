---
name: 'step-04-ux-alignment'
description: 'Check for UX document and validate alignment with PRD and Architecture'

nextStepFile: './step-05-epic-quality-review.md'
outputFile: '{planning_artifacts}/implementation-readiness-report-{{date}}.md'
---

# Step 4: UX Alignment

## STEP GOAL:

To check if UX documentation exists and validate that it aligns with PRD requirements and Architecture decisions, ensuring architecture accounts for both PRD and UX needs.

## Step-Specific Rules:

- Check for UX document existence first
- Don't assume UX is not needed
- Validate alignment between UX, PRD, and Architecture
- Add findings to the output report

## UX ALIGNMENT PROCESS:

### 1. Initialize UX Validation

"Beginning **UX Alignment** validation.

I will:

1. Check if UX documentation exists
2. If UX exists: validate alignment with PRD and Architecture
3. If no UX: determine if UX is implied and document warning"

### 2. Search for UX Documentation

Search patterns:

- `{planning_artifacts}/*ux*.md` (whole document)
- `{planning_artifacts}/*ux*/index.md` (sharded)
- Look for UI-related terms in other documents

### 3. If UX Document Exists

#### A. UX ↔ PRD Alignment

- Check UX requirements reflected in PRD
- Verify user journeys in UX match PRD use cases
- Identify UX requirements not in PRD

#### B. UX ↔ Architecture Alignment

- Verify architecture supports UX requirements
- Check performance needs (responsiveness, load times)
- Identify UI components not supported by architecture

### 4. If No UX Document

Assess if UX/UI is implied:

- Does PRD mention user interface?
- Are there web/mobile components implied?
- Is this a user-facing application?

If UX implied but missing: Add warning to report

### 5. Add Findings to Report

Append to {outputFile}:

```markdown
## UX Alignment Assessment

### UX Document Status

[Found/Not Found]

### Alignment Issues

[List any misalignments between UX, PRD, and Architecture]

### Warnings

[Any warnings about missing UX or architectural gaps]
```

### 6. Auto-Proceed to Next Step

After UX assessment complete, immediately load next step.

## PROCEEDING TO EPIC QUALITY REVIEW

UX alignment assessment complete. Loading next step for epic quality review.

