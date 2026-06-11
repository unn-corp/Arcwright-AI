# Claude Code Orchestration: Workflows, Goals, Loops & Routines

Autonomous orchestration primitives in Claude Code — when to reach for each, how to invoke,
and the operational limits that govern each system.

Last verified: June 2026 (Claude Code v2.1.170)

---

## Primitives at a Glance

| Primitive | Plan lives | Scale | Persistent | Session needed | Trigger |
|-----------|------------|-------|------------|----------------|---------|
| Subagents (Agent tool) | Claude's context | few / turn | No | Yes | Claude decides |
| Agent teams | Lead + task list | handful of peers | No | Yes | Claude / lead |
| `/loop` | Cron scheduler | 1 prompt / iteration | 7-day max | Yes (open) | Timer |
| `/goal` | Stop-hook evaluator | unlimited turns | Restored on `--resume` | Yes (open) | Condition met |
| Dynamic workflows (ultracode) | JS script | up to 1,000 agents | Resumable in session | Yes (background) | Keyword / effort level |
| Cloud routines | Saved config on Anthropic cloud | Full session | Yes (cloud) | No | Schedule / API / GitHub |
| Desktop scheduled tasks | Local scheduler | Full session | Yes (machine) | No | Schedule |

---

## Dynamic Workflows ("ultracode")

Shipped v2.1.154 (May 28 2026) — research preview.

Claude writes a JavaScript script that a runtime executes in the background, coordinating tens
to hundreds of subagents while the interactive session stays responsive. Results accumulate in
script variables — not in the context window.

### Invoking

```
# Inline keyword (triggers automatic workflow generation)
ultracode: sweep every file in src/ for deprecated API calls and fix them

# Natural language also works
Use a workflow to migrate all 500+ components to the new theme tokens

# Set ultracode as session default
/effort ultracode

# Built-in bundled example
/deep-research What are the security implications of WASM in the browser?

# Manage active runs
/workflows
```

> Prior to v2.1.160 the keyword was `workflow`. Use `ultracode` in v2.1.160+.

### Saving a workflow as a slash command

From the `/workflows` panel, press `s` to save the current script:

- **Project:** `.claude/workflows/<name>.js`
- **Personal:** `~/.claude/workflows/<name>.js`

Saved workflows appear in `/` autocomplete and accept an `args` parameter available as the
global `args` variable inside the script.

### Limits

| Limit | Value |
|-------|-------|
| Max agents per run | 1,000 |
| Max concurrent agents | 16 (CPU-bound) |
| Mid-run user input | Not supported — only permission prompts pause the run |
| Direct fs / shell from script | Not allowed — only via spawned subagents |

Subagents always run with `acceptEdits` enabled and inherit your tool allowlist. File edits
are auto-approved. Non-allowlisted shell, web, and MCP tools can still trigger permission
prompts mid-run.

### Disabling

```jsonc
// settings.json
{ "disableWorkflows": true }
```

```bash
# Environment variable (also usable by org admins)
CLAUDE_CODE_DISABLE_WORKFLOWS=1
```

The "Workflow keyword trigger" toggle is also available under `/config`.

### Best for

- Codebase-wide bug sweeps
- Large-scale migrations (500+ files)
- Adversarial cross-checked research (multiple agents, differing prompts)
- Multi-angle planning where results shouldn't pollute context

---

## `/goal` — Goal-Oriented Autonomous Loops

Shipped v2.1.139 (May 11 2026).

Set a completion condition; Claude works across turns until a small fast model (Haiku by
default) confirms the condition is met. One goal per session.

### Commands

```bash
# Set a goal and start the first turn immediately
/goal all tests in test/auth pass and lint is clean

# Check status
/goal

# Clear / stop (all aliases are equivalent)
/goal clear
/goal stop
/goal off
/goal reset
/goal none
/goal cancel
```

### Non-interactive usage

```bash
claude -p "/goal CHANGELOG has an entry for every PR merged this week"
```

### How it works

After each turn, the evaluator model receives the completion condition and the conversation so
far. If the condition is **not met**, Claude receives the evaluator's reason as guidance and
continues. If **met**, the goal clears automatically.

### Writing good conditions

- Must be **demonstrable from Claude's own output** — the evaluator does not run commands.
- Include measurable end states: `all 42 unit tests pass`, `no ESLint errors`, `file X contains Y`.
- Optionally add turn/time bounds: `…or stop after 20 turns`.

```bash
# Good — observable, measurable
/goal packages/api/src/ has no TypeScript errors and all exports are documented

# Bad — evaluator cannot verify external state
/goal the CI pipeline is green
```

### Persistence

- Condition is restored on `--resume`.
- Turn / time counters reset on resume.
- Unavailable when `disableAllHooks` or `allowManagedHooksOnly` is set in settings.

---

## `/loop` — Session-Scoped Scheduled Polling

Requires v2.1.72+.

Runs a prompt repeatedly on a fixed or adaptive interval within the open session. Stops when
the session ends; restored on `--resume` within 7 days.

### Patterns

```bash
# Fixed interval
/loop 5m check the deploy

# Adaptive — Claude decides the interval
/loop check the deploy

# Built-in maintenance prompt (no custom prompt)
/loop

# Re-run another slash command on a schedule
/loop 20m /review-pr 1234
```

### Interval rules

| Spec | Behaviour |
|------|-----------|
| `s` / `m` / `h` / `d` suffixes | All supported; seconds rounded to nearest minute |
| Non-clean intervals | Rounded to nearest clean value |
| Jitter | Up to 30 min for hourly+; up to half-interval for sub-hourly |
| Auto-expiry | Recurring tasks expire and delete after 7 days |

**Stop:** Press `Esc` while waiting for the next tick.

### Customising the built-in prompt

Create `.claude/loop.md` (project) or `~/.claude/loop.md` (user). Markdown, max 25,000 bytes.
Changes take effect on the next iteration.

### Internals

`/loop` is backed by the `CronCreate` / `CronList` / `CronDelete` tool family (5-field cron
syntax). Max 50 tasks per session. Disable entirely:

```bash
CLAUDE_CODE_DISABLE_CRON=1
```

> Bedrock / Vertex / Foundry: a promptless `/loop` falls back to a 10-minute fixed interval.

---

## Cloud Routines (`/schedule`)

Shipped April 14 2026 — research preview. Available on Pro, Max, Team, and Enterprise plans.

A **routine** is a saved configuration (prompt + repos + connectors) that runs on Anthropic-
managed cloud infrastructure. It survives laptop close and requires no open session.

### Creating a routine

```bash
# From the CLI
/schedule daily PR review at 9am
/schedule in 2 weeks open a cleanup PR

# Manage existing routines
/schedule list
/schedule update
/schedule run          # fire a one-off run of a saved routine immediately
```

Or navigate to **claude.ai/code/routines** in the web UI.

### Triggers

| Trigger | Details |
|---------|---------|
| **Scheduled** | Preset: hourly / daily / weekdays / weekly, or custom cron. Min interval: 1 hour. Runs staggered to avoid thundering herd. |
| **API** | `POST` the per-routine `/fire` endpoint with a bearer token. Optional `text` field. Returns `session_id` + URL. Requires header: `anthropic-beta: experimental-cc-routine-2026-04-01`. |
| **GitHub** | Triggered by `pull_request` or `release` events via the Claude GitHub App. Supports rich event filters. |

### Runtime environment

- Repos are cloned fresh each run from the default branch.
- Claude pushes to `claude/`-prefixed branches by default.
- All `claude.ai` MCP connectors are available. Locally-added `claude mcp add` servers are
  **not** available — add them via `claude.ai/customize/connectors` or commit a `.mcp.json`.
- Environment variables and secrets are supported; setup scripts are cached.
- Runs autonomously — **no permission prompts**.

### Limits

- Daily run cap applies per account (one-off runs are exempt).
- Org admins can disable scheduled runs entirely.

---

## Agent View & Background Sessions

Unified session management introduced in v2.1.139.

```bash
# List all sessions (running / blocked / done)
claude agents

# Machine-readable output (scriptable)
claude agents --json

# Show all sessions including completed (v2.1.169+)
claude agents --all
```

`--json` output fields added across versions:

| Field | Version |
|-------|---------|
| `waitingFor` | v2.1.162 |
| `id`, `state`, `blocked`, `justDispatched` | v2.1.169 |

Progress rows show `done/total` agent counts since v2.1.161.

### Running background sessions

```bash
# Run a shell command as a background session
! <command>

# Explicit background exec
claude --bg --exec '<command>'
```

Background sessions are resumable with `/resume` and marked `bg` in `claude agents`.

Worktree isolation default is full; to allow background sessions to edit the working copy
directly:

```jsonc
// settings.json
{ "worktree": { "bgIsolation": "none" } }
```

### Pinned sessions (v2.1.147+)

`Ctrl+T` pins a background session. Pinned sessions:

- Stay alive when idle.
- Restart in-place when Claude Code updates.
- Are shed under memory pressure only after non-pinned sessions.

---

## Related in Arcwright

The Arcwright master orchestrator (`arcwright-master`) uses the **in-process spawn +
Session Agent Registry** pattern described here: it dispatches the Agent tool, captures
each spawned agent's ID into a role→agentId table, and re-engages the same agent via
`SendMessage` for follow-up tasks instead of re-spawning. The full spec is in
[`claude-subagent-protocol`](../../.agents/skills/claude-subagent-protocol/SKILL.md).

For task-level routing (decide "is this an in-process task, a workflow, or a `/goal`?"),
use the workflow-router [`triage`](../../.agents/skills/triage/SKILL.md). tmux is
opt-in visibility only — see [`tmux`](../../.agents/skills/tmux/SKILL.md).

---

## Sources

- https://code.claude.com/docs/en/workflows
- https://code.claude.com/docs/en/scheduled-tasks
- https://code.claude.com/docs/en/routines.md
- https://code.claude.com/docs/en/goal.md
- https://code.claude.com/docs/en/changelog
