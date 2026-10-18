<!-- Conditional reference. The current SKILL.md and host policy take precedence. Paths are relative to this skill folder. -->

## Review output

Use this compact shape:

```text
Scope / account / Region / environment / primitive / client type / preserved behavior:
Auth flow / token issuer-consumers / storage-refresh / MFA-federation baseline:
API authorization / Identity Pool IAM / tenant / R&D isolation baseline:
UI bootstrap / p75 Web Vitals / auth latency / trigger baseline:
Findings:
  [severity] evidence → impact → smallest safe improvement → trade-off
Rollout / rollback / user migration / revocation plan:
Validation / synthetic test and metric evidence:
Unchanged by design:
Open questions / unknowns:
```

Severity is evidence-based:

- **Blocker:** exposed client/admin secret, unverified JWT accepted, arbitrary
  cross-tenant access, unauthenticated broad AWS role, production/R&D identity mix,
  or public callback/IdP trust that enables account takeover.
- **High:** missing issuer/signature/token-use validation, public implicit flow/no
  PKCE, wildcard redirect, over-privileged Identity Pool role, tenant authorization
  only in the client/claim/filter, non-idempotent critical trigger, or recovery path
  that exposes accounts or sensitive data.
- **Medium:** measurable auth/UI latency, refresh storm, trigger availability,
  quota/noisy-neighbor, stale-claim, observability, cost, or environment drift risk
  with a safe staged fix.
- **Low:** hygiene, documentation, tagging, test coverage, or accessibility
  improvement without demonstrated security, data, or user impact.
