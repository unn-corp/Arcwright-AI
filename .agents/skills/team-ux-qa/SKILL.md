---
name: "team-ux-qa"
description: "Implement a scoped interface change with a UX specialist who can write code, then independently validate its live visual, accessibility, and functional behavior with QA."
---

# UX implementation + QA: The Atelier

Execute the [shared team procedure](../subagent-protocol/references/team-execution.md) once per run. It supplies capability briefs, host/provider inheritance, ownership, review budgets, evidence, recovery, and optional pane/Kiro adapters. Delegation must already be authorized.

## Roles and ownership

| Role | Profile / native alias | Responsibility |
| --- | --- | --- |
| UX | `ux-designer` (`arcwright-ux-designer`) | Design and production UI implementation/revisions |
| QA | `qa` (`arcwright-qa`) | Independent live visual, accessibility, functional evidence |

## Stages

1. UX interprets the brief and implements the requested UI, using relevant installed design/frontend skills. The role can write production UI code; it is not restricted to wireframes. Follow project design conventions and assigned paths.
2. QA independently navigates the actual application and validates design intent, functional interactions, accessibility, and applicable responsive states. Prefer host browser/device tools; use installed `playwright-cli` or other runner guidance when appropriate. Screenshots alone do not prove interaction behavior.
3. For concrete failures, UX revises the implementation and QA rechecks affected live states and criteria under the shared budget. Preserve prior evidence and identify the build/source actually inspected.

## Completion

QA approves the current live implementation with relevant visual and functional evidence and required checks. If the app/environment is unavailable, report incomplete validation rather than replacing it with a purely mocked-test claim. Report changes, evidence, and remaining limits.
