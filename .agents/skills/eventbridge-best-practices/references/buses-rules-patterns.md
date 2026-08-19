# Event buses, rules, patterns, and contracts

## Primitive selection

EventBridge event buses are many-to-many routers. They receive events from AWS
services, custom applications, or SaaS partners and evaluate rules against the event
as it arrives. Use a custom bus when domain, environment, account, ownership, or
policy boundaries matter; reserve the default bus for the service events and
integration model that actually require it.

Use EventBridge Pipes for a point-to-point source-to-target path with optional
filtering, enrichment, and transformation. Use a bus when several independent
consumers need the event. Use EventBridge Scheduler for new one-time or recurring
invocations with flexible windows and failed-invocation retention. Use SQS for
durable work buffering and Step Functions for multi-step orchestration/state, even
when EventBridge starts the workflow.

## Event contract

An application event should have an immutable, documented envelope. EventBridge's
standard metadata is useful but is not sufficient as the business contract:

```json
{
  "id": "evt_01J...",
  "source": "com.example.orders",
  "detail-type": "OrderAccepted",
  "time": "2026-08-19T12:00:00Z",
  "account": "123456789012",
  "region": "us-east-1",
  "detail": {
    "schemaVersion": 3,
    "tenantId": "tenant_123",
    "orderId": "order_456",
    "correlationId": "req_789",
    "occurredAt": "2026-08-19T12:00:00Z"
  }
}
```

Keep `source` and `detail-type` stable and owned. Version the business detail when
field meaning or compatibility changes. Use additive evolution where possible,
explicit nullability/units, consumer contract tests, deprecation windows, and a
schema owner. Do not put secrets, credentials, raw access tokens, or unrestricted
personal data in an event merely because EventBridge can route it.

Use a stable business event ID or a publisher-owned ID for idempotency. Event IDs can
change across API calls or regional replication paths, so consumers that need to
correlate a replicated/replayed event need an immutable application identifier.

## Pattern precision

Patterns should match the smallest meaningful event set. Start with `source` and
`detail-type`, then match required `detail` fields. Add `account` and `region` when
events can arrive from other accounts/Regions or when a local rule must not process
remote events. Use content operators deliberately and test their semantics.

For example:

```json
{
  "source": ["com.example.orders"],
  "detail-type": ["OrderAccepted"],
  "account": ["123456789012"],
  "region": ["us-east-1"],
  "detail": {
    "schemaVersion": [3],
    "status": ["accepted"]
  }
}
```

A pattern containing only `source` can begin matching new event types added by a
publisher and invoke a target unexpectedly. A pattern with a broad `detail` shape
can also match state changes that cause a remediation target to emit the same event,
creating an infinite loop. Pattern changes require positive, negative, future-field,
missing-field, replay, and cross-account test fixtures. Validate with the console
Sandbox, `TestEventPattern`, or the `test-event-pattern` CLI command.

## Rules and targets

Rules are independently deployable routing contracts. Prefer one target per rule
when targets have different owners, retry policies, input transforms, permissions,
latency, or data classification. If two consumers currently need the same event,
duplicate the precise rule rather than forcing them into one shared failure/retry
contract.

Configure target input transformers only for a documented target schema. Preserve
the source event ID, schema version, correlation/causation IDs, and tenant context
needed for idempotency and debugging. Do not use a transformer to silently rename or
drop fields during a breaking migration.

Name buses and rules with stable environment/domain ownership, tag them for cost and
operations, and keep the source of truth in IaC. Review disabled/enabled state,
managed rules, target roles, and generated policy diffs. A rule that exists is not
necessarily enabled, and an enabled rule can have a target role or resource policy
that prevents delivery.

## Cross-account and cross-Region

Use a receiver event-bus resource policy to allow only the specified account,
Organization, source, or rule to send. Use an IAM role on event-bus targets and
scope `PutEvents`/target permissions. For a receiver that accepts events from many
accounts, every local rule that should be local-only should include the appropriate
`account` values; otherwise remote events may activate local targets.

Cross-Region routing needs explicit destination support, latency/cost consideration,
duplicate handling, and source/target Region fields. Do not make a broad `*` policy
the shortcut for multi-account onboarding. Use account/Organization conditions,
SCPs, KMS grants, and a catalog of allowed bus routes.

## Loop and storm prevention

Before enabling a remediation or synchronization rule, map the full cycle:

```text
event → rule → target → state change/API call → event → same rule
```

Add an event predicate that matches only the undesired state, a source marker or
version, a bounded retry/circuit breaker, and a cost/invocation alarm. Test an event
that the target emits after success and after failure. EventBridge can deliver
unexpected matches for newly introduced event types; `TriggeredRules`,
`ThrottledRules`, target failures, and ingestion-to-invocation latency should be
visible before production enablement.
