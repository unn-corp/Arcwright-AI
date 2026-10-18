---
name: "team-solo-dev"
description: "Delegate a clear, bounded implementation task or sequential queue to one quick-flow developer for lightweight planning, implementation, and self-validation without a review team."
---

# Solo Dev: Ghost

Execute the [shared team procedure](../subagent-protocol/references/team-execution.md) once per run. It supplies capability briefs, host/provider inheritance, ownership, review budgets, evidence, recovery, and optional pane/Kiro adapters. Delegation must already be authorized.

## Roles and ownership

| Role | Profile / native alias | Responsibility |
| --- | --- | --- |
| Solo Dev | `quick-flow-solo-dev` (`arcwright-quick-flow-solo-dev`) | Scoped plan, source implementation, self-validation |

## Stages

1. Coordinator orders the authorized queue with acceptance criteria and owned paths. Use the active agent directly instead when delegation is not authorized or adds no value.
2. Solo Dev states a brief implementation approach using the existing spec/context, implements the smallest complete change, and self-validates the public behavior with focused checks and required gates. Do not require a separate spec artifact for an already clear routine task.
3. Coordinator inspects actual changes and evidence before marking the item complete. Continue sequentially through the queue, carrying forward relevant decisions, current source state, and prior results. Reuse compatible native context only where supported; use the shared host dispatch rules otherwise.

## Completion

Every completed queue item meets its acceptance criteria with evidence; any blocked item is explicit. No independent review is claimed by this single-role preset. Add review only for a concrete remaining risk or an existing repository/user requirement, not as automatic ceremony.
