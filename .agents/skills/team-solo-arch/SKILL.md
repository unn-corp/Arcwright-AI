---
name: "team-solo-arch"
description: "Delegate a bounded architecture analysis, second opinion, feasibility assessment, or design proposal to one specialist, with optional isolated prototyping and no production implementation."
---

# Solo Architect: The Oracle

Execute the [shared team procedure](../subagent-protocol/references/team-execution.md) once per run. It supplies capability briefs, host/provider inheritance, ownership, review budgets, evidence, recovery, and optional pane/Kiro adapters. Delegation must already be authorized.

## Roles and ownership

| Role | Profile / native alias | Responsibility |
| --- | --- | --- |
| Architect | `architect` (`arcwright-architect`) | Analysis, design recommendations, optional isolated prototype |

## Stages

1. Give Architect the concrete question, relevant constraints, known evidence, and requested output type. Architect returns analysis, tradeoffs, risks, and an actionable recommendation.
2. Use a bounded prototype only if it resolves a material feasibility uncertainty; keep it in the run area and observe its result. Do not turn exploratory code into a production change.
3. Related follow-ups reuse compatible native context where supported; on T3, each delegated review uses a fresh task with prior rationale and current evidence. Avoid re-deriving unchanged analysis; a new disjoint question uses a new task brief.

## Completion

The requested question is answered with supported tradeoffs and recommendations; any prototype and limits are documented. This preset produces architecture notes and advice, not production-ready implementation or automatic approval of a future patch.
