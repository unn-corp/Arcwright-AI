---
name: "team-sec-qa"
description: "The Vault — Security finds vulnerabilities, Dev remediates, QA closes the exploit path, Security signs off; in-process with agent registry reuse"
---

# Agent Team: Security + QA — The Vault

> **Default orchestration:** in-process via [`claude-subagent-protocol`](.agents/skills/claude-subagent-protocol/SKILL.md). Spawn-once + reuse via Session Agent Registry. herdr pane variant is opt-in (see the `herdr` skill).
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

## Agent Registry

This team uses a Session Agent Registry (see `claude-subagent-protocol` §3) to record live agent IDs and reuse them across steps. Path:

```
_arcwright-output/sessions/<session-id>/agent-registry.md
```

Roles in this team (one row per role):

| Role | Agent | Notes |
|------|-------|-------|
| security | `arcwright-review-orchestrator` (security lens) | Reused for step 4 sign-off — knows original findings, current remediation state |
| qa | `arcwright-qa` | Reused for step 3 re-verification across loop iterations — knows prior exploit attempts |
| dev | `arcwright-dev` | Reused for step 2 remediation passes across loop iterations — knows prior patches |

Spawn-once rule: the first time each role is needed, spawn via `Agent` tool and capture `agentId`. On any subsequent task for the same role (including the next iteration of the remediation loop), look up the row in the registry and dispatch via `SendMessage`. The Security agent keeps full prior context — original findings, the QA exploit attempts, the current sign-off state.

## Model Strategy (sonnet-first + permission gate)

| Role | Default | Opus |
|------|---------|------|
| `arcwright-review-orchestrator` (security lens) | sonnet | only with explicit user permission — Security is **not** a silent-opus default |
| `arcwright-qa` | sonnet | only with explicit user permission |
| `arcwright-dev` | sonnet | n/a — code execution; sonnet is sufficient |

**Default is sonnet for every spawn.** Before spawning any agent with `model: "opus"` or raising effort, the orchestrator (or this skill) **must ask the user** first (per `claude-subagent-protocol` §6.3). No silent escalation — Security work, despite its stakes, follows the same gate. If the user grants opus for the security role, record the preference and stop asking for the rest of the session.

## Spawn-once + Reuse

For each step (and each loop iteration), before issuing the Agent call, check the registry:

- **Registry miss** (first use of the role in this session) → spawn via `Agent` tool. Capture the returned `agentId` and write a registry row.
- **Registry hit** (same role, same context) → dispatch via `SendMessage(to: <agentId>, ...)`. The agent already holds the prior context — do not re-feed it.

The Security agent is the load-bearing reuse case for this team: it is re-engaged on every remediation loop iteration and must know the original findings, the prior QA exploit attempts, and the current sign-off state. The QA agent is reused across re-verification passes to retain the prior exploit attempts and test setup. The Dev agent is reused across remediation passes to retain the patch history.

For the full spawn / reuse pattern see `claude-subagent-protocol` §4.

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

`security` is the first-time role. Spawn via `Agent` tool, capture `agentId`, write the registry row.

```json
{
  "name": "Agent",
  "input": {
    "subagent_type": "arcwright-review-orchestrator",
    "prompt": "Review the target scope for security vulnerabilities using an OWASP Top 10 lens. Focus on: injection, XSS, auth bypass, IDOR, secrets exposure, insecure data handling. List each finding with severity (critical | major | minor) and exploitation description.\n\n## Inputs\nTarget scope: {target_scope}\n\n## Output\nList of vulnerability findings with severity and exploitation description. If none: 'No findings.'",
    "model": "sonnet"
  }
}
```

Capture result into `$STEP_1_OUTPUT`. Pass to step 2.

---

#### Pane Visibility (opt-in)

For opt-in pane visibility, see the `herdr` skill's "Watching agents in panes (opt-in)" section (spawn with `herdr agent start`, wait with `herdr wait agent-status`). The pane is a viewing surface; the in-process Agent tool + SendMessage flow is still governed by `claude-subagent-protocol`.

---

### 2. Remediation

**What this step does:** Dev remediates all vulnerabilities in priority order.
**Inputs:** `$STEP_1_OUTPUT` (vulnerability findings from step 1)
**Output:** `$STEP_2_OUTPUT` — patches applied, files changed

---

#### Default: In-Process (Agent tool)

`dev` is the first-time role. Spawn via `Agent` tool, capture `agentId`, write the registry row.

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

#### Pane Visibility (opt-in)

For opt-in pane visibility, see the `herdr` skill's "Watching agents in panes (opt-in)" section (spawn with `herdr agent start`, wait with `herdr wait agent-status`). The pane is a viewing surface; the in-process Agent tool + SendMessage flow is still governed by `claude-subagent-protocol`.

---

### 3. Exploit Path Verification

**What this step does:** QA attempts to trigger each vulnerability through the live UI or API to confirm the exploit path is actually closed.
**Inputs:** `$STEP_2_OUTPUT` (patches applied) + `$STEP_1_OUTPUT` (original vulnerability findings with exploitation descriptions)
**Output:** `$STEP_3_OUTPUT` — pass (all exploit paths confirmed closed) or fail (remaining open paths)

---

#### Default: In-Process (Agent tool)

`qa` is the first-time role. Spawn via `Agent` tool, capture `agentId`, write the registry row.

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

#### Pane Visibility (opt-in)

For opt-in pane visibility, see the `herdr` skill's "Watching agents in panes (opt-in)" section (spawn with `herdr agent start`, wait with `herdr wait agent-status`). The pane is a viewing surface; the in-process Agent tool + SendMessage flow is still governed by `claude-subagent-protocol`.

---

### 4. Security Sign-Off

**What this step does:** Security reviews QA's verification results and issues final sign-off or escalation.
**Inputs:** `$STEP_3_OUTPUT` (QA verification results) + `$STEP_1_OUTPUT` (original findings)
**Output:** `$STEP_4_OUTPUT` — signed off or escalation. Final output — no next step.

---

#### Default: In-Process (Agent tool)

`security` is already in the registry from step 1 — reuse via `SendMessage` (re-engage the existing Security agent with the sign-off task). Do not re-spawn.

```json
{
  "name": "SendMessage",
  "input": {
    "to": "agent_<security-id>",
    "prompt": "Review the QA verification results and issue final sign-off or escalation on the remediated vulnerabilities.\n\n## Inputs\nQA verification report: {$STEP_3_OUTPUT}\nOriginal findings: {$STEP_1_OUTPUT}\n\n## Output\n'Signed off: all findings remediated and exploit paths confirmed closed.' OR 'Escalation: {remaining_concern}'"
  }
}
```

Capture result into `$STEP_4_OUTPUT`. If signed off: loop exits, task complete. If escalation: return to step 2 (re-engage the existing Dev agent via `SendMessage` with the remaining concerns; QA re-verifies via `SendMessage`; Security re-reviews via `SendMessage` again for the next sign-off pass). Final output — no next step.

---

#### Pane Visibility (opt-in)

For opt-in pane visibility, see the `herdr` skill's "Watching agents in panes (opt-in)" section (spawn with `herdr agent start`, wait with `herdr wait agent-status`). The pane is a viewing surface; the in-process Agent tool + SendMessage flow is still governed by `claude-subagent-protocol`.

---

## Team Wind-down

In-process wind-down — no pane close:

- Mark a role "done" by stopping further dispatch to that role. The agent becomes idle but is not killed (the user can pick it back up with `SendMessage` later in the session).
- The Session Agent Registry may be deleted or renamed to `agent-registry.closed.md` when the session ends.
- Inspect live agents at any time via `claude agents` (or `claude agents --json` for parseable output).
- There is no `kill-pane` analogue. The wind-down is: stop dispatching, let the session end.

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
