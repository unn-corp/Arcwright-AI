---
name: "team-full-dev"
description: "Coordinate Dev and QA for feature work with an Architect available only for consequential technical questions that the implementer cannot resolve confidently."
allowed-tools: Read, Grep, Glob, Write, Edit, Agent, SendMessage, Bash, mcp__t3_code__orchestrator_capabilities, mcp__t3_code__delegate_task, mcp__t3_code__task_status, mcp__t3_code__task_cancel
---

# Implementation with consultation: The Engine Room

Execute the [shared team procedure](../subagent-protocol/references/team-execution.md) once per run. It supplies capability briefs, host/provider inheritance, ownership, review budgets, evidence, recovery, and optional pane/Kiro adapters. Delegation must already be authorized.

## Roles and ownership

| Role | Profile / native alias | Responsibility |
| --- | --- | --- |
| Dev | `dev` (`arcwright-dev`) | Implementation and fixes |
| QA | `qa` (`arcwright-qa`) | Independent acceptance validation |
| Architect, conditional | `architect` (`arcwright-architect`) | Scoped technical recommendation, read-only by default |

## Stages

1. Dev implements the requested behavior. Resolve routine choices from project conventions without user interruption.
2. If a consequential unresolved data-model, API, caching, or integration decision blocks reliable implementation, coordinator routes the specific question and evidence to Architect. Architect gives an actionable recommendation and rationale; Dev continues. Do not start an idle Architect in anticipation or add a formal architecture gate to every task.
3. QA independently validates the actual patch against acceptance criteria with focused checks and required gates. Observe relevant UI/runtime behavior using host tools or installed runner guidance.
4. Dev fixes concrete QA failures; QA rechecks affected behavior under the shared budget. Further Architect consultation is conditional on a new material question.

## Completion

QA approves the current implementation with evidence for acceptance criteria and required checks. Report consulted decisions and remaining limits. Architect is an on-demand adviser, not an automatic sign-off authority for this preset.
