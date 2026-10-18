<!-- Conditional reference. The current SKILL.md and host policy take precedence. Paths are relative to this skill folder. -->

## Engine and topology decisions

- Choose Aurora PostgreSQL vs Aurora MySQL from extension, SQL dialect, driver/ORM,
  operational, and migration requirements. Do not present engine-specific parameters,
  extensions, failover behavior, or SQL examples as interchangeable.
- Use a writer/cluster endpoint for writes and a reader endpoint or deliberate
  reader routing for read-only work. A reader endpoint distributes connections; it
  does not make a query transactionally consistent with a preceding write and does
  not replace application-level read-after-write decisions.
- Size readers for read capacity, failover promotion, and background replication
  work—not only average read traffic. Set promotion tiers intentionally and test
  which reader becomes writer.
- Use provisioned instances when the workload is steady, latency-sensitive, or
  requires predictable capacity. Consider Serverless v2 for variable workload or
  operational simplicity only after measuring scale-up/down behavior, minimum
  capacity, connection limits, warm-buffer effects, and cost.
- Serverless v2 writers and readers can have independent capacity behavior. Choose
  minimum/maximum ACUs from memory/working-set, connection, burst, and failover
  requirements; do not choose the minimum solely to minimize idle cost.
- Use Aurora Global Database only when cross-Region read/DR requirements justify
  asynchronous replication, regional cost, and operational complexity. Define RPO,
  RTO, planned vs unplanned failover, write forwarding/traffic redirection, conflict
  handling, and isolated restore tests.
- Treat Aurora storage durability as distinct from application backup/restore,
  cross-Region recovery, and accidental deletion protection. Pick the topology from
  recovery evidence, not from the word “Aurora.”
