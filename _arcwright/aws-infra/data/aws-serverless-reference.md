# AWS architecture assessment reference

This is a generic assessment checklist, not a description of an installed stack.
The configured aws_reference may point to project-owned architecture instead;
preserve that selection and verify its currency before relying on it.

## Establish the target

Record source revision, intended account/Region/environment, existing service
contracts, access patterns, traffic assumptions and deployment authority. Read the
actual infrastructure and project decisions before recommending a service or
multi-account layout. Unknown identity or permissions remain explicit gaps.

## Evaluate the affected design

- Select CDK constructs supported by the installed version; inspect synthesized
  resources, permissions and replacement behavior rather than assuming defaults.
- Trace service and identity policies, trust conditions, encryption and secret
  delivery. Keep secret values out of code, diagnostic output and evidence.
- Establish event contracts, validation, retry limits, idempotency, backpressure,
  failure destinations and recovery ownership for asynchronous work.
- Derive database keys, indexes, consistency and retention from access patterns.
  Single-table storage is a choice to justify, not a universal requirement.
- Check service, model and feature availability for the actual Region and date.
  Example runtimes, model names or architecture diagrams do not establish support.
- Estimate workload-dependent costs with dated pricing and stated assumptions.
  Include scaling limits, monitoring, backup/restore, rollout and reversal.

## Report evidence separately

Static review and synthesis can establish properties of the inspected source.
Local emulation establishes only observed emulator behavior. Live checks require
authorized identity and scope and establish only the checks actually performed.
Missing credentials or tools leave required live checks incomplete; they do not
invalidate unrelated evidenced static observations. Preserve required QA,
Security, independent review and CI before promotion. A merge is not a deployment.
