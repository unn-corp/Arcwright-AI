---
name: pr-review-panel
description: Use when reviewing a diff, pull request, or changed files before merge, especially when correctness, security, tests, and contracts need separate scrutiny.
allowed-tools: Read, Grep, Glob, Bash, Agent, SendMessage
---

# PR Review Panel

Produce an evidence-backed merge verdict and account for every reported finding. Review is read-only unless fixes are already authorized.

## Scope and available tools

- Resolve PRs through an available repository tool or `gh pr diff`; otherwise review the requested files or branch diff. Check the actual base/default branch before assuming `main`. Include relevant uncommitted/untracked work when reviewing a working tree.
- Record base/head and working-tree scope. Save a read-only diff snapshot in temporary storage; pass an absolute path to workers sharing the filesystem, or its content otherwise. Do not stage files in Git. Reviewers may read surrounding code/tests.
- Discover callable native tools, including Arcwright Code / T3 Code task tools when exposed. Use real task IDs, completion, messaging, and cancellation interfaces; do not assume Claude `Agent`/`SendMessage` names exist.
- In Arcwright Code/T3, call `orchestrator_capabilities` before selecting a provider/model. Prefer supported native tools for same-provider work; use `delegate_task` for app-owned or cross-provider tasks. Retain each returned `taskId`; use `task_status`/`task_cancel` for custody. Every app-owned re-review is a new `delegate_task` with prior findings and current source, never a message to `childThreadId`. Register a PR worked on with `link_pull_request` when available.
- Use the current authorized model/provider; do not force a switch or invent IDs. Respect the host's live-agent cap, including the coordinator and existing tasks. Run independent lenses in waves that fit available capacity. Reuse suitable active work instead of duplicating tasks.
- Without available/authorized delegation, run lenses sequentially and disclose the lack of independence. If independent reviewers are required, report that portion incomplete.

## Lenses

Give each reviewer a small [capability brief](../subagent-protocol/guide-07-7-handoff-context-contract.md)
for `review-orchestrator` and its lens: relevant installed skill paths, finder,
and actual tool constraints. Suggestions are nonexclusive; read only needed
procedures, directly when no native Skill tool exists. Reuse an unchanged brief.

Use the selected lenses (`--lens r1,r3` narrows the set). Give each independent context without others' conclusions. Read the linked method for R4.

| ID | Lens | Focus |
| --- | --- | --- |
| R1 | Correctness | Reachable logic errors, state transitions, races, data loss |
| R2 | Security | Trust boundaries, authorization, injection, secrets; apply `security-review` if installed |
| R3 | Performance | Unbounded work, blocking paths, excessive queries, resource lifetime |
| R4 | Tests/Coverage | [Verification gaps](references/verification-gaps.md) at actual consumers, weakened/removed checks |
| R5 | API/Contract | Schema, events, compatibility, errors, caller assumptions |
| R6 | Readability | Complexity/duplication with a named maintenance consequence |

Each reviewer returns:

```text
LENS: R1
STATUS: complete | partial | failed
SCOPE: checked files/behaviors and omissions
FINDING: R1-001
FILE: path:line
SEVERITY: Critical | High | Medium | Low (provisional)
CONFIDENCE: 0-100
TITLE: concrete bad outcome
DETAIL: reachable trigger, evidence, consequence, correction
LENS_DONE
```

R4 also returns its consumer, minimal regression, and tests/searches checked. A completed clean lens returns an explicit empty finding list with scope and completion status. An empty tool response, timeout, malformed result, or missing completion is failed/partial, never a clean list. Retain every finding actually reported, including low-confidence ones.

Recheck missing behavior once after an empty first scan; a clean result is valid. Do not invent findings to meet a quota.

## Triage before filtering or grouping

1. Register every raw finding with its source ID and maintain a lens-completion table. Finish available waves before triage. Retry a failed lens once only when a recoverable tool error warrants it; otherwise retain its failure and scope.
2. Verify each claim against cited code and reachable callers/guards. Check the claimed bad outcome, not whether its fix sounds sensible. Read R4's cited evidence before relying on it. Grade concrete harm centrally; reviewer severity/confidence are inputs, not proof.
3. Give each raw finding a verdict: **real**, **false**, or **unverified**. Record evidence of harm, the specific refutation, or the missing check. An unrelated fact nearby does not refute a claim. A difficult fix does not disprove reachable harm.
4. Assign **report**, **reject**, **defer**, **below-threshold**, or **duplicate-of ID**. An issue exposed by the change is not pre-existing merely because its code started earlier. Preserve requested intent/scope; never edit a spec to make a defect disappear. Review alone authorizes no fixes, tracker writes, or external messages.
5. Only now group real findings sharing a root defect. Nearby lines or a common fix alone do not prove duplication. Preserve member IDs, outcomes, and evidence; use the group's highest verified severity.
6. Default display threshold is 70 (`--threshold N`, integer 0–100). Filtered findings stay in the ledger. A verified Critical/High issue still affects the merge verdict below the display threshold. Rank reported groups by severity, confidence, then path.

On a resumed pass, carry a prior disposition only when the same claim and all code, test, or contract evidence it depended on remain unchanged. Mark it carried and cite its earlier row. Changed evidence requires re-verification.

Keep one ledger row per raw finding, including rejected, deferred, grouped, and filtered entries: ID/source, verdict, severity/confidence, evidence, disposition, grouped parent if any. Reconcile row count to the sum received from lenses before completing the report.

## Verdict and output

| Condition | Verdict |
| --- | --- |
| Any verified Critical or at least two verified High issues | BLOCK |
| One verified High or at least three verified Medium issues | REVISE |
| Required lens partial/failed, or an unresolved claim could block merge | INCOMPLETE; retain any established BLOCK/REVISE decision too |
| Lower-severity real findings remain | APPROVE WITH NOTES |
| All selected lenses complete and no real findings remain | APPROVE |

Only findings caused or exposed by the reviewed change affect its merge verdict. Deferring those findings retains their severity; clearly pre-existing, unaffected issues may be noted separately without blocking this change. An unverified issue is not a proven defect; name the missing check. Never announce clean approval from an incomplete review.

Report the verdict and reviewed revision/scope; ranked actionable findings; completed/partial/failed/excluded lens statuses; every raw finding's compact disposition ledger with reconciled counts; and unresolved decisions or narrow verification needed. Reasons must be visible; omitted counts alone are insufficient.

For architectural depth, use an installed `review-orchestrator` only when requested or selected by `--ar` and callable in this host. Discover its real interface. If unavailable, perform relevant architecture/contract checks here and disclose the limitation. This panel has no mandatory dependency on that agent. `--ar` authorizes review, not a model upgrade or code changes.

Triage methods adapted from [BMAD v6.12.4](https://github.com/bmad-code-org/BMAD-METHOD/tree/bab9082c3e884e0d72c759bcd1a6d90bcc01be84/src/bmm-skills/ship/bmad-code-review), under the [upstream license](UPSTREAM-LICENSE).
