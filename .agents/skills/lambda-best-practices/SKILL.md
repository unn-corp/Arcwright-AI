---
name: lambda-best-practices
description: Use when planning, implementing, deploying, debugging, or reviewing AWS Lambda functions, handlers, event sources, concurrency, cold starts, VPC access, retries/DLQs, serverless APIs, Lambda security, or Lambda-backed UI/runtime performance.
---

# AWS Lambda best practices

Treat Lambda as a stateless compute boundary with explicit event delivery,
idempotency, downstream capacity and observability. Plan, implement, or review only
the requested path; select the relevant section rather than inventorying every
service. A review is read-only. Existing implementation authorization permits its
necessary changes; live invocation, deployment, replay, redrive and IAM/concurrency
mutations need authorization covering those actions.

## Establish the relevant baseline

Identify account/Region/environment, function/runtime/architecture, trigger and
sync/async semantics, version/alias, memory/timeout/concurrency, downstream limits,
network/IAM/secret boundary, tenant context and preserved behavior. Mark deployed
facts unknown when unavailable. Verify time-sensitive runtimes, quotas, regional
features and pricing from current official documentation.

For performance work, measure initialization, warm/cold share, p50/p95/p99 duration,
memory, throttles, queue/iterator age, retries and downstream/user latency. Optimize
the actual bottleneck; a happy-path invocation does not establish retry safety or
load capacity.

## Implementation invariants

- Keep functions focused, with durable state outside global memory and `/tmp`.
  Reuse SDK clients and bounded connections outside handlers; caches must not leak
  request/tenant data. Avoid splitting a synchronous flow into a slower Lambda chain.
- Validate event schema/version/source and server-side tenant authorization before
  effects. Make retriable business operations idempotent with durable keys or
  conditional writes. A timeout/lost response may follow a committed effect.
- Bound downstream timeouts, retries/backoff/jitter, event age, batch size and
  concurrency. Retry transient failures, quarantine permanent/poison records, and
  use supported partial-batch responses without violating order. Give failure
  destinations/DLQs an owner, alarm and recovery procedure; prevent event loops.
- Size concurrency against arrival rate × duration and dependency capacity. Reserved
  concurrency/backpressure protects dependencies; provisioned concurrency addresses
  measured latency. Check queue-age and cost trade-offs rather than increasing limits
  blindly. Tune memory/package/VPC/cold-start features from representative evidence.
- Use resource-scoped roles/invoke policies, managed secrets with bounded refresh,
  authenticated APIs and redacted logs/traces. Introduce VPC access only for a real
  private-resource requirement. Keep R&D resources, events and credentials separate;
  use synthetic or approved masked data.
- Deploy immutable versions/aliases with an appropriate canary and rollback path.
  Inspect generated IaC for widening permissions, enabling triggers, replacement,
  alias drift, secret/network changes and cross-environment references.
- In UI/API flows, distinguish accepted/pending/completed/failed. Preserve recovery
  after ambiguous outcomes; measure end-to-end latency and avoid serial/N+1 invokes.

## Verify and report

Use `test-quality` when authoring/reviewing tests. Select cases from changed risks:
invalid/duplicate/unauthorized input, partial batches, timeout/throttle/dependency
failure and ambiguous effects. Use realistic event/runtime paths and synthetic data.
Run load/cold-start, tenant, redrive or rollback exercises when those contracts change
or a repository gate requires them; do not manufacture a full matrix for every edit.
Preserve required checks, compare relevant metrics to baseline, and state unrun
checks. Report evidence → impact → smallest fix/trade-off, rollout/recovery and unknowns.

## Conditional detail

Open [design/performance](references/workflow-guide.md#function-design-and-performance),
[event failure](references/workflow-guide.md#events-idempotency-and-failure),
[capacity](references/workflow-guide.md#concurrency-and-downstream-capacity), or
[security/tenancy](references/workflow-guide.md#security-networking-and-data) only as
needed. Use [review checklist](references/review-checklist.md) for an actual audit
and [official references](references/workflow-guide.md#official-references) for current
service facts.
