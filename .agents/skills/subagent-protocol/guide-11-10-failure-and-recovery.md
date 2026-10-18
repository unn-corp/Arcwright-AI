# Failure and recovery

Distinguish a failed child from a failed transport.

- **Child failed:** inspect status, evidence, and owned changes. Correct an
  actionable cause within existing authority and allow at most one corrective
  task retry. A new child needs a new task/request ID and counts against the
  workflow's task/round budget; do not reset that budget.
- **Transport failed:** allow at most three attempts for the same logical
  operation, including the first; honor a lower user limit. Persist the count.
  For a lost response or uncertain write, reconcile existing task IDs and actual
  server state first. Retry only when safe; an idempotent T3 retry keeps the
  identical payload and stable `clientRequestId`. Once its task ID is known,
  inspect that task instead of dispatching a duplicate.

A wait timeout, queued task, or live child is pending work, not transport failure.
Do not blindly retry permissions, authentication, or permanent validation errors.
Use short backoff for transient failures, respecting server retry-after guidance.
Surface an unresolved blocker after the relevant budget is exhausted.

| Failure | Response |
| --- | --- |
| Unsupported call field | Read the current schema and correct the arguments |
| Permission denied | Use a permitted alternative or surface the necessary user decision; do not broaden access automatically |
| Missing optional capability | Continue applicable work and state the limit; do not install it without authority |
| Child failed or timed out | Inspect status and evidence, reconcile owned changes, then use bounded recovery |
| Required review/check fails | Fix the cause and obtain current evidence, or leave the gate explicitly incomplete |

Independent work may continue while a blocked dependency is resolved. Stop unsafe
or dependent actions; ask only for a consequential missing decision that cannot
be resolved from existing context. Do not silently skip a required role, retry an
unchanged failure indefinitely, or treat budget expiry as approval.

Preserve recoverable work and task records. Cancel only owned tasks when needed,
according to host policy. Do not delete worktrees or unrelated artifacts merely
to tidy a failed run.
