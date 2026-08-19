---
name: lambda-best-practices
description: Use when planning, implementing, deploying, debugging, or reviewing AWS Lambda functions, handlers, event sources, concurrency, cold starts, VPC access, retries/DLQs, serverless APIs, Lambda security, or Lambda-backed UI/runtime performance.
---

# AWS Lambda best practices

Treat Lambda as a stateless, at-least-once-capable compute boundary with a defined
event contract, downstream capacity, retry policy, and observability contract. Optimize
the measured initialization and invocation path, not just the handler code. Prefer a
managed service integration or queue/workflow when it provides a clearer delivery or
state contract than another Lambda wrapper.

## Operating contract

- Establish account/Organization, Region, environment, function name/alias/version,
  runtime/architecture, memory/timeout/ephemeral storage, invocation type, event
  source, concurrency controls, VPC path, downstream dependencies, data class,
  tenant boundary, quotas, deployment method, and preserved behavior.
- Start from evidence: `Init Duration`, p50/p95/p99 duration, billed duration, memory
  use, cold-start rate, concurrency/throttles, iterator age/queue age, retry/DLQ
  depth, downstream saturation, error type, and user-visible latency.
- Keep facts, assumptions, findings, and recommendations separate. Runtime versions,
  quotas, supported features, pricing, and regional behavior are time-sensitive;
  verify the current AWS documentation for the target Region/runtime.
- Reviews are read-only by default. Do not invoke production functions, replay events,
  alter concurrency, publish versions, shift aliases, redrive a DLQ, or change IAM,
  VPC, secret, or event-source configuration without authorization for that mutation.
- Never put credentials, tokens, private data, full events, or customer payloads in
  hook output, committed fixtures, logs, traces, or screenshots.

## Choose the mode

### Planning

Define the trigger and delivery semantics, function boundary, sync/async UX contract,
idempotency key, retry/DLQ behavior, concurrency budget, downstream capacity, cold
start target, security boundary, tenant isolation, deployment strategy, cost budget,
and rollback/incident plan. Decide whether the work belongs in Lambda, a direct AWS
service integration, SQS, EventBridge, Step Functions, Fargate, or another service.

### Implementation

Make the smallest evidence-backed change. Keep handlers small and stateless, validate
events, initialize reusable clients outside the handler, bound downstream calls,
configure retries and failure destinations, inspect generated IAM/IaC, and test the
same event source and runtime path used in production.

### Review

Read [references/review-checklist.md](references/review-checklist.md) and report
severity, evidence, user/data impact, smallest safe improvement, trade-offs,
validation, rollback, unchanged behavior, and unknowns. A review does not authorize
live invocation or deployment.

## First-pass inventory

Search for and inspect, as applicable:

- handler entry points, runtime/architecture, package manager/lockfile, layers or
  container image, bundler/tree-shaking, extensions, `/tmp` use, environment variables,
  Secrets Manager/Parameter Store access, and runtime version;
- event source mappings for API Gateway/ALB/Function URLs, SQS, SNS, EventBridge,
  S3, DynamoDB/Kinesis streams, Kafka, schedules, Step Functions, and direct invokes;
- batch size/window, maximum concurrency, partial batch response, starting position,
  bisect-on-error, filter criteria, retry/visibility/retention, on-failure destination,
  DLQ, and poison-record recovery;
- memory, timeout, ephemeral storage, reserved/provisioned/max concurrency, aliases,
  versions, provisioned warmup, SnapStart or runtime-specific cold-start features,
  and account/Region concurrency quotas;
- API/network path, VPC subnets/security groups, interface endpoints, NAT, DNS,
  connection pooling, RDS Proxy, database limits, external HTTP timeout/keep-alive,
  and downstream rate limits;
- IAM execution role, resource-based invoke policy, KMS/secret grants, function URL
  authentication, API authorizer, code signing, log/tracing access, and cross-account
  invocation;
- synchronous/async retry behavior, idempotency store/key, duplicate handling,
  compensating action, timeout/cancellation semantics, and user-visible pending/failed
  behavior;
- structured logs, metrics, traces, correlation/request IDs, alarms, dashboards,
  cost dimensions, deployment canary/rollback, and version/alias drift;
- tenant context, membership/authorization checks, per-tenant rate/concurrency,
  noisy-neighbor controls, tenant data in logs/events, and R&D versus production
  accounts/resources; and
- UI/API bootstrap, request waterfalls, Lambda tail latency, polling/webhook or
  async completion state, loading/error/retry states, and p75 LCP/INP/CLS when the
  function is on the critical render path.

If a deployed fact or owning policy cannot be inspected, mark it unknown. A passing
unit test or successful invocation does not prove idempotency, downstream safety,
tenant isolation, cold-start performance, or correct retry behavior.

## Function design and performance

- Keep functions focused on one event contract and use many small, independently
  deployable functions when ownership, scaling, security, or failure behavior differs.
  Do not split work into functions merely to hide a synchronous waterfall or increase
  cross-function latency.
- Assume a standard execution environment may disappear after one invocation. Store
  durable state in a durable service; global memory and `/tmp` are optimization caches,
  not correctness stores, and must never leak request or tenant data across invocations.
- Initialize SDK clients, connection pools, parsers, and immutable configuration
  outside the handler so reused environments amortize setup. Keep initialization
  small: import only needed modules, tree-shake/bundle dependencies, remove unused
  layers/extensions, and measure `Init Duration` before/after.
- Reuse HTTP/database connections with keep-alive and retry stale idle connections.
  Set connection, read, overall, and cancellation timeouts. A cached connection is
  not proof it is alive; handle resets without turning one stale socket into a retry
  storm.
- Tune memory with a representative load test. Memory changes CPU/network capacity
  and cost; choose the setting from p95/p99 latency, memory headroom, throughput,
  and cost per useful operation—not from a default or one cold request.
- Set timeout above the expected downstream operation plus bounded retry budget, but
  below the upstream timeout where possible. Leave room for cleanup and a useful error
  response. Never rely on a timeout to cancel a downstream side effect automatically.
- Use provisioned concurrency, SnapStart, or a lighter runtime only when measured
  cold-start latency and traffic shape justify the cost/compatibility trade-off.
  Validate initialization side effects, randomness, credentials, extensions, and
  deployment behavior for the chosen feature.
- Keep user-facing synchronous paths short. Move slow or bursty work behind SQS,
  EventBridge, or Step Functions and represent accepted/pending/processed/failed
  states in the UI rather than holding a request open without a deadline.
- Avoid Lambda-to-Lambda chains that add latency and independent retries. Use a
  workflow or queue when the dependency graph, backpressure, compensation, or
  visibility matters.

## Events, idempotency, and failure

- Validate event source, schema/version, required fields, size, and authorized tenant
  context before performing work. Treat event input as untrusted data.
- Make the business effect idempotent with a stable event/business key and a durable
  deduplication or conditional-write strategy. Lambda event source mappings and many
  asynchronous paths can deliver duplicates; a retry that timed out may have already
  committed its side effect.
- Classify errors as validation/permanent, authorization, dependency/transient, or
  ambiguous outcome. Do not retry malformed or unauthorized input indefinitely. Use
  exponential backoff with jitter and a bounded attempt/age policy for transient work.
- For SQS/stream batches, use partial batch response where supported, preserve ordering
  requirements, bound batch size/window, and isolate poison records. Configure
  visibility timeout/retention/DLQ or on-failure destination with an owner, alarms,
  redrive procedure, and data-retention policy.
- For asynchronous invokes, define retry and on-failure behavior. For synchronous
  APIs, the caller owns some retry behavior; return a stable error contract and an
  idempotency token for retriable mutations.
- Prevent recursive self-invocation and event loops. If recursion is possible, add
  explicit source/detail guards, a maximum depth or budget, alarms, and a safe
  throttling runbook.

## Concurrency and downstream capacity

- Model concurrency as `arrival rate × duration` and compare it with account/function
  limits, database connections, API quotas, queue visibility, and tenant capacity.
  Lambda scales quickly, but downstream systems often do not.
- Use reserved concurrency to protect a critical function and cap a noisy or risky
  function. Use provisioned concurrency for latency, not as a generic throughput
  control. Set event-source maximum concurrency and batch controls where available.
- Add backpressure before a database or third-party API. Prefer a queue, bounded
  worker pool, token bucket, or service-native quota over unbounded `Promise.all`.
- For streams, monitor iterator age, checkpoint/retry behavior, shard/partition
  parallelism, ordering, and partial failure. For SQS, monitor age of oldest message,
  in-flight limit, visibility timeout, receive count, and DLQ depth.
- Avoid a global concurrency or timeout change without a downstream load test and a
  rollback threshold. A lower concurrency can preserve correctness while increasing
  queue age; report the trade-off.

## Security, networking, and data

- Give each function a least-privilege execution role and resource-based invoke
  policy. Restrict actions, resources, conditions, source accounts/ARNs, and KMS
  grants. Do not use a shared administrator role for convenience.
- Use environment variables for non-secret operational configuration. Store secrets
  in Secrets Manager or Parameter Store, grant read access only to the function that
  needs it, cache with bounded refresh, and rotate without logging values.
- Add a VPC only for a concrete private-resource requirement. When VPC access is
  required, use multiple AZs, verify subnet/NAT/interface-endpoint/DNS capacity,
  protect database connection limits, and measure the added path latency.
- Authenticate API Gateway/ALB/Function URL callers with the appropriate authorizer
  or IAM; a public URL plus a secret in a header is not a complete auth model. Validate
  input and tenant membership at the server boundary.
- Redact tokens, authorization headers, passwords, event bodies, and personal data
  from logs/traces. Use encryption and retention appropriate to data classification.
- For multi-tenant functions, derive tenant from a verified identity and server-side
  membership, apply tenant predicates to every read/write, and prevent tenant IDs or
  resource ARNs from becoming client-controlled destinations.

## Deployment, observability, and cost

- Deploy immutable versions behind aliases; use a canary/linear traffic shift for
  risky changes, test rollback, and ensure triggers, permissions, environment, layers,
  and destinations point to the intended alias/version.
- Inspect IaC plans for function replacement, permission widening, event-source
  enablement, alias drift, secret references, VPC changes, and cross-environment
  resources before deployment.
- Emit structured logs with request/correlation IDs and outcome categories. Monitor
  Invocations, Errors, Throttles, Duration, `Init Duration`, ConcurrentExecutions,
  IteratorAge/queue age, destination failures, and downstream saturation. Add alarms
  with owners and a runbook; use tracing to identify cold-start and dependency time.
- Attribute cost by function, tenant/tier where safe, environment, memory, duration,
  provisioned concurrency, requests, logs, NAT, and downstream services. Do not use
  unbounded tenant IDs as high-cardinality metric dimensions.
- Keep R&D in separate accounts/resources, roles, secrets, event sources, aliases,
  and data. Use synthetic or approved masked events; do not replay production events
  or copy production credentials into R&D.

## UI and API performance

- Treat a Lambda on the critical path as a measured user-facing dependency. Track
  p75/p95/p99 end-to-end latency, cold-start share, response payload, retries, and
  browser Web Vitals. Optimize the slowest real segment.
- Avoid frontend N+1 invokes, serial auth/profile/tenant calls, and unbounded payloads.
  Batch or aggregate deliberately, cache only non-sensitive data, and keep cache
  authorization semantics correct for users and tenants.
- Return an explicit accepted/pending state for asynchronous work. The UI should
  preserve user input, show progress/retry/recovery, and distinguish a function
  timeout from a denied request or completed-but-unconfirmed side effect.

## Multi-tenant SaaS and R&D

- Decide whether functions are pooled, per tenant/tier, or account/Region isolated
  from compliance, noisy-neighbor, residency, deployment, quota, and blast-radius
  requirements. Separate functions without separate data/IAM/queues is not isolation.
- Enforce tenant authorization server-side on every sensitive operation. Event filters,
  function names, environment variables, S3 prefixes, or token claims reduce routing
  work but are not a complete authorization boundary.
- Bound per-tenant concurrency, queue depth, request rate, payload size, retries, and
  downstream usage. Keep tenant context in validated structured data and idempotency
  keys, not raw logs or untrusted destinations.
- R&D uses separate accounts/resources/aliases/roles/secrets and synthetic or masked
  data. Test tenant A/B isolation, duplicate/timeout behavior, DLQ redrive, throttling,
  rollback, and cold starts before broad production rollout.

## Validation gate

Before calling a Lambda change complete:

1. Record environment/account/Region, trigger semantics, handler/runtime, dependency
   and network path, memory/timeout/concurrency, downstream limits, idempotency,
   retry/DLQ, IAM/data/tenant boundary, UI contract, and preserved behavior.
2. Inspect generated IaC and policies for broad permissions, public invocation,
   cross-environment references, accidental event-source enablement, secret leakage,
   VPC replacement, and alias/version drift.
3. Test valid, invalid, duplicate, stale, unauthorized, oversized, timeout, throttled,
   partial-batch, poison-record, downstream-failure, and ambiguous-outcome inputs.
4. Load test warm/cold, p50/p95/p99, concurrency, queue/stream behavior, downstream
   saturation, tenant isolation, and UI pending/error/retry states with synthetic data.
5. Verify alarms, traces, redaction, DLQ ownership/redrive, rollback/canary, quota
   headroom, cost baseline, and R&D/production separation.

## Review output

Use this compact shape:

```text
Scope / account / Region / environment / trigger / preserved behavior:
Runtime / init / dependency / memory-timeout-concurrency / network baseline:
Delivery / idempotency / retry-DLQ / downstream / IAM-tenant baseline:
UI/API latency / Web Vitals / observability / cost baseline:
Findings:
  [severity] evidence → impact → smallest safe improvement → trade-off
Rollout / rollback / redrive plan:
Validation / load and synthetic-event evidence:
Unchanged by design:
Open questions / unknowns:
```

Severity is evidence-based:

- **Blocker:** exposed secret, arbitrary invocation/admin access, proven cross-tenant
  effect, recursive production loop, or non-idempotent destructive side effect with
  unbounded retries.
- **High:** broad IAM/public endpoint, missing authorization, lost retry/DLQ path,
  no idempotency for retriable mutation, unsafe event-source scaling, or measured
  p95/p99 regression on a critical user path.
- **Medium:** cold-start/package/network/concurrency, quota, downstream, observability,
  cost, or deployment risk with a safe staged fix.
- **Low:** hygiene, tagging, documentation, test, or non-critical optimization.

## Official references

- [Lambda best practices](https://docs.aws.amazon.com/lambda/latest/dg/best-practices.html)
- [Designing Lambda applications](https://docs.aws.amazon.com/lambda/latest/dg/concepts-application-design.html)
- [Lambda execution environment lifecycle](https://docs.aws.amazon.com/lambda/latest/dg/lambda-runtime-environment.html)
- [Lambda scaling and concurrency](https://docs.aws.amazon.com/lambda/latest/dg/lambda-concurrency.html)
- [Lambda event source mappings](https://docs.aws.amazon.com/lambda/latest/dg/invocation-eventsourcemapping.html)
- [Lambda retry behavior](https://docs.aws.amazon.com/lambda/latest/dg/invocation-retries.html)
- [Lambda environment variables](https://docs.aws.amazon.com/lambda/latest/dg/configuration-envvars.html)
- [Lambda VPC networking](https://docs.aws.amazon.com/lambda/latest/dg/configuration-vpc.html)
- [Lambda security](https://docs.aws.amazon.com/lambda/latest/dg/lambda-security.html)
- [Lambda monitoring](https://docs.aws.amazon.com/lambda/latest/dg/monitoring-metrics-types.html)
- [Lambda quotas](https://docs.aws.amazon.com/lambda/latest/dg/gettingstarted-limits.html)
