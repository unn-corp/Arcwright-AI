# Task registry

Prefer the host's task registry. If a local ledger is needed, keep it in a unique
`_arcwright/_memory/skill-runs/orchestration-<run>/` directory, or host-managed
evidence storage. One coordinator owns ledger writes; concurrent children return
results or write separate artifacts.

Record only information needed to reconcile work:

| Field | Meaning |
| --- | --- |
| Task ID and role | Actual returned ID and bounded responsibility |
| Host/provider/model | Values actually selected or returned; unknown when not exposed |
| Workspace and ownership | Checkout, owned paths, and read/write scope |
| Source identity | Commit plus relevant working changes or artifact revision |
| Status and next action | Running, complete, failed, blocked, or canceled; evidence path |

Before dispatch, reconcile relevant tasks so a lost response or resumed session
does not duplicate active work. Verify native agent liveness before follow-up.
For T3 review rounds, retain each round's separate `taskId` and stable request ID.
Cross-session memory is context, not evidence that a prior task is still alive.
Never cancel unrelated user tasks or delete their recovery artifacts.
