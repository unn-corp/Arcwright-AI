---
name: 'step-03-create-stories'
description: 'Generate all epics with their stories following the template structure'

# Path Definitions
workflow_path: '{project-root}/_arcwright/awm/workflows/3-solutioning/create-epics-and-stories'

# File References
thisStepFile: './step-03-create-stories.md'
nextStepFile: './step-04-final-validation.md'
workflowFile: '{workflow_path}/workflow.md'
outputFile: '{planning_artifacts}/epics.md'

# Task References
advancedElicitationTask: '{project-root}/_arcwright/core/workflows/advanced-elicitation/workflow.xml'
partyModeWorkflow: '{project-root}/_arcwright/core/workflows/party-mode/workflow.md'

# Template References
epicsTemplate: '{workflow_path}/templates/epics-template.md'
---

# Step 3: Generate Epics and Stories

**Goal:** Generate all epics with their stories based on the approved epics_list, following the template structure exactly.

**Rules:** Process epics sequentially. Each story must be completable by a single dev agent. Stories must NOT depend on future stories within the same epic.

---

## STORY GENERATION PROCESS

### 1. Load Approved Epic Structure

Load {outputFile} and review: approved epics_list, FR coverage map, all requirements, and template structure.

### 2. Story Creation Guidelines

**Database/entity principle:** Create tables/entities ONLY when needed by the story — not all upfront in Epic 1.

**Story dependency principle:** Each story must be completable based only on previous stories. No forward dependencies.

**Story format:**

```
### Story {N}.{M}: {story_title}

As a {user_type},
I want {capability},
So that {value_benefit}.

**Acceptance Criteria:**

**Given** {precondition}
**When** {action}
**Then** {expected_outcome}
**And** {additional_criteria}
```

✅ Good stories: "User Registration with Email", "User Login with Password", "Create New Blog Post"
❌ Bad stories: "Set up database", "Create all models", "Login UI (depends on Story 1.3 API)"

### 3. Process Epics Sequentially

For each epic in the approved list:

**A. Epic Overview** — display epic number, title, goal, FRs covered, relevant NFRs.

**B. Story Breakdown** — work with user to identify distinct user capabilities, ensure logical flow, size stories appropriately.

**C. For each story:**
1. Story title (clear, action-oriented)
2. User story (As a / I want / So that)
3. Acceptance criteria (Given/When/Then — specific, independently testable, include edge cases)

**D. Collaborative Review** — present each story and ask:
- "Does this story capture the requirement correctly?"
- "Is the scope appropriate for a single dev session?"
- "Are the acceptance criteria complete and testable?"

**E. Append to {outputFile}** when approved — use correct numbering and proper markdown.

### 4. Epic Completion

After all stories for an epic are complete: display epic summary, story count, verify FR coverage, confirm with user before proceeding to next epic.

### 5. Final Document Check

After all epics and stories are generated, verify:
- Template structure followed exactly
- All placeholders replaced
- All FRs covered
- Formatting consistent

**Required structure:**
1. Overview section with project name
2. Requirements Inventory (all three subsections populated)
3. FR Coverage Map
4. Epic List with approved structure
5. Epic sections (each with goal + stories with Given/When/Then ACs)

### 6. Present Final Menu

Display: **`Select an Option: [A] Advanced Elicitation [P] Party Mode [AR] Adversarial Review [C] Continue`**

**Menu handling:**
- **A:** Read fully and follow: {advancedElicitationTask}
- **P:** Read fully and follow: {partyModeWorkflow}
- **AR:** Execute `{project-root}/_arcwright/core/tasks/review-adversarial-general.xml` — display findings, then redisplay menu
- **C:** Save content to {outputFile}, update frontmatter, then read fully and follow: {nextStepFile}
- **Any other input:** Respond, then redisplay menu

Always halt and wait for user input at this menu.

---

## SUCCESS METRICS

- All epics processed in sequence
- Stories created for each epic following template exactly
- All FRs covered by stories
- Stories appropriately sized with specific, testable acceptance criteria
- Document complete and ready for development
