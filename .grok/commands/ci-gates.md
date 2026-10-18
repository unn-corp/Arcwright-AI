---
description: Set up or audit CI quality gates, local hooks, coverage gaps, and required checks for the current project.
---

# CI gates

Load `.agents/skills/ci-gates/SKILL.md` and execute it for `$ARGUMENTS` or the supplied
task. Preserve existing decisions and gates. Use project scope unless global scope
was requested. Detect the stack and existing CI/hooks before choosing setup or audit;
`setup` and `audit` explicitly select the mode.

In audit mode, prioritize untested high-risk modules and gate drift; report findings
without re-scaffolding or bulk-writing tests. In setup mode, adapt the skill's
hook, workflow, and coverage references to this repository and its runner fleet.
Read branch-protection and runner details only when those topics are in scope.
Repository/ruleset writes, branch creation, and global installation require existing
authorization for those actions; do not repeat an approval already given. Report
observed verification and any unavailable administrative capability honestly.
