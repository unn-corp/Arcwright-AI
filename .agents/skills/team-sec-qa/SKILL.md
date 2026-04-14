---
name: "team-sec-qa"
description: "The Vault — Security finds vulnerabilities, Dev remediates, QA closes the exploit path, Security signs off"
---

# Agent Team: Security + QA — The Vault

## tmux Protocol

If `$TMUX` is set, load `.agents/skills/tmux-protocol/SKILL.md` before any pane operations.

## Available Skills

Scan `_arcwright/_config/skills-menu.md` for skills relevant to this task. Load the full SKILL.md for any that apply before starting work.


## Team Composition

| Role | Agent | Skills |
|------|-------|--------|
| Security | Security reviewer (review agent with security-only sub-spec lens) | OWASP, injection, XSS, auth bypass, secrets exposure |
| QA | `arcwright-agent-awm-qa` | playwright-cli, vulnerability path verification, regression testing |
| Dev | `arcwright-agent-awm-dev` | Security remediation, patch implementation |

## Purpose

The Vault is purpose-built for security-first remediation cycles. Security identifies vulnerabilities, Dev remediates them, and QA verifies the exploit path is actually closed — not just that the code compiles. This distinction matters: QA's role is to attempt to exploit the vulnerability through the live UI or API and confirm the attack surface is gone. Security then signs off on fixed items. Use The Vault for targeted security hardening, post-vulnerability-report remediation, or any time a security issue needs independent QA verification before sign-off.

## Layout (tmux)

```
┌─────────┬───────────┐
│         │ Security  │
│ Master  ├───────────┤
│ (left)  │    QA     │
│         ├───────────┤
│         │    Dev    │
└─────────┴───────────┘
```

## Spawn Sequence

```bash
# 1. Split Security pane (top-right)
tmux split-window -h -c "#{pane_current_path}" "~/.config/tmux/bin/agent_spawn.sh 'You are the Security reviewer in The Vault team managed by Conductor (master-orchestrator). Activate with a security-only review lens: focus exclusively on OWASP Top 10, injection vulnerabilities, XSS, auth bypass, secrets exposure, and insecure data handling. Emit AGENT_SIGNAL::FINDING signals as you discover issues. You have sign-off authority on fixed items. Your task queue comes from the master pane. Before stopping any task output: AGENT_SIGNAL::TASK_DONE::security::{task_id}::{status}::{summary}. On long tasks emit AGENT_SIGNAL::PROGRESS every 60s. Wait for your first task.'"
sleep 8

# 2. Split QA pane (mid-right)
tmux split-window -v -c "#{pane_current_path}" "~/.config/tmux/bin/agent_spawn.sh 'You are the QA agent in The Vault team managed by Conductor (master-orchestrator). Read and activate: {project-root}/.claude/commands/arcwright-agent-awm-qa.md. In this team your role is to VERIFY THAT EXPLOIT PATHS ARE CLOSED — not just that code compiles. Use playwright-cli to attempt to trigger vulnerabilities through the live UI and API. Signal pass only when you have confirmed the attack surface is gone. Your task queue comes from the master pane. Before stopping any task output: AGENT_SIGNAL::TASK_DONE::qa::{task_id}::{pass|fail}::{summary}. On long tasks emit AGENT_SIGNAL::PROGRESS every 60s. Wait for your first task.'"
sleep 8

# 3. Split Dev pane (bottom-right)
tmux split-window -v -c "#{pane_current_path}" "~/.config/tmux/bin/agent_spawn.sh 'You are the Dev agent in The Vault team managed by Conductor (master-orchestrator). Read and activate: {project-root}/.claude/commands/arcwright-agent-awm-dev.md. Your task queue comes from the master pane. Before stopping any task output: AGENT_SIGNAL::TASK_DONE::dev::{task_id}::{status}::{summary}. On long tasks emit AGENT_SIGNAL::PROGRESS every 60s. Wait for your first task.'"
sleep 8

# 4. Equalize pane sizes
tmux select-layout tiled
sleep 6
```

## Agent Activation

> **Project context**: Master passes the `## Project Context` block (from its activation scan) to each agent in their first task message. Agents receive context from master — they do not re-scan independently.

- **Security**: Activate review agent with **security-only sub-spec lens** (OWASP Top 10, injection, XSS, auth bypass, secrets exposure).
  - Security has **sign-off authority** on fixed items.
- **QA**: `Read and activate: {project-root}/.claude/commands/arcwright-agent-awm-qa.md`
  - QA's role in this team is **exploit path verification** — must attempt to trigger vulnerabilities through live UI/API, not just run unit tests.
- **Dev**: `Read and activate: {project-root}/.claude/commands/arcwright-agent-awm-dev.md`

## Iterative Loop

```
1. Master dispatches security review scope to Security
   → tmux send-keys -t {security_pane_id} "TASK-{id}-sec: Review target area: {files/endpoints}. Emit FINDING signals per vulnerability. Signal TASK_DONE when review complete." Enter

2. Security reviews and emits findings
   → AGENT_SIGNAL::FINDING::security::{task_id}::finding::{severity}::{vuln_description}
   → AGENT_SIGNAL::TASK_DONE::security::{task_id}::complete::{N} findings emitted

3. Master batches findings, dispatches remediation task to Dev
   → tmux send-keys -t {dev_pane_id} "TASK-{id}-fix: Remediate these vulnerabilities in priority order. Findings: {findings}. Signal TASK_DONE when patched." Enter

4. Dev remediates
   → AGENT_SIGNAL::TASK_DONE::dev::{task_id}::patched::{files_changed}

5. Master dispatches QA verification task with the specific exploit paths to test
   → tmux send-keys -t {qa_pane_id} "TASK-{id}-verify: Verify these exploit paths are CLOSED. Attempt each attack via playwright-cli. Findings to verify: {findings}. Signal TASK_DONE with pass or fail per finding." Enter

6. QA attempts to trigger each vulnerability through live UI/API
   → AGENT_SIGNAL::TASK_DONE::qa::{task_id}::pass::All exploit paths confirmed closed
   → OR: AGENT_SIGNAL::TASK_DONE::qa::{task_id}::fail::{still-exploitable findings}

7a. If QA FAIL:
    → Master re-dispatches remaining open paths to Dev for further remediation
    → Repeat from step 4

7b. If QA PASS:
    → Master dispatches QA verification result to Security for final sign-off
    → tmux send-keys -t {security_pane_id} "TASK-{id}-signoff: QA confirmed exploit paths closed. Review QA findings and sign off or escalate. QA report: {qa_summary}" Enter
    → Security reviews QA result → emits sign-off or escalation

8. Loop exits when Security emits sign-off on all patched vulnerabilities
```

## Communication Protocol

### Signal Format
```
AGENT_SIGNAL::{TYPE}::{FROM_ROLE}::{TASK_ID}::{STATUS}::{DETAIL}
```
Types: `READY` | `TASK_START` | `PROGRESS` | `TASK_DONE` | `TASK_BLOCKED` | `FINDING` | `ERROR`

Examples:
- `AGENT_SIGNAL::FINDING::security::task-030::finding::critical::IDOR on /api/users/{id} — no ownership check`
- `AGENT_SIGNAL::TASK_DONE::qa::task-030::pass::IDOR path tested — /api/users/999 returns 403 as expected`
- `AGENT_SIGNAL::TASK_DONE::security::task-030::signed-off::Remediation verified, all findings closed`

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

When spawning this team, master writes to `_arcwright/_memory/master-orchestrator-sidecar/session-state.md` under `active_team`:
```yaml
active_team:
  code: sec-qa
  name: "The Vault"
  spawned_at: {ISO8601}
  panes:
    security: {pane_id}
    qa: {pane_id}
    dev: {pane_id}
```

## In-Process Fallback

When `$TMUX` is not set, run agents sequentially using the Agent tool:

1. Spawn Security reviewer (Agent tool) with review scope → capture vulnerability findings
2. Spawn Dev agent (Agent tool) with findings → wait for remediation
3. Spawn QA agent (Agent tool) with exploit paths to verify → capture verification result
4. If QA fail: spawn Dev again with remaining open paths → repeat from step 3
5. If QA pass: spawn Security agent again with QA report → capture sign-off
6. If Security escalates: repeat from step 2

## Team Close Protocol

When master needs to close this team:
1. Read pane IDs from `active_team` in `_arcwright/_memory/master-orchestrator-sidecar/session-state.md`
2. Kill each pane directly: `tmux kill-pane -t {pane_id}` (DO NOT send `/exit`)
3. Clear `active_team` from session-state.md

## Best Used For

- Targeted security hardening of a specific endpoint, module, or auth flow
- Remediating a reported vulnerability with independent QA verification before sign-off
- Pre-pentest preparation to close known issues before external review
- Auth, payment, and admin area security reviews where exploit-path verification is mandatory
- Any remediation where "the code changed" is insufficient — actual attack surface closure must be confirmed
