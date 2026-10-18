<!-- Conditional reference. The current SKILL.md and host policy take precedence. Paths are relative to this skill folder. -->

## Operating contract

- Identify the engine and major version first: Aurora PostgreSQL or Aurora MySQL,
  provisioned or Serverless v2, Region(s), cluster topology, writer/readers,
  endpoints, VPC/subnets, parameter groups, and deployment owner.
- Start from evidence. Inspect query plans, database load/waits, connection churn,
  latency/error distributions, CPU/memory/I/O, replica lag, failover duration,
  backup/restore results, ACU/instance utilization, and cost when available.
- Keep facts, assumptions, findings, and recommendations separate. An Aurora
  feature, default, engine extension, limit, or pricing rule is not universal;
  verify it for the engine version and Region.
- Reviews are read-only by default. Do not run destructive DDL, write production
  data, backfill, fail over, restore over an existing database, change retention,
  rotate credentials, or modify a live cluster during a review without explicit
  authorization for that exact mutation.
- Never place passwords, connection strings with secrets, tokens, customer rows,
  private keys, or raw database dumps in hook output, logs, build artifacts, or
  committed configuration.
