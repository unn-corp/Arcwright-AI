---
name: "team-ux-arch"
description: "The Blueprint Room — UX and Architect produce design artifacts together; no implementation, no iterative loop"
---

# Agent Team: UX + Architecture — The Blueprint Room

## tmux Protocol

If `$TMUX` is set, load `.agents/skills/tmux-protocol/SKILL.md` before any pane operations.


## Team Composition

| Role | Agent | Skills |
|------|-------|--------|
| UX Designer | `bmad-agent-bmm-ux-designer` | Wireframes, component specs, interaction design, full dev skill access |
| Architect | `bmad-agent-bmm-architect` | API contract validation, data flow design, feasibility, full dev skill access |

## Purpose

The Blueprint Room is a design-only team — no production code is written, no iterative implementation loop runs. The UX Designer produces wireframes and component specifications; the Architect validates API contracts and data flow against the proposed design. Master mediates any design/architecture conflicts. Output is design artifacts only: wireframes, component specs, API contracts, data flow diagrams, and integration notes. Use this team to design a feature fully before handing it off to a dev team, or to validate that a UX design is architecturally feasible before building begins.

## Layout (tmux)

```
┌─────────┬───────────┐
│         │    UX     │
│ Master  ├───────────┤
│ (left)  │ Architect │
└─────────┴───────────┘
```

## Spawn Sequence

```bash
# 1. Split UX Designer pane (top-right)
tmux split-window -h -c "#{pane_current_path}" "~/.config/tmux/bin/agent_spawn.sh 'You are the UX Designer agent in The Blueprint Room team managed by Conductor (master-orchestrator). Read and activate: {project-root}/.claude/commands/bmad-agent-bmm-ux-designer.md. You have full dev skill access and can invoke any skill in .agents/skills/ directly. This team produces DESIGN ARTIFACTS ONLY — wireframes, component specs, interaction specs. No production code. Your task queue comes from the master pane. Before stopping any task output: AGENT_SIGNAL::TASK_DONE::ux::{task_id}::{status}::{summary}. On long tasks emit AGENT_SIGNAL::PROGRESS every 60s. Wait for your first task.'"
sleep 8

# 2. Split Architect pane (bottom-right, below UX)
tmux split-window -v -c "#{pane_current_path}" "~/.config/tmux/bin/agent_spawn.sh 'You are the Architect agent in The Blueprint Room team managed by Conductor (master-orchestrator). Read and activate: {project-root}/.claude/commands/bmad-agent-bmm-architect.md. You have full dev skill access and can invoke any skill in .agents/skills/ directly. This team produces DESIGN ARTIFACTS ONLY — API contracts, data flow specs, feasibility notes. No production code. Your task queue comes from the master pane. Before stopping any task output: AGENT_SIGNAL::TASK_DONE::architect::{task_id}::{status}::{summary}. On long tasks emit AGENT_SIGNAL::PROGRESS every 60s. Wait for your first task.'"
sleep 8

# 3. Equalize pane sizes
tmux select-layout tiled
sleep 6
```

## Agent Activation

- **UX Designer**: `Read and activate: {project-root}/.claude/commands/bmad-agent-bmm-ux-designer.md`
  - Has **full dev skill access** — can invoke any skill in `.agents/skills/` directly, including prototyping tools to validate design assumptions.
- **Architect**: `Read and activate: {project-root}/.claude/commands/bmad-agent-bmm-architect.md`
  - Has **full dev skill access** — can invoke any skill in `.agents/skills/` directly, including writing prototype code to validate feasibility.

## Task Routing Protocol

No iterative loop — this team has a defined forward flow:

1. **Parallel start**: Master dispatches design brief to UX Designer AND a requirements overview to Architect simultaneously.
2. **UX output**: UX Designer produces wireframes and component specs → `TASK_DONE`
3. **Architect validation**: Master forwards UX output to Architect for API contract and data flow validation → Architect emits findings or approval → `TASK_DONE`
4. **Conflict resolution**: If Architect identifies a design/architecture conflict (e.g., UX requires data not available via current API), master surfaces the conflict to both agents for negotiation. Each proposes a resolution. Master presents options to user if not auto-resolvable.
5. **Final artifacts**: Master collates all design outputs and presents to user: wireframes, component specs, API contracts, data flow diagrams, integration notes.

Conflict signals:
```
AGENT_SIGNAL::FINDING::architect::{task_id}::design-conflict::{description_of_conflict}
```

## Communication Protocol

### Signal Format
```
AGENT_SIGNAL::{TYPE}::{FROM_ROLE}::{TASK_ID}::{STATUS}::{DETAIL}
```
Types: `READY` | `TASK_START` | `PROGRESS` | `TASK_DONE` | `TASK_BLOCKED` | `FINDING` | `ERROR`

Examples:
- `AGENT_SIGNAL::TASK_DONE::ux::task-040::done::Wireframes complete for 4 screens, component spec written`
- `AGENT_SIGNAL::FINDING::architect::task-040::design-conflict::UX filter requires aggregation endpoint not in current API`
- `AGENT_SIGNAL::TASK_DONE::architect::task-040::done::API contracts validated, 2 new endpoints specified`

### Master Polling Protocol
After dispatching any task to a pane:
1. `sleep 8` then begin polling
2. Every 30s: `tmux capture-pane -t {pane_id} -p | tail -30 | grep "AGENT_SIGNAL"`
3. On `TASK_DONE`: route next action per Task Routing Protocol above
4. On `TASK_BLOCKED` or design-conflict `FINDING`: surface to user for resolution
5. No signal after 2 min: send `tmux send-keys -t {pane_id} "STATUS_CHECK" Enter`, wait 15s, poll once more
6. Still no signal: mark pane as unresponsive in session file, present recovery options to user

### Heartbeat Rule
Agents on tasks expected to take >90s MUST emit `AGENT_SIGNAL::PROGRESS::{role}::{task_id}::running::{brief_status}` every 60s.

## Team Registration

When spawning this team, master writes to `_bmad/_memory/master-orchestrator-sidecar/session-state.md` under `active_team`:
```yaml
active_team:
  code: ux-arch
  name: "The Blueprint Room"
  spawned_at: {ISO8601}
  panes:
    ux: {pane_id}
    architect: {pane_id}
```

## In-Process Fallback

When `$TMUX` is not set, run agents sequentially using the Agent tool:

1. Spawn UX Designer agent (Agent tool) with design brief → wait for wireframes + component specs
2. Spawn Architect agent (Agent tool) with UX output + requirements → wait for API contracts + data flow
3. If design conflict found: present conflict to user, get resolution direction, re-run affected agents
4. Collate all artifacts and present to user

## Team Close Protocol

When master needs to close this team:
1. Read pane IDs from `active_team` in `_bmad/_memory/master-orchestrator-sidecar/session-state.md`
2. Kill each pane directly: `tmux kill-pane -t {pane_id}` (DO NOT send `/exit`)
3. Clear `active_team` from session-state.md

## Best Used For

- Feature design phase before any sprint capacity is committed to implementation
- Validating that a UX concept is architecturally feasible and API-compatible
- Designing new API contracts and component specs together so both are coherent
- Large UI reworks where the architecture needs to adapt to new interaction patterns
- Situations where design/architecture conflicts need to be resolved before dev begins rather than during
