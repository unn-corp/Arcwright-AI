# DynamoDB Review Checklist

Use this reference for an existing setup, a performance investigation, or a change that
must preserve current behavior. Keep the review read-only until the user explicitly
authorizes a mutation.

## 1. Inventory

Search the repository for:

- CDK, SAM, Terraform, CloudFormation, Serverless Framework, or custom resource table definitions.
- Table names, ARNs, environment variables, key builders, entity/item type tags, and serialization helpers.
- `GetItem`, `BatchGetItem`, `Query`, `Scan`, `PutItem`, `UpdateItem`, `DeleteItem`, batch writes, and transactions.
- GSI/LSI names, projection settings, `FilterExpression`, `ProjectionExpression`, `ConsistentRead`, `Limit`, and `LastEvaluatedKey`.
- Stream event sources, filters, checkpoint/retry settings, dead-letter handling, and consumer tests.
- TTL writers/read filters, backup/PITR/deletion protection, alarms, dashboards, capacity settings, and IAM.
- Backfill/migration scripts, deploy templates, logical IDs, fixtures, snapshots, and old-version compatibility code.
- Deployed event sources, scheduled jobs, stream consumers, and known cross-repository,
  cross-account, or external clients. Unknown consumers are a release blocker for an
  incompatible change until ownership and compatibility are established.

Also inspect call sites and tests. A table construct alone cannot reveal the real access
contract.

## 2. Access-Pattern Matrix

Create one row per operation:

| Caller / use case | Operation | Table/index | Key condition | Result bound/page | Consistency | Traffic/cardinality | Tenant/auth | Side effects |
|---|---|---|---|---|---|---|---|---|
|  |  |  |  |  |  |  |  |  |

Flag rows with no key condition, unbounded results, a filter standing in for a key,
unknown tenant ownership, strong consistency requested on a GSI, or a missing retry /
conditional-write decision. Record the evidence and the missing assumption; do not call
the design wrong solely because the schema is unfamiliar.

## 3. Finding Categories

### Data model

- Key distribution and cardinality; hot partition or hot item risk; collection growth.
- Sort-key ordering and prefixes; denormalization and adjacency-list trade-offs.
- Whether single-table, multiple-table, or another datastore fits the actual access patterns.
- GSI/LSI key fit, sparse-index intent, index overloading/sharding, projection size, and write amplification.
- Item size, large attributes, sensitive fields, and S3/reference options.

### Runtime correctness

- Query vs. Scan, filter cost, pagination, result limits, projection, and consistency.
- Conditional writes, optimistic versioning, transaction scope, duplicate/retry behavior, and lost updates.
- SDK client reuse, retry/backoff classification, batch unprocessed items, marshalling, decimals/sets/binary values, and error mapping.
- For agent tools: trusted tenant context; operation-specific table/index/action
  allowlists; server-built or strictly allowlisted expressions; bounded input,
  output, rate, timeout, and cost; validation; redaction of attributes, keys,
  expressions, and errors; stored-data prompt-injection resistance; and explicit
  write/delete authorization.

### Operations, security, and cost

- On-demand vs. provisioned/auto scaling against measured workload and cost; GSI capacity and index storage.
- Throttling reasons, table/index CloudWatch metrics, Contributor Insights, alarms, and load-test evidence.
- PITR/on-demand backups, restore plan, deletion protection, `RemovalPolicy`, encryption/KMS, tags, and environment isolation.
- Stream view/retention, PII exposure, ordering assumptions, idempotent consumers, retries, partial failure, and replay.
- TTL epoch-seconds input, read-time filtering, asynchronous deletion, and global-table replicated-delete cost.
- Global-table consistency mode, conflict policy, Region routing, replication lag, and CloudFormation ownership.
- IAM actions scoped to exact table/index/stream resources; no broad wildcard access.

## 4. Behavior-Preservation Contract

Before proposing a change, write down which of these must remain unchanged:

- Existing item keys, entity prefixes, overwrite/merge/delete semantics, conditional failures, and response shape.
- Query/index results, ordering, pagination tokens, result limits, consistency, latency expectations, and cost envelope.
- Stream view type, event shape, event ordering assumptions, consumer side effects, retry behavior, and replay window.
- TTL meaning, expiration filtering, retention policy, table name/ARN, logical ID, backups, encryption, IAM, and environment boundaries.

Classify the proposal:

| Class | Meaning | Required treatment |
|---|---|---|
| Additive | Existing callers/data remain valid; new path is optional | Add tests, alarms, and rollback; prove no resource replacement and that latency, cost, IAM, stream behavior, and operational load remain within the preserved contract |
| Behavior-changing | Existing success/failure, data, timing, cost, or permission semantics change | Call it out and obtain explicit approval |
| Migration-required | Old keys/schema/resource cannot serve both versions safely | Design compatibility, idempotent backfill, cutover, verification, and rollback before implementation |

Changing a primary key or CloudFormation resource type is migration-required unless a
documented deployed-state inspection proves the exact resource is not replaced and
the data, access, and operational contracts are unchanged. A clean `cdk diff` alone
is never migration proof.

## 5. Safe Migration Shape

1. Snapshot the current contract and ensure PITR/backup/restore is adequate.
2. Add the new representation without removing the old one.
3. Deploy compatibility reads and, where needed, dual writes behind a flag; detect and
   reconcile divergence, deletes, TTL changes, and stream side effects.
4. Backfill in bounded, resumable, idempotent chunks; record progress, failures,
   duplicate/ambiguous outcomes, and any consumer replay or deduplication effects.
5. Verify counts, key coverage, representative queries, permissions, stream consumers,
   TTL behavior, latency, cost, restore recovery, and old-record behavior.
6. Canary the read cutover with measurable abort thresholds, monitor throttling/errors/
   consumer lag, and retain rollback.
7. Remove old paths only after an explicit deprecation window and verified recovery plan.

## 6. Review Output

```text
Scope / environments / preserved contract:
Evidence and unknowns:
Access-pattern matrix:
Findings:
  [severity] [category] evidence → impact → smallest safe improvement → trade-off
Migration or resource-replacement risk:
Validation / monitoring / rollback:
Unchanged by design:
Open questions:
```
