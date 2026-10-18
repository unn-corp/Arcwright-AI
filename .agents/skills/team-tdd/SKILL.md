---
name: "team-tdd"
description: "Coordinate an explicitly authorized QA/Dev test-first workflow: focused behavior checks fail for the intended missing behavior, Dev implements, and QA independently verifies the result."
allowed-tools: Read, Grep, Glob, Write, Edit, Agent, SendMessage, Bash, mcp__t3_code__orchestrator_capabilities, mcp__t3_code__delegate_task, mcp__t3_code__task_status, mcp__t3_code__task_cancel
---

# TDD pod: The Forge

Execute the [shared team procedure](../subagent-protocol/references/team-execution.md) once per run. It supplies capability briefs, host/provider inheritance, ownership, review budgets, evidence, recovery, and optional pane/Kiro adapters. Delegation must already be authorized.

## Roles and ownership

| Role | Profile / native alias | Responsibility |
| --- | --- | --- |
| QA | `qa` (`arcwright-qa`) | Acceptance-test files, intentional red evidence, independent green verification |
| Dev | `dev` (`arcwright-dev`) | Production implementation and fixes; agreed refactoring |

## Stages

1. QA reads the public contract and nearest tests/fixtures, then writes the smallest checks for distinct acceptance risks using `test-quality`. Confirm failure comes from the intended missing/incorrect behavior, not setup. If existing tests already express the contract, reuse them; do not invent a red run or modify correct behavior to manufacture one.
2. Dev implements the requested behavior to satisfy that contract and the checks without unrelated scope. Dev does not weaken QA's expectations to obtain green; a faulty expectation returns to QA with independent evidence.
3. QA independently verifies the focused cases execute and pass, then required repository gates. Observe live UI/runtime behavior where needed. Once green, perform only useful scoped refactoring and recheck affected behavior.
4. Concrete remaining failures return to Dev; QA rechecks the relevant surface under the shared budget. Serialize test/source ownership at stage boundaries to avoid conflicting edits.

## Completion

Focused public-behavior evidence and required gates pass for the current patch, and QA independently approves. Record any limit on demonstrating the original red state. Use this pod only when multi-agent test-first work is requested or authorized; routine tests use `test-quality` directly without new agents or a new harness.
