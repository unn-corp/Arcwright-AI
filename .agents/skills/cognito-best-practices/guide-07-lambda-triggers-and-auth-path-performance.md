<!-- Conditional reference. The current SKILL.md and host policy take precedence. Paths are relative to this skill folder. -->

## Lambda triggers and auth-path performance

- A trigger can be synchronous and can delay or fail an authentication operation.
  Keep pre-sign-up, pre-auth, custom auth, and pre-token generation handlers small,
  deterministic, idempotent, and bounded. Avoid network calls in the critical path;
  when unavoidable, set timeouts, retries, circuit behavior, and a safe failure
  policy. Never make a remote entitlement service the only path to basic sign-in
  without an availability plan.
- Give each trigger its own least-privilege role and function configuration. Do not
  put admin credentials or broad AWS permissions in a trigger just because it runs
  inside an auth flow. Keep secrets in Secrets Manager/Parameter Store and rotate
  them.
- Post-confirmation and post-authentication side effects must be idempotent and
  recoverable. Prefer emitting a durable event or enqueueing work over doing slow
  email, billing, analytics, or provisioning inline. Do not assume Cognito retries
  make external side effects exactly once.
- Use pre-token generation to add only claims/scopes the downstream authorization
  contract needs. Claims are snapshots: membership/role changes may not appear until
  a new token is issued. Do not put large, sensitive, or fast-changing authorization
  state in tokens, and never make a claim alone the only defense for a high-value
  tenant operation.
- Version trigger contracts and test cold starts, dependency size, timeout/error
  paths, malformed attributes, federated users, retries, and concurrent sign-ins.
  Keep logs free of tokens and personal data while retaining correlation IDs and
  useful failure categories.
