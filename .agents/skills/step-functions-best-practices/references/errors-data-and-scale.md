# Step Functions errors, data, and scale

Every Task should have a business timeout and an error contract. Retry transient
throttles/network/service errors with bounded backoff/jitter and a deadline. Catch
validation, authorization, permanent business, and exhausted-retry failures into a
clear compensation, manual-review, or quarantine path. A task may have committed
before a timeout; use a business idempotency key/status lookup/conditional write.

Use `.waitForTaskToken` only when a secure external callback is required. Bind the
token to execution/task/tenant, authenticate the callback, expire it, and handle
duplicates/late callbacks. Treat it as a bearer secret.

Set explicit Map/Distributed Map/Parallel concurrency from downstream and tenant
capacity. For large inputs use S3 item readers/writers or references rather than
materializing an unbounded array in state. Define item idempotency, tolerated failure,
ordering, redrive, result storage, and cleanup.

Execution input and history have quota/data-retention implications. Keep them small
and sanitized, and monitor open executions, task retries, state transitions, Map
failures, throttles, downstream latency, log delivery, and cost.

Official references:

- [Step Functions best practices](https://docs.aws.amazon.com/step-functions/latest/dg/sfn-best-practices.html)
- [Error handling](https://docs.aws.amazon.com/step-functions/latest/dg/concepts-error-handling.html)
- [Map state](https://docs.aws.amazon.com/step-functions/latest/dg/state-map.html)
- [Distributed Map](https://docs.aws.amazon.com/step-functions/latest/dg/concepts-orchestrate-large-scale-parallel-workloads.html)
- [Quotas](https://docs.aws.amazon.com/step-functions/latest/dg/limits.html)
