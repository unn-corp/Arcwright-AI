---
name: "team-solo-qa"
description: "Quick rules for Solo QA: The Inquisitor."
---

# Solo QA: The Inquisitor quick rules

One QA specialist executes the requested regression/smoke/UI/API checks and reports observed results. No production implementation. Confirm actual selected cases and build; absent or skipped verification is incomplete. Rerun only for changed code, failures, or a concrete remaining risk.

Read [SKILL.md](SKILL.md) and the [shared team procedure](../subagent-protocol/references/team-execution.md) for execution. Inherit user/host choices, include installed skill discovery in each handoff, and bind review evidence to the current source. Use focused checks and required gates. Native continuation is conditional on host support; each T3 delegated review round uses a fresh task. Keep working files in the active project’s Arcwright run area or host evidence storage. No AI attribution.
