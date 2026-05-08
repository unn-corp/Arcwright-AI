---
name: "claude-subagent-protocol"
description: "In-process Agent tool orchestration protocol for Arcwright tracks and teams. Defines spawn patterns, handoff context contract, model/mode strategy, failure recovery, and concurrency rules. The default orchestration substrate; tmux-protocol applies only when the user opts into split-pane visibility."
allowed-tools: Read, Grep, Glob
---

# claude-subagent-protocol

**Status: Default orchestration substrate.** This skill governs all in-process Agent tool calls in every Arcwright track and team workflow. Load this skill before executing any multi-step track or team workflow.

[`tmux-protocol`](.agents/skills/tmux-protocol/SKILL.md) replaces this only when the user has explicitly opted into split-pane visibility (says "spawn", "open agent", "watch", or similar). Default orchestration is in-process — no tmux required.

Always run [`project-context`](.agents/skills/project-context/SKILL.md) before starting any track or team workflow to surface existing config, plans, and tech stack.

---

## 1. Status and Trigger

**Load this skill when:**
- Starting any track workflow (`track-nano` through `track-large`, `track-rv`)
- Starting any team workflow (`team-full-dev`, `team-arch-dev`, etc.)
- Writing a new track or team skill that orchestrates subagents
- Reviewing or debugging an orchestration flow

**Do NOT load this skill when:**
- The user has explicitly opted into tmux split-pane visibility — load `tmux-protocol` instead
- Running as a subagent yourself (subagents do not spawn further subagents per r2 §11.1)
- Performing a single isolated task with no multi-step orchestration

**Opt-in trigger for tmux path:** User says "spawn", "open agent", "I want to watch", or any explicit split-pane request AND `$TMUX` is set. In that case, load `.agents/skills/tmux-protocol/SKILL.md` and use the `#### tmux Variant` subsections in each step.

---

## 2. Canonical Spawn Pattern

This is the locked JSON Agent tool call format. Every track and team skill reproduces this structure verbatim, omitting fields that take their default value.

### 2.1 Canonical Format (FR-1 — do not deviate)

```json
{
  "name": "Agent",
  "input": {
    "subagent_type": "arcwright-{role}",
    "prompt": "{task description}\n\n## Inputs\n{prior_step_output}\n\n## Output\n{expected_artifact_or_signal}",
    "model": "{sonnet|opus|haiku}"
  }
}
```

**Optional fields** — add after `model` only when overriding the default:

```json
{
  "name": "Agent",
  "input": {
    "subagent_type": "arcwright-dev",
    "prompt": "...",
    "model": "sonnet",
    "isolation": "worktree",
    "baseRef": "head",
    "permissionMode": "acceptEdits"
  }
}
```

**Field rules:**
- `subagent_type` — required. Use the exact agent name: `arcwright-analyst`, `arcwright-architect`, `arcwright-dev`, `arcwright-pm`, `arcwright-qa`, `arcwright-sm`, `arcwright-tech-writer`, `arcwright-ux-designer`, `arcwright-quick-flow-solo-dev`, `arcwright-review-orchestrator`.
- `prompt` — required. Always include a `## Inputs` section and a `## Output` section.
- `model` — always set explicitly per spawn; do not rely on inheritance. See §5 for role defaults.
- `isolation` — OMITTED for default (`"none"`). Set to `"worktree"` ONLY for the opt-in cases described in §3c. Never show `"isolation": "none"` explicitly — remove the key entirely.
- `run_in_background` — OMITTED for default (`false`). See §3d for the discouraged background pattern.
- `permissionMode` — OMITTED when using Claude default. Set `"acceptEdits"` for autonomous Dev steps. Set `"plan"` for high-stakes design requiring user approval before execution.

**Do NOT** add fields beyond those listed. **Do NOT** reorder fields. The field order inside `"input"` is: `subagent_type`, `prompt`, `model`, then optional `isolation`, `run_in_background`, `permissionMode`.

---

## 3. Spawn Variants

### 3a. Sequential Handoff

One Agent call per assistant message. The prior result feeds the next prompt. Use for any step that depends on the prior step's artifact (PRD → architecture, architecture → dev, dev → QA).

```json
{
  "name": "Agent",
  "input": {
    "subagent_type": "arcwright-architect",
    "prompt": "Produce the architecture document.\n\n## Inputs\nPRD at `_arcwright-output/features/{slug}/planning/prd.md`\nResearch outputs in `_arcwright-output/features/{slug}/research/`\n\n## Output\nWrite to `_arcwright-output/features/{slug}/planning/architecture.md`",
    "model": "opus"
  }
}
```

Capture the Agent tool return string into a named variable (`$ARCH_OUTPUT`) and reference it in the next step's prompt.

### 3b. Parallel Fan-Out

Multiple Agent calls in a **single** assistant message. Claude Code may run them concurrently (r2 §7.2). Use for genuinely independent work: research ×3, review sub-agents ×3 (AR+DRY, UV, SR), parallel UX+Architecture design.

Each agent in a parallel fan-out MUST own a **disjoint output path**. Assigning two agents the same output path is a user error.

```json
[
  {
    "name": "Agent",
    "input": {
      "subagent_type": "arcwright-analyst",
      "prompt": "R1: codebase audit.\n\n## Output\nWrite `_arcwright-output/features/{slug}/research/r1-codebase-audit.md`",
      "model": "sonnet"
    }
  },
  {
    "name": "Agent",
    "input": {
      "subagent_type": "arcwright-analyst",
      "prompt": "R2: external spec research.\n\n## Output\nWrite `_arcwright-output/features/{slug}/research/r2-spec.md`",
      "model": "sonnet"
    }
  },
  {
    "name": "Agent",
    "input": {
      "subagent_type": "arcwright-analyst",
      "prompt": "R3: skill UX research.\n\n## Output\nWrite `_arcwright-output/features/{slug}/research/r3-skill-ux.md`",
      "model": "sonnet"
    }
  }
]
```

The orchestrator reads the three output files after the parallel batch returns. Cap parallelism at 5 (§7).

**Result order is not guaranteed (r2 §7.2).** Collect results by name or index, never by arrival order. Named capture variables make this explicit: `$RESEARCH_R1_OUTPUT`, `$RESEARCH_R2_OUTPUT`, `$RESEARCH_R3_OUTPUT`.

### 3c. Worktree-Isolated Spawn (OPT-IN — not default)

**Default for all roles (including dev, ux-designer, quick-flow-solo-dev) is `isolation: "none"` — omit the field.** Code-writing agents write directly to the parent tree. This matches current Arcwright behavior and avoids the "where did the code go?" merge problem.

**Why not default?** Files written inside a worktree live at `.claude/worktrees/<name>/src/foo.ts`, NOT the parent's `src/foo.ts`. Without an explicit merge step (which Arcwright does not do), code written in a worktree is stranded.

**Opt-in scenarios (the only three cases where `isolation: "worktree"` appears):**
- **Parallel epics in track-large** — multiple Dev agents implementing different epics simultaneously, each in their own worktree, then merged manually post-track.
- **Risky / abandonable refactors** — when the orchestrator wants the option to discard the work without polluting the parent tree.
- **Spike / experiment phases** — exploratory implementations the user may not keep.

**`baseRef` rule:** When `isolation: "worktree"` is used, always set `"baseRef": "head"`. The subagent inherits the parent's current branch including unpushed commits. `"fresh"` is opt-in only for fully independent parallel epics that don't depend on the in-flight branch.

```json
{
  "name": "Agent",
  "input": {
    "subagent_type": "arcwright-dev",
    "prompt": "Spike: try refactoring auth middleware to use JWT.\n\n## Output\nWrite code changes to the working tree. Notes to `_arcwright-output/features/{slug}/dev/spike-notes.md`.",
    "model": "sonnet",
    "isolation": "worktree",
    "baseRef": "head",
    "permissionMode": "acceptEdits"
  }
}
```

**Collection pattern for worktree artifacts:**
- **Non-code artifacts** (specs, plans, notes, research) — agent writes to `_arcwright-output/features/{slug}/...`. These paths resolve identically inside a worktree. Orchestrator reads directly.
- **Code artifacts** — when worktree isolation is used, edits live in the worktree's checkout. The orchestrator either cherry-picks back manually post-track or treats the work as "parked" until the user decides to merge or discard.
- **Default Dev path uses `isolation: "none"`** — code edits go straight into the parent tree. No collection complexity.

**Worktree error state:** On subagent error with worktree isolation, the worktree is NOT auto-cleaned (preserves diagnostic state). Orchestrator decides whether to inspect, retry, or clean up via `git worktree remove`.

### 3d. Background Spawn (DISCOURAGED in tracks and teams)

`run_in_background: true` decouples the parent from the subagent's lifecycle. **Track and team SKILL.md files should NOT use `run_in_background: true`** — an autonomous orchestrator-driven loop cannot reliably wait for a transcript notification.

Use foreground parallel fan-out (§3b — multiple `Agent` calls in one assistant message) instead. They run concurrently and return as a batch.

Background spawns are only appropriate when the parent has clearly independent foreground work that does NOT depend on the background agent's output, AND the background agent writes its result to a known file path, AND the orchestrator reads that file on a later turn.

```json
{
  "name": "Agent",
  "input": {
    "subagent_type": "arcwright-qa",
    "prompt": "Run the full E2E suite and write results to `_arcwright-output/features/{slug}/qa/run-{timestamp}.json`.",
    "model": "sonnet",
    "run_in_background": true
  }
}
```

**Parent-side notification model (r2 §3.2):** Parent receives an async notification in the transcript when the background agent completes. The notification is informational — it does not auto-pause the parent's loop. Result collection: parent reads the agreed file path. The Agent tool result string is not reliably retrievable for background spawns. Parent's prompt cache is NOT kept warm by background spawns.

---

## 4. Handoff Context Contract

The handoff between phases is the orchestrator's responsibility. It is a strict, named contract.

### 4.1 Capture

Each Agent tool result is captured into a named variable. Naming convention:

| Pattern | Use when |
|---|---|
| `$STEP_N_OUTPUT` | Ordinal steps (step 1, step 2, ...) |
| `$RESEARCH_R1_OUTPUT`, `$RESEARCH_R2_OUTPUT`, `$RESEARCH_R3_OUTPUT` | Parallel research lanes |
| `$REVIEW_AR_OUTPUT`, `$REVIEW_DRY_OUTPUT`, `$REVIEW_UV_OUTPUT`, `$REVIEW_SR_OUTPUT` | Review gate sub-agents |
| `$ARCH_OUTPUT`, `$PRD_OUTPUT`, `$DEV_E1_OUTPUT` | Role-unambiguous single agents |
| `$STEP_N_OUTPUT_A`, `$STEP_N_OUTPUT_B`, `$STEP_N_OUTPUT_C` | Same step number, multiple parallel agents |

All caps. Dollar-prefix. Underscores only.

### 4.2 Pass Forward

The receiving agent's `prompt` always contains a `## Inputs` heading. Each prior output is referenced either inline (small) or by file path (large):

```
## Inputs
Prior research:
- R1 codebase audit: `_arcwright-output/features/{slug}/research/r1-codebase-audit.md`
- R2 external spec: `_arcwright-output/features/{slug}/research/r2-spec.md`

Architecture decisions: see captured summary below.
<inline summary if <2 KB>
```

The receiving agent reads its context from the prompt — there is no other channel. No out-of-band communication. No ambient shared state.

### 4.3 Windows ~6 KB Threshold Rule

If a handoff prompt would exceed ~6 KB, write the artifact to a file under `_arcwright-output/features/{slug}/...` and pass the file path. Avoids the Windows command-line length cliff at 8 KB (r2 §15.1). This rule applies to: research outputs, full PRDs, large epic lists.

```json
"prompt": "Run planning phase.\n\n## Inputs\nSee _arcwright-output/features/{slug}/research/r1-audit.md\n\n## Output\nprd.md at _arcwright-output/features/{slug}/planning/"
```

Apply proactively. The 6 KB threshold is approximate — err on the side of writing to file.

### 4.4 Output Directory Convention

All artifacts under `_arcwright-output/features/{slug}/...` with phase-prefixed sub-directories:
- `research/` — R1, R2, R3 research outputs
- `planning/` — PRD, architecture, epic list
- `dev/` — implementation notes, spike notes, per-epic dev outputs
- `review/` — review gate findings (AR+DRY, UV, SR)
- `qa/` — QA run results

---

## 5. Model and Mode Strategy

### 5.1 Per-Role Default Model

Always set `model` explicitly per spawn. Never rely on inheritance. This makes orchestrator-vs-executor cost predictable.

| Role | Model | Rationale |
|---|---|---|
| `arcwright-architect` | **opus** | Architectural decisions are irreversible; reasoning quality > latency. |
| `arcwright-review-orchestrator` | **opus** | Top-level gate driver; coordinates sub-reviewers. Orchestrator-only — never spawned as a subagent itself. |
| `arcwright-analyst` | sonnet | Research, no code writes. |
| `arcwright-pm` | sonnet | Synthesis, no code writes. |
| `arcwright-dev` | sonnet | Code execution; cheaper, faster, sufficient. |
| `arcwright-qa` | sonnet | Verification only. |
| `arcwright-quick-flow-solo-dev` | sonnet | Same as dev. |
| `arcwright-sm` | sonnet | Sprint coordination, no code writes. |
| `arcwright-tech-writer` | sonnet | Documentation. |
| `arcwright-ux-designer` | sonnet | Design + implementation. |

**Cost implication:** Opus orchestrator + Sonnet executors yields ~50% lower cost than all-Opus while preserving orchestration quality (r2 §5.3).

`haiku` — reserved for trivial summarization or formatting tasks only. Rarely used in current tracks.

### 5.2 Permission Mode (`permissionMode`)

| Mode | When to use |
|---|---|
| *(omit)* | Default for most spawns. Interactive mode — user reviews changes. Standard for review-only agents, research agents, planning agents. |
| `"acceptEdits"` | Autonomous Dev within a track's per-epic loop — orchestrator has approved the spec, Dev executes without prompting. Combine with `isolation: "worktree"` if sandboxed; otherwise edits go straight to parent tree. |
| `"plan"` | High-stakes design where the user must approve before execution (e.g., PRD revision after gate findings). |
| `"bypassPermissions"` | **Avoid.** Reserved for emergency hotfix only, with explicit user opt-in. |

`acceptEdits` is what makes track Dev steps autonomous — without it, every file write prompts the user. It is safe in tracks because the orchestrator has gone through Spec → Review → Approval before reaching Dev.

---

## 6. Failure and Recovery

### 6.1 Standard Retry Policy

| Failure mode | Orchestrator response |
|---|---|
| Agent tool returns error summary | Retry once with the SAME prompt. If still fails: capture the error, present to user, ask for direction. |
| Subagent unhandled exception (compile error, missing file, permission denied) | Capture error from Agent tool result. Do NOT retry blindly — present to user with diagnostic context. |
| Worktree-isolated subagent error | Worktree is NOT auto-cleaned. Orchestrator decides: inspect, retry, or `git worktree remove`. |
| Background spawn error | Parent receives async notification. Same retry-once-then-escalate pattern. Read the diagnostic file the subagent was instructed to write. |
| Permission denied (subagent uses tool not in `tools:` allowlist) | Update the agent definition's `tools:` list and retry. Config bug, not runtime escalation. |

**Retry policy is intentionally conservative (max 1 retry).** Track skills MUST NOT loop on Agent tool errors — escalate to the user instead. The user is the recovery authority.

### 6.2 Parallel Batch Failure Cascade

When one member of a parallel fan-out (§3b) fails:

1. **Do NOT halt the batch.** Other parallel agents continue and complete normally. Cancelling mid-flight is destructive and loses work.
2. **Do NOT auto-retry the failed member.** Apply retry-once-then-escalate only AFTER collecting all batch results.
3. **Collect all results.** The assistant message returns N tool results — some successful, some errors. Capture successful outputs into named variables; identify which failed.
4. **Present batch state to the user.** Example: "3 of 3 research agents started; R1 and R2 succeeded (output at ...); R3 failed with: `<error>`." Ask: retry R3 in isolation, proceed without R3, or abort the phase.
5. **Cascading dependencies.** If a later phase requires ALL parallel outputs (e.g., PRD needs all 3 research reports), do NOT proceed until the failed agent is recovered or explicitly skipped by the user.

This cascade rule applies to: research ×N, review sub-agents ×N, parallel epic Dev ×N.

---

## 7. Concurrency Rules

- **Max parallel spawns from a single assistant message: 5.** Arcwright convention. r2 §7.2 notes practical limit is ~10+; the conservative cap ensures no track skill ever queues. Current peak demand is 3 (research ×3 or review sub-agents ×3).
- **Result delivery order: not guaranteed (r2 §7.2).** Collect results by name or index, never by arrival order. Named capture variables (§4.1) make this explicit.
- **File contention is a user error.** Parallel agents writing the same file path produces undefined behavior. The orchestrator's prompt design must give each parallel agent a disjoint output path.
- **Worktree contention:** Parallel worktree-isolated spawns each get their own checkout in `.claude/worktrees/<subagent-name>/`. Naming collisions are handled automatically by Claude Code via session-scoped paths (r2 §4.2).

---

## 8. Trust-but-Verify

The Agent tool returns a **SUMMARY**, not a full transcript of the subagent's work. The orchestrator cannot trust that the summary accurately reflects what was written to disk.

**After any code-writing agent completes (`arcwright-dev`, `arcwright-quick-flow-solo-dev`, `arcwright-ux-designer`), the orchestrator MUST verify actual file changes before reporting the phase complete:**

```bash
git diff --stat
```

Or read key files directly:

```bash
# Read the output file the agent was instructed to write
# Grep for expected functions or exports
```

**Verification requirements by risk level:**

| Outcome type | Verification required |
|---|---|
| Security fix, schema change, file deletion | Always verify via `Read` / `git diff` |
| Feature implementation | Verify at least the primary output file exists and is non-empty |
| Documentation update, formatting | May trust summary |
| Review-only agent (no file writes) | Trust summary |

Do not report a Dev or UX phase complete based on the summary alone.

---

## 9. No Legacy Signals

In-process flows do **NOT** use any of the following:

| String | Status |
|---|---|
| `AGENT_SIGNAL::` | tmux-only — never in in-process flows |
| `STEP COMPLETE` | Eliminated — Agent tool return value is the sole completion signal |
| `PEER_SIGNAL::` | tmux-only — no cross-pane notification needed in-process |
| `STATUS_CHECK:` | tmux-only — sequential execution eliminates stall detection |

**The Agent tool return value IS the completion signal.** Sequential execution is blocking — the orchestrator waits for each Agent call to return before proceeding. No polling. No stall detection. No heartbeat signals.

These strings appear in `tmux-protocol` skill and are valid there. They have no meaning in in-process flows and should never appear in Default: In-Process blocks.

---

## 10. Cross-References

- **[`tmux-protocol`](.agents/skills/tmux-protocol/SKILL.md)** — opt-in observability path. Load when user signals split-pane visibility ("spawn", "watch", "open agent") AND `$TMUX` is set. Governs pane lifecycle, `tmux send-keys` delivery, `AGENT_SIGNAL` format, polling, pane close sequence, and the `AGENT_SIGNAL` / `PEER_SIGNAL` / `STATUS_CHECK` protocols that do NOT apply in-process.

- **[`project-context`](.agents/skills/project-context/SKILL.md)** — always run before any track or team workflow. Surfaces existing config, plans, tech stack, and skill overrides. The context block it produces becomes the first `## Inputs` section in the first agent's prompt.

- **Architecture source of truth:** `_arcwright-output/features/in-process-orchestration/planning/architecture.md` — §2 (spawn patterns), §3 (handoff contract), §4 (model/mode), §5 (failure model), §6 (concurrency cap) are the upstream definitions that this skill implements. When the architecture document changes, update this skill.
