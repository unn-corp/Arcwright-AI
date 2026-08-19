# S3 security and data-protection playbook

- Object Ownership: prefer Bucket owner enforced and no ACL dependency.
- Public exposure: keep Block Public Access enabled at organization/account/bucket
  levels, review access points and endpoint policies, and document any exception.
- Encryption: verify default and per-write behavior, KMS key policy/grants, and
  S3 Bucket Keys trade-offs. Default encryption does not rewrite existing objects.
- Transport/identity: require TLS, short-lived roles/presigned URLs, exact resource
  ARNs/actions, and conditions for account/org/VPC/encryption where needed.
- Recovery: versioning, noncurrent/delete-marker lifecycle, Object Lock mode and
  retention, isolated replication destination, restore drills, and RPO/RTO.
- Replication: versioning on both sides, least-privilege role/KMS permissions,
  existing-object plan, delete-marker semantics, and pending/failed monitoring.
- Events/logs: at-least-once idempotent consumers, protected same-Region destinations,
  CloudTrail data events when audit detail is required, and non-public log storage.
