---
name: "team-full-dev"
description: "The Engine Room — Dev implements, QA validates, Architect available for inline consultation on complex decisions"
---

# Agent Team: Full Dev — The Engine Room

## tmux Protocol

If `$TMUX` is set, load `.agents/skills/tmux-protocol/SKILL.md` before any pane operations.


## Team Composition

| Role | Agent | Skills |
|------|-------|--------|
| Dev | `bmad-agent-bmm-dev` | Full implementation |
| QA | `bmad-agent-bmm-qa` | playwright-cli, spec tests, validation |
| Architect | `bmad-agent-bmm-architect` | Inline consultation, complex decision review, full dev skill access |

## Purpose

The Engine Room is a full-stack implementation team with an Architect available for consultation rather than as a formal review gatekeeper. Dev implements and QA validates in the standard loop. When Dev encounters a complex architectural decision — a tricky data model choice, an API contract question, a caching strategy — master can route a consultation request to the Architect. The Architect responds with a recommendation and Dev proceeds. This keeps the review lightweight while ensuring expert guidance is available on-demand. Use this team for medium-to-large feature work where architectural questions are expected but don't need to block every task.

## Layout (tmux)

```
┌─────────┬───────────┐
│         │    Dev    │
│ Master  ├───────────┤
│ (left)  │    QA     │
│         ├───────────┤
│         │ Architect │
└─────────┴───────────┘
```

## Spawn Sequence

```bash
# 1. Split Dev pane (top-right)
tmux split-window -h -c "#{pane_current_path}" "~/.config/tmux/bin/agent_spawn.sh 'You are the Dev agent in The Engine Room team managed by Conductor (master-orchestrator). Read and activate: {project-root}/.claude/commands/bmad-agent-bmm-dev.md. An Architect is available for consultation on complex decisions — the master will route consultation requests. Your task queue comes from the master pane. Before stopping any task output: AGENT_SIGNAL::TASK_DONE::dev::{task_id}::{status}::{summary}. On long tasks emit AGENT_SIGNAL::PROGRESS every 60s. Wait for your first task.'"
sleep 8

# 2. Split QA pane (mid-right)
tmux split-window -v -c "#{pane_current_path}" "~/.config/tmux/bin/agent_spawn.sh 'You are the QA agent in The Engine Room team managed by Conductor (master-orchestrator). Read and activate: {project-root}/.claude/commands/bmad-agent-bmm-qa.md. Your task queue comes from the master pane. Before stopping any task output: AGENT_SIGNAL::TASK_DONE::qa::{task_id}::{pass|fail}::{summary}. On long tasks emit AGENT_SIGNAL::PROGRESS every 60s. Wait for your first task.'"
sleep 8

# 3. Split Architect pane (bottom-right)
tmux split-window -v -c "#{pane_current_path}" "~/.config/tmux/bin/agent_spawn.sh 'You are the Architect agent in The Engine Room team managed by Conductor (master-orchestrator). Read and activate: {project-root}/.claude/commands/bmad-agent-bmm-architect.md. You have full dev skill access and can invoke any skill in .agents/skills/ directly. In this team you are available for ON-DEMAND CONSULTATION — the master will send consultation requests when Dev encounters complex architectural decisions. Respond with a clear recommendation and rationale. Your task queue comes from the master pane. Before stopping any task output: AGENT_SIGNAL::TASK_DONE::architect::{task_id}::{status}::{summary}. On long tasks emit AGENT_SIGNAL::PROGRESS every 60s. Wait for your first task.'"
sleep 8

# 4. Equalize pane sizes
tmux select-layout tiled
sleep 6
```

## Agent Activation

- **Dev**: `Read and activate: {project-root}/.claude/commands/bmad-agent-bmm-dev.md`
- **QA**: `Read and activate: {project-root}/.claude/commands/bmad-agent-bmm-qa.md`
- **Architect**: `Read and activate: {project-root}/.claude/commands/bmad-agent-bmm-architect.md`
  - Has **full dev skill access** — can invoke any skill in `.agents/skills/` directly.
  - Role is **on-demand consultation**, not a formal review gate on every task.

## Task Routing Protocol

### Standard Dev-QA Loop
```
1. Master dispatches implementation task to Dev
   → tmux send-keys -t {dev_pane_id} "TASK-{id}: {description}. Acceptance criteria: {criteria}. Signal TASK_DONE when complete." Enter

2. Dev implements
   → AGENT_SIGNAL::TASK_DONE::dev::{task_id}::done::{summary}
   → OR: AGENT_SIGNAL::TASK_BLOCKED::dev::{task_id}::arch-question::{question}

3. Master receives Dev TASK_DONE → dispatches QA validation
   → tmux send-keys -t {qa_pane_id} "TASK-{id}-qa: Validate implementation. Criteria: {criteria}. Signal TASK_DONE pass or fail." Enter

4. QA validates
   → AGENT_SIGNAL::TASK_DONE::qa::{task_id}::pass::{summary}
   → OR: AGENT_SIGNAL::TASK_DONE::qa::{task_id}::fail::{findings}

5a. If QA PASS: master marks task complete
5b. If QA FAIL: master re-dispatches to Dev with findings → repeat from step 2
```

### Architect Consultation Path
When Dev emits `TASK_BLOCKED::arch-question` OR master judges a decision needs architectural input:
```
C1. Master routes question to Architect
    → tmux send-keys -t {architect_pane_id} "CONSULT-{id}: Dev needs architectural guidance. Question: {question}. Context: {context}. Provide a clear recommendation." Enter

C2. Architect provides recommendation
    → AGENT_SIGNAL::TASK_DONE::architect::consult-{id}::recommendation::{recommendation_summary}

C3. Master forwards recommendation to Dev
    → tmux send-keys -t {dev_pane_id} "Architect recommendation for TASK-{id}: {recommendation}. Continue implementation." Enter

C4. Dev proceeds with implementation (back to standard loop step 2)
```

## Communication Protocol

### Signal Format
```
AGENT_SIGNAL::{TYPE}::{FROM_ROLE}::{TASK_ID}::{STATUS}::{DETAIL}
```
Types: `READY` | `TASK_START` | `PROGRESS` | `TASK_DONE` | `TASK_BLOCKED` | `FINDING` | `ERROR`

Examples:
- `AGENT_SIGNAL::TASK_BLOCKED::dev::task-070::arch-question::Should this use optimistic locking or a queue?`
- `AGENT_SIGNAL::TASK_DONE::architect::consult-1::recommendation::Use a queue — optimistic locking will thrash under concurrent load`
- `AGENT_SIGNAL::TASK_DONE::qa::task-070::pass::All 6 assertions green`

### Master Polling Protocol
After dispatching any task to a pane:
1. `sleep 8` then begin polling
2. Every 30s: `tmux capture-pane -t {pane_id} -p | tail -30 | grep "AGENT_SIGNAL"`
3. On `TASK_DONE`: route next action per Task Routing Protocol above
4. On `TASK_BLOCKED::arch-question`: route to Architect consultation path
5. On `TASK_BLOCKED` (other): surface to user immediately
6. No signal after 2 min: send `tmux send-keys -t {pane_id} "STATUS_CHECK" Enter`, wait 15s, poll once more
7. Still no signal: mark pane as unresponsive in session file, present recovery options to user

### Heartbeat Rule
Agents on tasks expected to take >90s MUST emit `AGENT_SIGNAL::PROGRESS::{role}::{task_id}::running::{brief_status}` every 60s.

## Team Registration

When spawning this team, master writes to `_bmad/_memory/master-orchestrator-sidecar/session-state.md` under `active_team`:
```yaml
active_team:
  code: full-dev
  name: "The Engine Room"
  spawned_at: {ISO8601}
  panes:
    dev: {pane_id}
    qa: {pane_id}
    architect: {pane_id}
```

## In-Process Fallback

When `$TMUX` is not set, run agents sequentially using the Agent tool:

1. Spawn Dev agent (Agent tool) with task → wait for completion or arch question
2. If arch question: spawn Architect agent (Agent tool) with question → capture recommendation → pass to Dev
3. Spawn Dev agent again (if needed) with recommendation → wait for completion
4. Spawn QA agent (Agent tool) with criteria → wait for validation
5. If fail: spawn Dev again with findings → repeat from step 3
6. When QA passes: mark task complete

## Team Close Protocol

When master needs to close this team:
1. Read pane IDs from `active_team` in `_bmad/_memory/master-orchestrator-sidecar/session-state.md`
2. Kill each pane directly: `tmux kill-pane -t {pane_id}` (DO NOT send `/exit`)
3. Clear `active_team` from session-state.md

## Best Used For

- Medium-to-large feature implementation where architectural questions are expected but not blocking
- Features touching data models, API contracts, or performance-sensitive paths
- Any task where Dev + QA is not quite enough but full formal AR on every story is overkill
- Situations where having an Architect on standby reduces decision latency without slowing the loop
- Implementation work on systems where architectural expertise needs to be accessible but not prescriptive
