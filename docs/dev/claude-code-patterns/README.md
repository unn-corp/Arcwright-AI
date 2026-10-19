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
> skills. See [`claude-subagent-protocol`](../../../.agents/skills/claude-subagent-protocol/SKILL.md)
> for the unified in-process + SendMessage-reuse method. The bespoke `tracks` and the old
> `tmux-protocol` skill have been retired (native-orchestration migration, shipped
> 2026-06-11); Herdr now provides **opt-in visibility only** — see
> [Herdr documentation](https://herdr.dev).
> The [`triage`](../../../.agents/skills/triage/SKILL.md) skill is repurposed as the
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

These pages are conditional Claude Code references, not Arcwright-wide
orchestration defaults. The shared [subagent protocol](../../../.agents/skills/subagent-protocol/SKILL.md)
owns task lifecycle, provider/model inheritance, discovery, and host adaptation.
Use [triage](../../../.agents/skills/triage/SKILL.md) to select installed workflows.
Claude's native `Agent` and `SendMessage` shapes apply only where supported;
Arcwright Code delegated review rounds always use fresh tasks. No role implies
a fixed model family. Herdr provides optional viewing; see its
[documentation](https://herdr.dev). Retired tmux signal/polling protocols are not runtime guidance.

> Sources are cited at the bottom of each document. A few items that could not be confirmed
> from official docs are flagged inline as **unverified**. The Ultracode scripting API in
> [ultracode.md](ultracode.md) is documented from the authoritative live tool definition.
