---
name: "team-docs"
description: "The Library — Tech Writer drafts, Architect reviews for technical accuracy, lightweight iterative loop"
---

# Agent Team: Docs + Arch Review — The Library

## tmux Protocol

If `$TMUX` is set, load `.agents/skills/tmux-protocol/SKILL.md` before any pane operations.


## Team Composition

| Role | Agent | Skills |
|------|-------|--------|
| Tech Writer | `bmad-agent-bmm-tech-writer` | Documentation drafting, structuring, clarity editing |
| Architect | `bmad-agent-bmm-architect` | Technical accuracy review, API correctness, full dev skill access |

## Purpose

The Library ensures documentation is both readable and technically accurate. Tech Writer drafts; Architect reviews for technical correctness — wrong API signatures, outdated patterns, missing caveats, or inaccurate descriptions of system behavior. Master routes drafts from Tech Writer to Architect for sign-off. The loop is lightweight: draft → review → revise → approve. Use this team when documentation quality matters enough to have an independent technical accuracy review before publishing.

## Layout (tmux)

```
┌─────────┬───────────┐
│         │  Writer   │
│ Master  ├───────────┤
│ (left)  │ Architect │
└─────────┴───────────┘
```

## Spawn Sequence

```bash
# 1. Split Tech Writer pane (top-right)
tmux split-window -h -c "#{pane_current_path}" "~/.config/tmux/bin/agent_spawn.sh 'You are the Tech Writer agent in The Library team managed by Conductor (master-orchestrator). Read and activate: {project-root}/.claude/commands/bmad-agent-bmm-tech-writer.md. Your task queue comes from the master pane. Before stopping any task output: AGENT_SIGNAL::TASK_DONE::tech-writer::{task_id}::{status}::{summary}. On long tasks emit AGENT_SIGNAL::PROGRESS every 60s. Wait for your first task.'"
sleep 8

# 2. Split Architect pane (bottom-right, below Tech Writer)
tmux split-window -v -c "#{pane_current_path}" "~/.config/tmux/bin/agent_spawn.sh 'You are the Architect agent in The Library team managed by Conductor (master-orchestrator). Read and activate: {project-root}/.claude/commands/bmad-agent-bmm-architect.md. You have full dev skill access and can invoke any skill in .agents/skills/ directly. In this team your role is technical accuracy review of documentation drafts. Your task queue comes from the master pane. Before stopping any task output: AGENT_SIGNAL::TASK_DONE::architect::{task_id}::{status}::{summary}. On long tasks emit AGENT_SIGNAL::PROGRESS every 60s. Wait for your first task.'"
sleep 8

# 3. Equalize pane sizes
tmux select-layout tiled
sleep 6
```

## Agent Activation

- **Tech Writer**: `Read and activate: {project-root}/.claude/commands/bmad-agent-bmm-tech-writer.md`
- **Architect**: `Read and activate: {project-root}/.claude/commands/bmad-agent-bmm-architect.md`
  - Has **full dev skill access** — can invoke any skill in `.agents/skills/` directly, including code reading to verify documentation accuracy.

## Iterative Loop

Lightweight draft → review → revise → approve cycle:

```
1. Master dispatches documentation task to Tech Writer
   → tmux send-keys -t {writer_pane_id} "TASK-{id}: Write documentation for: {topic}. Context: {source_material}. Signal TASK_DONE with draft location." Enter

2. Tech Writer produces draft
   → AGENT_SIGNAL::TASK_DONE::tech-writer::{task_id}::draft::{file_path}

3. Master dispatches draft to Architect for technical accuracy review
   → tmux send-keys -t {architect_pane_id} "TASK-{id}-review: Review this documentation draft for technical accuracy. Draft: {file_path}. Emit FINDING signals for inaccuracies. Signal TASK_DONE::approved or TASK_DONE::needs-revision." Enter

4. Architect reviews for technical correctness
   → Emits FINDING signals for any inaccuracies, missing caveats, wrong signatures, outdated patterns
   → AGENT_SIGNAL::TASK_DONE::architect::{task_id}::approved (if accurate)
   → OR: AGENT_SIGNAL::TASK_DONE::architect::{task_id}::needs-revision::{summary_of_issues}

5a. If APPROVED: master marks documentation complete

5b. If NEEDS-REVISION:
    → Master forwards Architect findings to Tech Writer for revision
    → tmux send-keys -t {writer_pane_id} "TASK-{id}-revise: Revise draft based on technical review. Issues: {architect_findings}. Signal TASK_DONE when revised." Enter
    → Repeat from step 2
```

## Communication Protocol

### Signal Format
```
AGENT_SIGNAL::{TYPE}::{FROM_ROLE}::{TASK_ID}::{STATUS}::{DETAIL}
```
Types: `READY` | `TASK_START` | `PROGRESS` | `TASK_DONE` | `TASK_BLOCKED` | `FINDING` | `ERROR`

Examples:
- `AGENT_SIGNAL::TASK_DONE::tech-writer::task-060::draft::docs/backend/auth-patterns.md`
- `AGENT_SIGNAL::FINDING::architect::task-060::finding::major::has_admin_privileges() signature is wrong — takes user_id not user object`
- `AGENT_SIGNAL::TASK_DONE::architect::task-060::approved::Documentation is technically accurate`

### Master Polling Protocol
After dispatching any task to a pane:
1. `sleep 8` then begin polling
2. Every 30s: `tmux capture-pane -t {pane_id} -p | tail -30 | grep "AGENT_SIGNAL"`
3. On `TASK_DONE`: route next action per Iterative Loop above
4. On `TASK_BLOCKED`: surface to user immediately
5. No signal after 2 min: send `tmux send-keys -t {pane_id} "STATUS_CHECK" Enter`, wait 15s, poll once more
6. Still no signal: mark pane as unresponsive in session file, present recovery options to user

### Heartbeat Rule
Agents on tasks expected to take >90s MUST emit `AGENT_SIGNAL::PROGRESS::{role}::{task_id}::running::{brief_status}` every 60s.

## Team Registration

When spawning this team, master writes to `_bmad/_memory/master-orchestrator-sidecar/session-state.md` under `active_team`:
```yaml
active_team:
  code: docs
  name: "The Library"
  spawned_at: {ISO8601}
  panes:
    tech-writer: {pane_id}
    architect: {pane_id}
```

## In-Process Fallback

When `$TMUX` is not set, run agents sequentially using the Agent tool:

1. Spawn Tech Writer agent (Agent tool) with documentation task → wait for draft
2. Spawn Architect agent (Agent tool) with draft for review → wait for approval or findings
3. If needs-revision: spawn Tech Writer again with findings → wait for revised draft → repeat from step 2
4. When Architect approves: mark documentation complete

## Team Close Protocol

When master needs to close this team:
1. Read pane IDs from `active_team` in `_bmad/_memory/master-orchestrator-sidecar/session-state.md`
2. Kill each pane directly: `tmux kill-pane -t {pane_id}` (DO NOT send `/exit`)
3. Clear `active_team` from session-state.md

## Best Used For

- Writing or updating API reference documentation where accuracy is critical
- Documenting new backend patterns, auth flows, or architectural decisions
- Updating CLAUDE.md or other reference docs after system changes
- Any documentation that non-technical writers might produce but that needs an engineer's accuracy stamp
- Post-sprint documentation of newly built systems before the knowledge fades
