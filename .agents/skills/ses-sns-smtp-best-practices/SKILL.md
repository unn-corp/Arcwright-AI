---
name: ses-sns-smtp-best-practices
description: Use when planning, implementing, deploying, debugging, or reviewing Amazon SES email sending or receiving, SES SMTP integrations, Amazon SNS topics and subscriptions, bounces, complaints, suppression, event delivery, notification reliability, or messaging performance and security.
---

# SES, SNS, and SMTP best practices

Treat email and notification delivery as a distributed system with two separate
contracts: the send path and the feedback/event path. Amazon SES accepting a send
request does not prove inbox delivery, and Amazon SNS publishing a message does not
prove that every subscriber processed it. Design identity, deliverability, retries,
observability, security, and recovery together.

## Operating contract

- Identify the AWS account, Region, environment, SES sandbox/production status,
  verified identities, sending and receiving requirements, API versus SMTP path,
  SES quotas, configuration sets, event destinations, SNS topics/subscriptions,
  subscriber protocols, and tenant/data classification before recommending changes.
- Start from evidence: SES send/delivery/bounce/complaint/reject/delay events,
  reputation, sending rate, throttles, SMTP response codes, SNS delivery failures,
  retry/DLQ depth, subscriber latency, duplicate rate, and user-visible outcomes.
- Keep facts, assumptions, findings, and recommendations separate. Quotas, account
  status, endpoints, supported features, defaults, and pricing are Region/account or
  service-specific; verify them before making a current claim.
- Reviews are read-only by default. Do not send real email, subscribe a real
  endpoint, change DNS, approve production access, rotate SMTP credentials, publish
  to a production topic, or modify a live policy without explicit authorization for
  that exact mutation.
- Never place SMTP passwords, AWS keys, tokens, recipient lists, raw MIME, message
  bodies, bounce payloads, or private webhook URLs in hook output, logs, build
  artifacts, or committed configuration.

## Choose the mode

### Planning

Choose the send interface, identity/authentication model, event topology, retry and
idempotency contract, tenant/environment boundary, observability, quotas, rollout,
and recovery plan. Establish a deliverability and user-journey baseline before
optimizing throughput.

### Implementation

Make the smallest evidence-backed change. Verify Region/account scope, identity
authorization, DNS records, TLS, secret references, IAM/KMS policies, configuration
set attachment, event schema, subscriber permissions, retry/DLQ behavior, and
rollback before deploying.

### Review

Read [references/review-checklist.md](references/review-checklist.md) and report
severity, evidence, recipient/user impact, smallest safe improvement, trade-offs,
validation, rollback, unchanged behavior, and unknowns. A review finding is not
permission to send messages or change production delivery behavior.

## First-pass inventory

Search for and inspect, as applicable:

- SES API usage (`SendEmail`, `SendRawEmail`, templates, attachments), SMTP clients
  such as Nodemailer, SMTP endpoints/ports/TLS, connection reuse, timeouts, retries,
  and credentials;
- verified email/domain identities, From/Sender/Return-Path rules, DKIM, SPF, DMARC,
  custom MAIL FROM, DNS/IaC, sending authorization, sandbox/production access,
  regional quotas, dedicated IP pools, and environment-specific identities;
- SES configuration sets, message tags, event destinations, SNS/EventBridge/
  CloudWatch/Firehose consumers, bounce/complaint/delay/suppression processing,
  templates, unsubscribe/consent handling, and alert thresholds;
- SNS topics, standard/FIFO choice, message-group and deduplication IDs, topic and
  subscription policies, filter policies, raw delivery, retry policies, HTTPS
  signature verification, confirmation handling, SQS/Lambda/HTTP subscribers, and
  subscription DLQs;
- event envelopes, schema/version validation, idempotency keys, deduplication,
  outbox/inbox state, backoff/jitter, rate limiting, circuit breaking, replay,
  poison-message handling, and operator runbooks;
- tenant authorization, tenant-scoped sending identities/configuration sets/
  suppression, destination allow-lists, correlation tags, cross-tenant event
  handling, R&D versus production accounts/secrets/topics, and data retention; and
- API/UI submission flows, request waterfalls, user-visible pending/sent/failed
  states, accessibility, and whether any browser code can access provider
  credentials. Sending must remain server-side.

If a deployed fact or downstream subscriber cannot be inspected, mark it unknown. Do
not infer deliverability from a successful SDK call, or reliability from a healthy
topic, empty DLQ, or green deployment alone.

## Reference delivery topology

Use the simplest topology that preserves the required contract:

```text
server/API or SMTP client
        │
        ▼
Amazon SES ── configuration set/events ── SNS/EventBridge/CloudWatch/Firehose
                                              │
                                              ▼
                                     SQS subscription ── workers/Lambda
```

Use SNS for fan-out and notification routing. Use SQS behind SNS when a consumer
needs durable buffering, backpressure, independent retry, replay, or a dead-letter
queue. Do not use an SNS topic as a substitute for a work queue.

## SES send path

- Keep SES Region and environment explicit. SES identities, quotas, sandbox state,
  SMTP credentials, suppression lists, and configuration sets are Region-scoped in
  important ways; do not silently fall back to another Region.
- Verify a domain rather than a collection of ad hoc addresses when the application
  sends from a controlled domain. Configure Easy DKIM or a deliberate BYODKIM path,
  a custom MAIL FROM subdomain when SPF/DMARC alignment requires it, and a DMARC
  policy appropriate to the domain's rollout stage. Test DNS and alignment before
  increasing volume.
- Plan sandbox exit early. In the sandbox, recipients generally must be verified and
  sending is tightly limited. Production access still requires verified sender
  identities, consent/permission controls, and a process for bounce and complaint
  handling.
- Prefer the SES API/SDK for AWS-controlled application code. Use SMTP when an
  existing mail server, framework, appliance, or vendor integration requires it;
  do not add SMTP merely because it looks portable. Keep SMTP connection count,
  message size, concurrency, and send rate within measured quotas.
- Treat a successful SES API response or SMTP `250` acceptance as “SES accepted the
  request,” not “the recipient saw the message.” The event path must distinguish
  send, delivery, bounce, complaint, reject, rendering failure, and delivery delay.
- Use configuration sets on every production send path so events and message tags
  are not optional. Publish the minimum useful event fields to an appropriate
  destination, correlate with a non-sensitive internal ID, and redact recipient
  addresses and message content from logs and metrics.
- Maintain account/configuration-set/tenant suppression behavior. Stop retrying hard
  bounces and complaints, honor unsubscribe/consent state, and make suppression
  decisions before enqueueing a send where possible. A transient delivery delay is
  not the same as a permanent bounce.
- Shape volume with a bounded queue, per-identity/tenant rate limits, exponential
  backoff with jitter for throttles and transient errors, and a circuit breaker for
  provider or downstream failures. Do not turn provider throttling into an unbounded
  Lambda retry storm.
- Make application sends idempotent. Persist an intent/outbox or idempotency record
  before sending, include a stable internal correlation ID, and classify ambiguous
  outcomes before retrying. Email is an external side effect; blindly retrying can
  duplicate a password reset, invoice, or notification.

## SES SMTP

- Use the SES SMTP endpoint for the same Region as the identity and SMTP
  credentials. SES SMTP credentials are not the same string as an AWS secret access
  key and are Region-specific; store them in Secrets Manager or an approved secret
  store, restrict access, and rotate them deliberately.
- Require TLS. Use STARTTLS on the configured submission port or TLS Wrapper when
  the client requires it; verify the server certificate and reject plaintext or
  silent TLS downgrade. Treat EC2 port-25 throttling as an environment/network
  constraint, not something to work around by disabling TLS.
- Bound SMTP connect, greeting, TLS, authentication, command, and overall message
  timeouts. Reuse connections only with a bounded pool and safe idle/lifetime
  limits. Recycle broken connections and do not create an unbounded connection per
  request or Lambda invocation.
- Permit only server-owned From, Sender, and envelope/MAIL FROM values. Do not let a
  user-supplied address become an arbitrary sender or header. Validate message size,
  MIME structure, template variables, and attachment type before the SMTP call.
- Classify SMTP responses: retry transient 4xx conditions with bounded backoff,
  surface permanent 5xx/configuration failures, and handle an unknown outcome after
  connection loss as potentially accepted until the application idempotency policy
  resolves it. Never retry every response indiscriminately.

## SNS topology and delivery

- Use a standard topic for ordinary at-least-once fan-out where best-effort ordering
  is acceptable. Use an SNS FIFO topic with an SQS FIFO subscription when the
  consumer contract requires ordered processing and deduplication; do not claim
  end-to-end exactly-once behavior for arbitrary HTTP, email, or non-FIFO consumers.
- Put a stable event ID, event type, schema version, occurred-at timestamp, source,
  and authorized tenant context in each event. Subscribers must validate the source,
  schema, and tenant before acting, deduplicate by an appropriate key, and make
  side effects idempotent.
- Use message attributes and subscription filter policies to reduce unnecessary
  fan-out. Filtering is routing, not authorization; a consumer still validates the
  message and permissions. Treat filter-policy changes as eventually consistent and
  test both matched and intentionally filtered events.
- Attach a subscription-level SQS DLQ where failed delivery needs investigation or
  replay. Monitor delivery failures, age/depth, retry exhaustion, redrive results,
  and poison messages. A DLQ without an owner/runbook is only deferred data loss.
- For HTTP/S subscriptions, require HTTPS, handle the confirmation handshake
  deliberately, validate the SNS signature (prefer Signature Version 2), validate
  the expected TopicArn, bound request size/time, acknowledge only after safe
  acceptance, and make the handler idempotent.
- Use least-privilege topic/subscription/queue policies, IAM roles instead of long-
  lived application keys, KMS server-side encryption where message sensitivity or
  policy requires it, and `aws:SecureTransport` conditions. Keep secrets and
  sensitive recipient data out of topic names, tags, attributes, and logs.
- Keep payloads small and versioned. Put large or sensitive bodies behind an
  authorized S3/object reference with integrity and expiry checks instead of
  assuming every subscriber should receive the full content.

## Multi-tenant SaaS and R&D

Read [references/multi-tenant-and-rnd.md](references/multi-tenant-and-rnd.md) when
email or notifications serve multiple customers or when building a research and
development environment.

- Resolve a verified principal to a tenant and permitted sending identity on the
  server. Never trust a client-provided `From`, tenant, topic ARN, configuration set,
  suppression scope, or destination list as authorization.
- In pooled systems, include a non-sensitive tenant/correlation label in the event
  envelope and internal state, include tenant context in idempotency/deduplication
  keys, and ensure caches, queues, logs, exports, and event consumers cannot cross
  tenant boundaries. Do not put email addresses or message bodies into tags merely
  to get per-tenant analytics.
- Use tenant-level suppression where appropriate, but do not rely on suppression as
  authorization. Separate identities, configuration sets, IP pools, topics, accounts,
  or Regions for tenants whose reputation, compliance, residency, or noisy-neighbor
  requirements justify stronger isolation.
- Keep R&D in a separate account when practical, otherwise separate identities,
  topics, secrets, KMS keys, and policies. Use the SES mailbox simulator and verified
  test addresses; never run R&D tests against production recipient lists or
  credentials. Promote code, templates, policies, and IaC—not R&D event data or
  secrets.

## UI/API and deployment boundary

- Keep SES/SNS credentials and publish/send permissions server-side. Browser clients
  may request an authorized notification operation, but they must not call SES SMTP,
  hold AWS keys, choose arbitrary recipients, or publish directly to a broad topic.
- Model user-visible email state as pending/accepted/delivered/failed where the
  product needs that distinction. Do not show “delivered” after only an API success;
  reconcile event state asynchronously and preserve accessible loading, success,
  retry, and error states.
- For Amplify Functions/AppSync/API Gateway, bound Lambda concurrency against SES
  sending rate and SNS subscriber capacity, keep SDK clients outside handlers,
  make event handlers idempotent, and coordinate with `amplify-best-practices` for
  deployment, UI, and runtime checks.
- Keep identities, DNS, topics, subscriptions, event destinations, policies, and
  secrets in IaC. Review generated plans for replacement, cross-account exposure,
  accidental production identity use, and missing rollback before deployment.

## Validation gate

Before calling a messaging change complete, run the checks that fit the repository:

1. Record account/Region/environment, SES sandbox/production status, identity/DNS
   auth, quotas, sending path, configuration set/event destinations, SNS topology,
   subscriber contract, tenant boundary, and data classification.
2. Send only to the SES mailbox simulator or approved test identities in a safe
   environment. Verify API and SMTP TLS/authentication, templates, MIME, rate
   limiting, timeout behavior, and transient/permanent error handling.
3. Generate and consume representative send, delivery, bounce, complaint, reject,
   render-failure, delay, SNS retry, duplicate, filtered, replay, and DLQ cases.
4. Verify idempotency, event/schema validation, tenant isolation, signature checks,
   topic/queue/KMS/IAM policies, suppression behavior, and redaction.
5. Exercise deployment rollback, DNS/identity propagation assumptions, subscriber
   replacement, credential rotation, DLQ redrive, and provider outage behavior.
6. Compare send acceptance, delivery, bounce/complaint, throttling, p50/p95/p99
   event latency, duplicate rate, DLQ age, cost, and user-visible status against a
   known baseline.

## Review output

Use this compact shape:

```text
Scope / account / Region / environment / send path / preserved behavior:
Identity, deliverability, quota, and event baseline:
SNS topology, subscriber, retry, DLQ, and idempotency baseline:
Tenant/R&D and data-protection boundary:
Findings:
  [severity] evidence → impact → smallest safe improvement → trade-off
Rollout / rollback:
Validation / simulator / event / delivery evidence:
Unchanged by design:
Open questions:
```

Severity is evidence-based:

- **Blocker:** exposed credentials, arbitrary sender/topic/destination authorization,
  proven cross-tenant delivery, plaintext SMTP, production sends without required
  identity/consent controls, or irreversible delivery changes without rollback.
- **High:** missing bounce/complaint/suppression handling, no idempotency on a
  side-effecting consumer, unverified SNS HTTP signatures, unbounded provider retry
  or concurrency, missing DLQ for a loss-sensitive subscriber, or R&D access to
  production identities/recipient data.
- **Medium:** measurable deliverability, latency, cost, observability, quota, or
  operational risk with a safe staged fix.
- **Low:** hygiene or documentation improvement without demonstrated user/data risk.

## References

- [SES deliverability and sending](references/ses-deliverability.md) — read for
  identities, DNS auth, sandbox, API/SMTP, configuration sets, events, suppression,
  quotas, and feedback handling.
- [SNS delivery and event reliability](references/sns-delivery-and-events.md) — read
  for topic choice, filters, retries, DLQs, FIFO, HTTP subscribers, security, and
  idempotency.
- [Multi-tenant and R&D messaging](references/multi-tenant-and-rnd.md) — read for
  tenant isolation, per-tenant sending/reputation, safe test environments, and
  promotion controls.
- [Review checklist](references/review-checklist.md) — read for codebase and IaC
  audits.
- [Official sources](references/official-sources.md) — use when a current AWS
  behavior, limit, default, feature, or pricing detail matters.

Coordinate with `amplify-best-practices` for Amplify Functions/UI/deployment,
`security-review` for identity and secret boundaries, `s3-best-practices` when
payloads use object references, `eventbridge-best-practices` for event-bus/rule/
archive/replay routing, and `cloudfront-best-practices` when public assets or webhook
delivery are part of the path.
