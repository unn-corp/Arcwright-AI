---
name: "team-arch-dev"
description: "Coordinate architectural design, implementation, and an independent architectural spot-check for changes with consequential API, data-model, or subsystem decisions."
---

# Architect + Dev: The Foundry

Execute the [shared team procedure](../subagent-protocol/references/team-execution.md) once per run. It supplies capability briefs, host/provider inheritance, ownership, review budgets, evidence, recovery, and optional pane/Kiro adapters. Delegation must already be authorized.

## Roles and ownership

| Role | Profile / native alias | Responsibility |
| --- | --- | --- |
| Architect | `architect` (`arcwright-architect`) | Design, optional isolated spike, read-only spot-check |
| Dev | `dev` (`arcwright-dev`) | Requested production implementation and fixes |

## Stages

1. Architect proposes the smallest viable design, API/data-flow contracts, risks, and rationale. Put any necessary feasibility prototype in the run area; do not let a spike silently become production code.
2. Dev implements the agreed design and acceptance criteria, reporting necessary deviations with evidence. Inspect the actual patch and focused verification.
3. Architect spot-checks the current implementation against the design and integration contracts, returning approval or specific findings with severity and locations.
4. If findings remain, Dev fixes the substantiated batch and Architect rechecks only affected areas under the shared budget.

## Completion

Architect approves the current patch; acceptance evidence and required checks are complete. Report design decisions, deviations, changed files, and any remaining risks. This team does not itself authorize publication or merge.
