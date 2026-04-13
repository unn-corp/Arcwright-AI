---
name: triage-feedback
description: Fetch a feedback report by user-facing ID (FB-####) from production, investigate the issue, triage by complexity, and fix it.
version: 1.0.0
author: arcwright
tags: [feedback, triage, bugfix, workflow]
---

# Triage Feedback Skill

Fetch a production feedback report, investigate the codebase, triage complexity, then fix.

---

## Input

A user-facing feedback ID in `FB-####` format (e.g., `FB-0276`).

---

## Step 1 — Fetch the Feedback Report

The MCP `get_feedback` tool requires an **internal integer ID**, not the user-facing `report_id`.

1. Extract the numeric portion from the input (e.g., `FB-0276` → `276`).
2. Call `search_feedback(query="FB-0276", limit=5, db="prod")` to find the item.
3. From the results, match the entry whose `report_id` equals the input exactly.
4. Call `get_feedback(feedback_id=<matched internal id>, db="prod")` to get full details including comments, attachments, and activity log.
5. If no match is found, tell the user and stop.

**Always use `db="prod"`** — feedback lives in production.

Once the report is fetched successfully, **immediately mark it as in-progress**:

```
update_feedback_status(feedback_id=<internal_id>, new_status="in_progress", db="prod")
```

This signals to the team and the reporter that the issue is actively being worked on.

---

## Step 2 — Investigate

Read the feedback title, description, comments, and any attachments. Then:

1. Identify the **area of the codebase** affected (backend route, frontend page, model, migration, etc.).
2. Use Grep/Glob/Read to locate the relevant source files.
3. Reproduce the issue mentally — trace the code path described in the report.
4. Identify the root cause or the change needed.

---

## Step 3 — Branch Safety

Before making any changes, ensure you are NOT on `Production`:

```bash
current_branch=$(git branch --show-current)
if [ "$current_branch" = "Production" ] || [ "$current_branch" = "main" ]; then
  git checkout -b bugfix/$(echo "$FEEDBACK_ID" | tr '[:upper:]' '[:lower:]') Production
fi
```

If already on a feature/bugfix branch, confirm with the user whether to continue on it or create a new one.

---

## Step 4 — Triage and Act

Assess the complexity of the fix. Classify as one of:

### Trivial (confidence: high, scope: 1-2 files, mechanical change)
Examples: typo, wrong constant, missing null check, CSS tweak, off-by-one.

**Action:** Fix it immediately. No plan needed.

### Moderate (confidence: medium, scope: 3-6 files, clear solution but multi-step)
Examples: missing API field, broken query, state management bug, permission check gap.

**Action:**
1. Enter plan mode — outline the changes needed.
2. Get user approval on the plan.
3. Implement the fix.

### Difficult / Creative Choice (confidence: low, scope: 7+ files, multiple valid approaches, or design decision required)
Examples: architectural issue, feature rethink, performance problem with trade-offs, UX flow redesign.

**Action:**
1. Enter brainstorming mode (`/brainstorming`) — explore the problem space with the user.
2. Once direction is agreed, create a plan.
3. Get user approval on the plan.
4. Implement the fix.

**Announce your triage decision** to the user before proceeding (e.g., "This looks **Moderate** — entering plan mode.").

---

## Step 5 — Validate

After implementing:

1. Run `cd frontend && pnpm run type-check 2>&1 | grep "error TS" | grep -v "\.next/"` to check for TypeScript errors introduced by your changes.
2. If backend changes were made, check for obvious Python syntax/import errors.
3. Review your own diff: `git diff --stat` and `git diff` to sanity-check.

---

## Step 6 — Commit and Push

1. Stage only the files you changed.
2. Commit with message format: `fix: <description> (FB-####)`
3. Push the branch: `git push -u origin <branch-name>`

---

## Step 7 — Update Feedback Status

After pushing:

1. Write a **public-facing comment** explaining what was fixed in plain language that the reporter can understand. Avoid internal jargon, file paths, or code references — focus on what the user will experience differently. Example: *"The ribbons page was only showing 12 of 28 ribbons because the query had a default page size limit. All ribbons now display correctly."*
2. Call `add_feedback_comment(feedback_id=<internal_id>, comment="<public-facing explanation>", db="prod")` to post the explanation.
3. Call `update_feedback_status(feedback_id=<internal_id>, new_status="resolved", db="prod")` to mark the issue as resolved.
4. Tell the user the branch name and suggest next steps (PR, deploy, etc.).
