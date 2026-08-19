# SES, SNS, and SMTP quick rules

- Identify AWS account/Region, environment, SES sandbox/production state, identities, quotas, send path, configuration sets, event destinations, SNS topology, and subscriber contracts first.
- SES acceptance is not inbox delivery; instrument send, delivery, bounce, complaint, reject, rendering failure, and delivery delay events.
- Verify domains with DKIM; configure SPF/custom MAIL FROM and DMARC alignment deliberately; request SES production access before the application depends on unrestricted recipients.
- Prefer SES API/SDK for AWS-native code; use SMTP only where required. SMTP credentials are Region-specific, distinct from AWS secret keys, and must be stored/rotated as secrets.
- Require TLS for SMTP, bound connect/auth/message timeouts, bounded connection pools, and retry classification for transient versus permanent responses.
- Use configuration sets and non-sensitive message tags on production sends; handle suppression, consent, hard bounces, complaints, and unsubscribe state before retries.
- Use SNS standard for ordinary fan-out and FIFO plus SQS FIFO only when ordering/deduplication is part of the contract; do not claim exactly-once for arbitrary endpoints.
- SNS is fan-out, not durable work processing; use SQS subscriptions and subscription-level DLQs for backpressure, retry, replay, and poison messages.
- Verify SNS HTTPS signatures (prefer Signature Version 2), expected TopicArn, and confirmation state before processing; use HTTPS and least-privilege policies.
- Make every SES send intent and SNS consumer idempotent; include schema version, stable event ID, source, and tenant context.
- Treat filter policies as routing, not authorization; validate tenant and business permissions in every consumer.
- Keep credentials, arbitrary From/topic/destination choices, and publish/send permissions server-side; browser code must not send directly.
- For multi-tenant SaaS, use server-side tenant membership, tenant-scoped suppression and idempotency, bounded per-tenant quotas, and explicit identity/topic isolation for high-risk tenants.
- R&D uses separate identities/topics/secrets/KMS/policies and synthetic or approved test recipients; use the SES mailbox simulator and never production credentials or recipient lists.
- Reviews are read-only. Never send production email, change DNS, subscribe endpoints, rotate credentials, publish to production topics, or alter suppression/policies without explicit authorization.
