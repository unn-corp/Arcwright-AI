# S3 review checklist

## Scope and evidence

- [ ] Bucket/account/Region, data classes, producers/consumers, preserved behavior, and recovery goals are identified.
- [ ] Request/object-size distribution, growth, KMS, lifecycle, replication, event, and cost evidence is recorded or marked unknown.

## Access and protection

- [ ] Bucket owner enforced/Object Ownership, ACL posture, Block Public Access, bucket/access-point policies, and endpoint conditions are reviewed.
- [ ] Public, insecure, wildcard, cross-account, and long-lived-credential paths are denied or explicitly justified.
- [ ] Encryption, KMS permissions, write headers, existing-object re-encryption, and logging/audit requirements are clear.
- [ ] Versioning, Object Lock, lifecycle, delete markers, replication, restore tests, and RPO/RTO match the data class.

## Correctness and performance

- [ ] Conditional writes, checksums, multipart retry/resume/abort/complete, and idempotency are tested where applicable.
- [ ] Lists paginate; full scans use Inventory/catalog/batch; concurrency and retries are bounded.
- [ ] Events are treated as at-least-once/unordered and consumers deduplicate, retry, and quarantine failures.

## Cost and operations

- [ ] Storage class/lifecycle thresholds account for minimum durations, retrieval, small objects, and restore cost.
- [ ] Replication, KMS, request, transfer, logging, Inventory, and monitoring costs are included.
- [ ] IaC plan/lint cannot unexpectedly replace/delete a bucket or weaken retention/public-access controls.
