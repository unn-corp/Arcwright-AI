# Step Functions multi-tenant SaaS and R&D

Verify identity and resolve tenant membership at the API/start boundary. Check
tenant status, user membership, action, and resource ownership again at sensitive
workflow tasks. Execution input, Choice branches, event filters, and group/claim
fields are routing data—not a complete authorization boundary.

Bound per-tenant starts, running executions, Map/Parallel concurrency, retries,
payload/result size, downstream calls, and cost. A shared state machine can still
create cross-tenant effects if a task trusts a client-selected ARN, key, queue, or
tenant ID. Use a control-plane tenant directory and server-side resource mapping.

Use separate state machines/versions/aliases and, when justified by compliance,
residency, quota, noisy-neighbor, or blast-radius needs, separate accounts/Regions
and task resources. Separate state machines without separate IAM/data/queues are not
a full silo.

R&D uses separate roles, state machines, versions/aliases, secrets, queues/tables/
buckets, logs, and synthetic or approved masked data. Never copy production task
tokens, credentials, executions, or unmasked tenant payloads into R&D. Test tenant
A/B isolation, membership removal, duplicate starts, timeout-after-commit, redrive,
Map failure, rollback, and quota behavior.

Official references:

- [Step Functions security](https://docs.aws.amazon.com/step-functions/latest/dg/procedure-executing-iam.html)
- [Step Functions quotas](https://docs.aws.amazon.com/step-functions/latest/dg/limits.html)
- [Step Functions best practices](https://docs.aws.amazon.com/step-functions/latest/dg/sfn-best-practices.html)
