---
name: "team-sec-qa"
description: "Quick rules for Security remediation: The Vault."
---

# Security remediation: The Vault quick rules

Security finds; Dev remediates; QA independently exercises live exploit paths and valid behavior; Security signs off. Code changes or unit tests alone do not prove exploit closure. Missing live evidence leaves the gate incomplete. Do not start remediation roles for a no-findings review.

Read [SKILL.md](SKILL.md) and the [shared team procedure](../subagent-protocol/references/team-execution.md) for execution. Inherit user/host choices, include installed skill discovery in each handoff, and bind review evidence to the current source. Use focused checks and required gates. Native continuation is conditional on host support; each T3 delegated review round uses a fresh task. Keep working files in the active project’s Arcwright run area or host evidence storage. No AI attribution.
