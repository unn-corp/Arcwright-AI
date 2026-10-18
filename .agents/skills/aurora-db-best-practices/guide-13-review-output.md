<!-- Conditional reference. The current SKILL.md and host policy take precedence. Paths are relative to this skill folder. -->

## Review output

Use this compact shape:

```text
Scope / engine / version / topology / preserved behavior:
Evidence and unknowns:
Workload, connection, availability, and recovery baseline:
Findings:
  [severity] evidence → impact → smallest safe improvement → trade-off
Migration or rollout:
Validation / metrics / restore / failover / rollback:
Unchanged by design:
Open questions:
```

Use severity as a decision aid, not as a substitute for evidence:

- **Blocker:** proven cross-tenant data exposure or a runtime path that bypasses the
  tenant boundary, public exposure with an exploitable path, plaintext credentials,
  destructive/replacement change without a recovery path, or a migration/upgrade
  that has not proven compatibility and restore/rollback.
- **High:** unbounded connection/query behavior, untested client failover, missing
  tenant authorization, inadequate reader/capacity headroom, or missing evidence for
  a production RPO/RTO claim.
- **Medium:** measurable latency/cost/maintenance risk with a safe staged fix.
- **Low:** hygiene or observability improvement without demonstrated user/data risk.

Public accessibility, a low Serverless v2 minimum, one reader, `SELECT *`, or offset
pagination are review triggers, not automatic defects. Confirm ingress paths,
latency goals, workload shape, result size, and consistency needs before assigning
severity. Offset pagination can be reasonable for small, stable, shallow result sets;
large or changing datasets usually need bounded keyset/cursor pagination.
