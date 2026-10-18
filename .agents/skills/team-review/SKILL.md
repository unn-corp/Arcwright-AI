---
name: "team-review"
description: "Review a scoped patch or subsystem through independent architecture and UX lenses, batch substantiated fixes to Dev, and recheck only affected findings."
---

# Architecture + UX review and fixes

Execute the [shared team procedure](../subagent-protocol/references/team-execution.md) once per run. It supplies capability briefs, host/provider inheritance, ownership, review budgets, evidence, recovery, and optional pane/Kiro adapters. Delegation must already be authorized.

## Roles and ownership

| Role | Profile / native alias | Responsibility |
| --- | --- | --- |
| Architect | `architect` (`arcwright-architect`) | Read-only structural/integration review |
| UX | `ux-designer` (`arcwright-ux-designer`) | Read-only accessibility, tokens, interaction, visual review |
| Dev | `dev` (`arcwright-dev`) | Remediation source changes |

## Stages

1. Architect and UX review the same current scope independently, concurrently when capacity permits, with separate reports. Architect checks structural/API/integration correctness and meaningful DRY/SOLID concerns; UX checks accessibility, interactions, design tokens, and visual consistency.
2. Coordinator merges findings by severity and reviewer, preserving evidence and finding IDs. If both approve with no findings, finish without starting Dev. Otherwise Dev fixes substantiated items in priority order without unrelated cleanup.
3. Only reviewers whose findings or assumptions were affected recheck the changed areas. Pass their original findings, prior responses, actual patch, and current source fingerprint. Repeat only for material unresolved findings under the shared budget.

## Completion

Both independent review lenses approve the current scope with no unresolved blocking findings, and verification covers the fixes. Keep reasoned declines visible to their reviewer; coordinator cannot invent approval. This preset reports readiness and does not authorize merge.
