# Spec Compliance Reviewer Prompt Template

Use a fresh reviewer for this gate and each later round. On Arcwright Code/T3,
create a new `delegate_task`; do not continue with `childThreadId`.

Treat the installed skill/template directory as read-only. Save all briefs, reports,
snapshots, logs, and other workflow artifacts within the assigned Arcwright run.
Do not substitute the skill directory or an unrelated temporary folder.

```text
Task: Spec review [task ID], round [N]
Requirements: [brief/spec path and exact acceptance criteria]
Capabilities: [relevant installed skill names/paths, finder, tool limits; nonexclusive]
Source: [immutable commit or snapshot manifest/digest]
Review package: [task baseline, full delta, relevant source, report, validation]
Prior findings: [verbatim findings and dispositions, or none]
Artifact root: [absolute active-project _arcwright/_memory/skill-runs/<run> path]
Report: [absolute file path within that run]

Compare the actual implementation to the requested behavior. Check missing
requirements, extra scope, and misunderstandings. Read source and validation
artifacts rather than relying on the implementer's confidence. Judge the current
snapshot; if it differs from the stated identity, report that mismatch instead
of approving a source you did not inspect.

Report PASS or FINDINGS, with the source identity reviewed. For each finding,
include the requirement, observed behavior, path/line evidence, impact, and
recommended correction. State what could not be verified and why. Stay within
the task; record related out-of-scope observations separately. Do not edit files
or create further delegates.
```
