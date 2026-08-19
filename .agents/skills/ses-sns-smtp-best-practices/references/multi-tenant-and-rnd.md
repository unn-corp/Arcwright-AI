# Multi-tenant and R&D messaging

Apply this guidance when one SES/SNS integration serves multiple customers,
workspaces, organizations, or environments.

## Tenant boundary

Resolve the authenticated principal to a tenant and authorized capabilities on the
server. A tenant ID, email address, From domain, SMTP username, configuration-set
name, SNS topic ARN, or destination array from a URL/body/header/event is untrusted
until checked against a server-owned catalog and membership policy.

The catalog should record, at minimum:

- immutable tenant ID and lifecycle state;
- allowed sending identities/domains, mail classes, configuration sets, and Region;
- suppression scope and consent/preference state;
- SES/SNS placement, topic/subscription route, quota/rate tier, and data class;
- R&D/production environment and account IDs;
- template/content version and migration status; and
- owner, audit history, and incident/support controls.

Do not let a tenant choose another tenant's verified identity or publish to a shared
topic merely because it knows the ARN. Enforce this at API authorization and in the
publisher/consumer role policy where the AWS resource model allows it.

## Pool, bridge, and silo options

- **Pool:** shared SES identities/configuration sets and SNS topics with tenant
  context in application state. Lowest cost and simplest operations, but the
  strongest need for membership checks, quotas, redaction, and noisy-neighbor
  controls.
- **Bridge:** shared service with tenant/tier-specific identities, configuration
  sets, suppression, IP pools, topics, or SQS consumers. Useful when reputation,
  compliance, or throughput differs by tier while the control plane remains shared.
- **Silo:** dedicated AWS account/Region/identity set/topic/subscriber stack for a
  tenant or tier. Stronger blast-radius and reputation boundaries at higher cost and
  operational complexity. Keep onboarding, versioning, monitoring, and rollback
  unified through a control plane.

Use tenant placement as a deliberate product/operations contract. A per-tenant
configuration set or topic does not automatically isolate credentials, DNS, AWS
account, KMS keys, subscriber code, or operator access.

## Tenant-aware SES sending

- Use an allow-listed mapping from tenant to verified identity and permitted mail
  class. Check the recipient, consent, template, and tenant status before enqueueing.
- Include a bounded, non-sensitive tenant or placement label in internal send state
  and event correlation. Include tenant context in the idempotency/deduplication key
  so identical business IDs in two tenants cannot collide.
- Keep tenant email addresses and message bodies out of SES message tags, SNS
  attributes, topic names, and general metrics. Use redacted logs and controlled
  tenant-level dashboards or a usage table for showback.
- Use tenant-level suppression lists when required, but keep an application
  preference/suppression record so the product can explain why a send was blocked.
  Suppression is regional and must be read/changed only after tenant authorization.
- Bound per-tenant sends, recipients, concurrent SMTP sessions, queue depth, template
  rendering work, and retry budget. Reserve capacity for security and account-critical
  messages so one tenant's campaign cannot starve password resets.
- For high-value or regulated tenants, use a dedicated identity/domain, configuration
  set/IP pool, topic/queue, account, or Region only when the required isolation
  boundary and operational ownership are clear. Do not pay for isolation that is not
  measured or contractually needed.

## Tenant-aware SNS processing

Put tenant context in the validated event envelope, not only in a filter policy. A
consumer must reject or quarantine events whose tenant is missing, inactive, or not
authorized for the consumer's route. Include tenant ID in the deduplication key and
in protected state, not in unbounded metric dimensions.

For pooled topics:

- separate subscriptions by mail class, environment, or service when their retry,
  retention, or authorization contracts differ;
- use filter policies only to reduce fan-out, never as the only tenant security
  control;
- keep one tenant's large workload from consuming all subscriber concurrency or
  downstream rate with per-tenant scheduling/quotas; and
- ensure DLQ redrive preserves the original tenant context and does not bypass the
  normal authorization path.

For bridge/silo topics, verify topic policy, queue policy, KMS key policy, Lambda
execution role, and cross-account trust as one boundary. A dedicated topic with a
shared, over-privileged consumer role is not a complete silo.

## Safe R&D setup

Treat R&D as a non-production messaging laboratory:

1. Prefer a separate AWS account. If that is not practical, use separate SES
   identities/subdomains, SNS topics, SQS queues, KMS keys, secrets, IAM roles,
   configuration sets, and deployment state. Never let R&D credentials publish/send
   through production resources.
2. Use SES sandbox, the mailbox simulator, and approved verified test addresses. Do
   not import production recipient lists, suppression lists, SMTP passwords, API
   keys, or raw email bodies into R&D. Use synthetic tenants and synthetic content.
3. Keep environment labels explicit in configuration-set names, topic names, event
   envelopes, dashboards, and logs. Reject a production identity or topic when the
   runtime environment is R&D, and reject an R&D identity/topic in production.
4. Build an R&D tenant cohort that covers a new tenant, suspended tenant, opt-out,
   hard bounce, complaint, delivery delay, template failure, SMTP timeout, SNS
   duplicate, filtered event, HTTP signature failure, subscriber outage, and DLQ
   redrive.
5. Provision tenants idempotently: create catalog state, verify/attach identity,
   create configuration set/topic/subscriptions, attach policies/DLQs, seed consent
   and suppression fixtures, and mark the route active only after isolation checks.
   Do not make infrastructure provisioning part of a synchronous signup request.
6. Test tenant negative cases through the real API, worker, admin/support path,
   retry/redrive path, and direct AWS role. A user in tenant A must not send as
   tenant B, read tenant B event state, or redrive tenant B's DLQ without an
   explicitly audited support role.

## Promotion and recovery

Promote templates, code, IaC, policies, dashboards, tests, and runbooks—not R&D
messages, recipient data, secrets, or suppression state—into staging/production.
Before promotion, compare Region/account, identities/DNS, DMARC alignment,
configuration sets, quotas, SMTP endpoints, KMS/IAM, topic/queue/DLQ policies,
subscriber versions, event schemas, and tenant mappings.

Test that a tenant can be suspended quickly, suppression propagates without duplicate
sends, a failed subscriber can be redriven safely, and an identity/SMTP credential
can be rotated without losing queued work. SES suppression and SNS retention/DLQ
behavior are not substitutes for application-level records, audit history, or a
tenant export/deletion plan.
