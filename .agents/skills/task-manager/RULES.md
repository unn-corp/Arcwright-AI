# Task manager quick rules

- Reuse the project's task format and registry. New Arcwright task artifacts use `_arcwright/_memory/skill-runs/tasks-<epic>/`; installed bundles stay read-only.
- `decompose` plans without delegation. `status` reports without launching work. `run` executes only the authorized scope. Infer a clear operation from the supplied task.
- Task records preserve permanent ID, goal, acceptance criteria, inputs, outputs, dependencies, conflicts, status, evidence, and issue mappings. The coordinator owns registry/index updates.
- Plan dependencies and overlapping writes/shared resources before dispatch; use actual host capacity, not a fixed fan-out limit.
- Follow `subagent-protocol`: small nonexclusive capability briefs, inherited model/permissions, actual task IDs, supported worktree isolation, fresh T3 review rounds.
- Verify changed behavior and required sign-offs before marking done. Use `test-quality` for tests, focused checks, then required gates; report unrun checks.
- Continue an already-authorized queue without a question after each wave. Real blockers and user budgets remain incomplete, not approval.
- GitHub sync is explicit-only; reconcile IDs and changed state before external writes. Unnamed MCP requires its own request. No automatic push/PR or AI attribution.
