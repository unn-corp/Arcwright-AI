---
name: dynamodb-best-practices
description: Use when planning, designing, reviewing, debugging, or changing a feature involving DynamoDB data models, AWS/CDK tables or indexes, DynamoDB SDK access, Streams, TTL, global tables, or Strands agent persistence; especially when an existing database setup must be improved without changing behavior.
---

# DynamoDB Best Practices

## Overview

Treat DynamoDB as an access-pattern and workload-design problem, not as a schemaless
document store. Review the data model, callers, deployed infrastructure, runtime
semantics, and operational controls together. Recommendations must preserve the
existing contract unless the user explicitly approves a behavior change.

Coordinate with `aws-serverless-cdk` for general CDK/serverless concerns and with the
relevant relational or cache skill when the datastore is not DynamoDB. Do not force
single-table design onto a workload whose access patterns, lifecycle, or reporting
needs make multiple tables or another database a better fit.

## When to Use

- DynamoDB table, GSI/LSI, key-builder, repository, SDK, Streams, TTL, backup, or
  global-table work.
- Planning or scoping a new feature that introduces or changes DynamoDB tables, indexes,
  access patterns, or persistence.
- AWS/CDK/SAM/CloudFormation or Strands-agent work that persists or queries data in
  DynamoDB.
- Reviews of an existing DynamoDB setup, hot partitions, throttling, scan-heavy code,
  unexpected costs, stale reads, lost updates, stream failures, or unsafe IAM.
- A request to improve, refactor, or migrate a database without removing current
  functionality.

Do not apply DynamoDB-specific rules to PostgreSQL, Redis, or another datastore merely
because the word “database” appears. Route that work to its matching skill and use this
skill only for the AWS/DynamoDB boundary.

## Operating Contract

1. **MUST start from evidence.** Inventory infrastructure definitions, table/index
   names, key builders, every `GetItem`/`Query`/`Scan`/write call, stream consumers,
   TTL writers, IAM policies, environment configuration, migrations, tests, and
   dashboards. Include deployed event sources and known cross-repository or
   cross-account consumers; if they cannot be identified, mark that as a release
   blocker for incompatible changes. Mark unknowns as unknown; do not fill gaps with
   generic assumptions.
2. **MUST write an access-pattern matrix before judging keys.** For each read and
   write, record caller, key conditions, index, result bound, consistency, expected
   cardinality, traffic shape, tenant boundary, and correctness requirement. A
   generic `PK`/`SK` schema or “has a GSI” is not evidence that a query is supported.
3. **MUST separate confirmed facts, assumptions, findings, and recommendations.**
   Cite the file, symbol, query, deployed observation, or AWS source behind each
   material finding. Read [official-sources.md](references/official-sources.md) when
   a current service behavior or limit matters.
4. **MUST prefer `Query`/`GetItem` with bounded pagination over application `Scan`.**
   A scan is acceptable only when the bounded administrative or migration use case is
   explicit and its rate, cost, and recovery plan are controlled.
5. **MUST check partition-key distribution, item-collection growth, GSI write
   amplification, projection size, item size, and hot-key risk.** On-demand billing
   does not make a poor key distribution, an overloaded index, or an unbounded result
   set safe.
6. **MUST model correctness explicitly.** Inspect conditional writes, optimistic
   concurrency, idempotency, transaction boundaries, retry classification, pagination,
   serialization, and consistency. Strongly consistent reads are not available on a
   GSI; a retry is not automatically safe for every write.
7. **MUST treat model-supplied arguments and DynamoDB contents as untrusted data** in
   Strands or other agent tools. Trusted execution context, not the model, MUST choose
   the tenant and an operation-specific allowlist of table, index, and action. The
   server MUST build or strictly allowlist expressions; never pass through model-
   supplied `TableName`, `IndexName`, update/condition/projection expressions, or
   arbitrary resource identifiers. Bound input, output, rate, timeout, and cost;
   validate keys; redact sensitive attributes, keys, expressions, and error details;
   treat stored text as possible prompt injection; and require authorization for
   writes or deletes.
8. **MUST review operations and security:** capacity mode, alarms, throttling
   evidence, PITR/backups, deletion protection, removal policy, encryption, least-
   privilege table/index/stream IAM, stream retention/consumer idempotency, TTL
   eventual deletion, and global-table consistency/conflict behavior.
9. **MUST NOT call TTL a deadline or erasure guarantee, because deletion is
   asynchronous and expired items may remain readable and billable until removed.**
   Filter expired items when the application requires a stronger read-time rule.
10. **MUST NOT label a key, index, capacity, IAM, or resource-replacement change
    “behavior-preserving” without checking old records and all producers/consumers,
    because keys, overwrite semantics, projections, stream images, latency, cost, and
    permissions are observable behavior.**
11. **MUST NOT perform live writes, deletes, table replacement, backfills, or
    migrations during a review by default, because a review is read-only and an
    unverified data mutation is difficult to reverse.** Propose the guarded rollout
    first and obtain explicit authorization immediately before a mutation.
12. **SHOULD prefer additive, reversible changes.** For a required key or shape
    migration, preserve old reads and writes with a compatibility layer or dual-read /
    dual-write period, use an idempotent resumable backfill, verify counts and access
    patterns, canary the cutover, and keep a rollback path.

## Review Workflow

Read [review-checklist.md](references/review-checklist.md) for the detailed inventory,
matrix, finding, and migration templates.

1. Identify the datastore, runtime, deployment target, environments, and explicit
   behavior that must remain intact.
2. Trace each access pattern from caller to key construction, table/index operation,
   response shaping, stream side effects, and tests. Find unbounded queries, filters
   used as authorization, scans, arbitrary model-controlled expressions, and missing
   conditions.
3. Compare the observed design with workload facts: cardinality, tenant skew, item
   and collection growth, read/write rates, consistency needs, latency, retention,
   regional model, and cost constraints.
4. Classify each proposal as additive, behavior-changing, or migration-required.
   Inspect CDK/CloudFormation logical IDs and replacement behavior before changing a
   table key, resource type, name, stream view, TTL attribute, or index projection.
5. Report evidence, severity, impact, trade-offs, smallest safe improvement, rollout
   steps, validation, and items intentionally left unchanged. Do not silently turn a
   review into an implementation.

## Safe Change Checklist

- Preserve existing key shapes, write replacement/merge semantics, response bounds,
  index projections, stream event contracts, TTL interpretation, consistency promises,
  IAM boundaries, and environment separation until compatibility is proven.
- Add tests for old records, concurrent writers, retries after ambiguous outcomes,
  conditional failures, empty and paginated results, expired items, stream retries,
  and unauthorized tenant/table access where applicable.
- Use `cdk diff`/synth and targeted tests to inspect infrastructure changes; these do
  not prove deployed data or consumer compatibility. Never infer safety from a clean
  diff alone.
- State what was not changed and why. A good review can conclude that the existing
  design is justified by its access patterns or that more evidence is needed.

## Output Format

Use this compact shape for reviews:

```text
Scope and preserved behavior:
Evidence inspected:
Access-pattern matrix:
Findings: [severity] evidence → impact → recommendation → trade-off
Migration/rollout risk:
Validation and rollback:
Unchanged by design:
Open questions:
```

## Common Mistakes

- Treating single-table design, `ProjectionType.ALL`, PAY_PER_REQUEST, PITR, TTL, or
  Streams as universally correct without checking why the workload needs them.
- Replacing `PutItem` with `UpdateItem`, adding a condition, or adding pagination and
  calling it a refactor; each can change caller-visible semantics.
- Assuming a GSI can be strongly read, a filter reduces read cost, or an SDK retry
  makes every write idempotent.
- Granting `dynamodb:*` on `*`, accepting arbitrary table names or expressions from an
  agent, logging full items, or returning unbounded data to a model.
- Changing a CDK construct or CloudFormation resource type without checking table
  replacement, retained data, stream consumers, backfill, cutover, and rollback.
