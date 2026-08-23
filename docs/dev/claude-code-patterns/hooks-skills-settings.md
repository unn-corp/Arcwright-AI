# Hooks, Skills & Settings (Recent Additions)

Last verified: June 2026 (Claude Code v2.1.170)

Practical reference for Claude Code features relevant to building Arcwright agent workflows.
Covers hooks, skills, and settings added or changed since v2.1.130.

---

## Hooks

### Configuration Scopes

Hooks are resolved in priority order (last wins):

| Scope | File |
|-------|------|
| User global | `~/.claude/settings.json` |
| Project | `.claude/settings.json` |
| Project local (gitignored) | `.claude/settings.local.json` |
| Managed policy | Enterprise push |
| Plugin hooks | `.claude/skills/<name>/hooks/hooks.json` |
| Skill / command frontmatter | `allowed-tools`, `disallowed-tools` fields |

Disable all hooks without removing config:
```json
{ "disableAllHooks": true }
```

---

### Hook Types

| Type | Trigger |
|------|---------|
| `command` | Slash command runs |
| `http` | Outbound HTTP call |
| `mcp_tool` | MCP tool invoked |
| `prompt` | User sends a message |
| `agent` | Agent tool dispatch *(experimental)* |

---

### Hook Events (v2.1.130+)

#### MessageDisplay `(v2.1.152)`

Fires while assistant text is streaming. Lets you rewrite or hide the on-screen display without touching the transcript.

```json
{
  "hookSpecificOutput": {
    "displayContent": "Reformatted output here"
  }
}
```

- Return `displayContent` to replace what the user sees.
- Omit to pass through unchanged.
- Does **not** affect what Claude sees in transcript.

---

#### SubagentStart / SubagentStop `(v2.1.169)`

`SubagentStop` fires when a dispatched subagent finishes. You can inject feedback via `additionalContext` and continue the parent turn — not counted as a hook error.

```json
{
  "hookSpecificOutput": {
    "hookEventName": "SubagentStop",
    "additionalContext": "Subagent completed. Branch has 3 uncommitted files."
  }
}
```

Use this to build review-gate loops: block → inject context → Claude retries.

---

#### Stop / SubagentStop `additionalContext` `(v2.1.163)`

Both `Stop` and `SubagentStop` support `additionalContext`. Feed Claude post-turn feedback without blocking:

```json
{
  "hookSpecificOutput": {
    "hookEventName": "Stop",
    "additionalContext": "Branch has uncommitted changes — remind user to commit."
  }
}
```

Hook input for `Stop` / `SubagentStop` also includes:
- `background_tasks` — list of active background tasks `(v2.1.145)`
- `session_crons` — active scheduled crons `(v2.1.145)`

---

#### SessionStart — `reloadSkills` + `sessionTitle` `(v2.1.152)`

```json
{
  "hookSpecificOutput": {
    "reloadSkills": true,
    "sessionTitle": "Arcwright: feat/my-branch"
  }
}
```

- `reloadSkills: true` — re-scan skill dirs within the same session (no restart).
- `sessionTitle` — sets the tmux window / session title from a hook.

---

### Hook Input Fields

#### Effort `(v2.1.133)`

Hooks receive the current effort level in two ways:

```bash
# As env var
echo $CLAUDE_EFFORT   # "low" | "normal" | "high" | "max"
```

```json
// In JSON stdin
{ "effort": { "level": "high" } }
```

#### MCP env vars

MCP stdio servers receive:

| Variable | Since |
|----------|-------|
| `CLAUDE_PROJECT_DIR` | v2.1.139 |
| `CLAUDE_CODE_SESSION_ID` | v2.1.154 / v2.1.163 |
| `CLAUDECODE=1` | v2.1.139 |

---

### Hook Output Fields

#### `terminalSequence` `(v2.1.141)`

Inject raw terminal escape sequences from a hook — desktop notifications, window title updates, terminal bells:

```json
{
  "hookSpecificOutput": {
    "terminalSequence": "]2;Claude done"
  }
}
```

---

### Hook Config Options

#### `args: string[]` exec form `(v2.1.139)`

Spawn commands directly without a shell. Required for Windows `.cmd` / `.bat` scripts:

```json
{
  "hooks": {
    "PostToolUse": [{
      "matcher": "Bash",
      "args": ["node", "scripts/post-tool.js"]
    }]
  }
}
```

`${CLAUDE_PROJECT_DIR}` is passed as a plain string in the args array.

---

#### `continueOnBlock` on PostToolUse `(v2.1.139)`

When `true`, a blocked tool call feeds the rejection reason back to Claude and continues the turn instead of stopping:

```json
{
  "hooks": {
    "PostToolUse": [{
      "matcher": "Bash(rm -rf *)",
      "block": true,
      "continueOnBlock": true
    }]
  }
}
```

---

#### `if` field — permission-rule filtering `(v2.1.139 / fixed v2.1.163)`

Filter hook firing on tool events by pattern:

```json
{
  "hooks": {
    "PreToolUse": [{
      "if": "Bash(git *)",
      "command": "scripts/git-pre-check.sh"
    }]
  }
}
```

> **Fix (v2.1.163):** The `if` field previously fired incorrectly on every Bash call containing `$()` or `$VAR`. Fixed in v2.1.163 — update before relying on this.

---

#### `post-session` hook `(v2.1.169)`

Self-hosted runners only. Runs after a session ends — snapshot exports, workspace teardown:

```json
{
  "hooks": {
    "post-session": [{
      "command": "scripts/export-session.sh"
    }]
  }
}
```

- SIGTERM issued first, then SIGKILL after the configurable window (default 5 s).

---

## Skills

### Auto-load from `.claude/skills` `(v2.1.157)`

Skills in `.claude/skills/` load automatically — no marketplace install required.

Scaffold a plugin in the current project:
```bash
claude plugin init <name>
```

Creates `.claude/skills/<name>/SKILL.md` (and optional `hooks/hooks.json`).

---

### Frontmatter Fields

| Field | Effect | Since |
|-------|--------|-------|
| `allowed-tools` | Restrict tools while skill is active | — |
| `disallowed-tools` | Remove specific tools while active | v2.1.152 |

```yaml
---
name: my-skill
description: Does X
allowed-tools: Read, Edit, Bash
disallowed-tools: WebSearch
---
```

---

### `/reload-skills` `(v2.1.152)`

Re-scan all skill dirs without restarting the session:

```
/reload-skills
```

Also triggerable from a `SessionStart` hook via `reloadSkills: true`.

---

### `disableBundledSkills` `(v2.1.169)`

Hide bundled skills, workflows, and built-in slash commands from the model:

```json
{ "disableBundledSkills": true }
```

Or via env:
```bash
CLAUDE_CODE_DISABLE_BUNDLED_SKILLS=1 claude
```

Useful when you want only your custom skills surfaced — reduces noise in the skill listing budget.

---

### Plugin Behaviors

| Behavior | Since |
|----------|-------|
| Root-level `SKILL.md` (no `skills/` subdir) surfaced as skill | v2.1.142 |
| `defaultEnabled: false` in plugin manifest | v2.1.154 |
| Plugin dependency enforcement | v2.1.143 |

Literal `$` before a digit in skill command bodies — escape with `\$`:
```markdown
Cost: \$3.50 per million tokens
```
*(v2.1.163)*

---

## Settings

### `fallbackModel` `(v2.1.166)`

Up to 3 fallback models tried in order when the primary is overloaded. Use aliases so
the config never pins a version that gets retired:

```json
{
  "fallbackModel": [
    "sonnet",
    "haiku"
  ]
}
```

CLI flag for interactive sessions:
```bash
claude --fallback-model sonnet
```

---

### Glob patterns in deny rules `(v2.1.166)`

`"*"` in the tool-name position denies all tools:

```json
{
  "permissions": {
    "deny": ["*"]
  }
}
```

Combine with `allow` rules for an allowlist-only policy.

---

### `MAX_THINKING_TOKENS=0` — disable thinking `(v2.1.166)`

Disable extended thinking on models that think by default:

```bash
MAX_THINKING_TOKENS=0 claude
# or
claude --thinking disabled
```

---

### `requiredMinimumVersion` / `requiredMaximumVersion` `(v2.1.163)`

Managed settings for enterprise fleet version control. Claude Code refuses to start outside the allowed range:

```json
{
  "requiredMinimumVersion": "2.1.163",
  "requiredMaximumVersion": "2.2.0"
}
```

---

### `worktree.bgIsolation` `(v2.1.143)`

Controls whether background sessions use an isolated worktree or the working copy directly:

```json
{ "worktree": { "bgIsolation": "none" } }
```

`"none"` — background sessions edit the working copy in-place (no worktree clone).

---

### Managed Settings

| Setting | Effect | Since |
|---------|--------|-------|
| `pluginSuggestionMarketplaces` | Control marketplace plugin suggestions | v2.1.152 |
| `allowAllClaudeAiMcps` | Allow all claude.ai MCP servers | v2.1.149 |

---

### `--safe-mode` / `CLAUDE_CODE_SAFE_MODE` `(v2.1.169)`

Disable ALL customizations for troubleshooting — CLAUDE.md, plugins, skills, hooks, MCP:

```bash
claude --safe-mode
# or
CLAUDE_CODE_SAFE_MODE=1 claude
```

---

### `/cd` command `(v2.1.169)`

Change working directory mid-session without breaking prompt cache:

```
/cd /path/to/new/dir
```

---

### `agent` field in settings `(v2.1.157)`

Specify the default agent for dispatched sessions:

```json
{ "agent": "arcwright-dev" }
```

CLI override:
```bash
claude --agent arcwright-arch
```

---

### Status Line

| Feature | Since |
|---------|-------|
| Commands receive `COLUMNS` / `LINES` env | v2.1.153 |
| Status line JSON includes GitHub repo + PR info | v2.1.145 |

---

### `/usage` breakdown `(v2.1.149)`

Per-category token cost breakdown:

```
/usage
```

Reports cost by: skills, subagents, plugins, per-MCP-server.

---

### OTEL Tracing

| Addition | Since |
|----------|-------|
| `agent_id` + `parent_agent_id` on `claude_code.tool` spans | v2.1.145 |
| Subagent API requests carry `x-claude-code-agent-id` / `x-claude-code-parent-agent-id` headers | v2.1.139 |
| `OTEL_LOG_TOOL_DETAILS=1` adds `tool_parameters` to spans | v2.1.157 |

---

## Arcwright Relevance

### Installer (`packages/agent-orchestration/lib/installer.js`)

The installer writes `settings.json` for each target IDE. The following Arcwright-required
keys are set automatically (each only if the user hasn't customised it already):

| Key | Value | Why |
|-----|-------|-----|
| `env.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` | `1` | **Load-bearing** — powers `SendMessage` agent-reuse for in-process orchestration |
| `env.CLAUDE_CODE_NO_FLICKER` | `1` | Disables terminal flicker (alternate rendering path) |
| `skillListingBudgetFraction` | `0.03` | Prevents 50+ Arcwright skills + user skills from being truncated at session start |
| `fallbackModel` | `["sonnet"]` | Overload / flag-fallback lands on fast mid-tier alias, never pins a version |

The `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` env var is the most load-bearing — without
it, kept-alive agents can't be re-engaged across turns via `SendMessage`. See
[`claude-subagent-protocol`](../../../.agents/skills/claude-subagent-protocol/SKILL.md).

**Settings still recommended as user opt-in (not written by the installer):**

| Setting | Recommended default | Why |
|---------|---------------------|-----|
| `disableBundledSkills` | `false` (user opt-in) | Let users suppress built-ins if desired |
| `requiredMinimumVersion` | current floor | Ensure recent fixes are present |

### Skill layout

`.agents/skills/` (Claude Code) and `.kiro/skills/` (Kiro) remain the dual-format source. `disableBundledSkills` now gives users a clean way to surface only Arcwright skills — relevant for installs where skill count approaches the listing budget.

### Review-gate loops (`arcwright-review-orchestrator`)

`SubagentStop` + `additionalContext` + `continueOnBlock` together enable hook-driven review loops:

1. `SubagentStop` hook fires when reviewer subagent finishes.
2. Hook injects findings via `additionalContext`.
3. Parent turn continues — Claude sees findings without a new user message.
4. `continueOnBlock` on blocked tool calls feeds rejection reason back automatically.

No manual message injection or polling required.

---

## Related in Arcwright

The settings in this doc are managed by the Arcwright installer
(`packages/agent-orchestration/lib/installer.js` → `writeClaudeSettings`) and read by the
in-process orchestration at runtime:

- [`claude-subagent-protocol`](../../../.agents/skills/claude-subagent-protocol/SKILL.md) —
  defines which env vars and settings the protocol depends on, including
  `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` and `fallbackModel`.
- [`triage`](../../../.agents/skills/triage/SKILL.md) — workflow-router. Picks the right
  primitive per task; consults effort + model settings before recommending one.
- [`herdr`](../../../.agents/skills/herdr/SKILL.md) — opt-in pane visibility only;
  its session and profile hooks observe the same workflow without becoming its
  spawn mechanism.

---

## Sources

- https://code.claude.com/docs/en/hooks.md
- https://code.claude.com/docs/en/changelog
- https://raw.githubusercontent.com/anthropics/claude-code/main/CHANGELOG.md
