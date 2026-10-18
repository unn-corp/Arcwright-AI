---
name: step-functions-best-practices
description: Use when planning, implementing, deploying, debugging, or reviewing AWS Step Functions state machines, Amazon States Language, Standard or Express workflows, service integrations, retries, callbacks, Map/Parallel states, orchestration, workflow reliability, or workflow-backed UI/runtime performance.
---

# AWS Step Functions best practices

Design explicit state transitions, bounded data and recoverable effects. Step
Functions is not a database, queue or permission bypass. Match effort to the
requested state machine/path. Reviews are read-only; live starts/stops, production
replay/redrive, definition/IAM/log changes and deployment require authorization
covering that action. Use existing authorization without repeating approvals.

## Establish scope and execution semantics

Identify account/Region/environment, machine/version/alias, workflow type, caller,
start idempotency, inputs/outputs, task integrations, deadlines, downstream capacity,
IAM/tenant boundary and UI completion contract. Mark unavailable deployed facts
unknown. Verify current workflow guarantees, quotas, integrations and regional
features in official AWS documentation before relying on them.

Choose Standard for long-running/auditable workflows, human waits and supported
callback/job-completion patterns. Choose Express only when duration, integration,
history and delivery semantics fit; distinguish synchronous from asynchronous
Express guarantees. Do not infer business-effect exactly-once safety from the
workflow type. Duplicate starts and retried/ambiguous tasks still need explicit
idempotency and recovery contracts.

## Core design rules

- Prefer direct service integrations for simple calls; keep Lambda for genuine
  business logic or unavailable integrations. State names/schemas/error names and
  references are contracts. Version changes with an in-flight migration plan.
- Filter input/result/output using the chosen JSONPath or JSONata model. Keep state
  data small and non-sensitive. Pass large artifacts by authorized durable reference
  with version/integrity, encryption and retention; do not carry unbounded arrays,
  secrets or full customer events through history.
- Give external tasks a business timeout and typed error strategy. Retry transient
  errors with bounded attempts/backoff/jitter/deadline; catch permanent failure and
  route compensation, quarantine or human recovery. Cancellation/timeout does not
  prove a downstream side effect stopped.
- Make effects safe after retries/lost responses using durable business keys,
  provider idempotency, conditional writes or reconciliation. Use supported execution
  names for duplicate starts, not as a universal Express deduplication guarantee.
- Bound Map/Distributed Map and Parallel work from downstream/per-tenant capacity.
  Set failure thresholds, ordering, output storage and recovery deliberately; never
  assume unlimited fan-out is safe.
- Protect callback tokens as expiring bearer secrets: authenticated callback,
  execution/task/tenant binding, no URLs/logs, duplicate/late/cancel handling.
  Prefer supported callbacks or `.sync` over Lambda polling when the contract fits.
- Enforce server-side identity/membership at start and sensitive data/task boundaries.
  State fields/filters do not authorize arbitrary resource ARNs or tenant destinations.
  Keep roles least-privilege, logs redacted, and R&D resources/tokens/data separate.
- `StartExecution` acceptance is pending, not completion. Provide bounded authorized
  status/recovery paths and preserve user input through retry/cancel/partial failure.

## Verify and complete

Validate ASL plus changed contracts; syntax validity alone proves no business
recovery. Use `test-quality` to select synthetic positive/negative/duplicate,
timeout/retry/catch, cancellation, compensation or tenant tests relevant to the diff.
Inspect IaC/version/role/resource/log changes and preserve required gates. For
capacity/performance changes compare latency, retries, throttles, backlog, transitions,
downstream saturation and cost. Report evidence, impact, fix/trade-off, rollout,
rollback/redrive and unrun checks. Stop at the requested workflow.

## Conditional detail

Use [state data](references/workflow-guide.md#state-data-and-asl-design),
[task recovery](references/workflow-guide.md#tasks-retries-errors-and-compensation),
[fan-out](references/workflow-guide.md#map-parallel-and-throughput), or
[security](references/workflow-guide.md#security-tenancy-and-rd) for relevant recipes.
For audits open [review checklist](references/review-checklist.md); verify current
service facts through [official references](references/workflow-guide.md#official-references).
