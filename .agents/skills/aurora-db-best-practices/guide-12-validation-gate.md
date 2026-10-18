<!-- Conditional reference. The current SKILL.md and host policy take precedence. Paths are relative to this skill folder. -->

## Validation gate

Before calling an Aurora change complete, run the checks that fit the repository:

1. Record engine/version, topology, endpoints, connection budget, workload baseline,
   RPO/RTO, and cost dimensions; mark unavailable facts unknown.
2. Run representative query plans and load tests for critical reads/writes,
   pagination, concurrency, locks, pool/proxy behavior, and error/retry handling.
3. Exercise writer failover and reader routing in a safe environment. Verify DNS,
   pool recycling, idempotent retries, transaction error handling, and recovery time.
4. Restore a backup/snapshot into isolation and test application startup, schema,
   extensions, secrets, permissions, data freshness, and service time.
5. Run the repository's IaC lint/plan/synth and migration prechecks. Check for
   replacement, reboot, public exposure, plaintext secrets, unsafe DDL, and pending
   parameter changes.
6. Compare p50/p95/p99 latency, error rate, database load/waits, connections,
   replica lag, capacity, storage/I/O, failover time, and cost against the baseline.
