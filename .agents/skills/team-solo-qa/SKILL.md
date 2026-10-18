---
name: "team-solo-qa"
description: "Delegate a standalone regression, smoke, API, or UI validation run to one QA specialist, producing observed results without attached production implementation."
---

# Solo QA: The Inquisitor

Execute the [shared team procedure](../subagent-protocol/references/team-execution.md) once per run. It supplies capability briefs, host/provider inheritance, ownership, review budgets, evidence, recovery, and optional pane/Kiro adapters. Delegation must already be authorized.

## Roles and ownership

| Role | Profile / native alias | Responsibility |
| --- | --- | --- |
| QA | `qa` (`arcwright-qa`) | Test execution and evidence; no production source edits |

## Stages

1. Supply the target/build fingerprint, acceptance criteria, authorized environment, test scope, and any prior failures. QA selects installed `test-quality` and runner guidance only as needed.
2. Run the focused existing tests or observed UI/API flow, then required repository gates. Use host browser/device tools when applicable. Confirm the intended cases executed and retain failure evidence.
3. Return a structured report: scope/target, commands or actions, executed/passed/failed/skipped counts when available, failures, and PASS/FAIL/INCOMPLETE. For an authorized rerun after a fix, reference the prior failures and identify which changed; do not repeat green runs without a reason.

## Completion

The requested scope has an evidence-backed verdict on the actual target. Missing prerequisites, zero executed cases, or unavailable checks mean INCOMPLETE. This preset verifies and reports; it does not silently attach implementation work, alter production source, or repair failures outside its remit.
