# Lambda quick rules

- Scope account/Region/environment, runtime, trigger semantics, downstream capacity, IAM/tenant boundary and preserved behavior; mark unavailable deployed facts unknown.
- Keep handlers focused/stateless. Reuse bounded clients/connections, not durable state or request data in globals/`/tmp`.
- Validate input and server-side tenant membership; make retriable effects durably idempotent. A timeout may follow a committed effect.
- Bound timeouts, retries/backoff/jitter, batches, concurrency and queue age. Isolate poison records; use supported partial batches and owned recovery paths.
- Measure initialization, warm/cold latency, throttles and downstream saturation before tuning. Reserved concurrency protects capacity; provisioned concurrency addresses measured latency.
- Use resource-scoped roles, managed secrets with refresh, redacted logs and isolated synthetic R&D data.
- Inspect IaC/alias/trigger changes; preserve immutable deployment and rollback. UI acceptance is pending, not completion.
- Select focused tests from changed risks, preserve required gates and report unrun checks. Do not require every load/UI matrix for every edit.
- Reviews stay read-only. Production invoke/replay/redrive, alias shifts, deployments and IAM/concurrency mutations need action authorization.
