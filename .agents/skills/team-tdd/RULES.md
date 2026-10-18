---
name: "team-tdd"
description: "Quick rules for TDD pod: The Forge."
---

# TDD pod: The Forge quick rules

Authorized multi-agent TDD only. QA owns focused contract checks and intended failure evidence; Dev implements without weakening expectations; QA independently verifies green and required gates. Reuse existing tests/fixtures. Refactor after green only when useful, then recheck affected behavior.

Read [SKILL.md](SKILL.md) and the [shared team procedure](../subagent-protocol/references/team-execution.md) for execution. Inherit user/host choices, include installed skill discovery in each handoff, and bind review evidence to the current source. Use focused checks and required gates. Native continuation is conditional on host support; each T3 delegated review round uses a fresh task. Keep working files in the active project’s Arcwright run area or host evidence storage. No AI attribution.
