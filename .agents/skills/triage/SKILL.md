---
name: triage
description: "Choose the smallest supported execution workflow, continue authorized work, or return a recommendation when requested. Adapt to the host tools and delegation authority."
allowed-tools: Read, Grep, Glob, Bash
---

# Choose an execution workflow

Recommend the smallest supported approach for the task. If the user explicitly asks
only for a recommendation, return one. If implementation is already requested,
choose the approach and continue authorized work rather than requiring a second
trigger or confirmation. Selecting a skill never grants additional permissions.

## Use context already available

Read existing task/project context, relevant instructions and the requested outcome.
Use `project-context` only for missing project facts that affect the decision;
reuse its results instead of rescanning or dispatching a discovery agent. A few
file counts do not establish complexity. Route bugs to `systematic-debugging`, test
work to `test-quality`, and focused reviews to their domain skill without an extra
orchestration ceremony.

## Route by the actual dependency structure

| Shape | Approach |
| --- | --- |
| Clear deliverable fitting the current task | Work directly in the current agent |
| Substantial independent responsibilities | A small set of scoped agents, only when delegation is authorized |
| Large multi-stage migration/audit | Bounded discovery → change → verify stages; delegate independent parts only when useful and allowed |
| Explicit autonomous goal request | The host's available goal facility with an observable completion condition |
| Explicit request to watch pane activity | Add supported visibility without changing task ownership |

Prefer direct work for routine lookups, small changes and ordinary tests. A large
file count, “thorough” wording or available agents does not by itself require
parallelism. Keep dependent edits sequential and avoid multiple agents modifying
the same files. Preserve the user's named workflow and provider/model choice.

A verification condition can guide normal work without creating a persistent goal.
Create a host goal only when explicitly requested; its existence, evaluator behavior
and budget are host-specific. Never interpret a time/budget limit as approval or
proof of completion. State the actual verification evidence.

## Adapt to the host

Discover callable capabilities before recommending exact commands. Native tools are
appropriate when they support the chosen provider/model. For Arcwright Code/T3
cross-provider, chosen-model or worktree child tasks, use supported delegation and
retain task IDs. Every delegated review round is a fresh `delegate_task` with prior
findings and unresolved objections; a backing child thread is not a continuation API.
Do not create top-level threads as a substitute for child agents.

`ultracode`, `/goal` and `/schedule` are host-specific options, not portable Arcwright
commands. Recommend them only where actually available. Do not force Sonnet/Opus,
model-upgrade approvals or a Claude-only `Agent` tool on other hosts. Honor model
and authorization rules from the current session.

Host pane visibility is optional. Use it only after an explicit pane/watch
request and when supported viewing tools are available. Do not start a
visibility service or post legacy pane completion signals for ordinary work.

## Recommendation and completion

Give the approach, supported next action and one-sentence rationale. Mention a
budget or unresolved constraint only when it affects the decision. For execution,
keep ownership through verification and report results/remaining work. For a routing
request, finish after the recommendation instead of silently launching it.

## Conditional details

- [Host-specific alternatives and worked routes](references/workflow-guide.md#runtime-options)
  for a genuine routing choice.
- [Orchestration protocol](../subagent-protocol/SKILL.md) when executing
  authorized delegation, not merely choosing a workflow.
