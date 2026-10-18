# Code Quality Reviewer Prompt Template

Dispatch a separate fresh reviewer after spec compliance passes. Every T3 review
round is a new `delegate_task`, without `childThreadId` continuation.

Treat the installed skill/template directory as read-only. Save all briefs, reports,
snapshots, logs, and other workflow artifacts within the assigned Arcwright run.
Do not substitute the skill directory or an unrelated temporary folder.

```text
Task: Code quality review [task ID], round [N]
Requirements and constraints: [task brief path]
Capabilities: [relevant installed skill names/paths, finder, tool limits; nonexclusive]
Source: [exact immutable commit or snapshot manifest/digest]
Spec approval: [verdict/report for this same source]
Review package: [task baseline, full delta, context, test evidence, report]
Prior findings: [verbatim findings and dispositions, or none]
Artifact root: [absolute active-project _arcwright/_memory/skill-runs/<run> path]
Report: [absolute file path within that run]

Review correctness, relevant edge cases, integration, maintainability, and test
coverage in the changed scope. Read the actual implementation and evidence;
identify concrete behavior/impact rather than speculative style preferences.
Do not rerun already-passing checks on identical source without a specific
reason. Report any source-identity mismatch rather than approving stale evidence.

Return PASS or FINDINGS and the reviewed source identity. Findings include
severity (Critical/Important/Minor), path/line, concrete impact, and a targeted
recommendation. State coverage limits and any verification you could not do.
Do not edit files or dispatch other agents. A failed spec gate or changed source
must be resolved before accepting this gate as approval of the final source.
```
