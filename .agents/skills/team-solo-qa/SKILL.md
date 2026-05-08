---
name: "team-solo-qa"
description: "The Inquisitor — single QA agent for regression runs, playwright-cli sessions, and pass/fail reports"
---

# Agent Team: Solo QA — The Inquisitor

> **Default orchestration:** in-process via [`claude-subagent-protocol`](.agents/skills/claude-subagent-protocol/SKILL.md). tmux split-pane variant is opt-in (see step blocks).
>
> **Kiro CLI:** this team is not currently available as a Kiro `subagent` pipeline. Track-level workflows have Kiro pipelines; teams remain Claude Code / tmux for now.

## Best Used For

- Regression test runs against a deployed environment or after a merge
- Validating a specific UI flow or API behavior with playwright-cli without any implementation work
- Pre-release smoke tests to confirm critical paths are intact
- Generating a structured test report to feed into a triage decision or another team
- Standalone QA work that doesn't need to be paired with a Dev agent

## Team Composition

| Role | Agent | Skills |
|------|-------|--------|
| QA | `arcwright-qa` | playwright-cli, regression testing, spec tests, pass/fail reporting |

## Purpose

The Inquisitor is a single QA agent for standalone test execution. No Dev, no Architect — just QA running tests and reporting results. Use this team when you want to run regression tests against existing code, validate a deployed environment, or run a targeted playwright-cli session without any implementation work attached. The Inquisitor signals master with structured pass/fail reports that can be fed into a subsequent decision or another team.

## Layout (tmux)

```
┌─────────┬───────────┐
│         │           │
│ Master  │    QA     │
│ (left)  │ (Inq.)    │
└─────────┴───────────┘
```

## Spawn Sequence

Load `.agents/skills/tmux-protocol/SKILL.md` before running tmux commands. Default path is in-process — no pane operations needed.

#### tmux Variant (when $TMUX is set and user wants visibility)

Load `.agents/skills/tmux-protocol/SKILL.md` before running these commands.

```bash
# 1. Split QA pane (right)
tmux split-window -h -c "#{pane_current_path}" "~/.config/tmux/bin/agent_spawn.sh 'You are the QA agent (The Inquisitor) managed by Conductor (master-orchestrator). Read and activate: {project-root}/_arcwright/awm/agents/qa.md. Use playwright-cli for UI/API testing. Your task queue comes from the master pane. Before stopping any task output: AGENT_SIGNAL::TASK_DONE::qa::{task_id}::{pass|fail}::{summary}. On long tasks emit AGENT_SIGNAL::PROGRESS every 60s. Wait for your first task.'"
sleep 8

# 2. Equalize pane sizes
tmux select-layout tiled
sleep 6
```

## Agent Activation

> **Project context**: Master passes the `## Project Context` block (from its activation scan) to each agent in their first task message. Agents receive context from master — they do not re-scan independently.

- **QA**: activate `arcwright-qa`

## Steps

Single agent, no loop. Master queues test tasks and dispatches one at a time. Repeat step 1 for each queued task.

### 1. Test Run

**What this step does:** QA runs tests for the specified scope and produces a structured pass/fail report.
**Inputs:** Test scope and approach from master
**Output:** `$STEP_1_OUTPUT` — structured pass/fail report. Final output — no next step.

---

#### Default: In-Process (Agent tool)

```json
{
  "name": "Agent",
  "input": {
    "subagent_type": "arcwright-qa",
    "prompt": "Run tests for the specified scope and produce a structured pass/fail report. Use playwright-cli for UI/API testing as appropriate.\n\n## Inputs\nTest scope: {test_scope}\nTest approach: {playwright-cli|spec-files|both}\n\n## Output\nStructured QA report:\n- Scope: {areas tested}\n- Passed: N\n- Failed: N\n- Failures: list each failure with description\nFinal verdict: PASS or FAIL",
    "model": "sonnet"
  }
}
```

Capture result into `$STEP_1_OUTPUT`. Present report to user or route failures to a fix team. Final output — no next step.

---

#### tmux Variant (when $TMUX is set and user wants visibility)

Load `.agents/skills/tmux-protocol/SKILL.md` before spawning.

```bash
tmux send-keys -t {qa_pane_id} "TASK-{id}: {test_scope}. Test approach: {playwright-cli|spec-files|both}. Signal TASK_DONE with pass or fail and a structured report." Enter
```

Completion signal: `AGENT_SIGNAL::TASK_DONE::qa::{task_id}::{pass|fail}::{summary}`

---

## Communication Protocol

See [`tmux-protocol`](.agents/skills/tmux-protocol/SKILL.md) for the tmux signal protocol; this skill's default is in-process — Agent tool return value is the sole completion signal.

## Team Registration

When spawning this team, master writes to `_arcwright/_memory/master-orchestrator-sidecar/session-state.md` under `active_team`:
```yaml
active_team:
  code: solo-qa
  name: "The Inquisitor"
  spawned_at: {ISO8601}
  panes:
    qa: {pane_id}
```

## Team Close Protocol

When master needs to close this team:
1. Read pane ID from `active_team` in `_arcwright/_memory/master-orchestrator-sidecar/session-state.md`
2. Kill the pane directly: `tmux kill-pane -t {pane_id}` (DO NOT send `/exit`)
3. Clear `active_team` from session-state.md

## Kiro CLI

This team is not currently available as a Kiro `subagent` pipeline. Track-level workflows have Kiro pipelines; team orchestration remains Claude Code / tmux for now. A team-level Kiro DAG is planned for a follow-up release.
