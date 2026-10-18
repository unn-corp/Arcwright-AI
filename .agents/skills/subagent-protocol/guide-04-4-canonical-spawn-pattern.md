# Dispatch shape

Read the actual tool definition before constructing a call. Use structured
arguments and include the [handoff contract](guide-07-7-handoff-context-contract.md)
in the task text. Do not copy unsupported fields, force a provider, or broaden
permissions to match an example.

When a native host exposes an `Agent` tool, a conditional call may look like:

```json
{
  "subagent_type": "arcwright-dev",
  "description": "Fix the selected validation defect",
  "prompt": "<objective, owned files, evidence, decisions, capability brief, constraints>"
}
```

Use only fields that host accepts. Omit a model override to inherit the selected
model where supported. Native follow-up uses that host's supported messaging tool
and a verified live ID.

For Arcwright Code/T3 Code, discover a compatible target first. Its delegated task
shape is:

```json
{
  "task": "<complete scoped handoff>",
  "target": {"providerInstanceId": "<discovered ID>", "model": "<discovered ID>"},
  "mode": "async",
  "clientRequestId": "<run-role-round>"
}
```

Call `delegate_task`, retain `taskId`, and use `task_status`/`task_cancel`. A retry
of the same round uses the same request ID; a new review round uses a new ID and
includes prior findings and responses. Use `isolation: "worktree"` when a separate
checkout is required. It starts at the parent local commit; uncommitted edits are
not copied. Do not substitute `t3_thread_send` to a child storage thread.
