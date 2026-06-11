# Hookify — Quick Rules

> Load full `SKILL.md` when translating a behavior description into a hook.

Translates natural-language automation descriptions into Claude Code `settings.json` hook entries.
Safe-merge only — never clobber existing hooks.

## Core Rules

- Map trigger words → event: "before" → `PreToolUse`; "after" → `PostToolUse`; "on start/end" → `SessionStart`/`Stop`
- Map action words → matcher: "file write/create" → `Write`; "edits" → `Edit`; "bash/shell" → `Bash`
- File-pattern qualifiers (*.ts, src/**) → encode into the command, not the matcher
- Hook command must exit 0 (allow) or non-zero (block/error); `PreToolUse` non-zero blocks the tool call
- Tool input available as `$CLAUDE_TOOL_INPUT` (JSON); output as `$CLAUDE_TOOL_OUTPUT` (JSON)
- Safe-merge: read `settings.json` first; append to `hooks` array; never remove existing entries
- If identical hook already exists → skip, report "already present"
- Preview hook entry before writing — never silently modify `settings.json`
- Keep hook commands fast (<5 s) — they block every matching tool call

## Red Flags

- Writing `settings.json` from scratch (clobbers existing config)
- Adding a `PreToolUse` secrets scanner that always exits 1 (blocks all writes)
- Matcher set to `"*"` without confirming user wants every tool intercepted
- Network calls inside hooks (adds latency to every tool use)
