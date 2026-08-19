# SNS delivery and event reliability playbook

## Topic choice

Use a standard SNS topic unless ordering or deduplication is a real consumer
contract. Standard topics provide broad protocol support and are appropriate for
most notifications and SES feedback fan-out, but subscribers must tolerate duplicate
and out-of-order delivery.

Use SNS FIFO with an SQS FIFO subscription when processing requires ordered messages
within a message group and deduplication. Supply a stable message group ID and
deduplication ID, or use content-based deduplication only when the body uniquely
identifies the event. A FIFO topic paired with a standard queue or arbitrary HTTP
subscriber does not create an end-to-end exactly-once contract. Filtering can also
change the delivery guarantees described by AWS.

Do not create one topic per tenant by default. Choose pooled topics with explicit
tenant context, topic-per-tier/service, or siloed topics/accounts based on blast
radius, compliance, residency, throughput, and support requirements.

## Event envelope

Use a small, versioned envelope around business data:

```json
{
  "eventId": "evt_01J...",
  "eventType": "email.delivery.updated",
  "schemaVersion": 1,
  "source": "mail-service",
  "occurredAt": "2026-08-19T12:00:00Z",
  "tenantId": "tenant_123",
  "correlationId": "mail_456",
  "data": { "status": "delivered" }
}
```

Use stable IDs for idempotency and trace correlation. Validate `source`, event type,
schema version, tenant authorization, and required fields before a subscriber acts.
Keep sensitive message bodies, credentials, tokens, and full recipient data out of
the envelope when a reference or redacted state is sufficient. If the payload is
large, store it in a protected object and include an authorized, integrity-checked
reference with expiry or version information.

## Subscriptions and filters

A subscription receives every message by default. Add a filter policy when a
subscriber only needs a subset, and choose attribute-based or body-based filtering
deliberately. Use bounded, low-cardinality attributes such as event type, mail class,
environment, and schema version.

Filtering is not authorization. A subscriber must still validate its source, tenant,
permissions, and payload. Filter-policy changes are eventually consistent; test the
transition and the matched/filtered cases before relying on it for a rollout.

Raw message delivery can remove SNS's envelope metadata. Enable it only when the
subscriber contract explicitly expects the original body, and preserve event IDs and
schema metadata in the publisher's body when raw delivery is used.

## Reliability, retries, and DLQs

Use an SQS subscription when the consumer needs independent backpressure, durable
buffering, replay, visibility timeout, or a consumer-specific dead-letter queue.
Attach the DLQ to the subscription and give it an owner, alarm, retention policy,
redrive procedure, and poison-message runbook. Monitor the age and count of failed
messages, not only whether the topic is healthy.

SNS retry behavior is protocol-specific. HTTP/S supports a custom delivery policy;
other protocols have AWS-defined behavior. Do not add a second uncontrolled retry
loop in the Lambda/HTTP handler. A subscriber should acknowledge only after it has
accepted the event safely, and should return an error for a retryable failure.

Every subscriber must be idempotent. Deduplicate by event ID plus the relevant tenant
or business key, store inbox/processed state when the side effect matters, and use
transactional outbox/inbox patterns when a database write and message action must be
consistent. Protect downstream systems with bounded concurrency and circuit
breakers.

## HTTP/S subscribers

Require HTTPS and validate SNS signatures before processing notifications or subscribe
confirmation messages. Prefer Signature Version 2, retrieve the signing certificate
over HTTPS, validate its trust/issuer and allowed SNS certificate URL, and reject an
unexpected TopicArn. Bound body size, request time, and certificate-fetch behavior.

Treat subscription confirmation as an explicit provisioning state. Do not blindly
call `SubscribeURL` from untrusted input. Record the topic, endpoint, environment,
owner, and confirmation status, and remove stale subscriptions safely.

## Security and networking

- Use IAM roles and least-privilege topic, publish, subscribe, queue, and KMS
  permissions. Separate publisher, subscriber, operator, and cross-account roles.
- Use SNS server-side encryption with an appropriate KMS key when message sensitivity,
  policy, or tenant isolation requires it. Verify the key policy grants the SNS
  service principal only the needed actions.
- Use HTTPS and enforce `aws:SecureTransport` in resource policies where applicable.
  Consider VPC endpoints for private publisher access, while remembering that an SNS
  topic endpoint is still an AWS service boundary rather than a private database.
- Avoid secrets, credentials, full email addresses, message bodies, and regulated
  content in topic names, tags, free-form attributes, or logs. Redact event payloads
  at the observability boundary.
- Review cross-account topic/queue policies and KMS grants together. A policy that
  permits publish but cannot decrypt or deliver is a deployment failure; a policy
  that is broad enough for any account is a security finding.

## SES feedback fan-out

For SES events, configure the event destination through a configuration set rather
than relying on ad hoc email notifications. A common shape is:

```text
SES configuration set
  ├─ SNS topic → alerting/notification consumer
  ├─ SQS subscription → suppression and send-state worker
  └─ Firehose/CloudWatch/EventBridge → analytics/operations
```

Give each consumer its own retry and DLQ contract. Do not let a slow analytics
consumer block a suppression update. Suppression and complaint handling should be
fast, idempotent, and observable; analytics can tolerate a longer queue.
