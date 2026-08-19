# EventBridge delivery and recovery

## Target retry contract

EventBridge retries failed target delivery for a bounded time. Configure maximum
event age and retry attempts from the target's idempotency, recovery time, and
downstream capacity. A longer retry window can preserve a transient event but can
also deliver stale business actions; a shorter window pushes more work to the DLQ or
operator path.

Use target-specific retry settings rather than one universal policy. A notification
target, an invoice workflow, and an analytics sink have different freshness and
recovery requirements. Add jitter or downstream rate limiting where the target can
become a synchronized retry storm.

## Dead-letter queues

Attach an SQS DLQ to loss-sensitive target delivery. The DLQ should have:

- an owner and an alarm on count and oldest age;
- retention matched to incident response and business recovery;
- encryption and a queue policy that allows EventBridge delivery;
- a classification path for poison events versus temporary outages;
- a redrive tool/runbook that validates the event and tenant before replay; and
- a record of operator, reason, time, target, and replay/redrive outcome.

An empty DLQ is not proof of success if the rule never matched, the target was
disabled, or events were filtered. Monitor `FailedInvocations`, `InvocationsFailedToBeSentToDLQ`,
`TriggeredRules`, `ThrottledRules`, `MatchedEvents`, and target-specific queue age
where those metrics apply. Inspect `PutEvents` failures and partial batch results;
publisher code must handle per-entry failures rather than assuming the whole request
was accepted.

## Consumer idempotency

EventBridge can deliver an event more than once, and archives, failover, or manual
redrive can intentionally repeat it. Every target that causes a side effect should:

1. validate source, event type, schema, tenant, and authorization;
2. derive a stable idempotency key from the business event, not only a transport
   attempt;
3. atomically record processed/in-progress state with the side effect where possible;
4. classify a timeout or connection loss as an ambiguous outcome before retrying; and
5. expose a safe, audited replay path for events that failed after partial work.

For database consumers, use an inbox/outbox or transactionally guarded write. For
Lambda, do not rely on warm-container memory for deduplication. For HTTP/API
destinations, persist the event ID and tenant state before acknowledging a successful
side effect. For a non-idempotent external provider, add a provider idempotency key
or a reconciliation job before enabling replay.

## Archives and replay

Archive only the event subset and retention period that support a real recovery,
audit, migration, or testing requirement. Archives can contain tenant and personal
data; define access, KMS, retention, deletion, export, and legal-hold behavior.

Before replay:

- identify the source bus, time range, rules/targets, schema versions, and replay
  operator;
- decide whether replay is isolated, target-limited, or allowed to produce real
  side effects;
- make consumers replay-safe and observe `replay-name`/replay metadata;
- throttle the replay to downstream capacity and avoid collision with live traffic;
- verify ordering assumptions—replay is not a guarantee of original insertion order;
  and
- compare event count, target invocations, failures, DLQ, and business outcomes.

EventBridge archives are tied to their source bus, and replay is routed back to that
bus. Do not assume an archive is a cross-Region backup or that an archive replay can
restore a database without application-specific reconciliation.

## Global endpoints and failover

Use a global endpoint when the business requires regional event-ingress failover and
can operate a secondary Region. Replicate events and configure the secondary
consumer path so failover is tested continuously rather than only during an
incident. Use an immutable application event ID because transport event IDs can
change across API calls/Regions, and make consumers idempotent for both replication
and failback.

Align `PutEvents` and target limits across Regions. Health-check only publisher/
ingress dependencies that should cause an event-ingress failover; a single failed
subscriber should not force all publishers to the secondary Region. Test primary
outage, secondary processing, recovery, failback, duplicate events, and partial
regional degradation.

## Pipes and Scheduler recovery

Pipes have source/target-specific delivery and failure behavior. Inspect source
checkpoint/visibility, filtering, enrichment failure, target retry, and error
handling. Use a DLQ or source-native retention where supported, and ensure enrichment
does not make a previously replayable event depend on mutable state without a
fallback.

Scheduler should have explicit retry limits, maximum event age, flexible time window,
execution role, target timeout, and failed-invocation retention. Use idempotency for
one-time schedules: a scheduler retry or operator retry must not create two invoices,
emails, or tenant-provisioning operations.

## Observability and cost

Instrument publisher request/entry failure, matched/triggered/throttled rules,
ingestion-to-invocation latency, target failure/retry, DLQ count/age, archive bytes,
replay progress, and downstream processing duration. Use correlation IDs and
redacted structured logs; avoid an unbounded tenant ID metric dimension.

Budget alarms for event volume, invocation spikes, loops, cross-Region transfer,
archive storage, replay, API destinations, and downstream compute. A pattern that
matches a newly added event type can create both user impact and unexpected cost.
