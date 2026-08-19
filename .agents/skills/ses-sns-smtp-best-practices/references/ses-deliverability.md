# SES deliverability and sending playbook

## Identity and DNS

Keep identities, DNS, and sending authorization in the same Region/account model as
the application. Prefer a verified domain for application sending and use distinct
subdomains for transactional, marketing, R&D, and other reputationally different
streams when the business requires separation.

Before increasing volume, verify:

- the From/Sender identity is verified in the send Region;
- Easy DKIM or BYODKIM produces an aligned DKIM signature;
- a custom MAIL FROM subdomain has the required MX and SPF records when envelope
  alignment or bounce routing requires it;
- the domain's DMARC policy and alignment mode match the actual From, DKIM, and MAIL
  FROM domains; and
- the receiving mailbox for the custom MAIL FROM domain is deliberately configured.

Do not let an end user choose an arbitrary From, Sender, Return-Path, or raw header.
Use an allow-listed identity and a server-owned template/header policy. If one tenant
needs its own From domain, make domain verification and sending authorization an
explicit onboarding state; do not treat a DNS record supplied by the tenant as proof
that the tenant is allowed to use another tenant's identity.

## Sandbox and production

SES sandbox status and sending quotas are Region-specific. New accounts are normally
restricted to verified recipients and low sending limits. Request production access
with a clear transactional/marketing use case, website/contact details, verified
identity, consent process, and bounce/complaint workflow before a production launch.

Use the SES mailbox simulator for bounce, complaint, delivery, and other supported
test outcomes. Keep simulator traffic separate from business analytics so test
events cannot suppress or degrade real recipients.

## API sending

For AWS-native application code, prefer the SES v2 API/SDK. Keep SDK clients outside
Lambda handlers when the runtime allows it, but keep recipient, tenant, template
variables, and correlation data invocation-scoped. Bound recipient count, body/HTML
size, attachments, template data, concurrency, and queue depth.

Use a configuration set on every production send. Add only bounded, non-sensitive
message tags such as `environment`, `mail_class`, `template_version`, and a
non-PII internal correlation ID. Avoid putting recipient addresses, message content,
secrets, or high-cardinality unbounded user data into tags or logs.

Treat send status as an asynchronous state machine:

```text
queued → submitted/accepted → delivered
                         ├── bounced
                         ├── complained
                         ├── rejected/rendering-failed
                         └── delivery-delayed → delivered or failed
```

The exact event sequence is provider- and recipient-dependent. Persist the internal
send intent before the external call, store the SES message ID and correlation ID,
and make event updates idempotent. A network error after the API call or SMTP `250`
may leave the accepted state unknown; do not blindly resend a security-sensitive or
financial message.

## Feedback and suppression

Configure event publishing to the smallest useful destination set: CloudWatch for
operational metrics, SNS/EventBridge for control-plane reactions, Firehose for
analytics, or a combination with clear ownership. Monitor send, delivery, bounce,
complaint, reject, rendering failure, and delivery-delay rates separately.

Maintain an application-level recipient state in addition to the SES account or
tenant suppression list. A permanent bounce or complaint should stop future sends
unless an authorized remediation flow explicitly clears it. A temporary delivery
delay should follow bounded retry policy and should not immediately mark the address
permanently invalid.

For marketing mail, maintain consent and unsubscribe state. For transactional mail,
still avoid unsolicited content and provide the product-appropriate preference and
support path. Do not use a successful SES send response as evidence that consent or
deliverability is valid.

Use tenant-level suppression where supported and useful, but enforce tenant identity
and entitlement before reading or modifying suppression state. A suppression list is
a delivery safety mechanism, not an authorization system.

## SMTP operational contract

SES SMTP credentials are unique to a Region and are distinct from AWS secret access
keys. Keep them in Secrets Manager or an approved secret store, grant access only to
the SMTP sender, and rotate by deploying the replacement before revoking the old
credential. Never derive or store SMTP credentials in source, a frontend bundle,
logs, URLs, or error messages.

The SES SMTP endpoint requires TLS:

- STARTTLS uses a submission port supported by the client, such as 587 or 2587;
- TLS Wrapper uses a TLS-first port supported by the client, such as 465 or 2465;
- port 25 can be subject to EC2 throttling and should not be the default application
  choice; and
- the client must validate the server certificate and reject a downgrade or
  plaintext fallback.

Bound connect, greeting, TLS, AUTH, command, message, idle, and total operation
timeouts. Use a bounded connection pool where connection reuse helps, with maximum
concurrency and lifetime. Exponential backoff with jitter is appropriate for
transient 4xx/provider throttles; permanent 5xx/auth/identity errors need correction,
not repeated retries.

## Quotas, reputation, and cost

Quotas are Region-specific and may be adjustable, but a quota increase is not a
deliverability strategy. Use a queue and measured rate limiter, reserve capacity for
password resets and other critical transactional mail, and separate marketing
bursts from transactional traffic when reputation or latency requires it.

Monitor sending rate, quota utilization, throttles, bounce/complaint rates, delivery
delay, queue age, template/rendering failures, and cost. Dedicated IPs or IP pools
are a workload/reputation decision, not an automatic performance improvement; use
them only with enough sustained, consistent volume and an operational plan.
