<!-- Conditional reference. The current SKILL.md and host policy take precedence. Paths are relative to this skill folder. -->

## Identity Pools and AWS credentials

- Use an Identity Pool only when the client genuinely needs temporary AWS API
  credentials. For a normal application API, prefer a backend that validates User
  Pool tokens and performs authorization without exposing AWS service permissions to
  the browser.
- Disable unauthenticated identities unless the public/guest use case is explicit.
  If enabled, the unauthenticated role must be narrowly scoped to the minimum public
  actions and resources; it must not read tenant data, write arbitrary objects,
  invoke admin APIs, or reach control-plane operations.
- Give authenticated identities a role with least privilege and bounded resources.
  Review every action, resource ARN, condition, external ID, session duration, and
  provider trust policy. Never use `*` resources or broad administrative permissions
  as a shortcut for a client role.
- Use role mappings or session/principal tags only when the claims are verified,
  mapping rules are explicit, and the resulting IAM policy is least privilege.
  ABAC reduces policy duplication but does not remove the need to validate tenant,
  user status, object ownership, and resource naming.
- Treat temporary credentials as bearer credentials. Use short lifetimes appropriate
  to the app, refresh safely, do not log them, and do not assume removing a User Pool
  session immediately invalidates already-issued Identity Pool credentials.
