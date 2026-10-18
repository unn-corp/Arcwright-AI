---
name: "team-ux-arch"
description: "Create coherent UX wireframes, component specifications, API contracts, and data-flow designs with two specialists before implementation. Design artifacts only, with conditional conflict resolution."
---

# UX + Architecture: The Blueprint Room

Execute the [shared team procedure](../subagent-protocol/references/team-execution.md) once per run. It supplies capability briefs, host/provider inheritance, ownership, review budgets, evidence, recovery, and optional pane/Kiro adapters. Delegation must already be authorized.

## Roles and ownership

| Role | Profile / native alias | Responsibility |
| --- | --- | --- |
| UX | `ux-designer` (`arcwright-ux-designer`) | Wireframes, component specs, interactions |
| Architect | `architect` (`arcwright-architect`) | API/data-flow analysis, feasibility, validation |

## Stages

1. UX creates wireframes, component specifications, and interaction notes while Architect analyzes required data, endpoints, and feasibility from the same brief. Their artifact paths are disjoint. Use bounded prototypes in the run area only to resolve concrete design uncertainty.
2. Architect validates the UX output against API/data constraints, producing contracts, data-flow diagrams, and integration notes. Name any `DESIGN_CONFLICT` explicitly with its impact.
3. Only if conflicts exist, coordinator asks both roles for compatible UX/architecture resolutions. Resolve choices supported by the existing requirements; present options to the user only when an unresolved product tradeoff changes the result. Keep the shared review budget; this is not an implementation loop.
4. Coordinator verifies and collates the final design artifacts and remaining decisions.

## Completion

Wireframes, component specs, contracts, data-flow diagrams, and integration notes exist and agree, or outstanding conflicts are explicitly unresolved. No production implementation. Any experimental prototype remains separate from application source. The package is ready for an authorized implementation team, not automatically dispatched to one.
