---
name: "team-hotfix"
description: "Rapid Response — emergency fix with strict guardrails (max 4 files, isolated subsystem, Security reviews fix). In-process via the Session Agent Registry; Dev and Security roles are spawned once and reused via SendMessage. Sonnet-first, permission-before-opus on Security, no legacy signals."
---

# Agent Team: Hotfix — Rapid Response

> **Default orchestration:** in-process via the [`claude-subagent-protocol`](../claude-subagent-protocol/SKILL.md) skill. The `Dev` and `Security` roles are each spawned once and recorded in the Session Agent Registry; their results are passed forward as handoff context. tmux split-pane variant is opt-in only (see step blocks).
>
> **Kiro CLI:** this team is available as a Kiro `subagent` pipeline. See `## Kiro Pipeline` at the end of this skill.

## Best Used For

- Production incidents requiring immediate targeted remediation
- Critical bugs in isolated subsystems (null pointer, broken auth check, bad query)
- Situations where time-to-fix is more important than review completeness
- Any emergency where the scope is genuinely bounded to 1-4 files in a single subsystem
- NEVER use for: architectural changes, multi-subsystem refactors, new features, scope > 4 files

## Team Composition

| Role | Agent | Skills |
|------|-------|--------|
| Dev | `arcwright-dev` | Targeted fix, isolated scope |
| Security | `arcwright-review-orchestrator` (security lens) | Fix review, regression safety check |

## Purpose

Rapid Response is the production emergency team. It moves fast and skips non-essential review stages, but compensates with hard guardrails and mandatory Security review of the fix before proceeding to PTM. Dev identifies and fixes the issue. Security reviews the fix — not for architectural elegance, but to confirm the fix doesn't introduce a security regression or new vulnerability. No AR loop, no UX review, no spec phase. Requires explicit `[emergency]` confirmation from the user before the team spawns.

## GUARDRAILS — READ BEFORE SPAWN

**These constraints are NON-NEGOTIABLE:**

1. **Max 4 files touched** — if the fix requires more than 4 files, this is not a hotfix. Escalate to a full track.
2. **Isolated subsystem only** — changes must be confined to a single, identifiable subsystem. No cross-cutting changes.
3. **`[emergency]` confirmation required** — master MUST receive explicit `[emergency]` from the user before spawning this team. Do not spawn on assumption.
4. **No AR loop** — architectural review is skipped.
5. **No UX review** — UX validation is skipped.
6. **No spec phase** — no PRD, no story, no sprint planning.
7. **Security review is MANDATORY** — no PTM without Security sign-off on the fix.

If any guardrail would be violated, stop and present the user with options: escalate to a full track, or narrow scope to fit within guardrails.

## Spawn-once + Reuse

The Hotfix team has two roles. Each is spawned once for the hotfix cycle and reused for follow-ups (rework, additional review). First use of a role spawns the agent and records `agentId` in the Session Agent Registry. Subsequent use of the same role in this hotfix cycle reuses that agent via `SendMessage(to: <agentId>, ...)`. If a follow-up hotfix lands in the same session and is on a disjoint issue, spawn fresh (replace the row).

**Decision rule:**

- First use of `dev` or `security` in this hotfix cycle → spawn. Record ID.
- Re-spawn on a second hotfix in the same session (disjoint issue) → spawn fresh; replace the row.
- Reuse for rework or follow-up on the same hotfix → `SendMessage`.

Full protocol: see the [`claude-subagent-protocol`](../claude-subagent-protocol/SKILL.md) skill.

## Agent Registry

The Hotfix team keeps a two-row registry at the canonical path:

```
_arcwright-output/sessions/<session-id>/agent-registry.md
```

```markdown
# Session Agent Registry

Session: <session-id>
Updated: <ISO timestamp>

| Role | Agent ID | Spawned | Last Task | Notes |
|------|----------|---------|-----------|-------|
| dev | agent_abc123 | 2026-06-10T10:00:00Z | emergency fix: null pointer in auth | reused — knows the fix |
| security | agent_def456 | 2026-06-10T10:05:00Z | security review of hotfix | reused — knows the diff |
```

On wind-down, rename the file to `agent-registry.closed.md` (or delete). Use `claude agents` to inspect the live agent set. See `claude-subagent-protocol` §3 for the full lifecycle.

## Model and Permission Gate (sonnet-first)

| Role | Default model | Promote to opus? |
|------|---------------|------------------|
| dev | **sonnet** | Not recommended — hotfix speed matters. Opus only with explicit user permission. |
| security | **sonnet** | Allowed with explicit user permission. Security sign-off is the gate; opus can be valuable here. |

**Permission-before-opus (mandatory).** Before spawning any role with `model: "opus"`, the orchestrator must ask the user:

```
This role may benefit from opus (deeper reasoning for security sign-off / complex fix).
Default is sonnet.
Switch this spawn to opus? (yes / no / always-yes-for-this-session)
```

If the user declines, spawn `sonnet`. If the user says "always-yes-for-this-session", record the preference and stop asking. **No silent escalation** — applies to every role in this team. See `claude-subagent-protocol` §6 for the full rule.

## Steps

No iterative loop. Linear flow with guardrail gates. The two Agent calls (Dev then Security) are sequential — each awaits the prior result. Security's `SendMessage` reuses the registered security agent.

### 1. Guardrail Verification

**What this step does:** Master verifies `[emergency]` confirmation has been received and that the issue fits within guardrails before proceeding.
**Inputs:** User's `[emergency]` confirmation + issue description
**Output:** `$STEP_1_OUTPUT` — guardrail check: proceed or escalate

This step is performed by master directly (no Agent spawn needed): confirm `[emergency]` received, confirm issue fits in 1-4 files in a single subsystem. If either check fails, surface options to user.

---

### 2. Emergency Fix

**What this step does:** Dev identifies and implements the fix within guardrail constraints.
**Inputs:** Issue description + guardrail constraints
**Output:** `$STEP_2_OUTPUT` — fix complete with files changed, OR guardrail-blocked signal

**First use of `dev` in this hotfix cycle → spawn and record:**

```json
{
  "name": "Agent",
  "input": {
    "subagent_type": "arcwright-dev",
    "prompt": "Emergency fix for production issue. GUARDRAILS ARE NON-NEGOTIABLE: touch MAX 4 files, isolated to the specified subsystem only, no cross-cutting changes. If the fix requires violating a guardrail, stop and report which guardrail would be violated and why.\n\n## Inputs\nIssue: {issue_description}\nSubsystem: {subsystem}\nGuardrails: max 4 files, isolated subsystem, no cross-cutting changes\n\n## Output\nFix complete with files changed listed. OR: 'GUARDRAIL_BLOCKED: {reason}' if a guardrail would be violated.",
    "model": "sonnet",
    "permissionMode": "acceptEdits"
  }
}
```

Capture the returned `agentId`, write the `dev` row, then capture the result into `$STEP_2_OUTPUT`. Verify file changes (`git diff --stat`) before proceeding to step 3. If `GUARDRAIL_BLOCKED`: surface to user immediately.

**Rework on the same fix (same hotfix cycle) → reuse the registered dev agent:**

```json
{
  "name": "SendMessage",
  "input": {
    "to": "agent_abc123",
    "prompt": "Rework on the same hotfix.\n\n## Inputs\nPrior fix attempt: {$STEP_2_OUTPUT or path}\nFeedback from security review: {feedback or 'fix scope adjustment'}\n\n## Output\nUpdated fix. List files changed (delta from prior attempt). OR 'GUARDRAIL_BLOCKED: {reason}'."
  }
}
```

---

#### tmux Variant (opt-in visibility only)

For opt-in pane visibility, see the [`tmux`](../tmux/SKILL.md) skill's "Watching agents in panes (opt-in)" section. The pane is a viewing surface; the in-process Agent tool + SendMessage flow inside it is still governed by the `claude-subagent-protocol` skill. Note: pane snippets may still reference `AGENT_SIGNAL::TASK_DONE` for tmux-internal signaling — this is opt-in only and does **not** apply in the default in-process flow.

```bash
# 1. Split Dev pane (top-right)
tmux split-window -h -c "#{pane_current_path}" "~/.config/tmux/bin/agent_spawn.sh 'You are the Dev agent in the Hotfix (Rapid Response) team managed by Conductor (master-orchestrator). Read and activate: {project-root}/_arcwright/awm/agents/dev.md. GUARDRAILS: touch MAX 4 files, isolated subsystem only, no cross-cutting changes. Your task queue comes from the master pane. On long tasks emit AGENT_SIGNAL::PROGRESS every 60s. Wait for your first task.'"
sleep 8

# 2. Split Security pane (bottom-right)
tmux split-window -v -c "#{pane_current_path}" "~/.config/tmux/bin/agent_spawn.sh 'You are the Security reviewer in the Hotfix (Rapid Response) team managed by Conductor (master-orchestrator). Activate with a security-only review lens. In this team: review the Dev fix for security regressions, new vulnerabilities, or unsafe patterns introduced by the fix. You are NOT reviewing for architectural quality. Your task queue comes from the master pane. Wait for your first task.'"
sleep 8

# 3. Equalize pane sizes
tmux select-layout tiled
sleep 6
```

---

### 3. Security Review

**What this step does:** Security reviews the fix for regressions and new vulnerabilities — not architectural quality.
**Inputs:** `$STEP_2_OUTPUT` (files changed + fix description) + original issue
**Output:** `$STEP_3_OUTPUT` — approved (proceed to PTM) or blocked (security concern)

**First use of `security` in this hotfix cycle → spawn and record:**

```json
{
  "name": "Agent",
  "input": {
    "subagent_type": "arcwright-review-orchestrator",
    "prompt": "Review this hotfix for security regressions ONLY. Does the fix introduce any: new attack surface, auth bypass, injection opportunity, unsafe data handling, or other security vulnerability? Do NOT review for architectural quality.\n\n## Inputs\nFiles changed: {$STEP_2_OUTPUT}\nIssue being fixed: {issue_description}\n\n## Output\nEither 'Approved: fix is safe, no security regressions introduced.' OR 'Blocked: {specific_security_concern}'",
    "model": "sonnet"
  }
}
```

Capture the returned `agentId`, write the `security` row, then capture the result into `$STEP_3_OUTPUT`. If approved: proceed to PTM. If blocked: surface to user for decision.

**Follow-up review on the same fix (e.g. after Dev reworked) → reuse the registered security agent:**

```json
{
  "name": "SendMessage",
  "input": {
    "to": "agent_def456",
    "prompt": "Re-review the hotfix after Dev rework.\n\n## Inputs\nPrior review: {$STEP_3_OUTPUT or path}\nNew fix delta: {$STEP_2_OUTPUT_DELTA or path to new files changed}\n\n## Output\nEither 'Approved: fix is safe.' OR 'Blocked: {specific_security_concern}'."
  }
}
```

---

#### tmux Variant (opt-in visibility only)

For opt-in pane visibility, see the [`tmux`](../tmux/SKILL.md) skill's "Watching agents in panes (opt-in)" section. Note: pane snippets may still reference `AGENT_SIGNAL::TASK_DONE` for tmux-internal signaling — this is opt-in only and does **not** apply in the default in-process flow.

```bash
tmux send-keys -t {security_pane_id} "TASK-{id}-review: Review hotfix for security regressions only. Files changed: {$STEP_2_OUTPUT}. Issue: {issue_description}. Signal TASK_DONE::approved or TASK_DONE::blocked." Enter
```

---

## Team Wind-down

Rapid Response has no pane to close in the default in-process flow. To wind down:

1. **Stop dispatching** to both `dev` and `security` rows in the registry. Both agents go idle.
2. **Inspect live agents** with `claude agents` (or `claude agents --json`) to see what is still running.
3. **Close the registry** by renaming the file to `agent-registry.closed.md` (or deleting) at session end. Live agents end with the session.
4. **New hotfix in same session?** If the new issue is disjoint, spawn fresh for both roles and replace the registry rows. If related, decide per-row.

There is no `kill-pane` / `tmux send-keys "/exit"` analogue in-process. See `claude-subagent-protocol` §12 for the full wind-down model.

## Kiro Pipeline

Use the `subagent` tool to run this team as a Kiro pipeline.

```json
{
  "task": "Emergency hotfix: Dev fixes production issue within guardrails (max 4 files, isolated subsystem), Security reviews fix before PTM.",
  "stages": [
    {
      "name": "emergency-fix",
      "role": "arcwright-dev",
      "prompt_template": "Emergency fix for production issue. GUARDRAILS ARE NON-NEGOTIABLE: touch MAX 4 files, isolated to the specified subsystem only, no cross-cutting changes: {task}",
      "depends_on": []
    },
    {
      "name": "sec-review",
      "role": "arcwright-review-orchestrator",
      "prompt_template": "Review this hotfix for security regressions ONLY. Does the fix introduce any new attack surface, auth bypass, injection opportunity, unsafe data handling, or other security vulnerability? Do NOT review for architectural quality: {task}",
      "depends_on": ["emergency-fix"]
    }
  ]
}
```
