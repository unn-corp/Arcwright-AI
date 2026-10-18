---
description: Choose and execute one of Arcwright's 17 team workflows for a supplied task; respects the host's delegation tools and limits.
---

# Team

Use `$ARGUMENTS` or the current task. If a team code was supplied, load
`.agents/skills/team-<code>/SKILL.md` directly. Otherwise choose the best fit from
`.agents/skills/triage/compositions.md` and state that choice briefly. Ask only when
there is no actionable goal or a consequential ambiguity prevents choosing.

Execute the selected team's workflow using the host's native or Arcwright Code/T3
Code delegation tools. Follow the current provider/model choices, authorization,
concurrency limits, and workspace requirements. Load the compact
`subagent-protocol` entrypoint for a multi-step orchestration; load only the
host-specific examples needed. Retain task IDs and acceptance evidence, sequence
dependent work, and avoid duplicate tasks.

Herdr is used only when the user explicitly requests visible panes; an environment
variable alone does not require a mode question. Use host waiting/status tools,
keep installed bundles read-only, and put runtime artifacts in the project's
Arcwright run or host evidence storage. Report the result, verification, and
remaining issues without model attribution. Team selection does not authorize
publishing, merging, production operations, or unrelated external actions.
