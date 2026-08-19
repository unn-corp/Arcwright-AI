# SES, SNS, and SMTP review checklist

## Scope and baseline

- [ ] AWS account, Region, environment, SES sandbox/production state, and preserved behavior are identified.
- [ ] Send path, identity, quota/rate, API/SMTP client, configuration set, event destinations, topics, subscribers, and data classification are documented.
- [ ] Baseline includes acceptance/delivery, bounce/complaint/delay, SMTP errors, SNS delivery/retry/DLQ, latency, duplicates, and cost or unknowns.

## SES identity and deliverability

- [ ] From/Sender/Return-Path identities are verified and server-allow-listed.
- [ ] DKIM, SPF/custom MAIL FROM, and DMARC alignment are configured and tested in the correct Region/domain.
- [ ] Sandbox/production access, consent, unsubscribe, bounce, complaint, and suppression workflows are explicit.
- [ ] Configuration sets and event destinations are attached to production sends; message tags are bounded and non-sensitive.
- [ ] API/SMTP success is not presented as inbox delivery; event state is asynchronous and idempotent.
- [ ] Quota/rate limits, queueing, backoff/jitter, concurrency, and critical-mail reserve are bounded.

## SMTP

- [ ] Region-specific SMTP credentials are stored in an approved secret store and are not AWS keys, source, logs, URLs, or browser data.
- [ ] TLS is required and certificate validation is enabled; no plaintext fallback or unbounded port-25 dependence exists.
- [ ] Connect, TLS, auth, command, idle, message, and total timeouts/pool limits are set.
- [ ] Transient 4xx and permanent 5xx/identity/auth errors are classified; ambiguous acceptance is handled by idempotency rather than blind retries.

## SNS delivery

- [ ] Standard/FIFO choice matches ordering and deduplication requirements; exactly-once claims are limited to the actual topic/queue path.
- [ ] Event envelope has stable ID, type, version, source, timestamp, and authorized tenant context.
- [ ] Filters are tested and treated as routing, not authorization; raw delivery is an explicit subscriber contract.
- [ ] Durable consumers use SQS where needed, with subscription-level DLQ, retention, alarms, owner, and redrive runbook.
- [ ] Consumers validate schema/source/topic, are idempotent, bound concurrency, and handle poison messages.
- [ ] HTTPS subscribers verify Signature Version 2, certificate chain/URL, expected TopicArn, and confirmation state.
- [ ] IAM/topic/queue/KMS policies are least privilege, cross-account paths are explicit, and TLS is enforced.

## Tenant and R&D safety

- [ ] Server-side tenant membership controls identity, destination, topic, configuration set, suppression, and event access.
- [ ] Tenant context is included in protected idempotency/event state; queues, caches, logs, metrics, and DLQs do not cross tenants.
- [ ] Per-tenant quotas and noisy-neighbor controls protect transactional mail and subscriber capacity.
- [ ] R&D uses separate accounts/resources/identities/secrets/KMS/policies with synthetic or approved test recipients.
- [ ] SES mailbox simulator and negative cross-tenant tests cover send, bounce, complaint, delay, retries, signatures, filtering, and redrive.

## Operations and rollout

- [ ] Dashboards/alarms cover deliverability, reputation, throttles, event latency, duplicates, retries, DLQs, queue age, and cost.
- [ ] Credential rotation, identity/DNS changes, subscriber replacement, topic policy changes, and template changes have staged rollout/rollback.
- [ ] R&D artifacts promoted to production exclude messages, recipient data, secrets, and environment-specific suppression state.
- [ ] Review severity is evidence-based and includes a stop/go condition and recovery path for blocker/high findings.
