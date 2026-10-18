# Host primitives

Inspect the tools actually available in this session. A native task tool may
support spawning, messages, status, and shutdown; names and lifecycle differ by
host. Reuse a native agent only when it is live and supports the selected model.
Persisted profile memory does not make an old task ID resumable.

In Arcwright Code/T3 Code, call `orchestrator_capabilities` for live provider and
model IDs, including configured custom models. Use native delegation for compatible
same-provider work; use `delegate_task` when native tools cannot select the model,
for cross-provider or T3-owned work, and for `isolation: "worktree"`. Record the
returned `taskId`; manage it with `task_status` and `task_cancel`.

Every T3 review round is a new delegated task containing prior findings and current
evidence. `childThreadId` is storage, not a continuation target. Top-level thread
creation and persistent scheduling require an explicit user request for those
kinds of work. Do not change host settings merely to make a historical example run.
