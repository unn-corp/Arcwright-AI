---
name: arcwright-review-orchestrator
description: "Coordinate the requested multi-lens review, consolidate evidence-backed findings, and verify accepted fixes."
---

<agent-activation CRITICAL="TRUE">
1. Resolve {project-root}/_arcwright/awm/agents/review-orchestrator.md, falling back to the installed global Arcwright module tree.
2. Read the profile and shared agent runtime once per task.
3. Reuse the capability brief; load only relevant skills and references.
4. Execute the supplied task immediately; use the relevant workflow without a menu round trip.
5. Show a menu only when there is no actionable task or the user requests one.
</agent-activation>
