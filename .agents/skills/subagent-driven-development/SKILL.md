---
name: subagent-driven-development
description: Use when executing an implementation plan with delegated tasks and separate spec-compliance and code-quality reviews in the current session.
---

# Subagent-Driven Development

## Arcwright output location

Treat this installed skill bundle as read-only during execution. Resolve the active project and put all workflow notes, reports, logs, snapshots, fixtures, and other generated artifacts in a unique `<project-root>/_arcwright/_memory/skill-runs/subagent-driven-development-<run-id>/` directory. Never use the directory containing this skill as a working/output directory. Keep authorized application source edits in their requested paths. Follow the shared [runtime storage contract](../SOURCES-SUPERPOWERS.md), including host-managed evidence references.


Execute the authorized plan with a fresh implementer per task, then spec review,
then code-quality review. Keep Arcwright's two-stage review topology. Durable
progress and precise source identities make this workflow recoverable after a
repair, interruption, or context compaction.

Use this workflow when delegation is available and appropriate for the plan.
Honor an existing choice to work inline or use another orchestration approach;
if delegation is unavailable, carry out the authorized work and explain the
independence limit. This skill does not install tools or start external services.

## Native tools and custody

Follow [subagent-protocol](../subagent-protocol/SKILL.md) for tool/model discovery,
task IDs, fresh T3 review tasks, concurrency, and reconciliation. This workflow
adds the implementer → spec review → quality review stages below. See
[host-adapters.md](references/host-adapters.md) only for the active host.

Follow the user's workspace assignment. Use an isolated worktree for independent
writing tasks where appropriate, but preserve explicit shared-workspace work.
Do not stash, reset, stage, or commit somebody else's changes to obtain a clean
baseline. Existing authorization remains valid; no new approval ritual is needed
between already-authorized tasks. Commits, pushes, merges, releases, and outside
messages require their actual task authorization.

## Setup and durable progress

1. Read the plan and relevant specification once. Check interacting tasks for
   contradictory interfaces, ownership, or acceptance criteria. Resolve routine
   choices within existing authorization and record the reason; seek input only
   when a material unknown prevents a sound decision.
2. Resolve the active project root and create this plan's own
   `_arcwright/_memory/skill-runs/subagent-driven-development-<run-id>/` area.
   Store briefs, ledgers, reports, snapshots, fixtures, and review packages there;
   pass its absolute path to every delegate. The installed skill and its
   templates remain read-only. Record links/IDs for host-managed captures or
   results when the host requires separate storage. Never substitute the skill
   directory or an arbitrary temporary directory for the project's run area.
3. Create a progress ledger with plan path and revision/hash, repository/worktree,
   baseline HEAD, task IDs, and task ownership. Reuse an existing ledger only when
   its owner matches this plan. Update it after each dispatch, report, review,
   repair, and completed task; a todo tool alone is not durable evidence.
4. Record initial staged, unstaged, and relevant untracked state before edits.
   Keep existing work distinct from task changes. Use scoped source snapshots
   for a dirty/shared worktree as described below; an unchanged HEAD does not
   mean the implementation is unchanged.

Each ledger entry records:

| Field | Record |
|---|---|
| Task and owner | Plan task, authorized file scope, implementer task ID/status |
| Baseline | Pre-task HEAD and scoped source manifest/snapshot path |
| Current source | Exact commit or snapshot identity and artifact paths |
| Validation | Commands, outcomes, and the source identity actually exercised |
| Review | Gate, round, reviewer task ID, source identity, findings/verdict |
| Next action | Open findings, fix owner, round count, or completion evidence |

Keep task briefs and reports as files when that reduces repeated prompt content.
A brief contains the task's exact requirements and relevant constraints, rather
than the entire session history. Include a small capability brief with relevant
installed skill names, actual entrypoint paths, the router's finder, and tool
constraints, following the shared [handoff contract](../subagent-protocol/guide-07-7-handoff-context-contract.md).
Suggestions are nonexclusive and need no preload; reuse the brief while its task
and installation stay unchanged. Use the templates linked below.

## Source and review packages

Record the baseline **before** dispatching the implementer. Review the whole task
change, not just the last commit.

- **Committed source:** record the pre-task BASE and exact tested HEAD. Check
  ancestry and use `git diff BASE HEAD` plus the commit list for that task. Never
  replace BASE with `HEAD~1`; a task may contain multiple commits. A final branch
  review uses the branch's actual merge base.
- **Dirty or uncommitted source:** preserve before/after copies and SHA-256 hashes
  of the task's scoped files, including relevant untracked additions, deletions,
  and staged versus working-tree differences. Package the baseline-to-current
  task delta and enough surrounding source for review. Record existing unrelated
  changes separately. Do not present `git diff BASE HEAD` as the entire change
  when HEAD is unchanged but the worktree differs.
- **Review identity:** name an immutable source commit or snapshot manifest and
  its digest. The package contains the task brief, implementer report, exact
  delta/range, validation results, and any omitted or unavailable source. Include
  task-owned source only; do not sweep credentials or unrelated private files
  into a handoff.

Before dispatch and before accepting approval, compare the recorded identity to
the actual scoped source. If someone changes it, capture a new identity and
review the changed source. Bind test evidence to the source it exercised;
previous green tests do not prove an intervening repair works. An empty or
non-descendant commit range is not a clean implementation review: investigate
whether the changes are uncommitted, on another branch, or missing.

## Task loop

### 1. Implement

Dispatch a fresh implementer with the task brief, file ownership, baseline,
relevant interfaces, report path, and existing authorization boundaries. Workers
do not create their own reviewers or extra subagents; the controller owns review
custody. Avoid concurrent writers to the same files. Batch truly mechanical
same-shape edits only when the plan and ownership permit it.

Use [implementer-prompt.md](implementer-prompt.md). The implementer makes the
scoped change, runs proportionate meaningful checks, self-reviews, and reports
status plus source identity. Do not require commits when the task is source-only
or when shared uncommitted work makes a snapshot the correct review unit.

| Status | Controller action |
|---|---|
| DONE | Capture the exact source and proceed to spec review |
| DONE_WITH_CONCERNS | Read concerns, resolve correctness/scope gaps, then review |
| NEEDS_CONTEXT | Supply missing facts or record a routine decision; avoid redispatching the same incomplete brief |
| BLOCKED | Inspect the actual blocker; narrow the task, supply context, or choose an available authorized approach |

### 2. Spec compliance, then code quality

Start a fresh spec reviewer with
[spec-reviewer-prompt.md](spec-reviewer-prompt.md). It compares actual source with
the exact requirements, reports missing/extra behavior with path/line evidence,
and names anything it cannot verify. Verify report claims against source and
artifacts; do not assume speed or confidence proves either correctness or error.

After spec compliance passes, start a **separate fresh** quality reviewer using
[code-quality-reviewer-prompt.md](code-quality-reviewer-prompt.md), on the same
source identity. Preserve both gates. A reviewer verifies meaningful behavior,
tests, integration risks, and maintainability in the changed scope. It need not
repeat passing tests on identical source unless a concrete concern justifies it.

Give each reviewer current findings verbatim and the package path. Do not tell
reviewers what not to flag or silently discard findings. Resolve any requirement
that cannot be checked from the package before marking it satisfied.

### 3. Repair and scoped re-review

When a gate finds a real issue, assign the fix with the finding, relevant source,
acceptance criterion, and covering checks. Record the repair's exact source and
validation. Start a fresh reviewer for the affected gate with
[re-review-prompt.md](re-review-prompt.md); its scope is the prior findings and new
breakage introduced by the repair. Preserve unrelated observations in the ledger
without allowing them to expand the task silently.

A repair changes the source under review. Confirm spec compliance for the changed
requirements before accepting quality review on the new identity. The ledger
must show both gates apply to the final source, including any scoped revalidation
of an otherwise unchanged gate. Implementer self-review does not replace either
gate. Review of an older snapshot cannot approve a newer repair.

Bound the loop: normally allow at most **five fix rounds per task**, each followed
by scoped re-review. Honor a different explicit task budget. At the cap, record
unresolved findings, evidence, attempted fixes, and a concrete next action.
Do not mark a task complete with unresolved material defects. Continue safe
independent authorized work where possible; do not launch an endless retry loop
or ask again for permission already given.

### 4. Complete and recover

Mark complete only when the scoped implementation is present, required checks
pass on its current identity, and both review gates apply to that source. Record
approvals and source/validation artifacts in the ledger before moving on.

After an interruption or compaction, read this plan's ledger, inspect native task
statuses/returned IDs, and compare actual source with recorded identities.
Recover reports from existing tasks before redispatching them. Resume at the
first incomplete stage. If source changed after an approval, record the new
snapshot and revalidate the affected gates. Missing evidence is a recovery item,
not grounds to claim completion or redo unrelated finished work.

## Final review and handoff

Run a fresh review of the complete implementation against the plan and the
branch/snapshot baseline, including interactions across tasks and unresolved
ledger items. Package the full range rather than only the last task. Bind fixes
and any re-review to the repaired source as above.

Retain the ledger, reports, source manifests, and review/validation evidence for
recovery. Do not automatically delete evidence or another task's workspace.
Report the delivered behavior, validation, material limits, and routine rulings
that affect the result. Perform only the finishing actions already authorized;
this workflow does not require a missing `superpowers:*` skill or an automatic
commit, push, merge, or release.
