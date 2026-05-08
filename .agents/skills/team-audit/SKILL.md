---
name: "team-audit"
description: "The Crucible — full audit with Architect, UX, and Security running concurrently; Security has final sign-off"
---

# Agent Team: Full Audit + Fix Loop — The Crucible

> **Default orchestration:** in-process via [`claude-subagent-protocol`](.agents/skills/claude-subagent-protocol/SKILL.md). tmux split-pane variant is opt-in (see step blocks).
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

## Layout (tmux)

```
┌─────────┬───────────┐
│         │ Architect │
│ Master  ├───────────┤
│ (left)  │    UX     │
│         ├───────────┤
│         │ Security  │
├─────────┼───────────┤
│  (open) │    Dev    │
└─────────┴───────────┘
```

## Spawn Sequence

Load `.agents/skills/tmux-protocol/SKILL.md` before running tmux commands. Default path is in-process — no pane operations needed.

#### tmux Variant (when $TMUX is set and user wants visibility)

Load `.agents/skills/tmux-protocol/SKILL.md` before running these commands.

```bash
# 1. Split Architect pane (top-right)
tmux split-window -h -c "#{pane_current_path}" "~/.config/tmux/bin/agent_spawn.sh 'You are the Architect agent in The Crucible audit team managed by Conductor (master-orchestrator). Read and activate: {project-root}/_arcwright/awm/agents/architect.md. You have full dev skill access. Emit AGENT_SIGNAL::FINDING signals as you discover issues. Your task queue comes from the master pane. Before stopping any task output: AGENT_SIGNAL::TASK_DONE::architect::{task_id}::{status}::{summary}. On long tasks emit AGENT_SIGNAL::PROGRESS every 60s. Wait for your first task.'"
sleep 8

# 2. Split UX pane (mid-right)
tmux split-window -v -c "#{pane_current_path}" "~/.config/tmux/bin/agent_spawn.sh 'You are the UX Designer agent in The Crucible audit team managed by Conductor (master-orchestrator). Read and activate: {project-root}/_arcwright/awm/agents/ux-designer.md. You have full dev skill access. Emit AGENT_SIGNAL::FINDING signals as you discover issues. Your task queue comes from the master pane. Before stopping any task output: AGENT_SIGNAL::TASK_DONE::ux::{task_id}::{status}::{summary}. On long tasks emit AGENT_SIGNAL::PROGRESS every 60s. Wait for your first task.'"
sleep 8

# 3. Split Security pane (bottom-right)
tmux split-window -v -c "#{pane_current_path}" "~/.config/tmux/bin/agent_spawn.sh 'You are the Security reviewer in The Crucible audit team managed by Conductor (master-orchestrator). Activate with a security-only review lens: focus exclusively on OWASP Top 10, injection vulnerabilities, XSS, auth bypass, secrets exposure, and insecure data handling. Emit AGENT_SIGNAL::FINDING signals as you discover issues. You have FINAL SIGN-OFF authority. Your task queue comes from the master pane. Before stopping any task output: AGENT_SIGNAL::TASK_DONE::security::{task_id}::{status}::{summary}. On long tasks emit AGENT_SIGNAL::PROGRESS every 60s. Wait for your first task.'"
sleep 8

# 4. Split Dev pane (4th pane — horizontal split from bottom area)
tmux split-window -h -c "#{pane_current_path}" "~/.config/tmux/bin/agent_spawn.sh 'You are the Dev agent in The Crucible audit team managed by Conductor (master-orchestrator). Read and activate: {project-root}/_arcwright/awm/agents/dev.md. You can invoke architect, QA, and security skills from .agents/skills/ inline during fix phases. Your task queue comes from the master pane. Before stopping any task output: AGENT_SIGNAL::TASK_DONE::dev::{task_id}::{status}::{summary}. On long tasks emit AGENT_SIGNAL::PROGRESS every 60s. Wait for your first task.'"
sleep 8

# 5. Equalize pane sizes
tmux select-layout tiled
sleep 6
```

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

Issue all three Agent calls in a single assistant message (parallel fan-out):

```json
[
  {
    "name": "Agent",
    "input": {
      "subagent_type": "arcwright-architect",
      "prompt": "Audit the following scope for architectural issues: DRY/SOLID violations, structural problems, integration pattern issues. List each finding with severity (critical | major | minor) and description.\n\n## Inputs\nAudit scope: {audit_scope}\n\n## Output\nList of findings with severity. If none: 'No findings.'",
      "model": "opus"
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
      "model": "opus"
    }
  }
]
```

Capture results into `$STEP_1_AR_OUTPUT`, `$STEP_1_UX_OUTPUT`, `$STEP_1_SEC_OUTPUT`. Merge and sort all findings by severity (critical security first, then critical arch/ux, then major, then minor). Pass merged findings to step 2.

---

#### tmux Variant (when $TMUX is set and user wants visibility)

Load `.agents/skills/tmux-protocol/SKILL.md` before spawning. Dispatch to all three panes simultaneously; poll for all three TASK_DONE signals before proceeding.

```bash
tmux send-keys -t {architect_pane_id} "TASK-{id}-ar: Audit scope: {audit_scope}. Emit FINDING signals per issue. Signal TASK_DONE when audit complete." Enter
tmux send-keys -t {ux_pane_id} "TASK-{id}-ux: Audit scope: {audit_scope}. Emit FINDING signals per issue. Signal TASK_DONE when audit complete." Enter
tmux send-keys -t {security_pane_id} "TASK-{id}-sec: Audit scope: {audit_scope}. Emit FINDING signals per security issue. Signal TASK_DONE when audit complete." Enter
```

Completion signals (wait for all three):
```
AGENT_SIGNAL::TASK_DONE::architect::{task_id}::done::{finding_count}
AGENT_SIGNAL::TASK_DONE::ux::{task_id}::done::{finding_count}
AGENT_SIGNAL::TASK_DONE::security::{task_id}::done::{finding_count}
```

---

### 2. Fix Batch

**What this step does:** Dev fixes all findings in severity order (critical security first).
**Inputs:** Merged findings from step 1 (all three reviewers)
**Output:** `$STEP_2_OUTPUT` — fix completion summary with files changed

---

#### Default: In-Process (Agent tool)

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

#### tmux Variant (when $TMUX is set and user wants visibility)

Load `.agents/skills/tmux-protocol/SKILL.md` before spawning.

```bash
tmux send-keys -t {dev_pane_id} "TASK-{id}-fix: Fix findings in priority order. Critical security first. Findings: {merged_findings}. Signal TASK_DONE with files changed." Enter
```

Completion signal: `AGENT_SIGNAL::TASK_DONE::dev::{task_id}::fixed::{files_changed}`

---

### 3. Targeted Re-Audit

**What this step does:** Only the reviewers whose findings were addressed re-audit only the affected areas. Security always re-reviews security-tagged findings.
**Inputs:** `$STEP_2_OUTPUT` (files changed + fix descriptions from step 2)
**Output:** `$STEP_3_OUTPUT` — re-audit result per reviewer: clean pass or new findings

---

#### Default: In-Process (Agent tool)

Issue re-audit Agent calls only for reviewers with affected findings. Security always included when security findings were fixed:

```json
[
  {
    "name": "Agent",
    "input": {
      "subagent_type": "arcwright-review-orchestrator",
      "prompt": "Re-audit ONLY the areas that were fixed for security findings. Confirm the original vulnerabilities are closed and no new security issues were introduced.\n\n## Inputs\nFiles changed: {$STEP_2_OUTPUT}\nOriginal security findings: {$STEP_1_SEC_OUTPUT}\n\n## Output\nClean pass OR new/remaining findings with severity.",
      "model": "opus"
    }
  }
]
```

Add Architect and/or UX re-audit calls to the array if their findings were also addressed. Capture results into `$STEP_3_OUTPUT`. If Security clean AND all other findings resolved: loop exits, task complete. Otherwise: return to step 2 with remaining findings.

---

#### tmux Variant (when $TMUX is set and user wants visibility)

Load `.agents/skills/tmux-protocol/SKILL.md` before spawning. Dispatch only to reviewers with affected findings:

```bash
tmux send-keys -t {security_pane_id} "TASK-{id}-reverify: Re-audit ONLY these affected areas: {affected_areas}. Signal TASK_DONE with clean pass or new findings." Enter
```

Completion signal: `AGENT_SIGNAL::TASK_DONE::security::{task_id}::clean::All security findings resolved — sign-off granted`

---

## Communication Protocol

See [`tmux-protocol`](.agents/skills/tmux-protocol/SKILL.md) for the tmux signal protocol; this skill's default is in-process — Agent tool return value is the sole completion signal.

## Team Registration

When spawning this team, master writes to `_arcwright/_memory/master-orchestrator-sidecar/session-state.md` under `active_team`:
```yaml
active_team:
  code: audit
  name: "The Crucible"
  spawned_at: {ISO8601}
  panes:
    architect: {pane_id}
    ux: {pane_id}
    security: {pane_id}
    dev: {pane_id}
```

## Team Close Protocol

When master needs to close this team:
1. Read pane IDs from `active_team` in `_arcwright/_memory/master-orchestrator-sidecar/session-state.md`
2. Kill each pane directly: `tmux kill-pane -t {pane_id}` (DO NOT send `/exit`)
3. Clear `active_team` from session-state.md

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
