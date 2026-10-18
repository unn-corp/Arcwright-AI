---
name: ses-sns-smtp-best-practices
description: Use when planning, implementing, deploying, debugging, or reviewing Amazon SES email sending or receiving, SES SMTP integrations, Amazon SNS topics and subscriptions, bounces, complaints, suppression, event delivery, notification reliability, or messaging performance and security.
---

# SES, SNS and SMTP best practices

Design the send path and feedback/consumer path together. SES acceptance does not
prove inbox delivery; SNS publish success does not prove subscriber processing.
Plan, implement or review the requested path. Reviews stay read-only; real sends,
DNS/identity changes, subscriptions, production publishes, secret rotation and live
policy changes require authorization covering the action, not just a review request.

## Establish the relevant contract

Identify AWS account/Region/environment, SES sandbox state, identities/DNS auth,
API/SMTP path, quotas, configuration sets, destinations, SNS subscriptions, retry/DLQ,
tenancy and user-visible status. Use send/delivery/bounce/complaint/reject/delay,
SMTP codes, SNS failures, latency/duplicates and DLQ age as evidence. Mark missing
facts unknown; verify current Region/account-specific limits and behavior.

## Send and delivery invariants

- Prefer SES API for AWS application code; use SMTP for actual integration needs.
  Keep sender identity and consent/suppression enforced server-side. Verify domain
  DKIM and deliberate SPF/MAIL FROM/DMARC alignment. Production access does not
  remove sender-verification or reputation obligations.
- Attach production configuration sets/events with non-sensitive correlation tags.
  Distinguish accepted, delivered, bounced, complained, rejected, rendering failure
  and delay. Stop permanent bounce/complaint retries and honor unsubscribe state.
- Persist send intent/idempotency and reconcile ambiguous outcomes before resending.
  Bound queues, per-tenant/provider rates, retries/backoff/jitter and connection
  pools. Do not turn throttles into a retry storm or promise email exactly-once.
- SES SMTP credentials are Region-specific secrets, distinct from AWS secret keys.
  Use the matching endpoint, verified TLS without downgrade, bounded connect/auth/
  command/message timeouts, server-owned envelope/header values and validated MIME.
  Classify transient 4xx, permanent 5xx/configuration errors and potentially accepted
  connection-loss outcomes.

## Notification and security invariants

Use SNS standard for ordinary fan-out; select FIFO with compatible subscribers when
ordered/deduplicated processing is required. Use SQS buffering/subscription DLQs
where consumers need durable work, backpressure or replay. Every loss-sensitive
failure path needs an owner, alarm and recovery procedure.

Validate event ID/type/schema/source and authorized tenant context; make consumers
idempotent. Filters reduce fan-out but do not authorize a consumer. HTTPS endpoints
verify signature and expected TopicArn and handle confirmation deliberately; use
current supported signature verification, not a trusted-looking envelope alone.

Keep credentials, send/publish permissions and arbitrary destination choices off
clients. Use least-privilege topic/queue/KMS/IAM policies and redacted logs. Isolate
tenant identity, suppression, idempotency and quotas; split reputation/resources
when requirements justify it. R&D uses separate resources/secrets and simulator or
approved recipients, never production lists or captured messages.

## Verify and complete

Inspect generated IaC for replacement, trust widening, unintended production
references and rollback. Use `test-quality` to choose changed-contract cases from
TLS/authentication, event feedback, signatures, suppression, duplicates, filters,
transient/permanent failures, DLQ/replay or tenant isolation. Use the SES mailbox
simulator or approved safe identities; don't send merely to validate a review.
Preserve required gates and compare relevant latency/reputation/cost/status to a
baseline. Report evidence → impact → smallest fix/trade-off, recovery and unrun checks.

## Conditional references

- [SES deliverability](references/ses-deliverability.md) for DNS, events and quotas.
- [SMTP recipes](references/workflow-guide.md#ses-smtp) and
  [SNS reliability](references/sns-delivery-and-events.md) for the affected protocol.
- [Multi-tenant/R&D](references/multi-tenant-and-rnd.md) for those environments.
- [Review checklist](references/review-checklist.md) for an audit,
  [official sources](references/official-sources.md) for current service facts.
