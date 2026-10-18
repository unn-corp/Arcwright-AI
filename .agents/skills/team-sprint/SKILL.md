---
name: "team-sprint"
description: "Execute an existing sprint plan as a dependency-ordered story queue with SM coordination, Dev implementation, and independent QA acceptance before marking each story done."
allowed-tools: Read, Grep, Glob, Write, Edit, Agent, SendMessage, Bash, mcp__t3_code__orchestrator_capabilities, mcp__t3_code__delegate_task, mcp__t3_code__task_status, mcp__t3_code__task_cancel
---

# Sprint execution: The Strike Team

Execute the [shared team procedure](../subagent-protocol/references/team-execution.md) once per run. It supplies capability briefs, host/provider inheritance, ownership, review budgets, evidence, recovery, and optional pane/Kiro adapters. Delegation must already be authorized.

## Roles and ownership

| Role | Profile / native alias | Responsibility |
| --- | --- | --- |
| SM | `sm` (`arcwright-sm`) | Queue/dependencies and local story status |
| Dev | `dev` (`arcwright-dev`) | Current story implementation and fixes |
| QA | `qa` (`arcwright-qa`) | Independent current-story validation |

## Stages

1. SM reads the existing sprint plan, orders stories by priority and dependencies, and identifies the first story with its acceptance criteria. Carry the queue forward; do not recreate planning artifacts already available.
2. Dev implements that story within its scope and supplies actual changed paths and focused evidence.
3. QA validates the current story's criteria independently with proportionate tests and required checks. Dev fixes substantiated failures; QA rechecks affected behavior under the shared budget per story.
4. Only after QA passes on the current patch does SM mark the story done and provide the next dependency-ready story. Repeat sequentially until the authorized queue is complete or a real blocker/user budget intervenes. Keep blocked stories distinct from completed ones.

## Completion

Completed stories have acceptance evidence and independent QA approval; the remaining queue and blockers are accurate. Keep implementation tracking local by default. External tracker/MCP synchronization requires the user's explicit request and its installed procedure. Report the actual completion count rather than claiming the whole sprint succeeded when work remains.
