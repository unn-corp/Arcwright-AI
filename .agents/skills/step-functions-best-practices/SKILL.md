---
name: step-functions-best-practices
description: Use when planning, implementing, deploying, debugging, or reviewing AWS Step Functions state machines, Amazon States Language, Standard or Express workflows, service integrations, retries, callbacks, Map/Parallel states, orchestration, workflow reliability, or workflow-backed UI/runtime performance.
---

# AWS Step Functions best practices

Treat Step Functions as an orchestration and state-transition boundary, not a
general-purpose database, message queue, or permission bypass. Choose Standard or
Express from execution semantics and recovery needs, keep state data bounded, make
tasks idempotent, and make every timeout/retry/compensation decision explicit.

## Operating contract

- Establish account/Organization, Region, environment, state machine name/version/
  alias, Standard/Express type, start API/event source, execution duration/rate,
  state data, task integrations, IAM role, tenant boundary, quotas, logging/tracing,
  data classification, and preserved behavior.
- Start from evidence: execution start-to-complete latency, state transition rate,
  open/running executions, task duration, retries/catches, throttles, Map concurrency,
  payload/history size, Lambda/downstream saturation, failure/recovery time, and
  user-visible pending/complete/error behavior.
- Keep facts, assumptions, findings, and recommendations separate. Step Functions
  quotas, workflow type behavior, integration support, pricing, and ASL features are
  time-sensitive; verify current AWS documentation for the target Region.
- Reviews are read-only by default. Do not start/stop/retry/replay production
  executions, change a state machine, redrive a task, or mutate IAM/logging/quotas
  without explicit authorization for that mutation.
- Never place credentials, raw tokens, large customer payloads, payment data, or
  unreviewed tenant data in execution input/output, history, logs, hook output, or
  committed fixtures.

## Choose the mode

### Planning

Define the business workflow, success/failure/compensation contract, execution
semantics, Standard/Express choice, start idempotency key, state payload, task
timeouts/retries, human callback or `.sync` needs, concurrency/backpressure,
authorization/tenant boundary, UI status contract, cost budget, observability,
deployment/versioning, and rollback/incident plan.

### Implementation

Make the smallest evidence-backed change. Prefer direct Step Functions service
integrations over Lambda wrappers, keep tasks small and idempotent, pass large data
through S3 references, bound Map/Parallel concurrency, use typed retry/catch/timeouts,
inspect execution IAM/IaC, and validate the ASL definition plus negative paths.

### Review

Read [references/review-checklist.md](references/review-checklist.md) and report
severity, evidence, user/data impact, smallest safe improvement, trade-offs,
validation, rollback, unchanged behavior, and unknowns. A review does not authorize
live execution or state-machine mutation.

## First-pass inventory

Search for and inspect, as applicable:

- ASL JSON/YAML, CDK/Terraform/SAM/CloudFormation state-machine resources, Workflow
  Studio exports, versions/aliases, logging/tracing, tags, and deployment diffs;
- Standard/Express type, start execution caller, execution name/idempotency, input
  validation, event source, API response contract, and execution retention;
- Task resources and optimized integrations for Lambda, DynamoDB, SQS, SNS, EventBridge,
  Batch, Glue, ECS/EKS, EMR, SageMaker, API Gateway, HTTP, and nested workflows;
- `Task`, `Pass`, `Choice`, `Wait`, `Parallel`, `Map`, `Succeed`, `Fail`, JSONPath/
  JSONata/variables, `InputPath`/`Parameters`/`ResultSelector`/`ResultPath`/
  `OutputPath`, payload size, large-result handling, and schema/version compatibility;
- task, heartbeat, callback, `.sync`, HTTP, execution, and overall business
  deadlines; retry error classes/backoff/jitter/max attempts; catch routing;
  compensation, cancellation, and partial-success behavior;
- Map/Distributed Map item reader/writer, `MaxConcurrency`, tolerated failure,
  redrive behavior, ordering, item idempotency, and downstream rate limits;
- execution role, task roles, resource policies, cross-account/Region integrations,
  KMS/secrets, VPC/private endpoints, and whether execution input can choose a
  resource ARN or tenant destination;
- execution history/logging level, sensitive-data redaction, CloudWatch policy size,
  X-Ray/trace correlation, metrics/alarms, cost dimensions, and runbooks;
- tenant identity/membership, per-tenant execution/rate/concurrency limits, noisy
  neighbor controls, cross-tenant task/input/output paths, and R&D/production
  accounts/resources; and
- UI/API start response, polling/webhook/callback, accepted/pending/completed/failed
  states, duplicate-click handling, timeout/cancel UX, and p75 LCP/INP/CLS if the
  workflow gates a user-visible path.

If a deployed fact or workflow owner cannot be inspected, mark it unknown. A valid
ASL definition or successful happy-path execution does not prove idempotency,
compensation, payload safety, tenant isolation, or recovery.

## Workflow type and execution semantics

- **Standard:** choose for long-running, auditable, stateful workflows, human waits,
  `.sync`/callback patterns, non-idempotent business actions, and execution history.
  Its execution/state guarantees and state-transition billing must match the need.
- **Express:** choose for high-rate, short-lived event processing when at-least-once
  behavior and CloudWatch-based history are acceptable. Treat every task/effect as
  idempotent and verify the duration/integration constraints before using it.
- Nest an Express workflow inside a Standard workflow only when the child’s work is
  safe under its execution semantics and the boundary’s retry/compensation contract
  is clear. Do not choose Express solely because it looks cheaper.
- Use an execution name/idempotency key for duplicate starts where the workflow type
  supports it. For Express or any path without automatic duplicate-start protection,
  enforce idempotency in the caller/workflow/task and make duplicate clicks safe.
- Use versions/aliases or an equivalent immutable deployment contract. Pin or migrate
  intentionally; do not change a live definition and assume existing executions have
  the new logic.

## State data and ASL design

- Keep execution input/output small, bounded, and non-sensitive. Pass S3 URI/version,
  DynamoDB key, or another durable reference for large artifacts; validate ownership,
  checksum/version, encryption, and retention before a task reads it.
- Use `InputPath`, `Parameters`, `ResultSelector`, `ResultPath`, and `OutputPath` or
  JSONata/variables to pass only the fields each state needs. Do not carry the full
  event, secrets, redundant task responses, or unbounded arrays through every state.
- Treat state names, input schema, output schema, error names, and result references
  as contracts. Version additively, validate required fields, and keep a migration
  path for in-flight executions.
- Prefer direct service integrations for simple calls. A Lambda wrapper adds cold
  start, IAM, serialization, retry, logging, and failure surfaces; use it for real
  business logic or when no suitable integration exists.
- Make `Choice` branches exhaustive with a safe default/Fail path. Ensure `Parallel`
  branches have compatible output contracts and that partial branch failure has a
  deliberate compensation or terminal outcome.
- Set timeouts at the Task/heartbeat/callback/execution boundary. A task timeout
  should not silently leave a payment, job, or external side effect running; design
  cancellation/reconciliation for ambiguous outcomes.

## Tasks, retries, errors, and compensation

- Give every external task a typed error contract. Retry transient service/throttle/
  network errors with bounded exponential backoff, jitter where supported, and a
  maximum attempts/age appropriate to the business deadline. Do not retry validation,
  authorization, malformed input, or known permanent business failures.
- Use `Catch` to route permanent failure, compensation, human intervention, or
  quarantine. Preserve correlation, execution, tenant, and idempotency context without
  copying sensitive payloads into an error state.
- Assume a task can be retried or a caller can lose the response after the task
  committed. Every non-idempotent action needs a business key, conditional write,
  provider idempotency key, status lookup, or compensating action.
- Use `.waitForTaskToken` only with a secure callback contract: authenticate the
  callback, bind token to execution/task/tenant, protect it as a bearer secret,
  expire it, and handle duplicate/late/cancelled callbacks. Do not put task tokens
  in URLs or logs.
- Use `.sync` when downstream job completion is part of the contract and the quota,
  cost, cancellation, and timeout behavior is understood. Do not poll in a Lambda
  when a service integration or callback is available.
- Make cancellation, timeout, manual stop, redrive, and replay production-like
  operations. Record operator/reason/range, isolate or gate side effects, and verify
  idempotency before replaying.

## Map, Parallel, and throughput

- Set explicit `MaxConcurrency` for Map/Distributed Map from downstream capacity and
  per-tenant budgets. “Unlimited” fan-out is an outage plan, not a performance plan.
- For large datasets, use Distributed Map/S3 readers/writers where appropriate and
  define item schema, item idempotency, failure threshold, ordering, result storage,
  redrive, and cost. Do not materialize a huge array into execution state.
- Bound `Parallel` branches and use a shared downstream capacity budget. A workflow
  can be internally valid while overwhelming a database, API, account quota, or one
  tenant’s resources.
- Use nested state machines only with an explicit parent/child ownership, start
  idempotency, timeout, failure propagation, and observability contract.

## Security, tenancy, and R&D

- Use a least-privilege state-machine execution role and narrowly scoped task/resource
  policies. Separate roles by integration or state machine when that reduces blast
  radius. Do not let execution input select arbitrary IAM actions, function ARNs,
  queues, tables, or cross-account targets.
- Verify identity and tenant membership at the API/start boundary and again at
  sensitive task/data boundaries. State fields and event filters are routing data,
  not authorization. Apply tenant predicates to every task/read/write.
- Keep execution history/logging free of tokens, credentials, payment data, and
  unnecessary personal data. Use KMS/encryption, retention, redaction, and access
  controls aligned with classification.
- Bound per-tenant starts, running executions, Map concurrency, retries, payloads,
  downstream work, and cost. A shared state machine is not automatically a tenant
  silo; split accounts/Regions/resources when compliance, residency, noisy-neighbor,
  or blast-radius requirements justify it.
- R&D uses separate state machines/versions/aliases, accounts/resources, roles,
  queues/tables/buckets, secrets, logs, and synthetic or approved masked data. Never
  replay production executions or copy production task tokens/credentials into R&D.

## UI/API integration and performance

- `StartExecution` accepted is not business completion. Return an execution ID and
  explicit accepted/pending state; use bounded polling, webhook, EventBridge, or a
  secure callback for completion. Handle duplicate clicks with an idempotency key.
- Do not block first render on a long workflow. Keep status queries bounded and
  tenant-authorized; show progress, retry, cancellation, timeout, and partial-failure
  states without losing user input.
- Measure start-to-accepted, task and end-to-end p95/p99, state transitions, retries,
  downstream waits, execution backlog, and p75 LCP/INP/CLS for workflow-gated UI.
  Remove unnecessary Lambda wrappers and serialization only after measuring.

## Deployment and observability

- Validate ASL syntax, schema/contract fixtures, positive/negative Choice branches,
  retry/catch/error paths, timeout/cancellation, duplicate starts, redrive, and
  in-flight version behavior before deployment.
- Inspect generated IaC for state-machine replacement, definition diff, version/alias,
  execution-role widening, log policy changes, cross-account trust, and task resource
  references. Roll out with a canary/synthetic execution and a reversible alias or
  deployment path.
- Monitor executions started/succeeded/failed/timed out/aborted, open executions,
  execution latency, state transition/throttle metrics, task retries, Map failures,
  Lambda/downstream latency, log delivery, and cost. Keep an owner and runbook for
  each alarm.
- Tag state machines, versions, integrations, and supporting resources with
  environment/owner/domain/data-classification/cost-center metadata. Avoid unbounded
  tenant IDs as metric dimensions.

## Validation gate

Before calling a Step Functions change complete:

1. Record environment/account/Region, workflow type, start/idempotency, state/input/
   output contracts, task integrations, error/retry/timeout, Map/Parallel limits,
   IAM/data/tenant boundary, UI contract, quotas, cost, and preserved behavior.
2. Inspect generated IaC and ASL for broad roles, arbitrary resource selection,
   payload/history bloat, unbounded concurrency, missing defaults/timeouts, unsafe
   retries, state-machine replacement, and cross-environment references.
3. Run positive/negative/duplicate/timeout/throttle/partial-failure/cancel/redrive
   tests with synthetic data. Verify Standard/Express semantics and version behavior.
4. Test tenant A/B access, membership removal, stale input, noisy-neighbor limits,
   task idempotency, compensation, callback authentication/expiry, and R&D routing.
5. Compare execution latency, retries, failures, open executions, transitions,
   throttles, downstream saturation, UI Web Vitals, logs/traces, and cost to baseline.

## Review output

Use this compact shape:

```text
Scope / account / Region / environment / workflow type / preserved behavior:
Start / idempotency / state-data / task integration baseline:
Timeout / retry-catch / compensation / Map-concurrency / IAM-tenant baseline:
UI status / execution latency / observability / cost baseline:
Findings:
  [severity] evidence → impact → smallest safe improvement → trade-off
Rollout / rollback / cancellation / redrive plan:
Validation / synthetic execution evidence:
Unchanged by design:
Open questions / unknowns:
```

Severity is evidence-based:

- **Blocker:** arbitrary task/resource selection, exposed callback token/secret,
  proven cross-tenant task/data effect, production replay without idempotency, or
  workflow semantics that can duplicate a destructive side effect.
- **High:** wrong Standard/Express semantics, missing task timeout/recovery, unsafe
  retry/catch, unbounded Map/Parallel fan-out, broad execution role, unbounded state
  payload/history, or UI/API treating start acceptance as completion.
- **Medium:** measurable latency, quota/throttle, version/deployment, observability,
  cost, R&D, or downstream-capacity risk with a staged fix.
- **Low:** hygiene, tagging, documentation, test, or non-critical optimization.

## Official references

- [Step Functions best practices](https://docs.aws.amazon.com/step-functions/latest/dg/sfn-best-practices.html)
- [Choosing Standard or Express](https://docs.aws.amazon.com/step-functions/latest/dg/choosing-workflow-type.html)
- [Step Functions concepts](https://docs.aws.amazon.com/step-functions/latest/dg/welcome.html)
- [Error handling](https://docs.aws.amazon.com/step-functions/latest/dg/concepts-error-handling.html)
- [Amazon States Language](https://docs.aws.amazon.com/step-functions/latest/dg/concepts-amazon-states-language.html)
- [Task state](https://docs.aws.amazon.com/step-functions/latest/dg/amazon-states-language-task-state.html)
- [Map state](https://docs.aws.amazon.com/step-functions/latest/dg/state-map.html)
- [Distributed Map](https://docs.aws.amazon.com/step-functions/latest/dg/concepts-orchestrate-large-scale-parallel-workloads.html)
- [Service integrations](https://docs.aws.amazon.com/step-functions/latest/dg/connect-to-resource.html)
- [Step Functions quotas](https://docs.aws.amazon.com/step-functions/latest/dg/limits.html)
- [Step Functions security](https://docs.aws.amazon.com/step-functions/latest/dg/procedure-executing-iam.html)
- [Step Functions monitoring](https://docs.aws.amazon.com/step-functions/latest/dg/procedure-cw-metrics.html)
