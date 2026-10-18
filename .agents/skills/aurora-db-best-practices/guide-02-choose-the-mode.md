<!-- Conditional reference. The current SKILL.md and host policy take precedence. Paths are relative to this skill folder. -->

## Choose the mode

### Planning

Inventory the workload and recovery contract, choose the Aurora topology and engine
features that fit it, and produce a staged plan with latency/capacity targets,
security controls, migration risk, metrics, cost dimensions, validation, and rollback.

### Implementation

Make the smallest evidence-backed change. Check engine/version support, parameter
group scope, pending-reboot behavior, CloudFormation/IaC replacement risk, secret
handling, endpoint semantics, and backup/restore implications before applying it.

### Review

Read [references/review-checklist.md](references/review-checklist.md) and report
severity, evidence, user/runtime impact, smallest safe improvement, trade-offs,
rollout, validation, rollback, unchanged behavior, and unknowns. Do not turn a
review finding into a live database mutation silently.
