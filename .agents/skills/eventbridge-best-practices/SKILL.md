---
name: eventbridge-best-practices
description: Use when planning, implementing, deploying, debugging, or reviewing Amazon EventBridge event buses, rules, event patterns, targets, Pipes, Scheduler, archives and replay, global endpoints, schemas, cross-account or cross-Region routing, or event-driven application reliability.
---

# EventBridge best practices

Treat EventBridge as a managed event router, not a database, queue, workflow engine,
or exactly-once transport. Separate the event contract, routing contract, target
processing contract, and recovery contract. A successful `PutEvents` call means the
event was accepted by the bus; it does not prove that every matching target completed
its work.

## Operating contract

- Identify the AWS account/Organization, Region, environment, event source, bus,
  event schema/version, rules/patterns, target protocols, retry/DLQ settings,
  archive/replay requirements, quotas, cross-account/Region paths, tenant boundary,
  and data classification before recommending a change.
- Start from evidence: `PutEvents` failures, matched/triggered/throttled rules,
  ingestion-to-invocation latency, target failures, retries, DLQ age/depth, replay
  volume, duplicate/out-of-order effects, and user-visible recovery.
- Keep facts, assumptions, findings, and recommendations separate. EventBridge
  quotas, supported target behavior, cross-Region availability, costs, and defaults
  are current service details; verify them for the Region and target.
- Reviews are read-only by default. Do not publish production events, enable a live
  rule, replay an archive, change an event-bus policy, invoke a target, or alter a
  cross-account route without explicit authorization for that exact mutation.
- Never place credentials, tokens, private URLs, raw sensitive payloads, or customer
  data in hook output, logs, committed patterns, tags, or unreviewed event archives.

## Choose the mode

### Planning

Define the event contract, bus ownership, routing patterns, target boundary,
idempotency, retries/DLQs, replay policy, security, tenant isolation, observability,
cost, and rollout. Choose EventBridge bus, Pipes, Scheduler, SQS, SNS, or Step
Functions from the required delivery semantics rather than product familiarity.

### Implementation

Make the smallest evidence-backed change. Validate event patterns against positive and
negative fixtures, inspect generated IaC policies and target roles, configure retry
and DLQ behavior, preserve schema compatibility, and stage cross-account/Region
changes before enabling production traffic.

### Review

Read [references/review-checklist.md](references/review-checklist.md) and report
severity, evidence, event/user impact, smallest safe improvement, trade-offs,
validation, rollback, unchanged behavior, and unknowns. A review does not authorize
publishing or replaying events.

## First-pass inventory

Search for and inspect, as applicable:

- `PutEvents`, custom event publishers, AWS service/SaaS sources, event envelopes,
  schemas, versioning, source/detail-type conventions, event IDs, tenant context,
  and payload size/redaction;
- custom/default/partner event buses, bus resource policies, archive settings,
  encryption, tags, account/Region ownership, cross-account and cross-Region targets,
  global endpoints, health checks, and failover replication;
- event-pattern JSON, `PutRule`/`PutTargets`, target input transformers, target roles,
  retry policies, maximum event age/attempts, dead-letter queues, retry alarms, and
  rule enable/disable state;
- target types and handlers: Lambda, SQS, SNS, Step Functions, API destinations,
  HTTP endpoints, Kinesis, Pipes, Scheduler, and downstream idempotency/outbox/
  inbox/transaction behavior;
- archive/replay ranges, retention, replay routing, replay marker handling, schema
  migration, consumer compatibility, and whether replay can trigger real side effects;
- IAM/resource policies, KMS grants, Secrets Manager/API destination auth, HTTPS,
  VPC/network paths, CloudTrail, logs, metrics, quotas, and cost budgets;
- tenant authorization, tenant-aware event IDs and filters, R&D versus production
  buses/roles/payloads, and cross-tenant consumer/DLQ/replay behavior; and
- any UI/API flow that depends on asynchronous completion. The UI must represent
  accepted/pending/processed/failed states without treating bus acceptance as work
  completion.

If a deployed fact or target owner cannot be inspected, mark it unknown. A clean
event-pattern test, successful publish, or empty DLQ does not prove production
reliability.

## Choose the EventBridge primitive

- **Event bus:** many-to-many routing from AWS services, custom applications, or SaaS
  partners to multiple independently owned targets. Use separate custom buses for
  clear domain/tenant/environment ownership and policy boundaries; do not put every
  event in one ungoverned default bus.
- **Rule:** declarative match and delivery. Prefer a single target per rule when
  target contracts or ownership may diverge; duplicate precise rules for independent
  consumers instead of hiding unrelated retry/security behavior behind one rule.
- **Pipes:** point-to-point source-to-target integration with optional filtering,
  enrichment, and transformation. Use when one source feeds one target; use a bus
  for many-to-many fan-out and independent subscriptions.
- **Scheduler:** one-time or recurring invocation with flexible windows, retry
  limits, and failed-invocation retention. Prefer Scheduler for new scheduled tasks;
  legacy scheduled rules should not be expanded without a reason.
- **Archive/replay:** recovery, backfill, migration validation, and new-consumer
  testing. Replays are new side effects, may not preserve original order, and must be
  isolated or made idempotent before activation.
- **Global endpoint:** regional failover for event ingestion when the RPO/RTO,
  health-check, replication, and secondary-consumer contract justifies the cost and
  operational complexity. Configure and test the secondary path, not only DNS/health.

## Event contracts and patterns

- Use a stable envelope with immutable event ID, source, `detail-type`, schema
  version, timestamp, account/Region where meaningful, correlation/causation IDs,
  tenant context, and a bounded detail payload. Do not use EventBridge-assigned
  metadata as the only business idempotency key.
- Treat event schemas as public API. Prefer additive evolution, explicit versioning,
  compatibility tests, producer/consumer ownership, and deprecation windows. Do not
  silently change field meaning, nullability, units, or tenant semantics.
- Make patterns precise: match `source` and `detail-type`, scope `account` and
  `region` when cross-account/Region events are possible, and match the required
  detail fields. A broad source-only pattern can begin matching future events and
  trigger unexpected work and cost.
- Validate patterns with `TestEventPattern`/CLI/console fixtures and include
  positive, negative, unknown-field, missing-field, cross-account, cross-Region,
  replay, and version-transition cases. Store patterns and fixtures in IaC/tests.
- Prevent loops. A target that changes the same resource or emits the same event
  family can re-trigger its rule. Add loop guards, source/detail predicates,
  idempotency, and a budget alarm before enabling remediation rules.
- Use input transformers only for a documented target contract. Preserve the source
  event ID, schema/version, correlation, and tenant context needed for debugging and
  idempotency; do not use a transformer to hide a breaking schema change.

## Delivery, retries, and recovery

- Configure target retry policy with a bounded maximum event age and attempts that
  match the target's idempotency and recovery time. EventBridge retries failures for
  a limited period; it is not an infinite durable queue.
- Attach a target-specific SQS DLQ for loss-sensitive delivery. Alert on DLQ count,
  age, target failures, retry exhaustion, throttled rules, and `PutEvents` failures.
  Assign an owner, retention, replay/redrive procedure, and poison-event policy.
- Design every target handler for at-least-once effects: validate event source and
  schema, deduplicate by a stable event/business key, make database writes and
  downstream side effects idempotent, and classify ambiguous outcomes before retrying.
- Bound target concurrency and downstream calls. Use SQS between EventBridge and a
  slow/bursty worker when queueing/backpressure is required; do not expect a Lambda,
  API destination, or database to absorb unlimited event fan-out.
- Treat replays as production-like mutations. Replay into an isolated bus/target or
  gate side effects by replay metadata and migration mode. Record replay name/time
  range/operator, throttle replay rate, and verify consumers tolerate duplicate and
  out-of-order events.

## Security and cross-account routing

- Use least-privilege IAM roles for publishers, rules, targets, archives, Pipes,
  Scheduler, API destinations, and operators. Keep event-bus resource policies
  narrow by account/Organization, source, rule, Region, and action.
- Cross-account event-bus targets should use an IAM role and receiver resource policy.
  When receiving from multiple accounts, include allowed `account` values in rule
  patterns so unrelated events do not trigger local targets.
- Use KMS encryption where event sensitivity or policy requires it, and verify key
  policies grant EventBridge/target service principals only needed actions. Keep raw
  sensitive payloads out of archives unless retention, access, deletion, and key
  ownership are deliberate.
- Use HTTPS/TLS for API destinations and webhook targets, store connection/auth
  secrets in Secrets Manager or the supported connection mechanism, rotate them, and
  validate endpoint ownership. Do not put credentials in URLs or event detail.
- Consider VPC endpoints for private publisher access where the service/path supports
  it, but do not mistake private ingress for tenant authorization.
- Monitor CloudTrail and EventBridge metrics. Event bus access, rule changes, target
  changes, archive/replay, and cross-account policy changes are security-sensitive.

## Multi-tenant SaaS and R&D

- Resolve verified identity to tenant and permitted event sources, bus, rule, target,
  archive, replay, and scheduler on the server. Never trust tenant/account/bus/target
  choices from client input or an unvalidated event field.
- In pooled buses, include tenant context in the validated envelope and idempotency
  state. Consumers must check tenant status/authorization; filters reduce fan-out but
  are not an authorization boundary. Keep tenant IDs out of unbounded metric
  dimensions and sensitive logs.
- Use tenant/tier/domain buses, accounts, KMS keys, or target stacks when compliance,
  residency, blast radius, noisy-neighbor, or replay isolation requires it. A
  dedicated rule with a shared over-privileged target role is not a silo.
- Bound per-tenant publisher rate, event size, fan-out, target concurrency, replay
  rate, and scheduler usage. A single tenant must not exhaust `PutEvents`, target,
  archive, or downstream quotas.
- R&D uses separate account/buses/roles/KMS/secrets/archives and synthetic or
  approved masked events. Do not replay production archives into R&D without an
  approved sanitization process. Use explicit environment patterns that reject
  production sources/targets from R&D.
- Promote event schemas, patterns, IaC, code, tests, alarms, and runbooks—not R&D
  events, archives, secrets, or tenant data. Canary a representative tenant and
  verify replay/DLQ/loop behavior before broad enablement.

## Validation gate

Before calling an EventBridge change complete, run the checks that fit the repository:

1. Record account/Region/environment, bus ownership, event contract/version, source,
   rules/patterns, targets, retry/DLQ, archive/replay, security, tenant boundary,
   RPO/RTO, quotas, and cost dimensions.
2. Test event patterns with positive/negative/version/cross-account/replay fixtures;
   inspect generated IaC for policy, role, target, encryption, and replacement risk.
3. Publish only synthetic or approved test events in a safe environment. Exercise
   target success, timeout, throttling, duplicate, out-of-order, invalid schema,
   retry exhaustion, DLQ, redrive, and replay cases.
4. Verify subscriber idempotency, tenant authorization, loop prevention, event
   latency, throttling, queue age, DLQ ownership, and user-visible pending/failed
   behavior.
5. For cross-Region/global endpoints, exercise secondary ingestion, replication,
   failback, unique event correlation, and duplicate handling.
6. Compare publish errors, triggered/throttled rules, ingestion-to-target latency,
   failures, retries, DLQ age, replay throughput, duplicates, downstream load, and
   cost against the baseline.

## Review output

Use this compact shape:

```text
Scope / account / Region / environment / primitive / preserved behavior:
Event contract / pattern / target / retry-DLQ baseline:
Security / tenant / cross-account-Region / archive baseline:
Findings:
  [severity] evidence → impact → smallest safe improvement → trade-off
Rollout / rollback / replay plan:
Validation / metrics / synthetic event evidence:
Unchanged by design:
Open questions:
```

Severity is evidence-based:

- **Blocker:** arbitrary cross-account target/publish access, exposed secret, proven
  cross-tenant event delivery, unbounded loop with production impact, or replay of
  side effects without an isolation/idempotency plan.
- **High:** missing target retry/DLQ for loss-sensitive work, non-idempotent target,
  over-broad pattern, unverified webhook/API destination, missing cross-account
  policy boundary, or R&D access to production buses/archives.
- **Medium:** measurable latency, quota, cost, observability, schema, or operational
  risk with a safe staged fix.
- **Low:** hygiene/documentation improvement without demonstrated user/data risk.

## References

- [Event buses, rules, and patterns](references/buses-rules-patterns.md) — read for
  bus ownership, event contracts, precise patterns, rule design, loops, and targets.
- [Delivery and recovery](references/delivery-and-recovery.md) — read for retries,
  DLQs, idempotency, archives, replay, global endpoints, and observability.
- [Security, tenants, and R&D](references/security-tenants-rnd.md) — read for IAM,
  KMS, cross-account/Region, tenant boundaries, and safe environments.
- [Review checklist](references/review-checklist.md) — read for codebase/IaC audits.
- [Official sources](references/official-sources.md) — use when current EventBridge
  behavior, quota, feature, or pricing matters.

Coordinate with `ses-sns-smtp-best-practices` for email/SNS event integration,
`amplify-best-practices` for Amplify Functions/UI/deployment, `s3-best-practices`
for object-backed payloads, `security-review` for policy/secret boundaries, and
`dynamodb-best-practices`/`aurora-db-best-practices` for consumer state/idempotency.
