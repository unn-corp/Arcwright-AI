# EventBridge quick rules

- Identify account/Region, environment, event bus, source, event schema/version, rules, targets, retry/DLQ, archives/replay, quotas, and tenant boundary first.
- EventBridge is a router, not a database, queue, workflow engine, or universal exactly-once transport; choose SQS, Pipes, Scheduler, SNS, or Step Functions when their contracts fit better.
- Make event envelopes versioned and bounded with stable event IDs, source, detail-type, timestamps, correlation, and authorized tenant context.
- Make event patterns precise: match source plus detail-type and scope account/Region where relevant; validate positive/negative fixtures and prevent loops.
- Prefer one target per rule when target ownership/retry/security contracts differ; duplicate precise rules for independent consumers.
- Configure bounded target retry age/attempts and a subscription/target-specific SQS DLQ for loss-sensitive work; assign alarms, owners, retention, and redrive runbooks.
- Every target must validate source/schema/tenant and be idempotent; at-least-once delivery, replay, failover, and ambiguous outcomes can duplicate side effects.
- Treat archives/replays as production-like mutations: isolate or gate side effects, record replay metadata, throttle, and do not assume original ordering.
- Use IAM/resource policies, KMS, HTTPS, Secrets Manager/API destination connections, and explicit cross-account/Region roles; narrow bus policies by account/Organization/source/rule.
- For cross-account reception, scope rule patterns with `account`; do not let a broad bus policy become broad local execution.
- Use buses for many-to-many, Pipes for point-to-point source-to-target enrichment/filtering, and EventBridge Scheduler for new recurring/one-time schedules.
- For multi-tenant SaaS, enforce tenant authorization server-side; filters are routing, not security. Bound per-tenant publish/fan-out/replay/target quotas.
- R&D uses separate buses, accounts/resources/roles/archives and synthetic or masked events; promote schemas/IaC/code, never production events or R&D archives.
- Reviews are read-only. Never publish, enable, replay, route cross-account, or alter live EventBridge policies without explicit authorization.
