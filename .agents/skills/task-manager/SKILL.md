---
name: "task-manager"
description: "Plan or maintain the active task list, dependencies, and progress using the project's chosen tracking convention."
allowed-tools: Read, Write, Edit, Bash, Glob, Grep, Agent, SendMessage, mcp__t3_code__orchestrator_capabilities, mcp__t3_code__delegate_task, mcp__t3_code__task_status, mcp__t3_code__task_cancel
---

# Task and wave manager

Decompose, track, and execute authorized work using the project's existing task
registry. Reuse its format and location rather than migrating a live plan. For a
new Arcwright registry, use `_arcwright/_memory/skill-runs/tasks-<epic>/`; keep
installed bundles read-only. Planning does not dispatch agents or publish issues.

| Operation | Outcome |
| --- | --- |
| `decompose [spec-path]` | Task files, dependency graph, and wave plan; planning only |
| `status [--epic slug]` | Reconciled task counts, blockers, and next actionable work |
| `run [--wave WN] [--task T-NNN] [--worktree]` | Execute the authorized selected work and verify its evidence |
| `sync` | Explicitly requested GitHub Issues mirror; local registry stays authoritative |

Use the supplied task to infer a clear operation. Ask only when ambiguity changes
the result, such as multiple plausible epics with no current context. Keep planning
and reports concise; an extra compression skill is optional.

## Task contract

For the Arcwright format, each `T-{NNN}.md` has a permanent, zero-padded ID:

```yaml
id: T-001
status: pending # pending | in-progress | done | blocked | skipped
epic: selected-epic
goal: Observable requested outcome
acceptance_criteria:
  - Public result that demonstrates completion
reads:
  - path/to/input
writes:
  - path/to/owned-output
depends_on: []
conflicts_with: []
agent: arcwright-dev # suggested role, not a delegation requirement
notes: Known decisions, constraints, and source/evidence references
```

Retain existing issue mappings and any explicitly selected provider/model fields.
Omit a model override by default; inherit the host selection. Do not turn a role
suggestion into a model or tool allowlist. Acceptance criteria cover the actual
outcome without an arbitrary count quota. Never reuse a deleted task ID.

`INDEX.md` summarizes epic/spec, task counts, each task's status/dependencies/wave,
role, issue mapping, and the wave graph. Task records are authoritative; reconcile
the index to them. One coordinator owns registry writes and updates the index at
meaningful status changes; workers return evidence rather than racing to edit it.
Keep blocked and skipped work distinct from done.

## Plan and execute

1. Read the supplied spec and existing decisions once. Decompose by observable
   deliverables and assign explicit input/output ownership. Add producer-to-consumer
   dependencies when a task needs another task's changed output; a shared read
   alone does not imply execution order. Check inferred edges for cycles.
2. Group dependency-ready tasks into waves with disjoint writes. Include directory
   overlaps, shared generators, lockfiles, installs, and mutable environments in
   conflict analysis. Use the real available host capacity, including active work;
   split a large wave instead of imposing a fixed five-task limit. Record the plan
   before dispatch. `decompose` ends after producing this plan.
3. For `run`, load the [delegation protocol](../subagent-protocol/SKILL.md).
   Validate selected task dependencies and ownership. Give each task its goal,
   acceptance criteria, source identity, owned paths, existing authorization, and a
   small [capability brief](../subagent-protocol/guide-07-7-handoff-context-contract.md)
   with actual installed skill paths, finder, and tool constraints. Suggestions are
   nonexclusive; read only needed skills/references and reuse unchanged context.
4. Dispatch through supported host tools. Native follow-up applies only to a live
   compatible agent; every T3 delegated review round is fresh and carries prior
   findings. Retain task IDs. `--worktree` requests supported checkout isolation;
   in Arcwright Code use `delegate_task` with `isolation: "worktree"`. It starts
   from the parent local commit without copying uncommitted edits. Do not invent
   native `baseRef` fields or commit somebody else's changes for isolation.
5. Inspect returned changes and public behavior. For test work use `test-quality`,
   existing fixtures, focused checks, then required gates. Mark done only when
   acceptance evidence and required review sign-offs cover the current source;
   file existence alone is insufficient. Record unrun checks and failed gates.
6. Update task records and index. Continue the already authorized queue without
   prompting after each wave; stop at the requested endpoint, real blocker, or
   user budget. A status-only request does not launch the queue. Recover from
   failures through the protocol and reconcile active work before retrying.

## Optional GitHub sync

Run only when requested or already authorized. Confirm the intended repository,
actual `gh` availability, and authentication without printing secrets. If the tool
or remote is missing, report what could not sync and continue applicable local
work. Unnamed Development MCP use requires its separate explicit authorization.

Create one issue for each unmapped task; retain returned issue numbers/URLs in
the index before a retry. Reconcile uncertain writes to avoid duplicates. Update
only changed status/labels/content; avoid repeated identical comments. Preserve
existing project labels, with `arcwright-task`, wave, and status labels when the
project uses them. Send multiline bodies with structured arguments or a body
file, treating task text as data. No push, PR, or production action is implied.

Report completed/blocked tasks, current wave, evidence, remaining queue, and actual
sync outcomes. Omit AI/model attribution and keep required source/license credits.
