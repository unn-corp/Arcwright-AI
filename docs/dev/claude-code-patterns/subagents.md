# Claude Code Subagents

Isolated context windows delegated by the main Claude session — each gets its own system prompt, tool access, and permission set; only the summary result returns to the parent.

> Last verified: June 2026 (Claude Code v2.1.170)

---

## Key Constraints

- Subagents **cannot spawn other subagents** — no nesting. Chain from the main thread instead.
- Tools **never available** to subagents: `Agent`, `AskUserQuestion`, `EnterPlanMode`, `ExitPlanMode` (unless `permissionMode: plan`), `ScheduleWakeup`, `WaitForMcpServers`.
- Plugin-provided subagents ignore `hooks`, `mcpServers`, and `permissionMode` (security sandbox).

---

## Agent File Format

```markdown
---
name: code-reviewer
description: Reviews code for quality and best practices
tools: Read, Glob, Grep
model: sonnet
---
You are a code reviewer...
```

Files are markdown with YAML frontmatter. The body is the agent's system prompt.

---

## Frontmatter Fields

| Field | Required | Notes |
|-------|----------|-------|
| `name` | yes | Identity key — not the filename |
| `description` | yes | Drives auto-delegation; write "use proactively" to trigger it |
| `tools` | no | Allowlist of tool names |
| `disallowedTools` | no | Denylist — applied before `tools` |
| `model` | no | `sonnet` / `opus` / `haiku` / `fable` / full model ID / `inherit` (default: inherit) |
| `permissionMode` | no | `default` / `acceptEdits` / `auto` / `dontAsk` / `bypassPermissions` / `plan` |
| `maxTurns` | no | Hard turn limit |
| `skills` | no | Skill paths to preload at startup (full content injected) |
| `mcpServers` | no | Inline definitions or string refs to parent connections |
| `hooks` | no | Scoped to this subagent; `Stop` auto-converts to `SubagentStop` |
| `memory` | no | `user` / `project` / `local` — enables persistent memory dir |
| `background` | no | `true` = always run in background |
| `effort` | no | `low` / `medium` / `high` / `xhigh` / `max` |
| `isolation` | no | `worktree` — run in isolated git worktree |
| `color` | no | UI color for this agent |
| `initialPrompt` | no | Pre-filled prompt text |

---

## Storage & Resolution Priority

Agents are scanned recursively. Identity is the `name` field, not the filename. When two agents share a name, one is silently kept.

| Priority | Location | Notes |
|----------|----------|-------|
| 1 (highest) | Managed `.claude/agents/` (org) | Enterprise-managed |
| 2 | `--agents` CLI JSON | Session-only |
| 3 | Project `.claude/agents/` | Check into version control |
| 4 | `~/.claude/agents/` | User-global |
| 5 (lowest) | Plugin `agents/` | Plugin-provided |

File-based agents require a session restart to load. Agents created via `/agents` load immediately.

---

## Built-in Agents

| Agent | Model | Reads CLAUDE.md + git status | Tools |
|-------|-------|------------------------------|-------|
| Explore | Haiku | No | Read-only |
| Plan | Inherits | No | Read-only |
| General-purpose | Inherits | Yes | All |
| statusline-setup | Sonnet | Yes | All |
| claude-code-guide | Haiku | Yes | All |

---

## Invocation Methods

```bash
# Session-wide: every task uses this agent as the spawned subagent
claude --agent code-reviewer

# @-mention: guaranteed single-task delegation
# (type in the Claude Code UI)
@"code-reviewer (agent)"

# CLI session-only definition (no file needed)
claude --agents '{"code-reviewer": {"description":"...","prompt":"...","tools":["Read","Grep"],"model":"sonnet"}}'

# Fork a subagent from the current conversation
/fork <task description>
```

`prompt` in the `--agents` JSON is equivalent to the markdown body in a file-based agent.

**Automatic delegation** — Claude reads agent descriptions and routes tasks. Add `"use proactively"` to a description to encourage this. Alternatively, just name the agent in natural language.

**`settings.json`** — set `"agent": "code-reviewer"` to make it the session default (CLI `--agent` overrides this).

**Agent tool (programmatic)** — `Agent(...)` invokes a subagent directly from within another agent's turn. `Task(...)` is an alias retained from before v2.1.63.

---

## Foreground vs Background

| Mode | Blocks parent | Prompts | How to trigger |
|------|--------------|---------|---------------|
| Foreground | Yes | Passed to user | Default |
| Background | No | Auto-denied | `background: true` frontmatter; Ctrl+B during run; Claude's own choice |

Disable all background tasks: `CLAUDE_CODE_DISABLE_BACKGROUND_TASKS=1`

---

## Fork Mode

Introduced v2.1.117. Default-on staging began v2.1.161.

```bash
# Force on
CLAUDE_CODE_FORK_SUBAGENT=1

# Force off
CLAUDE_CODE_FORK_SUBAGENT=0

# Slash command
/fork <task>
```

| Property | Fork | Named subagent |
|----------|------|----------------|
| Context history | Full parent history inherited | Fresh context |
| System prompt | Same as parent | Agent's own definition |
| Model | Same as parent | `model` frontmatter field |
| Permission prompts | Surfaces to user | Auto-denied in background |
| Prompt cache | Shared with parent (cheaper) | Separate |

With fork env enabled, general-purpose spawns become forks and run in background. **Forks cannot spawn forks.**

---

## Model Resolution Order

```
CLAUDE_CODE_SUBAGENT_MODEL env
  → per-invocation model param
    → frontmatter model field
      → main conversation model
```

---

## Startup Context

Each subagent receives:
- Its own system prompt (frontmatter body)
- The delegation message from the parent
- CLAUDE.md hierarchy (all levels) — **except** Explore and Plan
- Git status snapshot — **except** Explore and Plan
- Skills listed in `skills:` frontmatter (full content)

Does **not** inherit: parent conversation history, skills loaded by parent, files the parent has read.

---

## Restrict Agent Spawning

When Claude itself is the main thread (launched via `--agent`), control which subagents it can spawn:

```markdown
---
name: orchestrator
tools: Agent(worker, researcher), Read
---
```

Omit `Agent` entirely to block all spawning.

Disable a specific built-in:
```json
{ "permissions": { "deny": ["Agent(Explore)"] } }
```

CLI equivalent: `--disallowedTools "Agent(Explore)"`

Block all spawning: deny `"Agent"`.

---

## Persistent Memory

Enable with the `memory:` frontmatter field.

| Scope | Path | Git |
|-------|------|-----|
| `user` | `~/.claude/agent-memory/<name>/` | No |
| `project` | `.claude/agent-memory/<name>/` | Yes (versionable) |
| `local` | `.claude/agent-memory-local/<name>/` | No (gitignored) |

When enabled:
- System prompt gets read/write instructions injected automatically
- First 200 lines or 25 KB of `MEMORY.md` is injected at startup
- `Read`, `Write`, `Edit` are auto-enabled for the memory dir

**Default recommendation:** `project` scope. Instruct the agent in its body to maintain its own memory.

---

## MCP Per Subagent

```markdown
---
name: db-agent
mcpServers:
  postgres:
    command: npx
    args: ["-y", "@modelcontextprotocol/server-postgres", "postgresql://localhost/mydb"]
---
```

- **Inline definitions** — server connects at subagent start, disconnects at finish, scoped only to that subagent.
- **String refs** — reuse the parent's existing connection: `mcpServers: ["postgres"]`
- Since v2.1.153: MCP restrictions (`--strict-mcp-config`, `--bare`, enterprise managed, `allowed/deniedMcpServers`) apply to frontmatter-defined servers too.

---

## Hooks

```markdown
---
name: my-agent
hooks:
  SubagentStop:
    - matcher: ""
      hooks:
        - type: command
          command: echo "agent done"
---
```

Frontmatter hooks are scoped to the subagent. `Stop` in frontmatter auto-converts to `SubagentStop`.

Session-level hooks go in `settings.json`:

```json
{
  "hooks": {
    "SubagentStart": [...],
    "SubagentStop": [...]
  }
}
```

Since v2.1.163: `Stop` and `SubagentStop` hooks receive `additionalContext` in their payload.

---

## Transcripts

```
~/.claude/projects/{project}/{sessionId}/subagents/agent-{agentId}.jsonl
```

- Main session compaction does not affect subagent transcripts.
- Cleaned after `cleanupPeriodDays` (default: 30).
- Resume: ask Claude to "continue the previous work".
- `SendMessage` tool routes messages to a running agent by ID — requires `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`.

---

## Best Practices

- Keep agents **single-task focused** — one clear responsibility per agent.
- Write **detailed descriptions** — they drive automatic delegation; include "use proactively" where appropriate.
- **Limit tool access** — only grant the tools the agent actually needs.
- **Check `.claude/agents/` into version control** — project-scoped agents are team assets.
- Use **project memory scope** as the default for persistent agents.
- **Isolate high-volume output** (test runs, log parsing, doc generation) in subagents to keep the main context clean.
- **Chain, don't nest** — if an agent needs to spawn further work, return to the main thread and dispatch from there.

---

## Changelog Reference

| Version | Change |
|---------|--------|
| v2.1.63 | `Task` tool renamed to `Agent`; `Task(...)` retained as alias |
| v2.1.117 | Fork mode introduced |
| v2.1.153 | MCP restrictions now apply to subagent frontmatter servers |
| v2.1.161 | Fork mode default-on (staged rollout) |
| v2.1.163 | `Stop`/`SubagentStop` hooks return `additionalContext` |

---

## Related in Arcwright

The in-process **Agent tool + SendMessage** is the spawn mechanism Arcwright uses.
Arcwright captures each spawned agent's ID into a Session Agent Registry (role →
agentId table) and re-engages the same agent via `SendMessage` for follow-up tasks
instead of re-spawning — the kept-alive/reuse model. The full spec is in
[`claude-subagent-protocol`](../../.agents/skills/claude-subagent-protocol/SKILL.md).

**tmux subagent spawning (split-pane `claude --dangerously-skip-permissions '<task>'`
launches) is retired** in favor of in-process dispatch. tmux remains available as
opt-in visibility only — see [`tmux`](../../.agents/skills/tmux/SKILL.md), section
"Watching agents in panes".

For task-level routing (which subagent / workflow / `/goal` to use), use the
workflow-router [`triage`](../../.agents/skills/triage/SKILL.md).

---

## Sources

- https://code.claude.com/docs/en/sub-agents
- https://raw.githubusercontent.com/anthropics/claude-code/main/CHANGELOG.md
