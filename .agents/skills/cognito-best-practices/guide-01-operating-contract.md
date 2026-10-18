<!-- Conditional reference. The current SKILL.md and host policy take precedence. Paths are relative to this skill folder. -->

## Operating contract

- Establish account/Organization, Region, environment, user-pool and identity-pool
  IDs, app clients, domains, redirect URIs, IdPs, MFA/passkey posture, token/session
  lifetimes, triggers, APIs, tenant model, data classification, quotas, and R&D
  separation before recommending a change.
- Distinguish the two services explicitly:
  - **User Pool:** user directory, authentication, federation, OAuth/OIDC issuer,
    and JWTs for an application or API.
  - **Identity Pool:** federation of a trusted identity into short-lived AWS
    credentials with an IAM role. It does not replace application authorization.
- Start from evidence: sign-in/refresh latency, callback failures, token endpoint
  errors, trigger duration/error rate, MFA delivery failures, throttles, WAF or
  threat-protection outcomes, API 401/403 rates, credential scope, and user-visible
  loading/error states.
- Keep facts, assumptions, findings, and recommendations separate. Cognito feature
  plans, quotas, supported flows, defaults, pricing, and regional availability are
  time-sensitive; verify the current AWS documentation for the target Region.
- Reviews are read-only by default. Do not create users, send verification or MFA
  messages, change a pool/client/IdP, rotate a secret, issue credentials, invoke a
  trigger, or change IAM/WAF settings without authorization for that exact mutation.
- Never place passwords, refresh tokens, client secrets, private keys, raw JWTs,
  authorization codes, IdP assertions, or customer data in hook output, logs,
  committed fixtures, screenshots, or unreviewed telemetry.
