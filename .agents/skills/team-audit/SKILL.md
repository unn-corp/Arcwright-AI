---
name: "team-audit"
description: "The Crucible — full audit with Architect, UX, and Security running concurrently; Security has final sign-off; in-process with agent registry reuse"
---

# Agent Team: Full Audit + Fix Loop — The Crucible

> **Default orchestration:** in-process via [`claude-subagent-protocol`](.agents/skills/claude-subagent-protocol/SKILL.md). Spawn-once + reuse via Session Agent Registry. tmux is opt-in visibility only.
>
> **Kiro CLI:** this team is available as a Kiro `subagent` pipeline. See `## Kiro Pipeline` at the end of this skill.

## Best Used For

- Pre-release comprehensive quality audits where all three dimensions must pass
- Legacy codebase onboarding where security, architecture, and UX health are all unknown
- High-stakes subsystems (auth, payments, admin panels) requiring full multi-dimensional review
- Post-incident remediation where a broad audit scope is needed after a production issue
- Periodic scheduled health checks on critical application areas

## Team Composition

| Role | Agent | Skills |
|------|-------|--------|
| Architect | `arcwright-architect` | Architecture audit, DRY/SOLID, full dev skill access |
| UX Designer | `arcwright-ux-designer` | UV audit, accessibility, design token compliance, full dev skill access |
| Security | `arcwright-review-orchestrator` (security lens) | OWASP, injection, XSS, auth vulnerabilities |
| Dev | `arcwright-dev` | Fix implementation, can invoke architect, QA, and security skills inline |

## Purpose

The Crucible is the most thorough audit configuration available. Architect, UX Designer, and Security reviewer run concurrently to maximize coverage and minimize clock time. All findings are aggregated and severity-triaged, with critical security issues addressed first. Security has final sign-off authority — the loop does not exit until Security signals a clean pass on all remediated areas. Use The Crucible before major releases, for legacy code onboarding, or whenever a codebase area needs comprehensive multi-dimensional validation.

## Agent Registry

This team uses a Session Agent Registry (see `claude-subagent-protocol` §3) to record live agent IDs and reuse them across steps. Path:

```
_arcwright-output/sessions/<session-id>/agent-registry.md
```

Roles in this team (one row per role):

| Role | Agent | Notes |
|------|-------|-------|
| architect | `arcwright-architect` | Reused for step 3 re-audit if arch findings were addressed |
| ux | `arcwright-ux-designer` | Reused for step 3 re-audit if ux findings were addressed |
| security | `arcwright-review-orchestrator` (security lens) | Reused for step 3 re-audit — Security always re-reviews security-tagged findings |
| dev | `arcwright-dev` | Reused for step 2 fix passes across loop iterations |

Spawn-once rule: the first time each role is needed, spawn via `Agent` tool and capture `agentId`. On any subsequent task for the same role (including the next iteration of the fix loop), look up the row in the registry and dispatch via `SendMessage`. The Security agent keeps full prior context — original findings, last re-audit result, sign-off status.

## Model Strategy (sonnet-first + permission gate)

| Role | Default | Opus |
|------|---------|------|
| `arcwright-architect` | sonnet | only with explicit user permission |
| `arcwright-ux-designer` | sonnet | only with explicit user permission |
| `arcwright-review-orchestrator` (security lens) | sonnet | only with explicit user permission — Security is **not** a silent-opus default |
| `arcwright-dev` | sonnet | n/a — code execution; sonnet is sufficient |

**Default is sonnet for every spawn.** Before spawning any agent with `model: "opus"` or raising effort, the orchestrator (or this skill) **must ask the user** first (per `claude-subagent-protocol` §6.3). No silent escalation — Security work, despite its stakes, follows the same gate. If the user grants opus for the security role, record the preference and stop asking for the rest of the session.

## Spawn-once + Reuse

For each step, before issuing the Agent call, check the registry:

- **Registry miss** (first use of the role in this session) → spawn via `Agent` tool. Capture the returned `agentId` and write a registry row.
- **Registry hit** (same role, same context) → dispatch via `SendMessage(to: <agentId>, ...)`. The agent already holds the prior context — do not re-feed it.

The Security agent is the load-bearing reuse case for this team: it is re-engaged on every re-audit pass and must know the original findings, the prior re-audit result, and the current sign-off state. Spawning a fresh Security agent loses that context.

For the full spawn / reuse pattern see `claude-subagent-protocol` §4.

## Agent Activation

> **Project context**: Master passes the `## Project Context` block (from its activation scan) to each agent in their first task message. Agents receive context from master — they do not re-scan independently.

- **Architect**: activate `arcwright-architect`
  - Has **full dev skill access** — can invoke any skill in `.agents/skills/` directly.
- **UX Designer**: activate `arcwright-ux-designer`
  - Has **full dev skill access** — can invoke any skill in `.agents/skills/` directly.
- **Security**: activate with **security-only sub-spec lens** (OWASP Top 10, injection, XSS, auth, secrets).
  - Security has **final sign-off authority** — no loop exit without Security's clean pass.
- **Dev**: activate `arcwright-dev`
  - Can invoke architect, QA, and security skills from `.agents/skills/` inline during fix phases.

## Steps

### 1. Concurrent Audit

**What this step does:** Architect, UX Designer, and Security run concurrent audits of the target scope, each emitting findings by severity.
**Inputs:** Audit scope (files/areas) from master
**Output:** `$STEP_1_AR_OUTPUT`, `$STEP_1_UX_OUTPUT`, `$STEP_1_SEC_OUTPUT` — findings from each reviewer

---

#### Default: In-Process (Agent tool)

All three reviewers are first-time roles. Spawn all three in a single assistant message (parallel fan-out):

```json
[
  {
    "name": "Agent",
    "input": {
      "subagent_type": "arcwright-architect",
      "prompt": "Audit the following scope for architectural issues: DRY/SOLID violations, structural problems, integration pattern issues. List each finding with severity (critical | major | minor) and description.\n\n## Inputs\nAudit scope: {audit_scope}\n\n## Output\nList of findings with severity. If none: 'No findings.'",
      "model": "sonnet"
    }
  },
  {
    "name": "Agent",
    "input": {
      "subagent_type": "arcwright-ux-designer",
      "prompt": "Audit the following scope for UX/UI issues: accessibility violations, design token non-compliance, interaction pattern problems, visual inconsistencies. List each finding with severity (critical | major | minor).\n\n## Inputs\nAudit scope: {audit_scope}\n\n## Output\nList of findings with severity. If none: 'No findings.'",
      "model": "sonnet"
    }
  },
  {
    "name": "Agent",
    "input": {
      "subagent_type": "arcwright-review-orchestrator",
      "prompt": "Audit the following scope for security vulnerabilities using an OWASP Top 10 lens: injection, XSS, auth bypass, secrets exposure, insecure data handling, IDOR. List each finding with severity (critical | major | minor).\n\n## Inputs\nAudit scope: {audit_scope}\n\n## Output\nList of security findings with severity. If none: 'No findings.'",
      "model": "sonnet"
    }
  }
]
```

Capture the returned `agentId` for each spawn and write rows to the Session Agent Registry. Capture results into `$STEP_1_AR_OUTPUT`, `$STEP_1_UX_OUTPUT`, `$STEP_1_SEC_OUTPUT`. Merge and sort all findings by severity (critical security first, then critical arch/ux, then major, then minor). Pass merged findings to step 2.

---

#### tmux Variant (opt-in)

For opt-in pane visibility, see the `tmux` skill's "Watching agents in panes (opt-in)" section. In-process flow inside the pane is still governed by `claude-subagent-protocol`.

---

### 2. Fix Batch

**What this step does:** Dev fixes all findings in severity order (critical security first).
**Inputs:** Merged findings from step 1 (all three reviewers)
**Output:** `$STEP_2_OUTPUT` — fix completion summary with files changed

---

#### Default: In-Process (Agent tool)

`dev` is the first-time role. Spawn via `Agent` tool, capture `agentId`, write the registry row.

```json
{
  "name": "Agent",
  "input": {
    "subagent_type": "arcwright-dev",
    "prompt": "Fix all audit findings in severity order. Critical security findings first, then critical arch/ux, then major, then minor.\n\n## Inputs\nFindings (sorted by severity): {merged_findings_from_step_1}\n\n## Output\nFix complete. List all files changed and describe each fix. Tag each fix with its finding severity and originating reviewer.",
    "model": "sonnet"
  }
}
```

Capture result into `$STEP_2_OUTPUT`. Pass to step 3.

---

#### tmux Variant (opt-in)

For opt-in pane visibility, see the `tmux` skill's "Watching agents in panes (opt-in)" section.

---

### 3. Targeted Re-Audit

**What this step does:** Only the reviewers whose findings were addressed re-audit only the affected areas. Security always re-reviews security-tagged findings.
**Inputs:** `$STEP_2_OUTPUT` (files changed + fix descriptions from step 2)
**Output:** `$STEP_3_OUTPUT` — re-audit result per reviewer: clean pass or new findings

---

#### Default: In-Process (Agent tool)

Issue re-audit Agent / SendMessage calls only for reviewers with affected findings. Security is always included when security findings were fixed.

Reuse rule: any reviewer with a row in the registry from step 1 is re-engaged via `SendMessage` with the new re-audit task (do not re-spawn). Security is the load-bearing case here — it must know the original findings, the fixes applied, and the prior re-audit result.

```json
[
  {
    "name": "SendMessage",
    "input": {
      "to": "agent_<security-id>",
      "prompt": "Re-audit ONLY the areas that were fixed for security findings. Confirm the original vulnerabilities are closed and no new security issues were introduced.\n\n## Inputs\nFiles changed: {$STEP_2_OUTPUT}\nOriginal security findings: {$STEP_1_SEC_OUTPUT}\n\n## Output\nClean pass OR new/remaining findings with severity."
    }
  }
]
```

Add `SendMessage` calls for `architect` and/or `ux` to the array if their findings were also addressed. Capture results into `$STEP_3_OUTPUT`. If Security clean AND all other findings resolved: loop exits, task complete. Otherwise: return to step 2 with remaining findings.

---

#### tmux Variant (opt-in)

For opt-in pane visibility, see the `tmux` skill's "Watching agents in panes (opt-in)" section.

---

## Team Wind-down

In-process wind-down — no pane close:

- Mark a role "done" by stopping further dispatch to that role. The agent becomes idle but is not killed (the user can pick it back up with `SendMessage` later in the session).
- The Session Agent Registry may be deleted or renamed to `agent-registry.closed.md` when the session ends.
- Inspect live agents at any time via `claude agents` (or `claude agents --json` for parseable output).
- There is no `kill-pane` analogue. The wind-down is: stop dispatching, let the session end.

## Kiro Pipeline

> Note: This pipeline represents one iteration of the concurrent-audit + fix + re-audit loop. Re-invoke for additional iterations if re-audit finds remaining findings.

Use the `subagent` tool to run this team as a Kiro pipeline.

```json
{
  "task": "Full concurrent audit: Architect, UX, and Security review simultaneously; Dev fixes all findings; targeted re-audit until Security signs off.",
  "stages": [
    {
      "name": "audit-ar",
      "role": "arcwright-architect",
      "prompt_template": "Audit the scope for architectural issues: DRY/SOLID violations, structural problems, integration pattern issues. List each finding with severity (critical | major | minor): {task}",
      "depends_on": []
    },
    {
      "name": "audit-ux",
      "role": "arcwright-ux-designer",
      "prompt_template": "Audit the scope for UX/UI issues: accessibility violations, design token non-compliance, interaction pattern problems, visual inconsistencies. List each finding with severity: {task}",
      "depends_on": []
    },
    {
      "name": "audit-sec",
      "role": "arcwright-review-orchestrator",
      "prompt_template": "Audit the scope for security vulnerabilities using an OWASP Top 10 lens: injection, XSS, auth bypass, secrets exposure, insecure data handling, IDOR. List each finding with severity: {task}",
      "depends_on": []
    },
    {
      "name": "dev-fix",
      "role": "arcwright-dev",
      "prompt_template": "Fix all audit findings in severity order. Critical security findings first, then critical arch/ux, then major, then minor. Tag each fix with its finding severity and originating reviewer: {task}",
      "depends_on": ["audit-ar", "audit-ux", "audit-sec"]
    },
    {
      "name": "re-audit-sec",
      "role": "arcwright-review-orchestrator",
      "prompt_template": "Re-audit ONLY the areas that were fixed for security findings. Confirm original vulnerabilities are closed and no new security issues were introduced. Issue final sign-off or list remaining concerns: {task}",
      "depends_on": ["dev-fix"]
    }
  ]
}
```
