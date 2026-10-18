---
name: "team-sec-qa"
description: "Find scoped vulnerabilities, remediate them, verify real exploit paths independently through UI/API behavior, and obtain final security sign-off."
---

# Security remediation: The Vault

Execute the [shared team procedure](../subagent-protocol/references/team-execution.md) once per run. It supplies capability briefs, host/provider inheritance, ownership, review budgets, evidence, recovery, and optional pane/Kiro adapters. Delegation must already be authorized.

## Roles and ownership

| Role | Profile / native alias | Responsibility |
| --- | --- | --- |
| Security | `review-orchestrator` (`arcwright-review-orchestrator`), security lens | Vulnerability findings and final read-only sign-off |
| Dev | `dev` (`arcwright-dev`) | Security remediation source changes |
| QA | `qa` (`arcwright-qa`) | Independent live exploit-path verification and evidence |

## Stages

1. Security reviews the authorized target for relevant OWASP risks: injection, XSS, auth/authorization bypass, IDOR, secrets, and unsafe data handling. Each finding needs severity, location, exploitation path, and evidence. If none exist, record that conclusion without inventing a remediation stage.
2. Dev remediates vulnerabilities in severity order, mapping each patch to its finding and preserving intended valid behavior.
3. QA independently attempts each reported exploit through the actual UI/API in the authorized test environment using host tools or the relevant installed runner. Verify the unsafe outcome is closed and the legitimate path still works. Unit-test success or a code diff alone does not establish exploit-path closure.
4. Security reviews the actual patch and QA evidence, then signs off or names remaining concerns. Remediate and reverify material open issues under the shared budget, retaining the full finding/response history.

## Completion

Security independently signs off on the current patch and every remediated finding has QA evidence of exploit-path closure. If an environment/tool prevents live verification, report that item unverified and the gate incomplete. Security can close a no-findings review without unnecessary Dev/QA tasks. This preset grants no production or external testing authority.
