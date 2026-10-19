# Keeping Agents Alive & Resuming With Context

Last verified: June 2026 (Claude Code v2.1.170)

How Claude Code agents stay alive across tasks and how ended agents resume with their context
intact. Two categories: agents that are still **running**, and agents that **ended** but can
pick up where they left off.

On a compatible Claude host, native `Agent`/`SendMessage` reuse can preserve a
specialist's context. Follow Arcwright's shared
[subagent protocol](../../../.agents/skills/subagent-protocol/SKILL.md) for the actual
host and user-selected provider/model. Arcwright Code review rounds require fresh
delegated tasks. Herdr is optional visibility, not persistence. These conditional
mechanisms complement that protocol; see [orchestration.md](orchestration.md)
and [subagents.md](subagents.md).

---

## A. Agents That Stay Running

### Background Sessions (v2.1.139+)

Agents launched detached from the interactive terminal. They continue executing after you
switch away or close the pane.

```bash
# Launch a background session
claude --bg --exec 'implement the auth refactor'

# Or from inside Claude: prefix any shell command with !
! claude --dangerously-skip-permissions --exec 'run the migration'

# View all sessions (background and foreground)
claude agents
```

- `/resume` works on background sessions; they appear marked `bg` in the agents list.
- Flags `--ide`, `--chrome`, `--bare`, `--remote-control` are preserved when a session
  retires and wakes again (v2.1.169).
- Model and effort settings survive idle→wake cycles (v2.1.143).

### Pinned Background Sessions (v2.1.147+)

The closest native equivalent to an explicit keep-alive.

```
# Inside `claude agents` list view:
Ctrl+T   — pin the selected session
```

Pinned sessions:
- Stay alive when idle (non-pinned sessions may be culled under memory pressure).
- Restart **in place** across Claude Code updates — session ID and state are preserved.
- Are shed last under memory pressure, after all non-pinned sessions.

Use this for long-lived specialist agents (architect, QA) that need to remain addressable
across tasks.

### Agent Teams — SendMessage (experimental)

Peer agents that stay addressable by ID within a session, resumable via the `SendMessage`
tool.

```bash
# Enable the experimental flag before launching Claude
export CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1
claude
```

Inside an orchestration agent:

```
SendMessage(agentId: "agent-abc123", message: "continue the migration, apply to users table")
```

- The target agent resumes with **full context intact** — no re-injection needed.
- v2.1.166 security hardening: `SendMessage` relayed from another session does **not** carry
  user authority. Messages from peer sessions are treated as unprivileged.
- Gated behind `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` — not on by default.

---

## B. Agents That Ended But Resume With Context

### Subagent Transcript Persistence

All subagent transcripts are written to disk, independent of the parent conversation:

```
~/.claude/projects/{project-hash}/{sessionId}/subagents/agent-{agentId}.jsonl
```

Key properties:
- Main-conversation **compaction does not touch** subagent transcripts.
- Retention window: `cleanupPeriodDays` (default **30 days**).
- To resume: ask Claude to "continue the previous work" referencing the agent ID, or use
  `SendMessage` with the stored agent ID.

```bash
# Inspect stored subagent transcripts
ls ~/.claude/projects/*/*/subagents/
```

### Persistent Agent Memory (`memory:` Frontmatter)

Gives a named subagent a durable directory that survives across sessions. This is
cross-session **state**, not just transcript resumption.

Declare in the agent's frontmatter:

```yaml
---
name: arcwright-architect
memory: project          # scope: user | project | local
---
```

Storage locations by scope:

| Scope | Path | Notes |
|-------|------|-------|
| `user` | `~/.claude/agent-memory/<name>/` | shared across all projects |
| `project` | `.claude/agent-memory/<name>/` | git-versionable; **recommended default** |
| `local` | `.claude/agent-memory-local/<name>/` | gitignored; machine-local |

On startup:
- First ~200 lines / 25 KB of `MEMORY.md` in that directory are **auto-injected** into the
  agent's context.
- `Read`, `Write`, and `Edit` tools are automatically enabled for the memory directory.

The agent can append task summaries, decisions, and state to its `MEMORY.md` between sessions.
Use `project` scope so memory is version-controlled alongside the codebase.

### Fork Subagents (v2.1.117+, default-on from v2.1.161)

Inherit the full parent context and share the parent's prompt cache — cheap to spin up for
context-heavy continuations.

```bash
# Inside Claude:
/fork implement the second phase of the migration

# Force-enable if not on by default:
export CLAUDE_CODE_FORK_SUBAGENT=1
```

- Tied to the **parent session** — not independently long-lived.
- Best for branching off a large context to do focused work without re-sending tokens.
- Not a substitute for pinned sessions when you need an agent to outlive the parent.

### Session Resume (`/resume`, `--resume`)

Restores a previous session with goals and loop state intact.

```bash
# Resume the most recent session
claude --resume

# Resume a specific session
claude --resume <sessionId>

# Inside Claude:
/resume
```

- `/goal` conditions are restored on `--resume`.
- `/loop` recurring tasks are restored on `--resume` within **7 days**.

---

## Decision Table

Map Arcwright orchestration needs to the right native mechanism:

| Need | Mechanism |
|------|-----------|
| Persistent specialist that remembers facts across tasks | `memory: project` frontmatter → `MEMORY.md` auto-inject |
| Keep a team of agents alive and addressable across tasks | Pinned background sessions (`Ctrl+T`) + `SendMessage` (requires `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`) |
| Resume a finished subagent's work within 30 days | Subagent transcript JSONL — ask Claude to "continue the previous work" with agent ID |
| Cheaply branch off context-heavy work | Fork subagent (`/fork <task>`) |
| Survive laptop close / run on a schedule | Cloud routines — see [orchestration.md](../orchestration.md) |
| Preserve flags (--ide, --chrome, --bare) across updates | Background session retire→wake (v2.1.169) |

---

## Caveats

- `SendMessage`-to-running-agent and agent teams are gated behind
  `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` and not enabled by default.
- Subagent transcript retention is controlled by `cleanupPeriodDays`; after 30 days the
  JSONL is deleted and transcript-based resumption is no longer possible (memory-based
  resumption via `MEMORY.md` is unaffected).
- Fork subagents are tied to the parent session lifetime — they cannot outlive the parent.
- Workflow dynamic runs are resumable within the session but are not long-lived processes.
- Pinned sessions restart in place across Claude Code updates but still require the Claude
  Code process to be running; they do not survive a full machine reboot.

---

## Related in Arcwright

Arcwright layers two complementary reuse mechanisms on top of these primitives:

- **Within-session reuse** — `SendMessage` to a kept-alive agent by ID. Spec:
  [`claude-subagent-protocol`](../../../.agents/skills/claude-subagent-protocol/SKILL.md)
  (Session Agent Registry section). Powered by
  `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`, which the installer writes to
  `settings.json` automatically.
- **Cross-session persistence** — `memory: project` on **all 10 specialist agents**
  (analyst, architect, dev, pm, qa, sm, tech-writer, ux-designer, quick-flow-solo-dev,
  review-orchestrator). First ~200 lines / 25 KB of each agent's `MEMORY.md` is
  auto-injected at startup, so the agent's accumulated knowledge survives across
  sessions — not just within one. The orchestrator (`arcwright-master`) is the one
  exception (it runs as the session itself).

tmux-based session files (`.agents/orchestration/session-*.md`) are retired; see
[Herdr documentation](https://herdr.dev) for the current opt-in visibility model.

---

## Sources

- https://code.claude.com/docs/en/sub-agents
- https://raw.githubusercontent.com/anthropics/claude-code/main/CHANGELOG.md
