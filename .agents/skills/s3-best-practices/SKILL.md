---
name: s3-best-practices
description: Use when planning, implementing, deploying, debugging, or reviewing Amazon S3 buckets, object keys, IAM/bucket policies, encryption, versioning, lifecycle, replication, multipart uploads, events, notifications, data protection, or S3 performance and cost.
---

# S3 best practices

Treat S3 as a durable object-data contract with separate concerns for access,
integrity, retention, lifecycle, event delivery, performance, and cost. Start with
the access patterns and recovery requirements; then choose bucket settings and
client behavior that preserve those invariants.

## Operating contract

- Inventory the bucket, Region, account/organization boundary, object classes and
  prefixes, producers/consumers, public/private posture, encryption keys, lifecycle,
  versioning/Object Lock, replication, notifications, logging, and IaC owner.
- Start from evidence. Use request metrics, object-size distribution, list/read/write
  patterns, KMS usage, lifecycle transitions, replication status, event failures,
  storage growth, and recovery objectives when available.
- Keep facts, assumptions, findings, and recommendations separate. S3 strong
  consistency does not make a workflow transactional, a notification exactly-once,
  or versioning a backup.
- Reviews are read-only by default. Do not delete objects, change bucket policies,
  rotate keys, alter retention, enable replication, or publish notifications during
  a review unless that exact mutation is authorized.
- Never put credentials, presigned URLs, customer data, object contents, or raw event
  payloads into hook output, logs, build artifacts, or committed configuration.

## Choose the mode

### Planning

Define data classes, access patterns, freshness, retention, recovery point/time,
compliance, and cost constraints. Propose bucket/prefix/key, IAM, encryption,
lifecycle, replication, upload, event, and observability choices with validation and
rollback paths.

### Implementation

Make the smallest evidence-backed change. Check account-level controls, Region,
existing versions/delete markers, replication implications, KMS permissions, and
irreversible retention settings before applying it. Validate with non-production
objects where possible.

### Review

Read [references/review-checklist.md](references/review-checklist.md) and report
severity, evidence, security/correctness/performance/cost/recovery impact, smallest
safe improvement, trade-offs, validation, rollback, unchanged behavior, and unknowns.

## First-pass inventory

Search for and inspect, as applicable:

- bucket definitions and policies in CDK, CloudFormation, Terraform, Pulumi,
  Serverless, Amplify Storage, or deployment scripts;
- Object Ownership, ACLs, all Block Public Access controls, bucket policy,
  access-point policy, VPC endpoint policy, identity policy, and cross-account
  principals/conditions;
- default encryption, SSE-S3/SSE-KMS/DSSE-KMS, KMS key policy/grants, S3 Bucket
  Keys, TLS requirements, and whether encryption is required on every write;
- versioning, delete markers, Object Lock mode/retention/legal holds, lifecycle
  rules, noncurrent versions, incomplete multipart uploads, and delete permissions;
- key naming/prefixes, object-size distribution, GET/HEAD/LIST/PUT/DELETE patterns,
  pagination, conditional writes, checksums, multipart upload/resume/abort, and
  presigned URL behavior;
- replication source/destination versioning, role and KMS permissions, existing
  object coverage, delete-marker behavior, RTC/metrics, and failure handling;
- event types/destinations/filters, retry and deduplication behavior, same-Region
  constraints, queue buffering, and recursion/loop risks; and
- CloudTrail object data events, server access logging, Inventory, Storage Lens,
  Config rules, alarms, retention, and protected log destinations.

If a deployed fact cannot be inspected, mark it unknown. Do not infer it from an
IaC definition alone.

## Access and security baseline

- Prefer Bucket owner enforced Object Ownership and disable ACLs for new buckets.
  Keep all four S3 Block Public Access settings enabled at the organization,
  account, and bucket levels unless a documented, reviewed public exception exists.
- Keep buckets private by default. For CloudFront delivery, use Origin Access
  Control and a bucket policy scoped to the distribution; do not make the bucket
  public as a shortcut. Coordinate with `cloudfront-best-practices`.
- Use least-privilege identity/resource policies: exact bucket/object ARNs,
  required actions only, and conditions such as organization, VPC endpoint, source
  account, or required encryption headers where appropriate. Avoid `Principal: *`,
  `s3:*`, public write, and long-lived access keys.
- Require TLS with a deny on insecure transport where it matches the access model.
  Use short-lived role credentials or presigned URLs with deliberate expiry and
  scope; never put secrets in object keys or query parameters by accident.
- Choose bucket names as if they may be visible. Names are globally unique and can
  be reused after deletion; do not put secrets in them and verify references before
  deleting/recreating a bucket.

## Encryption, durability, and recovery

- Verify default encryption and the required write path. SSE-S3 is the baseline for
  most data; choose SSE-KMS or DSSE-KMS when customer-managed keys, audit, separation
  of duties, or compliance requires it. Ensure producers, consumers, key policy, and
  grants agree.
- Default encryption applies to new writes; it does not re-encrypt existing objects.
  Plan a measured rewrite when an existing dataset needs a different encryption
  posture. Use S3 Bucket Keys when they reduce KMS request volume without violating
  the audit/key-isolation requirement.
- Enable Versioning when recovery from overwrite/delete, replication, or rollback
  requires it. Pair it with lifecycle rules for noncurrent versions and delete
  markers; versioning is not an independent backup or cross-Region recovery plan.
- Use Object Lock only for deliberate WORM requirements. Choose Governance vs
  Compliance mode, retention, legal holds, privileged bypass, and recovery/testing
  procedures explicitly; retention can be difficult or impossible to shorten.
- For backup/DR, define destination account/Region isolation, replication coverage,
  existing-object handling, KMS permissions, delete-marker policy, restore tests,
  RPO/RTO, and monitoring. Replication is asynchronous and does not replace restore
  validation.

## Correctness and integrity

- Use S3's strong read-after-write consistency, but do not add sleeps to compensate
  for a stale-read model. Strong consistency does not provide transactions,
  multi-object atomicity, conflict resolution, or protection against last-writer
  wins.
- Use conditional writes for coordination: `If-None-Match: *` for create-only and
  `If-Match` with a known ETag for compare-and-swap. Handle `412`/`409` explicitly
  and use application-level idempotency for retries.
- Use SigV4 and checksums for upload integrity. Do not assume a multipart or encrypted
  object's final ETag is a universal MD5 checksum.
- For multipart uploads, use an SDK transfer manager or bounded parallelism, choose
  part sizes from object size and retry behavior, record upload IDs/part state for
  resume, complete with the explicit part manifest, and abort incomplete uploads.
  Test cancellation and partial failure.
- Treat event notifications as at-least-once and potentially out of order. Use a
  durable queue/buffer, deduplicate with an object/version/event identity, make
  consumers idempotent, and handle poison messages. Prevent notification loops.

## Key design, listing, and performance

- Use stable, URL-safe keys with a predictable logical prefix. Choose prefixes for
  ownership, lifecycle, tenant/data class, and operational queries—not for obsolete
  random-hash partitioning advice.
- Use `ListObjectsV2` with continuation tokens and a bounded page size. Never assume
  one response contains all keys or perform an unbounded list on a request path.
  Use S3 Inventory, a catalog, or a batch process for full-bucket scans.
- Parallelize independent requests with bounded concurrency and reuse SDK clients.
  Avoid serial object-by-object work, unbounded downloads, and repeated HEAD calls
  when metadata can be carried with the workflow.
- Use multipart uploads for large objects based on measured size/network behavior;
  use checksums and retries rather than restarting an entire upload after one part
  fails. Avoid thousands of tiny objects when a different layout would reduce
  request/metadata overhead.
- S3 per-prefix request-rate guidance is not an application SLO. Benchmark the
  actual workload, watch `503 Slow Down`, and scale concurrency gradually with
  retries/backoff.
- For CloudFront/static UI delivery, keep objects private behind OAC, set explicit
  content type/cache-control, use immutable names where appropriate, and coordinate
  invalidation/versioning with `cloudfront-best-practices`.

## Lifecycle, storage class, and cost

- Model storage, PUT/GET/LIST, retrieval, transition, replication, KMS, logging,
  Inventory, data transfer, and restore costs together. Recheck current prices;
  do not hard-code them in a recommendation.
- Add lifecycle rules for current objects, noncurrent versions, delete markers,
  incomplete multipart uploads, and data classes that have different retention.
  Verify filters do not overlap unexpectedly and that transitions meet minimum
  object-size, duration, and retrieval constraints.
- Choose Standard, Intelligent-Tiering, Standard-IA, One Zone-IA, and archive
  classes based on access frequency, recreatability, availability, minimum storage
  duration, retrieval latency, and recovery requirements. One Zone-IA is for data
  that can be recreated or has another durable copy.
- Treat small-object transitions and frequent retrievals skeptically. Compare a
  measured cost model before moving hot or tiny objects to an archive/IA class.

## Replication, events, and observability

- Replication requires versioning on source and destination and an IAM role with
  the exact read/write/KMS permissions. It is asynchronous; monitor pending,
  failed, and replicated-byte metrics. Existing objects generally need an explicit
  Batch Replication plan.
- Scope notifications with non-overlapping event/prefix/suffix filters. Send to a
  durable same-Region destination with least-privilege resource policies. Use
  EventBridge when the workflow needs richer routing or FIFO-style downstream
  integration; direct S3 notifications are not FIFO.
- Use CloudTrail object-level data events when auditability requires request detail.
  Treat server access logging as best-effort operational evidence, and protect log
  destinations from public access and accidental lifecycle deletion.
- Use Inventory, Storage Lens, Config rules, CloudWatch metrics, alarms, and restore
  drills to detect drift, public exposure, version growth, failed replication,
  incomplete uploads, and cost surprises.

## Validation gate

Before calling a change complete, run the checks that fit the repository:

1. Prove the intended access matrix: allowed producer/consumer actions, denied
   public/insecure access, cross-account/VPC conditions, and CloudFront-only reads.
2. Inspect encryption on a new object, required checksum/conditional-write behavior,
   version/delete-marker behavior, and Object Lock retention if present.
3. Test paginated listing, concurrent bounded reads/writes, multipart retry/resume/
   abort/complete, and idempotent event consumption.
4. Verify lifecycle with representative object sizes/tags and inspect replication
   status, existing-object coverage, delete markers, and KMS failures.
5. Run the repository's IaC linter/plan and check that changes do not destroy data,
   bypass Block Public Access, replace a bucket unexpectedly, or weaken retention.
6. Compare request latency/error rates, KMS requests, storage/request/retrieval
   costs, event lag, and recovery results against the stated baseline.

## Review output

Use this compact shape:

```text
Scope / buckets / data classes / preserved behavior:
Evidence and unknowns:
Access, encryption, retention, and recovery baseline:
Findings:
  [severity] evidence → impact → smallest safe improvement → trade-off
Plan or rollout:
Validation / metrics / restore test / rollback:
Unchanged by design:
Open questions:
```

## References

- [Performance and integrity](references/performance-and-integrity.md) — read for
  consistency, conditional writes, multipart, key design, and request behavior.
- [Security and data protection](references/security-and-data-protection.md) — read
  for Object Ownership, Block Public Access, encryption, versioning, Object Lock,
  replication, and policy review.
- [Review checklist](references/review-checklist.md) — read for a codebase or bucket
  audit.
- [Official sources](references/official-sources.md) — use when a current AWS
  behavior, limit, default, or price matters.
