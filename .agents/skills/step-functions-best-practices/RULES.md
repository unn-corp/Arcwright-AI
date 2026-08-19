# Step Functions quick rules

- Identify account/Region/environment, workflow owner/type, start/idempotency, ASL/input-output contracts, task integrations, IAM, tenant boundary, quotas, UI completion contract, and R&D separation first.
- Choose Standard for long-running/auditable/non-idempotent/human/callback work; choose Express only when short/high-rate at-least-once semantics, integration limits, and CloudWatch history fit.
- Prefer direct AWS service integrations over Lambda wrappers when the operation is simple; keep real Lambda tasks small, idempotent, and independently observable.
- Bound state data with Input/Parameters/Result/Output paths or JSONata; pass large artifacts by encrypted/versioned S3 reference, never carry unbounded arrays, secrets, or raw customer payloads through history.
- Every Task needs a business timeout and typed error strategy. Retry only transient errors with bounded backoff/jitter; Catch permanent failures and compensate or quarantine.
- Use execution names/idempotency keys for duplicate starts; treat Express and task side effects as at-least-once unless the contract proves otherwise.
- Set Map/Parallel `MaxConcurrency` and failure thresholds from downstream and per-tenant capacity; never use unlimited fan-out by default.
- Secure `.waitForTaskToken` callbacks as expiring bearer secrets bound to execution/task/tenant; do not log or put tokens in URLs.
- Enforce tenant membership/server-side authorization at start and sensitive task/data boundaries; state fields, claims, and event filters are not authorization.
- R&D uses separate state machines/versions/aliases, accounts/resources/roles/secrets/logs and synthetic or approved masked data; never replay production executions or copy task tokens.
- UI treats `StartExecution` as accepted/pending, not complete; expose execution status with bounded, authorized polling/webhooks and preserve useful loading/error/retry/cancel states.
- Reviews are read-only. Never start/stop/retry/redrive production executions or mutate state machines/IAM/logging without explicit authorization.
