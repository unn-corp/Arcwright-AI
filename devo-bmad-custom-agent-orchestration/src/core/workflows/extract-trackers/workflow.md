---
name: bmad-extract-trackers
description: "Extract Nimbalyst structured tracker items from historical BMAD documents."
main_config: "{project-root}/_bmad/bmm/config.yaml"
---

# Historical Tracker Extraction Workflow

**Goal:** Scan old plan files and documents to identify actionable items (tasks, bugs, ideas, decisions) and convert them into structured Nimbalyst YAML `trackingStatus` blocks.

## WORKFLOW ARCHITECTURE

### Phase 1: Setup and Input

1. LOAD AND READ the nimbalyst-tracking SKILL document at: `{project-root}/_bmad/_memory/skills/nimbalyst-tracking/SKILL.md`. You MUST use the exact YAML format described in this skill.
2. Ask the user for the directory or specific files they want to scan.

- Provide examples like `_bmad-output/`, `plans/`, or `{project-root}/docs/`.

3. HALT and wait for user input.

### Phase 2: Discovery and Parsing

1. SCAN the provided directory for Markdown (`.md`) files.
2. READ the contents of the identified files.
3. EXTRACT all identifiable trackable items based on the rules in the Nimbalyst tracking skill:

- `task` (action items, todos)
- `bug` (defects, issues)
- `idea` (future enhancements)
- `decision` (architectural or design choices)
- `feature-request`, `user-feedback`, `technical-debt`, `user-story`

4. DETERMINE completion status:

- If the document implies the work is already done (e.g., "completed", "fixed", "implemented"), set the status to `resolved` or `closed` and generate a `resolvedDate`.
- Otherwise, set the status to `open`.

### Phase 3: Generation

1. GENERATE a new file: `{project-root}/nimbalyst-local/tracker/tracker-historical-{YYYY-MM-DD-HH-MM}.md`
2. WRITE all the extracted items into this new file using the exact `trackingStatus` YAML block format from the tracking skill. Do NOT use inline syntax.
3. REPORT a summary to the user indicating how many items of which types were successfully extracted and stored.

**End of Workflow**
