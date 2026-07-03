---
name: "team-solo-qa"
description: "The Inquisitor — single QA agent in-process via the Session Agent Registry. Regression runs, playwright-cli sessions, and pass/fail reports with sonnet-first, no legacy signals. herdr pane visibility is opt-in only."
---

# Agent Team: Solo QA — The Inquisitor

> **Default orchestration:** in-process via the [`claude-subagent-protocol`](../claude-subagent-protocol/SKILL.md) skill. The `QA` role is spawned once and recorded in the Session Agent Registry; subsequent runs (new test target, follow-up scope) reuse that agent via `SendMessage`. herdr pane variant is offered when `$HERDR_ENV` is set (spawn each role in its own pane in the current session) (see step blocks).
>
> **Kiro CLI:** this team is available as a Kiro `subagent` pipeline. See `## Kiro Pipeline` at the end of this skill.

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

The Inquisitor is a single QA agent for standalone test execution. No Dev, no Architect — just QA running tests and reporting results. Use this team when you want to run regression tests against existing code, validate a deployed environment, or run a targeted playwright-cli session without any implementation work attached. **The same QA agent is reused across the run queue** — the Inquisitor remembers the test target, prior run results, and the user's reporting preferences.

## Spawn-once + Reuse

The Inquisitor is a single-role team. The first test run spawns the agent via the `Agent` tool, captures the returned `agentId`, and writes a row to the **Session Agent Registry** (path and format in `claude-subagent-protocol` §3). Every subsequent run — same test target, follow-up on a failure, additional scope in the same area — reuses that agent by `SendMessage(to: <agentId>, ...)`. The agent retains all prior context (last run results, prior failures, the user's reporting format).

**Decision rule (when to spawn vs reuse):**

- First run in this Inquisitor session → spawn. Record ID.
- Follow-up run on the same target, retest after a fix, or expanded scope in the same area → **reuse** the registered agent.
- Disjoint target (different project area, different environment) → spawn fresh; replace the registry row.

Full protocol: see the [`claude-subagent-protocol`](../claude-subagent-protocol/SKILL.md) skill.

## Agent Registry

The Inquisitor keeps a one-row registry at the canonical path:

```
_arcwright-output/sessions/<session-id>/agent-registry.md
```

```markdown
# Session Agent Registry

Session: <session-id>
Updated: <ISO timestamp>

| Role | Agent ID | Spawned | Last Task | Notes |
|------|----------|---------|-----------|-------|
| qa | agent_abc123 | 2026-06-10T10:00:00Z | run regression suite for feature/auth | reused — knows last test run |
```

On wind-down, rename the file to `agent-registry.closed.md` (or delete). Use `claude agents` to inspect the live agent set. See `claude-subagent-protocol` §3 for the full lifecycle.

## Model and Permission Gate (sonnet-first)

| Role | Default model | Promote to opus? |
|------|---------------|------------------|
| qa | **sonnet** | Not recommended — QA is verification only. Opus only with explicit user permission if the failure triage warrants deeper reasoning. |

**Permission-before-opus (mandatory).** Before spawning this team with `model: "opus"`, the orchestrator must ask the user:

```
This task may benefit from opus (deeper failure triage). Default is sonnet.
Switch this spawn to opus? (yes / no / always-yes-for-this-session)
```

If the user declines, spawn `sonnet`. If the user says "always-yes-for-this-session", record the preference and stop asking. **No silent escalation.** See `claude-subagent-protocol` §6 for the full rule.

## Steps

Single agent, no loop. Master queues test runs and dispatches one at a time. The first run spawns; every subsequent run reuses the registered agent via `SendMessage`.

### 1. Test Run

**What this step does:** QA runs tests for the specified scope and produces a structured pass/fail report.
**Inputs:** Test scope and approach from master
**Output:** `$STEP_N_OUTPUT` — structured pass/fail report. Final output — no next step (or dispatched as next run).

**First run → spawn and record:**

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

Capture the returned `agentId`, write the registry row, then capture the result into `$STEP_1_OUTPUT`. Present report to user or route failures to a fix team.

**Each subsequent run → reuse the registered agent:**

```json
{
  "name": "SendMessage",
  "input": {
    "to": "agent_abc123",
    "prompt": "Next test run for the same Inquisitor session.\n\n## Inputs\nPrior run: see last task in registry or path to prior QA report\nNew scope: {test_scope}\nTest approach: {playwright-cli|spec-files|both}\n\n## Output\nStructured QA report. If rerun after a fix, reference prior failures and mark which are now resolved."
  }
}
```

Capture result into `$STEP_N_OUTPUT`. Update the registry's `Last Task` column.

---

## Team Wind-down

The Inquisitor has no pane to close in the default in-process flow. To wind down:

1. **Stop dispatching** runs to the `qa` row in the registry. The agent goes idle and is no longer messaged.
2. **Inspect live agents** with `claude agents` (or `claude agents --json`) to see what is still running.
3. **Close the registry** by renaming the file to `agent-registry.closed.md` (or deleting) at session end. Live agents end with the session.
4. **User picks up later?** No action needed — the user can `SendMessage` to the same `agentId` in the same session and the QA agent resumes with full prior context (last run results, test target).

There is no pane-close analogue in-process. See `claude-subagent-protocol` §12 for the full wind-down model.

## Kiro Pipeline

Use the `subagent` tool to run this team as a Kiro pipeline.

```json
{
  "task": "Run a QA test session for the specified scope and produce a structured pass/fail report.",
  "stages": [
    {
      "name": "qa-test-run",
      "role": "arcwright-qa",
      "prompt_template": "Run tests for the specified scope and produce a structured pass/fail report. Use playwright-cli for UI/API testing as appropriate: {task}",
      "depends_on": []
    }
  ]
}
```
