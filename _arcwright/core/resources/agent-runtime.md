# Agent runtime contract

Read once per task and reuse. This contract overrides legacy activation examples.

- Execute a supplied user/orchestrator/model task directly. Show a menu only when
  requested or no actionable task exists. Ask only for consequential missing facts.
- A profile's `<menu src="..."/>` points to conditional menu help, resolved relative
  to that profile in the active module tree. Read it for help/navigation, explicit
  menu commands, or needed workflow routing. Its handlers and command IDs remain
  available; ordinary task execution does not preload it.
- Read applicable `AGENTS.md` and relevant config once, preserving host precedence.
  Shared rules belong there; required host files import them. Select
  skills from catalog metadata; load only the entrypoint and references needed now.
  Avoid duplicate project/global copies and unrelated skill loads.
- Reuse a supplied capability brief: role, suggested installed skills and their
  `resolvedPath`, and discovery paths. Suggestions are nonexclusive and never a
  required preload. Read a relevant `SKILL.md` directly when no native Skill tool
  exists. For discovery, locate the installed `arcwright` skill from host metadata
  or the active project's skills directory and run its
  `scripts/agent-capabilities.cjs --role <profile-slug> --task <task>` once when
  useful. The host's global skills directory is fallback for a global-only install.
  Pass arguments as data. Use its finder to discover additional skills; missing
  optional suggestions do not block unrelated work or authorize installation.
- Before delegation, include that small capability brief, objective, owned files,
  source identity, acceptance evidence, available tool constraints, and known
  decisions. The child may select other installed skills within its authorization.
  Reuse the brief until task, workspace, or installation changes; do not transmit
  the full catalog. Return results, changed files, evidence, and material limits.
- Preserve scope and existing authorization. Automatic selection grants no extra
  authority for external messages, production changes, publishing, or merging.
  Unnamed Development MCP and its standards load only for explicitly requested MCP
  work; ordinary coding has no tracker preflight, sync, or pending-payload report.
- Use `subagent-protocol` for the shared delegation lifecycle; workflows add stages.
  Follow host tool, model, and concurrency rules. Retain task IDs and
  verify child results. Use normal privileges; load `gsudo` only for needed elevation.
  Prefer native preview tools. Preserve `DESIGN.md` and accessibility; no eyebrow
  labels or em dashes in user-facing copy.
- Keep installed profiles/skills read-only during execution. Working artifacts use
  `_arcwright/_memory/skill-runs/<workflow>-<run>/`; authorized source edits stay in
  their requested files. Use host-allocated evidence storage when exposed.
- Verify changed behavior and required completion checks. Broaden or repeat tests
  for new changes or unresolved concerns. Report observed results and limits
  concisely, without AI attribution; retain required source/license credits.
- For test authoring/review, load `test-quality` once. Reuse existing fixtures and
  the nearest suitable test; choose checks that distinguish a plausible defect in
  public behavior. Keep planning, added cases, tool output, and execution focused.
