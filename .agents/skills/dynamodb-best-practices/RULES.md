# dynamodb-best-practices — Quick Rules

> Load full `SKILL.md` for the review or design procedure.

- Trigger for DynamoDB, AWS data persistence, CDK tables/indexes, or Strands database tools.
- Start with repository/deployed evidence and an access-pattern matrix.
- Judge keys from access patterns, cardinality, skew, growth, and workload—not entity names.
- Prefer bounded `GetItem`/`Query`; justify every application `Scan`.
- Check GSI projection, write amplification, eventual consistency, and hot-key risk.
- Check conditions, concurrency, idempotency, retries, pagination, serialization, and limits.
- Treat model arguments and stored content as untrusted; trusted context controls tenant and operation.
- Use least-privilege IAM scoped to table, index, and stream resources.
- TTL is asynchronous cleanup, not a deadline, lock, or erasure guarantee.
- Preserve key/write/read/stream/TTL/IAM contracts unless change is explicit.
- Classify proposals as additive, behavior-changing, or migration-required.
- Default reviews to read-only; never silently run writes, deletes, backfills, or replacements.
- Prefer compatibility layers, idempotent backfills, canaries, verification, and rollback.
- Report evidence, severity, trade-offs, validation, unchanged behavior, and open questions.

## Red Flags

- “It has a GSI/TTL/Streams, so it is best practice.”
- “On-demand capacity prevents throttling.”
- “Single-table design always wins.”
- “The model can choose the table or expression.”
- “`cdk diff` proves the migration is safe.”
