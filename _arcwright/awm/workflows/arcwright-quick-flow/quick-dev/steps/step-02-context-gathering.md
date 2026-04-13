---
name: "step-02-context-gathering"
description: "Quick context gathering for direct mode - identify files, patterns, dependencies"

nextStepFile: "./step-03-execute.md"
---

# Step 2: Context Gathering (Direct Mode)

**Goal:** Quickly gather context for direct instructions - files, patterns, dependencies.

**Note:** This step only runs for Mode B (direct instructions). If `{execution_mode}` is "tech-spec", this step was skipped.

---

## AVAILABLE STATE

From step-01:

- `{baseline_commit}` - Git HEAD at workflow start
- `{execution_mode}` - Should be "direct"
- `{project_context}` - Loaded if exists

---

## EXECUTION SEQUENCE

### 1. Identify Files to Modify

Based on user's direct instructions and confirmed documents:

- **Review UX Design Document** — Search for `{planning_artifacts}/*ux*.md`. If found, read it to understand design intent, UI patterns, and interaction requirements.
- Search for relevant implementation files using glob/grep
- Identify the specific files that need changes
- Note file locations and purposes

### 2. Find Relevant Patterns

Examine the identified files and their surroundings:

- Code style and conventions used
- Existing patterns for similar functionality
- Import/export patterns
- Error handling approaches
- Test patterns (if tests exist nearby)

### 3. Note Dependencies

Identify:

- External libraries used
- Internal module dependencies
- Configuration files that may need updates
- Related files that might be affected

### 4. Create Mental Plan

Synthesize gathered context into:

- List of tasks to complete
- Acceptance criteria (inferred from user request)
- Order of operations
- Files to touch

---

## PRESENT PLAN AND PROCEED

Display to user:

```
**Context Gathered:**

**Files to modify:**
- {list files}

**Patterns identified:**
- {key patterns}

**Plan:**
1. {task 1}
2. {task 2}
...

**Inferred AC:**
- {acceptance criteria}

✅ Context mapped — moving to execution now.
If you want to adjust the plan before I start, say so. Otherwise I'm proceeding.
```

> 💡 **Agile note — why we do this:** Context gathering is a time-boxed spike, not a planning ceremony. The goal is to identify the right files and patterns so execution is surgical. We don't need approval to start — just clarity on what we're changing.

#### Auto-Proceed Rules:

- **Proceed immediately** to Step 3 unless the user requests adjustments
- If user says "adjust" or "wait" or similar: incorporate feedback, re-present summary, then proceed
- If user asks questions: answer them, then proceed
- **No y/n gate** — silence means go

---

## NEXT STEP DIRECTIVE

**After presenting the plan, read fully and follow:** `{project-root}/_arcwright/awm/workflows/arcwright-quick-flow/quick-dev/steps/step-03-execute.md`

---

## SUCCESS METRICS

- Files to modify identified
- Relevant patterns documented
- Dependencies noted
- Mental plan created with tasks and AC
- Proceeding to execution without unnecessary confirmation

## FAILURE MODES

- Executing this step when Mode A (tech-spec)
- Proceeding without identifying files to modify
- Blocking on user confirmation when no adjustment is needed
- Missing obvious patterns in existing code
