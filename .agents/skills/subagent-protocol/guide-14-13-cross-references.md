# Related capabilities

Select these only when the current task needs them:

- [Arcwright router](../arcwright/SKILL.md): discover installed skills, workflows,
  and profiles; `scripts/agent-capabilities.cjs` supplies small role suggestions.
- [Project context](../project-context/SKILL.md): resolve missing project decisions;
  reuse already supplied context rather than rescanning before every stage.
- [Shared team procedure](references/team-execution.md): dispatch, ownership,
  evidence, and gates for team presets.
- [Test quality](../test-quality/SKILL.md): useful focused verification.

Profiles share `_arcwright/core/resources/agent-runtime.md` in the installed
Arcwright module tree. Its runtime contract and the user's project instructions
govern activation; generated architecture notes are reference material, not a
replacement instruction source. Host-specific environment flags and call examples
apply only when that host supports and needs them.
