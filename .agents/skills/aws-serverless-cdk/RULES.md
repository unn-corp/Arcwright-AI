# CDK serverless quick rules

- Scope account/Region/environment, existing constructs, access/event contracts and authorized actions. Review does not authorize bootstrap, deploy or production changes.
- Prefer L2; use a typed L1 escape hatch only for a missing installed-L2 property. Inspect synthesized IAM/resources and preserve required gates.
- Keep Lambda focused/stateless, effects idempotent, connections bounded, instrumentation useful. Use existing Powertools rather than adding unrelated dependencies.
- Design DynamoDB from access patterns; preserve established keys. Match recovery/PITR, retention, Streams and TTL to actual contracts.
- EventBridge filters must be precise; domain buses and cross-account trust need deliberate policies.
- Amplify SSR AWS access needs a resource-scoped compute role, distinct from build/service roles. Use supported `ComputeRoleArn` configuration; avoid reserved `AWS_` variables.
- Inject secret references, fetch at runtime, cache with bounded refresh; never expose values in templates/logs.
- Verify bootstrap trust and dependency stage order. Preserve Cognito MFA policy and verify current Bedrock model/Region availability.
- SES feedback needs an observed idempotent consumer. Backup/Vault Lock retention changes require explicit scope and restore evidence.
- Read only the affected recipe. Stop after the requested change and report actual checks/unknowns.
