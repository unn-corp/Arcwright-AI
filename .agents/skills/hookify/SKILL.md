---
name: hookify
description: >
  Use when a user describes a behavioral automation in natural language ("before every file write,
  scan for secrets"; "after edits to *.ts, run typecheck") and needs it translated into a correct
  Claude Code hook entry in `.claude/settings.json`. Also use when auditing existing hooks or
  explaining what a hook does.
allowed-tools: Read, Edit, Write, Bash
---

# Hookify — Natural Language → Claude Code Hook Generator

Translate behavior descriptions into correct `settings.json` hook entries.
Safe-merge: never clobber existing hooks.

---

## Hook Event Reference

| Event | When it fires | Typical use |
|-------|--------------|-------------|
| `PreToolUse` | Before any tool call | Block dangerous ops, validate args, inject secrets scan |
| `PostToolUse` | After any tool call completes | Run typecheck, lint, log output |
| `SessionStart` | When a Claude Code session opens | Load context, announce environment |
| `Stop` | When Claude finishes responding | Notify, post-process, sync files |
| `SubagentStop` | When a spawned sub-agent exits | Collect sub-agent artifacts |
| `UserPromptSubmit` | When user submits a message | Sanitize input, prepend context |

### Matcher field

- `matcher` is a **glob or regex** on the tool name (for `PreToolUse`/`PostToolUse`) or omitted for session events.
- Tool names: `Write`, `Edit`, `Read`, `Bash`, `Glob`, `Grep`, `Agent`, `WebFetch`, `WebSearch`, `NotebookEdit`, `TodoWrite`.
- Match multiple with a pipe-separated glob: `"Write|Edit"`.
- Match all writes: `"Write"` (exact) or `"Write|Edit|NotebookEdit"`.

### Command field

- Shell command string executed in the project root.
- Receives hook context as environment variables: `CLAUDE_TOOL_NAME`, `CLAUDE_TOOL_INPUT` (JSON), `CLAUDE_TOOL_OUTPUT` (JSON).
- Non-zero exit = hook failure; Claude Code surfaces the error.
- Long-running commands block the tool call — keep hooks fast (<5 s) or background them with `&`.

---

## Step-by-Step Procedure

### 1. Parse the intent

Map the user's description to:
- **When**: `PreToolUse` (before) or `PostToolUse` (after) or session event
- **What tool(s)**: derive from action words ("file write" → `Write`; "edits to *.ts" → `Edit`)
- **Filter (optional)**: if a file-pattern qualifier exists, encode it into the command (the hook fires on every match, but the command can exit 0 early if the path doesn't match the pattern)
- **Command**: the shell command to execute

### 2. Draft the hook JSON object

```json
{
  "event": "PostToolUse",
  "matcher": "Edit",
  "command": "if echo \"$CLAUDE_TOOL_INPUT\" | jq -e '.file_path | test(\"\\\\.ts$\")' > /dev/null 2>&1; then npx tsc --noEmit; fi"
}
```

### 3. Safe-merge into settings.json

Read `.claude/settings.json` (or `~/.claude/settings.json` for global).
- If `hooks` key absent → add `"hooks": [<new-hook>]`.
- If `hooks` present → append new hook object to the array.
- Never remove, reorder, or rewrite existing hook entries.
- If an identical `{event, matcher, command}` already exists → report "already present", skip.

Use `Edit` to apply the change — minimal diff, never rewrite the whole file.

### 4. Confirm

Show the final hook entry and the line range in `settings.json` where it was inserted.
State what will trigger it.

---

## Common Patterns

### Secrets scan before any file write
```json
{
  "event": "PreToolUse",
  "matcher": "Write|Edit|NotebookEdit",
  "command": "echo \"$CLAUDE_TOOL_INPUT\" | jq -r '.content // .new_string // \"\"' | grep -qiE '(AKIA|sk-|ghp_|xox[baprs]-|-----BEGIN (RSA|EC|OPENSSH) PRIVATE KEY)' && { echo 'HOOKIFY: possible secret detected — aborting write'; exit 1; } || exit 0"
}
```

### TypeScript typecheck after .ts edits
```json
{
  "event": "PostToolUse",
  "matcher": "Edit|Write",
  "command": "echo \"$CLAUDE_TOOL_INPUT\" | jq -e '.file_path | test(\"\\\\.tsx?$\")' > /dev/null 2>&1 && npx tsc --noEmit || exit 0"
}
```

### Notify on session end
```json
{
  "event": "Stop",
  "command": "echo 'Claude session ended at '$(date) >> ~/.arcwright-sessions.log"
}
```

### Log every bash command
```json
{
  "event": "PostToolUse",
  "matcher": "Bash",
  "command": "echo \"$(date -Is) BASH: $(echo $CLAUDE_TOOL_INPUT | jq -r '.command // \"\"')\" >> .claude/bash-history.log"
}
```

---

## Constraints

- Hooks run with the same permissions as the Claude Code process — no privilege escalation.
- `PreToolUse` hooks that exit non-zero **block** the tool call. Use carefully.
- Avoid network calls in hooks — they add latency to every tool use.
- If the user's described behavior requires reading tool output, use `PostToolUse` with `CLAUDE_TOOL_OUTPUT`.
- Always preview the hook entry before writing. Never silently modify `settings.json`.

---

## Output Format

After writing the hook:

```
HOOK ADDED
  Event:   PostToolUse
  Matcher: Edit|Write
  Command: <command>
  Written to: .claude/settings.json (line NN)

Triggers: after every Edit or Write tool call.
```
