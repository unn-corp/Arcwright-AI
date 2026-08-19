# EventBridge security, tenants, and R&D

## IAM and bus policies

Separate publisher, bus administrator, rule manager, target execution, archive/
replay operator, and incident redrive roles. Grant only the actions and bus/rule/
target ARNs needed. Keep production replay and cross-account routing behind an
explicit, audited operator role.

Use event-bus resource policies for cross-account ingress and IAM roles for
cross-account event-bus targets. Restrict principals by account or Organization and
conditions such as source account, rule ARN, organization ID, Region, or tags where
supported. Avoid granting all accounts `events:PutEvents` or allowing a publisher to
manage rules/targets.

Review the complete chain:

```text
publisher role → source bus policy → rule pattern → target role/resource policy
             → KMS key / secret / network → target handler authorization
```

A broad bus policy can still be dangerous even when the target role is narrow: an
attacker may fill the bus, trigger an expensive target, or exploit a pattern that
was not designed for untrusted events. Conversely, a narrow bus policy is not enough
if a target accepts an arbitrary tenant or resource from event detail.

## Encryption and sensitive events

Use KMS encryption for event buses/archives and target queues where event sensitivity,
tenant contract, or policy requires it. Verify service-principal key permissions,
cross-account grants, rotation, and restore/replay access. Minimize event detail:
publish IDs and authorized references rather than credentials, access tokens, raw
email bodies, payment data, or full customer records. Protect object-backed detail
with a scoped role, encryption, integrity check, and expiry/version policy.

Use HTTPS/TLS for API destinations and webhook targets. Store API destination
connections/secrets in the supported managed connection or secret mechanism, rotate
them without losing scheduled work, and keep credentials out of event payloads and
URLs. Log event IDs and failure classes, not the full event by default.

## Multi-tenant isolation

Resolve the authenticated principal to tenant and event capabilities before
publishing. The following values are untrusted until checked against a server-owned
tenant catalog: event `tenantId`, source, bus ARN, rule name, target ARN, archive,
replay range, schedule, and destination.

For pooled buses:

- validate tenant status and membership at the publisher/API boundary;
- include tenant context in the event envelope and protected idempotency state;
- require consumers to validate tenant/source/schema again;
- use filters only to reduce fan-out, never as the only security boundary;
- include tenant in deduplication keys so two tenants cannot collide on the same
  business identifier; and
- impose per-tenant publish, event-size, fan-out, target-concurrency, archive, and
  replay quotas.

For bridge/silo models, dedicate buses, accounts, KMS keys, roles, archives, or
target stacks according to the actual isolation contract. A tenant-specific bus with
a shared operator role or shared archive may still permit cross-tenant access. Keep
support/admin cross-tenant operations on a separate audited path.

## R&D boundary

Prefer a separate AWS account for R&D. If that is not practical, use separate
EventBridge buses, event source names, IAM roles, KMS keys, archives, API
destination connections, secrets, and deployment state. Reject production account,
Region, bus, target, and archive ARNs from R&D configuration at startup and in CI.

Use synthetic or approved masked events. Do not replay production archives into R&D
without sanitization, access approval, retention rules, and a clear determination of
whether tenant/personal data remains. Test R&D with a cohort that includes normal,
large/skewed, suspended, deleted, cross-tenant, invalid-schema, replayed, and
noisy-neighbor tenants.

R&D validation should cover:

- positive and negative event patterns;
- publisher authorization and invalid tenant/source rejection;
- cross-account policy denial;
- target role/KMS/secret access;
- loop guard and quota alarms;
- duplicate/out-of-order/replay idempotency;
- DLQ/redrive authorization and tenant preservation; and
- global endpoint or secondary-Region behavior if production uses it.

Promote schemas, patterns, IaC, handlers, dashboards, tests, and runbooks—not R&D
events, archives, secrets, or tenant data. Canary a representative tenant or bus
partition and keep a rollback/disable-rule path ready before broad enablement.
