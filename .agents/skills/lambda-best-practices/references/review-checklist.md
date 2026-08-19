# Lambda review checklist

## Scope and trigger

- [ ] Account/Region/environment, function/alias/version, runtime/architecture, handler, trigger, invocation type, and preserved behavior are identified.
- [ ] Event source delivery, batch/window, ordering, visibility/checkpoint, retry/retention, DLQ/on-failure, and duplicate semantics are explicit.
- [ ] Lambda versus direct service integration, SQS/EventBridge, Step Functions, Fargate, or another boundary is justified.

## Runtime and performance

- [ ] `Init Duration`, cold-start share, p50/p95/p99, memory, package/layer/image size, timeout, and downstream latency are measured.
- [ ] Reusable clients/connections initialize outside the handler; request/tenant state is not leaked through global memory or `/tmp`.
- [ ] Memory/CPU, architecture, bundling, runtime, VPC path, provisioned concurrency/SnapStart, and cost trade-offs are tested rather than guessed.
- [ ] Timeouts/cancellation/keep-alive and connection-pool limits are below upstream/downstream contracts.

## Reliability and scale

- [ ] Input/schema/tenant validation and durable idempotency cover duplicates, timeouts after commit, retries, replay, and ambiguous outcomes.
- [ ] Retry/backoff/jitter, batch behavior, partial failure, poison records, visibility, DLQ/redrive, and async destinations have owners and alarms.
- [ ] Reserved/event-source concurrency and backpressure protect databases, APIs, queues, and per-tenant limits.
- [ ] Recursive invocation/event loops are prevented and have a bounded emergency throttle plan.

## Security and tenancy

- [ ] Execution/invoke IAM, KMS, secrets, authorizers, function URL/API access, cross-account conditions, and resource ARNs are least privilege.
- [ ] Logs/traces/events redact tokens, credentials, payloads, and personal data; retention and encryption match classification.
- [ ] Every sensitive operation checks verified identity, current tenant membership, action, and object ownership server-side.
- [ ] R&D and production use separate accounts/resources/roles/secrets/events and synthetic or approved masked data.

## Deployment and UI

- [ ] Immutable versions/aliases, canary/rollback, trigger/permission routing, environment references, and IaC replacement risk are tested.
- [ ] Metrics/alarms/traces cover errors, throttles, duration/init, concurrency, iterator/queue age, DLQ, downstream saturation, and cost.
- [ ] UI/API paths avoid serial/N+1 invokes, represent async state and recovery, and measure p75/p95/p99 plus LCP/INP/CLS where relevant.
