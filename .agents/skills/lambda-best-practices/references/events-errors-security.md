# Lambda events, errors, and security

Classify failures before selecting a retry. Validation, authentication, authorization,
schema, and permanent business errors should be rejected or quarantined. Dependency
and transient errors can retry with bounded exponential backoff/jitter. An ambiguous
timeout after a write needs an idempotency lookup or reconciliation, not a blind
duplicate mutation.

Every retriable mutation needs a stable event/business key and a durable conditional
write or idempotency record. Event source mappings and asynchronous invocation can
redeliver; Lambda does not make arbitrary business effects exactly once.

Use least-privilege execution and invoke policies. Store secrets in Secrets Manager
or Parameter Store, use KMS grants narrowly, validate API/tenant authorization on the
server, and redact logs/traces. A resource ARN, tenant ID, function name, or callback
chosen by an untrusted client must not become an unrestricted destination.

Give asynchronous and batch work a DLQ/on-failure destination, retention, alarm,
owner, poison-event policy, and redrive procedure. Redrive is a new production-like
mutation: test idempotency and tenant checks before reprocessing.

Official references:

- [Lambda retry behavior](https://docs.aws.amazon.com/lambda/latest/dg/invocation-retries.html)
- [Lambda best practices](https://docs.aws.amazon.com/lambda/latest/dg/best-practices.html)
- [Lambda security](https://docs.aws.amazon.com/lambda/latest/dg/lambda-security.html)
- [Lambda environment variables](https://docs.aws.amazon.com/lambda/latest/dg/configuration-envvars.html)
- [Lambda VPC configuration](https://docs.aws.amazon.com/lambda/latest/dg/configuration-vpc.html)
