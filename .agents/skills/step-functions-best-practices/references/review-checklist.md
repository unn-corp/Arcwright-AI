# Step Functions review checklist

## Scope and semantics

- [ ] Account/Region/environment, workflow owner, state machine/version/alias, start caller, preserved behavior, and execution type are identified.
- [ ] Standard/Express semantics, duration/rate, history/logging, billing, integration, and idempotency trade-offs fit the workflow.
- [ ] Start execution name/idempotency and duplicate-click/retry behavior are explicit.

## State data and ASL

- [ ] Input/output schemas, versioning, paths/JSONata/variables, Choice defaults, Parallel contracts, and large-data references are bounded.
- [ ] Secrets, tokens, unnecessary PII, and unbounded arrays/results do not enter execution history/logs.
- [ ] Direct service integrations are used where appropriate; Lambda wrappers add real value.

## Tasks and failure

- [ ] Every external Task has timeout/heartbeat/cancellation semantics and an ambiguous-outcome plan.
- [ ] Retry is typed, bounded, backoff/jitter-aware, and excludes permanent/auth/validation errors.
- [ ] Catch/compensation/quarantine paths preserve correlation/idempotency without leaking sensitive input.
- [ ] Task effects are idempotent across duplicate start, retry, redrive, replay, and timeout-after-commit.
- [ ] Callback tokens are authenticated, bound, expiring, and never logged/placed in URLs.

## Scale and security

- [ ] Map/Distributed Map/Parallel concurrency and failure thresholds protect downstream and per-tenant capacity.
- [ ] Execution/task IAM is least privilege; input cannot select arbitrary resources/actions/cross-account targets.
- [ ] Tenant membership and resource authorization are checked server-side at start and sensitive task/data boundaries.
- [ ] R&D uses separate state machines/versions/aliases/accounts/resources/roles/secrets/logs and synthetic or approved masked data.

## UI, deployment, operations

- [ ] UI treats start as accepted/pending, not completion; status queries are bounded/authorized and cancellation/recovery is clear.
- [ ] ASL/IaC tests cover positive/negative branches, duplicate/timeout/throttle/partial failure/cancel/redrive and in-flight version behavior.
- [ ] Deployment diff covers definition replacement, alias/version, role/log policy, cross-account trust, and task references.
- [ ] Metrics/alarms cover started/succeeded/failed/timed out/aborted/open executions, transitions/throttles, retries, Map failures, downstream latency, logs, and cost.
