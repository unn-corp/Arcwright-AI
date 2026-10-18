# Implementer Prompt Template

Dispatch through the host's native delegation tool. Fill in these fields; pass a
brief file when available, or inline the relevant task requirements.

Treat the installed skill/template directory as read-only. Save all briefs, reports,
snapshots, logs, and other workflow artifacts within the assigned Arcwright run.
Do not substitute the skill directory or an unrelated temporary folder.

```text
Task: Implement [task ID/name]
Worktree: [absolute path]
Ownership: [files/interfaces this task may change; concurrent work to preserve]
Requirements: [brief path or exact scoped requirements and acceptance criteria]
Context: [relevant interfaces, prior decisions, dependencies, and constraints]
Capabilities: [relevant installed skill names/paths, finder, tool limits; nonexclusive]
Baseline: [pre-task commit or scoped dirty-source snapshot/manifest]
Authorization: [existing allowed actions; commit/push/install only if authorized]
Artifact root: [absolute active-project _arcwright/_memory/skill-runs/<run> path]
Report: [absolute file path within that run]

Implement the specified behavior and preserve existing unrelated work. Use the
project's patterns, self-review the change, and run meaningful checks covering
what changed. Honor required TDD where applicable; a small reference edit does
not require an artificial agent scenario or mirrored implementation test.

Record the exact source identity the checks exercised. For uncommitted work,
report scoped file hashes/snapshot and staged/untracked status; do not claim a
commit range represents dirty source. Do not commit just to make review possible.

Resolve routine choices within the task. If a missing fact prevents a sound
choice, report what is missing and what can still proceed. Escalate with evidence
when the task cannot be completed; do not repeat the same unsuccessful action.

Do not dispatch helpers or reviewers. The controller owns review and task IDs.

Write the report with:
- DONE | DONE_WITH_CONCERNS | NEEDS_CONTEXT | BLOCKED
- Implemented behavior, changed files, and any relevant pre-existing changes
- Exact commit or source snapshot identity and artifact paths
- Commands, outcomes, and source identity actually tested
- Self-review findings, open concerns, and next action if incomplete

Return a short status, report path, source identity, and test summary. Do not
paste the whole report or session history into the controller's context.
```
