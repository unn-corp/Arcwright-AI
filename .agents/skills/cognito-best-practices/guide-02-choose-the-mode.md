<!-- Conditional reference. The current SKILL.md and host policy take precedence. Paths are relative to this skill folder. -->

## Choose the mode

### Planning

Define the user population, login methods, trust relationships, client type, OAuth
grant, token consumers, API authorization model, AWS-resource access, recovery/MFA
requirements, tenant boundary, environment/account layout, UI performance budget,
operational limits, and rollout/rollback plan. Choose User Pools, Identity Pools,
another AWS identity service, or a combination from the required trust and
authorization semantics.

### Implementation

Make the smallest evidence-backed change. Keep environments and domains distinct,
configure exact redirect/sign-out URLs, use the narrowest client and IAM permissions,
validate generated IaC, test the complete sign-in/refresh/sign-out/recovery path, and
verify the browser/mobile UI does not add an auth waterfall or expose secrets.

### Review

Read [references/review-checklist.md](references/review-checklist.md) and report
severity, evidence, user/data impact, smallest safe improvement, trade-offs,
validation, rollback, unchanged behavior, and unknowns. A review does not authorize
live Cognito or IAM mutations.
