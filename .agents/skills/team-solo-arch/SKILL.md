---
name: "team-solo-arch"
description: "The Oracle — single Architect agent in-process via the Session Agent Registry. Architecture analysis, design proposals, and prototyping with sonnet-first + permission-before-opus. tmux opt-in visibility only."
---

# Agent Team: Solo Architect — The Oracle

> **Default orchestration:** in-process via the [`claude-subagent-protocol`](../claude-subagent-protocol/SKILL.md) skill. The `Architect` role is spawned once and recorded in the Session Agent Registry; subsequent asks reuse that agent via `SendMessage`. tmux split-pane variant is opt-in only (see step blocks).
>
> **Kiro CLI:** this team is available as a Kiro `subagent` pipeline. See `## Kiro Pipeline` at the end of this skill.

## Best Used For

- Getting a second opinion on a design decision before committing
- Feasibility assessments before a feature is added to the sprint plan
- Designing API contracts, data models, or system integrations without building them yet
- Prototyping to validate whether a design assumption holds under realistic constraints
- Technical debt analysis and migration strategy planning
- Any situation where architectural expertise is needed without requiring a full multi-agent team

## Team Composition

| Role | Agent | Skills |
|------|-------|--------|
| Architect | `arcwright-architect` | Architecture analysis, design proposals, prototype code, full dev skill access |

## Purpose

The Oracle is a single-agent architecture team. The Architect receives a question, scope, or design problem and produces architecture analysis, design proposals, and recommendations. The Architect has full dev skill access and can write prototype code to validate assumptions. Output is recommendations and architecture notes — not production-ready implementation. Use The Oracle when you need architectural guidance, a second opinion on a design decision, or a feasibility assessment before committing to a direction.

## Spawn-once + Reuse

The Oracle is a single-role team. The first task for the `architect` role spawns the agent via the `Agent` tool, captures the returned `agentId`, and writes a row to the **Session Agent Registry** (path and format in `claude-subagent-protocol` §3). Every subsequent ask — same design area, follow-up question, or related scope — reuses that agent by `SendMessage(to: <agentId>, ...)`. The agent retains all prior context (codebase, prior analyses, user preferences).

**Decision rule (when to spawn vs reuse):**

- First ask for architecture in this session → spawn. Record ID.
- Follow-up question on a prior analysis, related scope, or design iteration → **reuse** the registered agent.
- Disjoint scope (different subsystem, unrelated question) → spawn fresh; replace the registry row.

Full protocol: see the [`claude-subagent-protocol`](../claude-subagent-protocol/SKILL.md) skill.

## Agent Registry

The Oracle keeps a one-row registry at the canonical path:

```
_arcwright-output/sessions/<session-id>/agent-registry.md
```

```markdown
# Session Agent Registry

Session: <session-id>
Updated: <ISO timestamp>

| Role | Agent ID | Spawned | Last Task | Notes |
|------|----------|---------|-----------|-------|
| architect | agent_abc123 | 2026-06-10T10:00:00Z | review auth-jwt migration proposal | reused — knows prior design rationale |
```

On wind-down, rename the file to `agent-registry.closed.md` (or delete). Use `claude agents` to inspect the live agent set. See `claude-subagent-protocol` §3 for the full lifecycle.

## Model and Permission Gate (sonnet-first)

| Role | Default model | Promote to opus? |
|------|---------------|------------------|
| architect | **sonnet** | Allowed ONLY with explicit user permission (see gate below). |

**Permission-before-opus (mandatory).** Before spawning this team (or any single step) with `model: "opus"`, the orchestrator must ask the user:

```
This task may benefit from opus (deeper architectural reasoning). Default is sonnet.
Switch this spawn to opus? (yes / no / always-yes-for-this-session)
```

If the user declines, spawn `sonnet`. If the user says "always-yes-for-this-session", record the preference and stop asking. **No silent escalation** — applies to every role in this team. See `claude-subagent-protocol` §6 for the full rule.

## Steps

Single agent, no loop. Master queues tasks and dispatches one at a time. For follow-up work on the same scope, **reuse the registered architect** via `SendMessage` (no fresh spawn).

### 1. Architecture Task

**What this step does:** Architect analyzes the question or scope and produces the requested architecture output type.
**Inputs:** Architecture question or scope from master
**Output:** `$STEP_1_OUTPUT` — architecture analysis, design proposal, or other output type. Final output — no next step.

**First ask → spawn and record:**

```json
{
  "name": "Agent",
  "input": {
    "subagent_type": "arcwright-architect",
    "prompt": "Analyze the following architecture question or scope and produce the requested output. Include trade-offs, risks, and recommendations. Write prototype code if needed to validate assumptions.\n\n## Inputs\nTask: {architecture_question_or_scope}\nRequested output type: {output_type}\n\n## Output\n{output_type} with: analysis, trade-offs, risks, and clear recommendations.",
    "model": "sonnet"
  }
}
```

Capture the returned `agentId`, write the registry row, then capture the result into `$STEP_1_OUTPUT`. Present to user or route to another team.

**Follow-up ask on the same scope → reuse the registered agent:**

```json
{
  "name": "SendMessage",
  "input": {
    "to": "agent_abc123",
    "prompt": "Follow-up on the prior analysis.\n\n## Inputs\nPrior ask: {original_architecture_question_or_scope}\nPrior output: _arcwright-output/sessions/<session-id>/oracle-1.md (or inline reference)\nNew ask: {followup_question}\n\n## Output\nUpdated recommendation addressing the follow-up, referencing but not re-deriving the prior analysis."
  }
}
```

Output types the Architect can produce:

- Architecture analysis report
- Design proposal with trade-offs
- API contract specification
- Data model recommendations
- Prototype code to validate a design assumption
- Feasibility assessment
- Migration strategy
- Technology selection rationale

---

#### tmux Variant (opt-in visibility only)

For opt-in pane visibility, see the [`tmux`](../tmux/SKILL.md) skill's "Watching agents in panes (opt-in)" section. The pane is a viewing surface; the in-process Agent tool + SendMessage flow inside it is still governed by the `claude-subagent-protocol` skill. Note: pane snippets may still reference `AGENT_SIGNAL::TASK_DONE` for tmux-internal signaling — this is opt-in only and does **not** apply in the default in-process flow.

```bash
# 1. Split Architect pane (right)
tmux split-window -h -c "#{pane_current_path}" "~/.config/tmux/bin/agent_spawn.sh 'You are the Architect agent (The Oracle) managed by Conductor (master-orchestrator). Read and activate: {project-root}/_arcwright/awm/agents/architect.md. You have full dev skill access and can invoke any skill in .agents/skills/ directly, including writing prototype code to validate design assumptions. Your task queue comes from the master pane. On long tasks emit AGENT_SIGNAL::PROGRESS every 60s. Wait for your first task.'"
sleep 8

# 2. Equalize pane sizes
tmux select-layout tiled
sleep 6
```

## Team Wind-down

The Oracle has no pane to close in the default in-process flow. To wind down:

1. **Stop dispatching** tasks to the `architect` row in the registry. The agent goes idle and is no longer messaged.
2. **Inspect live agents** with `claude agents` (or `claude agents --json`) to see what is still running.
3. **Close the registry** by renaming the file to `agent-registry.closed.md` (or deleting) at session end. Live agents end with the session.
4. **User picks up later?** No action needed — the user can `SendMessage` to the same `agentId` in the same session and the architect resumes with full prior context.

There is no `kill-pane` / `tmux send-keys "/exit"` analogue in-process. See `claude-subagent-protocol` §12 for the full wind-down model.

## Kiro Pipeline

Use the `subagent` tool to run this team as a Kiro pipeline.

```json
{
  "task": "Run an architecture analysis, design proposal, or feasibility assessment for the given scope.",
  "stages": [
    {
      "name": "architect-task",
      "role": "arcwright-architect",
      "prompt_template": "Analyze the architecture question or scope and produce the requested output. Include trade-offs, risks, and recommendations. Write prototype code if needed to validate assumptions: {task}",
      "depends_on": []
    }
  ]
}
```
