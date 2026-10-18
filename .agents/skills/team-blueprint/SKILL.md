---
name: "team-blueprint"
description: "Create a research-backed PRD and architecture feasibility package with PM, Analyst, and Architect. Produces planning artifacts and isolated feasibility prototypes, not production implementation."
---

# Strategic planning: The War Room

Execute the [shared team procedure](../subagent-protocol/references/team-execution.md) once per run. It supplies capability briefs, host/provider inheritance, ownership, review budgets, evidence, recovery, and optional pane/Kiro adapters. Delegation must already be authorized.

## Roles and ownership

| Role | Profile / native alias | Responsibility |
| --- | --- | --- |
| PM | `pm` (`arcwright-pm`) | PRD, backlog/acceptance criteria, planning synthesis |
| Analyst | `analyst` (`arcwright-analyst`) | Domain/user/competitive research, separate report |
| Architect | `architect` (`arcwright-architect`) | Feasibility, contracts, risks, optional isolated prototype |

## Stages

1. Analyst researches constraints, user needs, competitive context, and relevant prior art while PM drafts goals, stories, acceptance criteria, exclusions, and open questions. Their output paths are disjoint.
2. PM enriches the draft with research, separating observed evidence from assumptions and updating acceptance criteria.
3. Architect assesses the enriched PRD for feasibility, integration/data-flow implications, and technical risks. Use a bounded prototype only when it resolves a real uncertainty; keep it in the run area and verify its result.
4. PM or coordinator collates the PRD, research, architecture notes, key decisions, remaining questions, and recommended next steps. Correct concrete inconsistencies within the shared review budget.

## Completion

The planning package addresses the brief and contains traceable acceptance criteria, feasibility conclusions, risks, and an artifact index. Planning artifacts only: no production source changes, deployment, or automatic implementation. Put permanent requested documents in their designated project paths.
