# S3 quick rules

- Use Bucket owner enforced Object Ownership, ACLs disabled, and all four Block Public Access controls by default.
- Keep buckets private; use CloudFront OAC for CDN delivery. Use least-privilege resource-scoped policies and require TLS.
- Verify encryption on new writes; choose KMS/DSSE only when audit or compliance justifies the operational/KMS cost.
- Versioning is recovery help, not a backup. Pair it with noncurrent/delete-marker lifecycle; use Object Lock only deliberately.
- Use checksums, conditional writes, bounded multipart transfers, retries/resume, and abort incomplete uploads.
- Paginate every list; never scan a bucket on a request path. Use Inventory/catalogs for full scans.
- S3 events are at-least-once and unordered. Queue, deduplicate, make consumers idempotent, and prevent loops.
- Model storage, requests, retrieval, transition, replication, KMS, logging, transfer, and restore costs together.
- Reviews are read-only. Do not delete data, weaken access, change retention, or alter replication without explicit authorization.
