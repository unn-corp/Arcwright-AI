<!-- Conditional reference. The current SKILL.md and host policy take precedence. Paths are relative to this skill folder. -->

## Security and data protection

- Keep Aurora in private subnets with security groups scoped to the application
  producers/consumers. Avoid public accessibility and broad inbound database ports.
- Require TLS in transit where the application contract permits it and verify the
  client actually validates the certificate. Use encryption at rest with KMS and
  confirm key policy, rotation, cross-Region/replica access, and restore behavior.
- Store credentials in Secrets Manager or an equivalent approved secret store. Do
  not commit passwords or place them in URLs, logs, error messages, snapshots,
  environment dumps, or hook context. Use IAM database authentication only when
  its token lifetime, driver support, pool/proxy behavior, and operational cost fit.
- Grant least privilege to database users and AWS identities. Separate migrations,
  runtime reads/writes, analytics, and administration; do not grant application
  roles superuser or broad schema ownership without evidence.
- Review log exports, slow-query logging, Performance Insights/Database Insights,
  audit extensions, and query text for sensitive data before enabling or centralizing
  them. Redact values at the application and observability boundaries.
- Treat schema/migration input as untrusted. Parameterize values, restrict dynamic
  identifiers, validate tenant scope, and do not allow model/user input to choose an
  arbitrary cluster, schema, table, SQL expression, or migration operation.
