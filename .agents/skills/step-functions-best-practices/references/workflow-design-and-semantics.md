# Workflow design and execution semantics

## Standard versus Express

Choose Standard when the workflow is long-running, auditable, human-involved,
callback-based, `.sync`-based, or coordinates non-idempotent business actions.
Choose Express for short, high-rate event processing only when at-least-once task
execution, CloudWatch-based history, duration limits, and supported integrations fit.
Do not use Express to avoid designing idempotency.

An execution name can provide duplicate-start protection for supported Standard
semantics. Express and task effects still need application/workflow idempotency. A
caller that times out after `StartExecution` must be able to find the same business
operation rather than start another one.

## State contracts

Keep the state object a bounded control document: identifiers, status, authorized
tenant context, and small task results. Use `InputPath`, `Parameters`, `ResultSelector`,
`ResultPath`, `OutputPath`, JSONata, or variables to avoid copying irrelevant data.
Store large artifacts in encrypted/versioned S3 and pass a reference with ownership,
checksum, retention, and cleanup rules. State history is an operational and data
surface; do not put secrets, task tokens, payment data, or raw customer events in it.

Use exhaustive Choice defaults and stable error/output contracts. Additive schema
evolution is safer than changing field meaning while executions are in flight. Use
versions/aliases or an equivalent deployment boundary so new starts and existing
executions have an intentional relationship.

## Service integrations

Prefer optimized/direct integrations for simple service calls. They remove a Lambda
cold start, serialization, IAM hop, retry surface, and extra log stream. Use Lambda
when the task contains real business logic, validation, a supported SDK operation not
available as an integration, or a deliberate isolation boundary.

Official references:

- [Choosing workflow type](https://docs.aws.amazon.com/step-functions/latest/dg/choosing-workflow-type.html)
- [Amazon States Language](https://docs.aws.amazon.com/step-functions/latest/dg/concepts-amazon-states-language.html)
- [Data flow and parameters](https://docs.aws.amazon.com/step-functions/latest/dg/concepts-input-output-filtering.html)
- [Service integrations](https://docs.aws.amazon.com/step-functions/latest/dg/connect-to-resource.html)
