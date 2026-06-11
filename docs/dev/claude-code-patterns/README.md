# Claude Code Patterns

Reference notes on the agent, orchestration, model, and configuration features
Anthropic has shipped to Claude Code — captured so Arcwright's installer, skills,
and orchestration protocols can track the platform.

**Last verified:** June 2026 (Claude Code **v2.1.170**).

> These docs deliberately avoid pinning specific model version numbers — they churn.
> Use **aliases** (`opus`, `sonnet`, `haiku`, `fable`, `best`), which always resolve to
> the current model. See [models.md](models.md).

---

## Arcwright migration status

> The patterns documented below are now integrated into Arcwright's native-orchestration
> skills. See [`claude-subagent-protocol`](../../.agents/skills/claude-subagent-protocol/SKILL.md)
> for the unified in-process + SendMessage-reuse method. The bespoke `tracks` and the old
> `tmux-protocol` skill have been retired (native-orchestration migration, shipped
> 2026-06-11); tmux is now **opt-in visibility only** — see
> [`tmux`](../../.agents/skills/tmux/SKILL.md).
> The [`triage`](../../.agents/skills/triage/SKILL.md) skill is repurposed as the
> workflow-router that picks the right primitive (in-process agent / ultracode workflow /
> `/goal` loop) for each task.

---

## Documents

| Doc | Covers |
|-----|--------|
| [subagents.md](subagents.md) | Subagent file format, every frontmatter field, built-in agents, invocation, fork mode, persistent memory, per-agent MCP/hooks, transcripts |
| [orchestration.md](orchestration.md) | `/goal`, `/loop`, cloud routines (`/schedule`), agent view & background sessions, comparison matrix |
| [ultracode.md](ultracode.md) | Dynamic workflows (`ultracode`) — triggers, limits, the JS scripting API, patterns, resume |
| [keep-alive-and-resume.md](keep-alive-and-resume.md) | Keeping agents alive (pinned background sessions, agent teams) and resuming with context (transcripts, `memory:`, forks) |
| [models.md](models.md) | Model aliases, selection priority, effort control, fast mode, delegation strategy |
| [hooks-skills-settings.md](hooks-skills-settings.md) | New hook events/fields, skill auto-load & control, recent `settings.json` keys |

---

## What changed at a glance

- **Models** — newer top-tier models default to `high` effort with adaptive thinking,
  mid-conversation system messages, and a fast mode. Select by alias. See [models.md](models.md).
- **Subagents** — `Task` → `Agent` tool; **fork mode** (full-context, cache-sharing);
  rich frontmatter (`memory`, `isolation`, `effort`, `mcpServers`, `hooks`, `maxTurns`).
  See [subagents.md](subagents.md).
- **Ultracode** — **dynamic workflows** (up to 1,000 background agents via a JS script).
  See [ultracode.md](ultracode.md).
- **Orchestration** — `/goal` autonomous loops, `/loop` scheduled polling, cloud
  **routines**. See [orchestration.md](orchestration.md).
- **Keep-alive** — pinned background sessions (`Ctrl+T`), agent teams + `SendMessage`,
  durable `memory:` directories, 30-day subagent transcripts. See [keep-alive-and-resume.md](keep-alive-and-resume.md).
- **Config** — `fallbackModel`, `disableBundledSkills`, `requiredMin/MaximumVersion`,
  `--safe-mode`, hook `additionalContext`/`continueOnBlock` for review-gate loops.
  See [hooks-skills-settings.md](hooks-skills-settings.md).

---

## Relevance to Arcwright

These platform primitives are the native equivalents of patterns Arcwright currently
implements with tmux panes and session files (`claude-subagent-protocol`,
`tmux-protocol` skills, `.agents/orchestration/session-*.md`):

| Arcwright pattern | Native Claude Code equivalent |
|-------------------|-------------------------------|
| Opus orchestrates, Sonnet executes | `model: sonnet` on specialist subagents / `CLAUDE_CODE_SUBAGENT_MODEL=sonnet` |
| Persistent specialist agents across tasks | `memory: project` frontmatter |
| Keep a team alive across tasks | Pinned background sessions + `SendMessage` (experimental) |
| Track/team pipelines | Dynamic workflows (`ultracode`) — see [ultracode.md](ultracode.md) |
| Review-gate loops (`arcwright-review-orchestrator`) | `SubagentStop` + `additionalContext` + `continueOnBlock` |
| Resume a finished agent | Transcript JSONL within 30 days |

## Related in Arcwright

The patterns on this page are the substrate Arcwright's skills are built on top of:

- [`claude-subagent-protocol`](../../.agents/skills/claude-subagent-protocol/SKILL.md) —
  the in-process Agent tool + SendMessage-reuse protocol. Defines the Session Agent
  Registry (role → agentId) that replaces the old tmux `session-state.md` pane table,
  and enforces sonnet-first / permission-before-opus.
- [`triage`](../../.agents/skills/triage/SKILL.md) — the workflow-router. Given a task,
  it picks plain in-process agents / an ultracode dynamic workflow / a `/goal` loop.
- [`tmux`](../../.agents/skills/tmux/SKILL.md) — pane / window / session reference with
  one opt-in "Watching agents in panes" section. The old `tmux-protocol` skill
  (AGENT_SIGNAL/PEER_SIGNAL/STATUS_CHECK polling) is retired.

> Sources are cited at the bottom of each document. A few items that could not be confirmed
> from official docs are flagged inline as **unverified**. The Ultracode scripting API in
> [ultracode.md](ultracode.md) is documented from the authoritative live tool definition.
