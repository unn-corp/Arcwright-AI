---
name: "team-dev-qa"
description: "Coordinate scoped implementation and independent acceptance validation, routing concrete QA failures back to Dev until the requested behavior is verified."
allowed-tools: Read, Grep, Glob, Write, Edit, Agent, SendMessage, Bash, mcp__t3_code__orchestrator_capabilities, mcp__t3_code__delegate_task, mcp__t3_code__task_status, mcp__t3_code__task_cancel
---

# Dev + QA

Execute the [shared team procedure](../subagent-protocol/references/team-execution.md) once per run. It supplies capability briefs, host/provider inheritance, ownership, review budgets, evidence, recovery, and optional pane/Kiro adapters. Delegation must already be authorized.

## Roles and ownership

| Role | Profile / native alias | Responsibility |
| --- | --- | --- |
| Dev | `dev` (`arcwright-dev`) | Requested implementation and fixes |
| QA | `qa` (`arcwright-qa`) | Independent acceptance validation and report |

## Stages

1. Dev implements the scoped task and acceptance criteria, listing actual changed paths and focused verification.
2. QA independently validates the current implementation against those criteria. Select the cheapest adequate checks with `test-quality`; observe live UI/runtime behavior when the contract requires it. Use host browser tools or installed runner guidance as applicable.
3. If QA reports failures, Dev fixes each substantiated failure and QA revalidates the affected acceptance surface. Preserve prior findings and current source evidence in every handoff. Do not rerun unrelated green checks without a reason.

## Completion

QA gives a pass for the current patch and required repository gates have evidence. Unavailable checks, skipped cases, or an exhausted review budget remain explicit limitations, not a passing verdict. Report changed files, observed checks, and resolved/open findings.
