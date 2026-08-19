# EventBridge review checklist

## Scope and contract

- [ ] Account/Organization, Region, environment, bus owner, source, event contract/version, target owner, and preserved behavior are identified.
- [ ] Event ID/correlation/tenant context, payload classification/size, schema compatibility, and publisher error handling are explicit.

## Buses, rules, and patterns

- [ ] Bus/default/custom/Pipes/Scheduler choice matches many-to-many, point-to-point, schedule, queue, or workflow semantics.
- [ ] Patterns match source plus detail-type and required detail; account/Region scope is present where remote events are possible.
- [ ] Positive/negative/version/future-field/cross-account/replay fixtures validate every critical pattern.
- [ ] Rules have appropriate ownership, target roles, input transformers, enabled state, and no loop/storm path.
- [ ] One target per rule is used where target contracts, retry, security, or ownership differ.

## Delivery and recovery

- [ ] Target retry maximum age/attempts, concurrency, timeout, and downstream capacity are bounded.
- [ ] Loss-sensitive targets have SQS DLQs with encryption, alarms, owner, retention, poison-event handling, and redrive runbook.
- [ ] Consumers validate source/schema/tenant and are idempotent across duplicate, ambiguous, failover, redrive, and replay outcomes.
- [ ] Archives have filtered scope, retention, access/KMS policy, deletion/legal-hold rules, and a side-effect-safe replay plan.
- [ ] Global endpoints/secondary Regions replicate and process events, align quotas, and test duplicate/failback behavior where used.

## Security and tenancy

- [ ] Publisher, bus, rule, target, archive/replay, scheduler, KMS, secret, and operator permissions are least privilege.
- [ ] Cross-account/Region bus resource policies, target IAM roles, account/Region pattern filters, and organization conditions are explicit.
- [ ] HTTPS/TLS, API destination secret rotation, KMS grants, CloudTrail, and sensitive-event redaction are reviewed.
- [ ] Server-side tenant authorization protects source/bus/rule/target/archive/replay choices; filters are not treated as authorization.
- [ ] Per-tenant publish, fan-out, target, archive, replay, and downstream quotas prevent noisy neighbors.
- [ ] R&D uses separate buses/resources/roles/keys/archives and synthetic or masked events; production archives/credentials are not copied.

## Operations and rollout

- [ ] Metrics/alarms cover PutEvents failures, matched/triggered/throttled rules, target latency/failures, retries, DLQ age, archive/replay, and cost.
- [ ] IaC plan/synth catches broad policies, target replacement, secret/KMS breakage, unexpected cross-account routes, and rule enablement.
- [ ] Rollback/disable-rule, schema migration, replay, DLQ redrive, and incident ownership are documented and tested.
- [ ] Severity is evidence-based with a stop/go condition and recovery path for blocker/high findings.
