---
name: "team-docs"
description: "Draft or update technical documentation with a writer and an independent architect review for API signatures, factual accuracy, examples, and system behavior."
---

# Documentation + accuracy review: The Library

Execute the [shared team procedure](../subagent-protocol/references/team-execution.md) once per run. It supplies capability briefs, host/provider inheritance, ownership, review budgets, evidence, recovery, and optional pane/Kiro adapters. Delegation must already be authorized.

## Roles and ownership

| Role | Profile / native alias | Responsibility |
| --- | --- | --- |
| Writer | `tech-writer` (`arcwright-tech-writer`) | Documentation source and revisions |
| Architect | `architect` (`arcwright-architect`) | Read-only technical accuracy review |

## Stages

1. Writer drafts for the requested audience from relevant source material, existing documentation conventions, and the actual system. Keep working drafts in the run area unless a permanent document path was requested.
2. Architect checks API signatures, examples, links, important caveats, supported patterns, and descriptions of system behavior against source or primary documentation. Return approval or numbered corrections with evidence.
3. For concrete inaccuracies, Writer revises and Architect rechecks the affected content under the shared budget. Inspect the final artifact; a claimed draft is not evidence it exists.

## Completion

Architect approves the current document for technical accuracy and the requested documentation is delivered. This is a documentation team: no production-code changes and no publication without authorization. Skip application tests for prose-only changes unless examples, generated docs, or repository requirements create a concrete verification need.
