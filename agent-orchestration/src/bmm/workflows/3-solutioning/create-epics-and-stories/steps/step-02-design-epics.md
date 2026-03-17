---
name: 'step-02-design-epics'
description: 'Design and approve the epics_list that will organize all requirements into user-value-focused epics'

# Path Definitions
workflow_path: '{project-root}/_bmad/bmm/workflows/3-solutioning/create-epics-and-stories'

# File References
thisStepFile: './step-02-design-epics.md'
nextStepFile: './step-03-create-stories.md'
workflowFile: '{workflow_path}/workflow.md'
outputFile: '{planning_artifacts}/epics.md'

# Task References
advancedElicitationTask: '{project-root}/_bmad/core/workflows/advanced-elicitation/workflow.xml'
partyModeWorkflow: '{project-root}/_bmad/core/workflows/party-mode/workflow.md'

# Template References
epicsTemplate: '{workflow_path}/templates/epics-template.md'
---

# Step 2: Design Epic List

**Goal:** Design and get explicit approval for the `epics_list` that organizes all requirements into user-value-focused epics.

**Rules:** Read this entire file before acting. Focus only on the epics_list — do not create individual stories. Each epic must be standalone and enable future epics without requiring them.

---

## EPIC DESIGN PROCESS

### 1. Review Extracted Requirements

Load {outputFile} and review FRs, NFRs, and additional requirements from Step 1.

### 2. Epic Design Principles

**Organize by USER VALUE, not technical layers:**

✅ CORRECT — each epic delivers standalone user value:
- Epic 1: User Authentication & Profiles (complete auth system)
- Epic 2: Content Creation (uses auth, creates content)
- Epic 3: Social Interaction (uses auth + content)

❌ WRONG — technical milestones with no direct user value:
- Epic 1: Database Setup
- Epic 2: API Development
- Epic 3: Frontend Components

**Dependency rule:** Epic N+1 can build on previous epics but must deliver complete functionality for its own domain. Epic 2 must not require Epic 3 to function.

### 3. Design Epic Structure

**A. Identify user value themes** — look for natural FR groupings, user journeys, user types and goals.

**B. For each proposed epic, define:**
1. Epic title (user-centric)
2. User outcome (what users can accomplish after this epic)
3. FR coverage (which FR numbers it addresses)
4. Any technical/UX notes

**C. Format the epics_list:**

```
## Epic List

### Epic 1: [Epic Title]
[Epic goal — what users can accomplish]
**FRs covered:** FR1, FR2, FR3

### Epic 2: [Epic Title]
[Epic goal]
**FRs covered:** FR4, FR5, FR6
```

### 4. Create Requirements Coverage Map

```
### FR Coverage Map

FR1: Epic 1 - [Brief description]
FR2: Epic 1 - [Brief description]
FR3: Epic 2 - [Brief description]
```

### 5. Collaborative Refinement

Ask:
- "Does this epic structure align with your product vision?"
- "Are all user outcomes properly captured?"
- "Should we adjust any epic groupings?"

### 6. Get Final Approval

**Must get explicit user approval:** "Do you approve this epic structure for proceeding to story creation?"

If changes are requested: adjust, update epics_list, re-present for approval. Repeat until approved.

### 7. Save and Present Menu

After approval, update {outputFile}:
1. Replace `{{epics_list}}` with the approved epic list
2. Replace `{{requirements_coverage_map}}` with the coverage map

Display: **`Select an Option: [A] Advanced Elicitation [P] Party Mode [AR] Adversarial Review [C] Continue`**

**Menu handling:**
- **A:** Read fully and follow: {advancedElicitationTask}
- **P:** Read fully and follow: {partyModeWorkflow}
- **AR:** Execute `{project-root}/_bmad/core/tasks/review-adversarial-general.xml` — display findings, then redisplay menu
- **C:** Save approved epics_list to {outputFile}, update frontmatter, then read fully and follow: {nextStepFile}
- **Any other input:** Respond, then redisplay menu

Always halt and wait for user input at this menu.

---

## SUCCESS METRICS

- Epics organized around user value (not technical layers)
- All FRs mapped to specific epics
- Requirements coverage map completed
- User gives explicit approval for epic structure
- Document updated with approved epics
