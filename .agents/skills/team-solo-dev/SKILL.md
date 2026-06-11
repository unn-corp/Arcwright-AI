---
name: "team-solo-dev"
description: "Ghost — single quick-flow-solo-dev agent in-process via the Session Agent Registry. Master queues tasks; the dev agent is spawned once and reused via SendMessage for each queued task. Sonnet-first, no legacy signals."
---

# Agent Team: Solo Dev — Ghost

> **Default orchestration:** in-process via the [`claude-subagent-protocol`](../claude-subagent-protocol/SKILL.md) skill. The `Solo Dev` role is spawned once and recorded in the Session Agent Registry; every queued task reuses that agent via `SendMessage`. tmux split-pane variant is opt-in only (see step blocks).
>
> **Kiro CLI:** this team is available as a Kiro `subagent` pipeline. See `## Kiro Pipeline` at the end of this skill.

## Best Used For

- Well-scoped tasks where spec is already clear and review overhead isn't needed
- Batch of small, independent tasks that can be queued and executed sequentially
- Nano/small track work where the quick-flow-solo-dev agent's combined spec+dev pass is sufficient
- Prototyping or exploration tasks where speed matters more than formal review
- Tasks too small to justify spinning up a multi-agent team

## Team Composition

| Role | Agent | Skills |
|------|-------|--------|
| Solo Dev | `arcwright-quick-flow-solo-dev` | Full-stack implementation, spec writing, autonomous task execution |

## Purpose

Ghost is a single-agent team for autonomous task execution without review overhead. The quick-flow-solo-dev agent handles spec, implementation, and basic self-validation in one pass. Master queues tasks and Ghost works through them sequentially. **The same dev agent is reused across the whole queue** — Ghost remembers prior tasks, the codebase, and the user's preferences. Use Ghost when tasks are well-defined, scope is bounded, and you want maximum throughput without the coordination cost of a multi-agent team.

## Spawn-once + Reuse

Ghost is a single-role team. The first task in the queue spawns the agent via the `Agent` tool, captures the returned `agentId`, and writes a row to the **Session Agent Registry** (path and format in `claude-subagent-protocol` §3). Every subsequent queued task — same project, same area, follow-up on the previous work — reuses that agent by `SendMessage(to: <agentId>, ...)`. The agent retains all prior context (codebase, prior commits, the user's coding conventions).

**Decision rule (when to spawn vs reuse):**

- First task in this Ghost run → spawn. Record ID.
- Each subsequent task in the same queue → **reuse** the registered agent via `SendMessage`. Pass only the new task + the new acceptance criteria.
- Switching projects or genuinely disjoint scope → spawn fresh; replace the registry row.

Full protocol: see the [`claude-subagent-protocol`](../claude-subagent-protocol/SKILL.md) skill.

## Agent Registry

Ghost keeps a one-row registry at the canonical path:

```
_arcwright-output/sessions/<session-id>/agent-registry.md
```

```markdown
# Session Agent Registry

Session: <session-id>
Updated: <ISO timestamp>

| Role | Agent ID | Spawned | Last Task | Notes |
|------|----------|---------|-----------|-------|
| solo-dev | agent_abc123 | 2026-06-10T10:00:00Z | implement forgot-password endpoint | reused — already on feature/auth |
```

On wind-down, rename the file to `agent-registry.closed.md` (or delete). Use `claude agents` to inspect the live agent set. See `claude-subagent-protocol` §3 for the full lifecycle.

## Model and Permission Gate (sonnet-first)

| Role | Default model | Promote to opus? |
|------|---------------|------------------|
| solo-dev | **sonnet** | Not recommended for Ghost — solo-dev is built for fast, autonomous execution. Opus only with explicit user permission if the task warrants deeper reasoning. |

**Permission-before-opus (mandatory).** Before spawning this team with `model: "opus"`, the orchestrator must ask the user:

```
This task may benefit from opus (deeper reasoning on a complex algorithm). Default is sonnet.
Switch this spawn to opus? (yes / no / always-yes-for-this-session)
```

If the user declines, spawn `sonnet`. If the user says "always-yes-for-this-session", record the preference and stop asking. **No silent escalation.** See `claude-subagent-protocol` §6 for the full rule.

## Steps

Master maintains a task queue. Tasks are dispatched one at a time. The first task spawns; every subsequent task reuses the registered agent via `SendMessage`.

### 1. Task Execution

**What this step does:** Solo Dev executes the task autonomously — spec, implement, and self-validate in one pass.
**Inputs:** Task description and acceptance criteria from master
**Output:** `$STEP_N_OUTPUT` — task complete with summary. Mark task complete. Dispatch next queued task if any.

**First task → spawn and record:**

```json
{
  "name": "Agent",
  "input": {
    "subagent_type": "arcwright-quick-flow-solo-dev",
    "prompt": "Execute this task autonomously and completely. Write a quick spec, implement, and self-validate before finishing.\n\n## Inputs\nTask: {task_description}\nAcceptance criteria: {criteria}\n\n## Output\nTask complete. List all files changed and summarize what was done.",
    "model": "sonnet",
    "permissionMode": "acceptEdits"
  }
}
```

Capture the returned `agentId`, write the registry row, then capture the result into `$STEP_1_OUTPUT`. Verify file changes (`git diff --stat`) before marking complete.

**Each subsequent queued task → reuse the registered agent:**

```json
{
  "name": "SendMessage",
  "input": {
    "to": "agent_abc123",
    "prompt": "Next queued task for the same Ghost run.\n\n## Inputs\nPrior tasks completed: {$STEP_1_OUTPUT, $STEP_2_OUTPUT, ...} (or file paths)\nNew task: {next_task_description}\nAcceptance criteria: {criteria}\n\n## Output\nTask complete. List all files changed and summarize what was done. Reference prior tasks for context, do not re-derive."
  }
}
```

Capture result into `$STEP_N_OUTPUT`. Verify file changes. Mark task complete. Dispatch next queued task.

**Notes for the reuse pattern:**

- The receiving agent already knows the codebase and the user's coding conventions. Do not re-feed them — reference the new task only.
- Update the registry's `Last Task` column after each `SendMessage`.
- If the agent returns an error summary, retry once with the same prompt; on second failure escalate to the user. See `claude-subagent-protocol` §10.

---

#### tmux Variant (opt-in visibility only)

For opt-in pane visibility, see the [`tmux`](../tmux/SKILL.md) skill's "Watching agents in panes (opt-in)" section. The pane is a viewing surface; the in-process Agent tool + SendMessage flow inside it is still governed by the `claude-subagent-protocol` skill. Note: pane snippets may still reference `AGENT_SIGNAL::TASK_DONE` for tmux-internal signaling — this is opt-in only and does **not** apply in the default in-process flow.

```bash
# 1. Split Solo Dev pane (right)
tmux split-window -h -c "#{pane_current_path}" "~/.config/tmux/bin/agent_spawn.sh 'You are the Solo Dev (Ghost) agent managed by Conductor (master-orchestrator). Read and activate: {project-root}/_arcwright/awm/agents/quick-flow-solo-dev.md. Your task queue comes from the master pane. Execute tasks autonomously and completely. On long tasks emit AGENT_SIGNAL::PROGRESS every 60s. Wait for your first task.'"
sleep 8

# 2. Equalize pane sizes
tmux select-layout tiled
sleep 6
```

## Team Wind-down

Ghost has no pane to close in the default in-process flow. To wind down:

1. **Stop dispatching** tasks to the `solo-dev` row in the registry. The agent goes idle and is no longer messaged.
2. **Inspect live agents** with `claude agents` (or `claude agents --json`) to see what is still running.
3. **Close the registry** by renaming the file to `agent-registry.closed.md` (or deleting) at session end. Live agents end with the session.
4. **User picks up later?** No action needed — the user can `SendMessage` to the same `agentId` in the same session and Ghost resumes with full prior context.

There is no `kill-pane` / `tmux send-keys "/exit"` analogue in-process. See `claude-subagent-protocol` §12 for the full wind-down model.

## Kiro Pipeline

Use the `subagent` tool to run this team as a Kiro pipeline.

```json
{
  "task": "Execute a well-scoped task autonomously: spec, implement, and self-validate in one pass.",
  "stages": [
    {
      "name": "solo-dev-execute",
      "role": "arcwright-quick-flow-solo-dev",
      "prompt_template": "Execute this task autonomously and completely. Write a quick spec, implement, and self-validate before finishing: {task}",
      "depends_on": []
    }
  ]
}
```
