---
name: "team-sec-qa"
description: "The Vault — Security finds vulnerabilities, Dev remediates, QA closes the exploit path, Security signs off"
---

# Agent Team: Security + QA — The Vault

> **Default orchestration:** in-process via [`claude-subagent-protocol`](.agents/skills/claude-subagent-protocol/SKILL.md). tmux split-pane variant is opt-in (see step blocks).
>
> **Kiro CLI:** this team is available as a Kiro `subagent` pipeline. See `## Kiro Pipeline` at the end of this skill.

## Best Used For

- Targeted security hardening of a specific endpoint, module, or auth flow
- Remediating a reported vulnerability with independent QA verification before sign-off
- Pre-pentest preparation to close known issues before external review
- Auth, payment, and admin area security reviews where exploit-path verification is mandatory
- Any remediation where "the code changed" is insufficient — actual attack surface closure must be confirmed

## Team Composition

| Role | Agent | Skills |
|------|-------|--------|
| Security | `arcwright-review-orchestrator` (security lens) | OWASP, injection, XSS, auth bypass, secrets exposure |
| QA | `arcwright-qa` | playwright-cli, vulnerability path verification, regression testing |
| Dev | `arcwright-dev` | Security remediation, patch implementation |

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

Load `.agents/skills/tmux-protocol/SKILL.md` before running tmux commands. Default path is in-process — no pane operations needed.

#### tmux Variant (when $TMUX is set and user wants visibility)

Load `.agents/skills/tmux-protocol/SKILL.md` before running these commands.

```bash
# 1. Split Security pane (top-right)
tmux split-window -h -c "#{pane_current_path}" "~/.config/tmux/bin/agent_spawn.sh 'You are the Security reviewer in The Vault team managed by Conductor (master-orchestrator). Activate with a security-only review lens: focus exclusively on OWASP Top 10, injection vulnerabilities, XSS, auth bypass, secrets exposure, and insecure data handling. Emit AGENT_SIGNAL::FINDING signals as you discover issues. You have sign-off authority on fixed items. Your task queue comes from the master pane. Before stopping any task output: AGENT_SIGNAL::TASK_DONE::security::{task_id}::{status}::{summary}. On long tasks emit AGENT_SIGNAL::PROGRESS every 60s. Wait for your first task.'"
sleep 8

# 2. Split QA pane (mid-right)
tmux split-window -v -c "#{pane_current_path}" "~/.config/tmux/bin/agent_spawn.sh 'You are the QA agent in The Vault team managed by Conductor (master-orchestrator). Read and activate: {project-root}/_arcwright/awm/agents/qa.md. In this team your role is to VERIFY THAT EXPLOIT PATHS ARE CLOSED — not just that code compiles. Use playwright-cli to attempt to trigger vulnerabilities through the live UI and API. Signal pass only when you have confirmed the attack surface is gone. Your task queue comes from the master pane. Before stopping any task output: AGENT_SIGNAL::TASK_DONE::qa::{task_id}::{pass|fail}::{summary}. On long tasks emit AGENT_SIGNAL::PROGRESS every 60s. Wait for your first task.'"
sleep 8

# 3. Split Dev pane (bottom-right)
tmux split-window -v -c "#{pane_current_path}" "~/.config/tmux/bin/agent_spawn.sh 'You are the Dev agent in The Vault team managed by Conductor (master-orchestrator). Read and activate: {project-root}/_arcwright/awm/agents/dev.md. Your task queue comes from the master pane. Before stopping any task output: AGENT_SIGNAL::TASK_DONE::dev::{task_id}::{status}::{summary}. On long tasks emit AGENT_SIGNAL::PROGRESS every 60s. Wait for your first task.'"
sleep 8

# 4. Equalize pane sizes
tmux select-layout tiled
sleep 6
```

## Agent Activation

> **Project context**: Master passes the `## Project Context` block (from its activation scan) to each agent in their first task message. Agents receive context from master — they do not re-scan independently.

- **Security**: activate with **security-only sub-spec lens** (OWASP Top 10, injection, XSS, auth bypass, secrets exposure).
  - Security has **sign-off authority** on fixed items.
- **QA**: activate `arcwright-qa`
  - QA's role in this team is **exploit path verification** — must attempt to trigger vulnerabilities through live UI/API, not just run unit tests.
- **Dev**: activate `arcwright-dev`

## Steps

### 1. Security Review

**What this step does:** Security reviews the target scope for vulnerabilities and emits findings by severity.
**Inputs:** Target scope (files/endpoints) from master
**Output:** `$STEP_1_OUTPUT` — vulnerability findings with severity

---

#### Default: In-Process (Agent tool)

```json
{
  "name": "Agent",
  "input": {
    "subagent_type": "arcwright-review-orchestrator",
    "prompt": "Review the target scope for security vulnerabilities using an OWASP Top 10 lens. Focus on: injection, XSS, auth bypass, IDOR, secrets exposure, insecure data handling. List each finding with severity (critical | major | minor) and exploitation description.\n\n## Inputs\nTarget scope: {target_scope}\n\n## Output\nList of vulnerability findings with severity and exploitation description. If none: 'No findings.'",
    "model": "opus"
  }
}
```

Capture result into `$STEP_1_OUTPUT`. Pass to step 2.

---

#### tmux Variant (when $TMUX is set and user wants visibility)

Load `.agents/skills/tmux-protocol/SKILL.md` before spawning.

```bash
tmux send-keys -t {security_pane_id} "TASK-{id}-sec: Review target area: {target_scope}. Emit FINDING signals per vulnerability. Signal TASK_DONE when review complete." Enter
```

Completion signal: `AGENT_SIGNAL::TASK_DONE::security::{task_id}::complete::{N} findings emitted`

---

### 2. Remediation

**What this step does:** Dev remediates all vulnerabilities in priority order.
**Inputs:** `$STEP_1_OUTPUT` (vulnerability findings from step 1)
**Output:** `$STEP_2_OUTPUT` — patches applied, files changed

---

#### Default: In-Process (Agent tool)

```json
{
  "name": "Agent",
  "input": {
    "subagent_type": "arcwright-dev",
    "prompt": "Remediate all security vulnerabilities in priority order (critical first). Address each finding specifically.\n\n## Inputs\nVulnerability findings: {$STEP_1_OUTPUT}\n\n## Output\nRemediation complete. List all files changed and describe each patch with the vulnerability it closes.",
    "model": "sonnet"
  }
}
```

Capture result into `$STEP_2_OUTPUT`. Pass to step 3.

---

#### tmux Variant (when $TMUX is set and user wants visibility)

Load `.agents/skills/tmux-protocol/SKILL.md` before spawning.

```bash
tmux send-keys -t {dev_pane_id} "TASK-{id}-fix: Remediate vulnerabilities in priority order. Findings: {$STEP_1_OUTPUT}. Signal TASK_DONE when patched." Enter
```

Completion signal: `AGENT_SIGNAL::TASK_DONE::dev::{task_id}::patched::{files_changed}`

---

### 3. Exploit Path Verification

**What this step does:** QA attempts to trigger each vulnerability through the live UI or API to confirm the exploit path is actually closed.
**Inputs:** `$STEP_2_OUTPUT` (patches applied) + `$STEP_1_OUTPUT` (original vulnerability findings with exploitation descriptions)
**Output:** `$STEP_3_OUTPUT` — pass (all exploit paths confirmed closed) or fail (remaining open paths)

---

#### Default: In-Process (Agent tool)

```json
{
  "name": "Agent",
  "input": {
    "subagent_type": "arcwright-qa",
    "prompt": "Verify that each vulnerability's exploit path is CLOSED — not just that code changed. Attempt each attack via playwright-cli through the live UI and API. Signal pass only when the attack surface is confirmed gone.\n\n## Inputs\nVulnerabilities to verify (with exploitation descriptions): {$STEP_1_OUTPUT}\nPatches applied: {$STEP_2_OUTPUT}\n\n## Output\nPass or fail per vulnerability. 'All exploit paths confirmed closed.' OR list of still-exploitable paths with evidence.",
    "model": "sonnet"
  }
}
```

Capture result into `$STEP_3_OUTPUT`. If all paths closed: pass to step 4. If any still open: return to step 2 with remaining open paths.

---

#### tmux Variant (when $TMUX is set and user wants visibility)

Load `.agents/skills/tmux-protocol/SKILL.md` before spawning.

```bash
tmux send-keys -t {qa_pane_id} "TASK-{id}-verify: Verify exploit paths are CLOSED. Attempt each attack via playwright-cli. Findings to verify: {$STEP_1_OUTPUT}. Signal TASK_DONE with pass or fail per finding." Enter
```

Completion signal: `AGENT_SIGNAL::TASK_DONE::qa::{task_id}::pass::All exploit paths confirmed closed` or `AGENT_SIGNAL::TASK_DONE::qa::{task_id}::fail::{still_exploitable}`

---

### 4. Security Sign-Off

**What this step does:** Security reviews QA's verification results and issues final sign-off or escalation.
**Inputs:** `$STEP_3_OUTPUT` (QA verification results) + `$STEP_1_OUTPUT` (original findings)
**Output:** `$STEP_4_OUTPUT` — signed off or escalation. Final output — no next step.

---

#### Default: In-Process (Agent tool)

```json
{
  "name": "Agent",
  "input": {
    "subagent_type": "arcwright-review-orchestrator",
    "prompt": "Review the QA verification results and issue final sign-off or escalation on the remediated vulnerabilities.\n\n## Inputs\nQA verification report: {$STEP_3_OUTPUT}\nOriginal findings: {$STEP_1_OUTPUT}\n\n## Output\n'Signed off: all findings remediated and exploit paths confirmed closed.' OR 'Escalation: {remaining_concern}'",
    "model": "opus"
  }
}
```

Capture result into `$STEP_4_OUTPUT`. If signed off: loop exits, task complete. If escalation: return to step 2. Final output — no next step.

---

#### tmux Variant (when $TMUX is set and user wants visibility)

Load `.agents/skills/tmux-protocol/SKILL.md` before spawning.

```bash
tmux send-keys -t {security_pane_id} "TASK-{id}-signoff: QA confirmed exploit paths closed. Review and sign off or escalate. QA report: {$STEP_3_OUTPUT}" Enter
```

Completion signal: `AGENT_SIGNAL::TASK_DONE::security::{task_id}::signed-off::Remediation verified, all findings closed`

---

## Communication Protocol

See [`tmux-protocol`](.agents/skills/tmux-protocol/SKILL.md) for the tmux signal protocol; this skill's default is in-process — Agent tool return value is the sole completion signal.

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

## Team Close Protocol

When master needs to close this team:
1. Read pane IDs from `active_team` in `_arcwright/_memory/master-orchestrator-sidecar/session-state.md`
2. Kill each pane directly: `tmux kill-pane -t {pane_id}` (DO NOT send `/exit`)
3. Clear `active_team` from session-state.md

## Kiro Pipeline

> Note: This pipeline represents one iteration of the Security+QA remediation loop. Re-invoke for additional iterations if QA finds remaining open exploit paths.

Use the `subagent` tool to run this team as a Kiro pipeline.

```json
{
  "task": "Security-first remediation: Security identifies vulnerabilities, Dev remediates, QA verifies exploit paths are closed, Security signs off.",
  "stages": [
    {
      "name": "sec-review",
      "role": "arcwright-review-orchestrator",
      "prompt_template": "Review the target scope for security vulnerabilities using an OWASP Top 10 lens. List each finding with severity (critical | major | minor) and exploitation description: {task}",
      "depends_on": []
    },
    {
      "name": "dev-remediate",
      "role": "arcwright-dev",
      "prompt_template": "Remediate all security vulnerabilities in priority order (critical first). Address each finding specifically and describe each patch with the vulnerability it closes: {task}",
      "depends_on": ["sec-review"]
    },
    {
      "name": "qa-verify-exploits",
      "role": "arcwright-qa",
      "prompt_template": "Verify that each vulnerability's exploit path is CLOSED — not just that code changed. Attempt each attack via playwright-cli through the live UI and API. Signal pass only when the attack surface is confirmed gone: {task}",
      "depends_on": ["dev-remediate"]
    },
    {
      "name": "sec-signoff",
      "role": "arcwright-review-orchestrator",
      "prompt_template": "Review the QA verification results and issue final sign-off or escalation on the remediated vulnerabilities: {task}",
      "depends_on": ["qa-verify-exploits"]
    }
  ]
}
```
