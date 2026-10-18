---
name: "team-hotfix"
description: "Deliver an explicitly admitted emergency fix within four files in one isolated subsystem, followed by mandatory independent security review. Excludes new features and architectural refactors."
---

# Hotfix: Rapid Response

Execute the [shared team procedure](../subagent-protocol/references/team-execution.md) once per run. It supplies capability briefs, host/provider inheritance, ownership, review budgets, evidence, recovery, and optional pane/Kiro adapters. Delegation must already be authorized.

## Roles and ownership

| Role | Profile / native alias | Responsibility |
| --- | --- | --- |
| Dev | `dev` (`arcwright-dev`) | Targeted fix within admitted paths |
| Security | `review-orchestrator` (`arcwright-review-orchestrator`), security lens | Read-only security regression review and sign-off |

## Emergency admission

Before spawning, coordinator must have the user's explicit `[emergency]` confirmation for this incident; honor it if already present. Verify a maximum of **four touched files in one isolated subsystem**, including tests and follow-up edits. Count the cumulative hotfix paths, not each batch separately. No new feature, cross-cutting change, architectural refactor, architectural-review loop, UX review, or specification phase.

If admission is missing or the guard cannot hold, stop this preset and present narrowing or a full-track alternative. Emergency admission does not authorize touching production, deployment, or merge; those still follow the current user/host grant.

## Stages

1. Coordinator directly verifies emergency admission, subsystem, and expected file scope; no agent is needed for that check.
2. Dev reproduces/diagnoses and applies the smallest targeted fix. Report `GUARDRAIL_BLOCKED` before widening scope. Coordinator inspects the cumulative actual diff and focused regression evidence.
3. Security reviews only the fix's security/regression implications: attack surface, auth bypass, injection, secrets, and data handling. Return approved or a specific blocking concern; architectural taste is outside this review.
4. This is a linear emergency path, not a generic iterative audit. If blocked, surface the concern and options to the user. Any already-authorized rework must retain the same guardrails and receive a new Security review before proceeding.

## Completion

The admitted fix remains within four files/one subsystem, focused required verification is recorded, and Security independently approves the current patch before any PTM/merge-readiness handoff. A blocked review cannot be waived by the coordinator. New disjoint incidents use a fresh run and task set.
