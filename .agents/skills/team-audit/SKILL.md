---
name: "team-audit"
description: "Coordinate architecture, UX, and security audits with prioritized remediation and independent security sign-off before a release or broad subsystem quality assessment."
---

# Full audit: The Crucible

Execute the [shared team procedure](../subagent-protocol/references/team-execution.md) once per run. It supplies capability briefs, host/provider inheritance, ownership, review budgets, evidence, recovery, and optional pane/Kiro adapters. Delegation must already be authorized.

## Roles and ownership

| Role | Profile / native alias | Responsibility |
| --- | --- | --- |
| Architect | `architect` (`arcwright-architect`) | Read-only structure/integration audit |
| UX | `ux-designer` (`arcwright-ux-designer`) | Read-only accessibility, interaction, visual/token audit |
| Security | `review-orchestrator` (`arcwright-review-orchestrator`), security lens | Read-only vulnerability audit and final sign-off |
| Dev | `dev` (`arcwright-dev`) | Remediation source changes |

## Stages

1. Audit the same fixed target with Architect, UX, and Security independently. Run reviewers concurrently only within live capacity; each owns a separate report. Security checks injection, XSS, auth/authorization bypass, IDOR, secrets, and unsafe data handling where relevant.
2. Merge findings by owner and severity: critical security first, then other critical, major, and minor. Dev fixes substantiated findings in a batch and maps each patch to its finding.
3. Re-audit changed areas with the affected reviewers. Security always rechecks security-tagged fixes and assesses new security risks from the remediation. Changes to another reviewer's assumptions require that reviewer to recheck too.
4. Repeat only for material open findings or changed behavior under the shared budget. Keep declined findings with an evidence-based reason; do not mistake them for reviewer approval.

## Completion

Architecture and UX have no unresolved blocking findings on the current scope, and Security independently gives final clean sign-off on the current patch, even if the initial audit found no vulnerabilities. Report all finding outcomes and verification limits; budget exhaustion cannot substitute for sign-off.
