# Scoped Re-review Prompt Template

Start a fresh delegate for each round. T3 uses a new `delegate_task` without
`childThreadId`; include the prior findings instead of resuming the old reviewer.

Treat the installed skill/template directory as read-only. Save all briefs, reports,
snapshots, logs, and other workflow artifacts within the assigned Arcwright run.
Do not substitute the skill directory or an unrelated temporary folder.

```text
Task/gate/round: [task ID, spec or quality, N]
Requirements: [brief and applicable criteria]
Capabilities: [reuse current relevant skill paths, finder, and tool limits; nonexclusive]
Original findings: [verbatim list and previous report path]
Previously reviewed source: [commit or snapshot identity]
Repaired source: [new immutable identity and manifest/package path]
Repair delta: [complete old-to-new source delta, including uncommitted files]
Validation: [commands, results, and repaired source identity exercised]
Artifact root: [absolute active-project _arcwright/_memory/skill-runs/<run> path]
Report: [absolute file path within that run]

For each finding, report ADDRESSED or NOT ADDRESSED with source evidence.
Check new breakage introduced by the repair. Record unrelated observations
separately; do not restart a broad review of unchanged code. Name anything
unverifiable and any mismatch between the stated and actual source.

Return PASS only for the repaired source and this gate's stated scope. Include
its identity and the prior approval supplemented by this scoped revalidation.
Do not edit files or dispatch more agents.
```
