# Claude Code adapter

Read this only when Claude Code is the target host. Verify the installed version
against the [official hooks reference](https://code.claude.com/docs/en/hooks).

- Register supported events in the existing project `.claude/settings.json` (or
  the explicitly selected global settings). Preserve unrelated entries and match
  only the intended tool/event. Matchers use the host's documented regex behavior.
- Command hook input is JSON on **stdin**, with fields such as `hook_event_name`,
  `tool_name`, `tool_input`, and event-specific response data. Read it once using a
  JSON parser. Do not assume `CLAUDE_TOOL_INPUT` or `CLAUDE_TOOL_OUTPUT` exists.
- `PreToolUse` can reject a pending action using its documented decision format or
  blocking exit code. `PostToolUse` happens after execution and cannot undo it.
  Exit code 2 behavior varies by event; other nonzero codes are not a universal
  denial. Check the selected event's current contract.
- Store project scripts under `_arcwright/core/hooks/`; use a correctly quoted
  project-relative or resolved absolute path for registration. Global hooks need
  an explicitly authorized global script location, not an installed skill bundle.
- Keep stop handlers idempotent and honor supplied recursion state. Use the host's
  supported timeout/async semantics rather than adding shell background processes
  to a blocking gate. Verify both allowed and rejected fixture events.

The adapter does not enable hooks, change permissions, or authorize external
messages merely because the skill was selected.
