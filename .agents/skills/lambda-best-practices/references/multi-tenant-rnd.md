# Lambda multi-tenant SaaS and R&D

## Tenant boundary

Resolve tenant from a verified identity plus a server-side membership/entitlement
record. Apply the tenant predicate to every data read/write and downstream action;
function names, event filters, S3 prefixes, environment variables, or claims alone
are not authorization. Include authorized tenant context in validated idempotency
keys and correlation data, but keep raw tenant data out of logs and unbounded metrics.

Bound per-tenant request rate, concurrency, batch size, queue age, retry/redrive,
payload size, downstream usage, and cost. Shared functions can be efficient, but a
single tenant must not exhaust a database pool, reserved concurrency, queue, or
third-party quota. Use tiered functions/queues/accounts/Regions only when the
compliance, residency, noisy-neighbor, or blast-radius benefit justifies the
operational cost.

## R&D separation

Use separate accounts when feasible; at minimum separate functions/aliases, event
sources, queues, databases, roles, secrets, logs, alarms, KMS grants, and data. Use
synthetic tenants/events or approved masked data. Never copy production credentials,
tokens, raw events, or unmasked tenant records into R&D, and never allow an R&D role
to invoke production functions or redrive production DLQs.

Test duplicate delivery, timeout-after-commit, cross-tenant reads/writes, disabled
membership, throttling, DLQ redrive, alias rollback, and per-tenant noisy-neighbor
limits before production rollout.

Official references:

- [Designing Lambda applications](https://docs.aws.amazon.com/lambda/latest/dg/concepts-application-design.html)
- [Lambda resilience](https://docs.aws.amazon.com/lambda/latest/dg/security-resilience.html)
- [Lambda best practices](https://docs.aws.amazon.com/lambda/latest/dg/best-practices.html)
