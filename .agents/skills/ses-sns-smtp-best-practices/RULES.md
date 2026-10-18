# SES, SNS and SMTP quick rules

- Identify account/Region/environment, identity/DNS, sandbox, quota, API/SMTP path, event destinations, SNS consumers and tenant boundary.
- Acceptance is not delivery/processing. Correlate actual events without exposing recipients, bodies, secrets or raw feedback payloads.
- Use deliberate DKIM/SPF/DMARC alignment, consent/suppression and production configuration sets. Stop permanent bounce/complaint retries.
- SMTP uses Region-specific secret credentials and verified TLS; bound pools/timeouts and distinguish transient, permanent and ambiguous outcomes.
- Persist send intent/idempotency; make consumers idempotent. Filters route but do not authorize. Validate event schema/source/tenant; HTTPS SNS verifies signature, TopicArn and confirmation.
- Use SNS for fan-out, SQS for durable buffering/backpressure; give loss-sensitive DLQ paths an owner and recovery procedure. Do not promise arbitrary exactly-once delivery.
- Keep sends/publishes and destination authorization server-side. Isolate tenant quota/reputation and synthetic R&D resources/data.
- Use simulator/approved identities for authorized verification; choose tests from changed risks and preserve required checks.
- Reviews do not authorize real email, DNS changes, subscriptions, production publishes, secret rotation or policy mutation.
