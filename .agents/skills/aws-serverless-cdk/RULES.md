# aws-serverless-cdk — Quick Rules (sidecar)

TRIGGER: Any CDK v2 / serverless infrastructure work (Lambda, DynamoDB, EventBridge, Amplify SSR, Cognito, Secrets Manager, multi-account deploy).

## Rules

1. **Single-purpose Lambda** — one function, one job. No shared mutable state between invocations.
2. **L2 first, L1 escape hatch only** — use `CfnXxx.addPropertyOverride()` when L2 lacks the property; never drop entirely to L1.
3. **Powertools on every Lambda** — Logger (structured JSON) + Tracer (X-Ray) + Metrics (EMF) via middy middlewares. Initialise at module scope.
4. **DynamoDB single-table** — access-pattern-first schema; generic `PK/SK/GSI1PK/GSI1SK`; PITR + Streams + TTL enabled at construct time.
5. **EventBridge: custom bus + precise patterns** — never catch-all on default bus; filter by `source` + `detailType` + `detail` fields.
6. **Amplify SSR: `computeRoleArn` escape hatch** — always set via `cfnApp.addPropertyOverride('ComputeRoleArn', role.roleArn)`. Without it, every SDK call in SSR returns `AccessDenied`.
7. **Amplify env-var prefix** — never use `AWS_` prefix (reserved). Use a project prefix e.g. `UNNAMED_ACCOUNT_ID`.
8. **Secrets: ARN in env var, value resolved at runtime** — module-scope cache to avoid per-invocation API calls. Never `unsafeUnwrap()` into env vars.
9. **Multi-account bootstrap** — `cdk bootstrap --trust <pipeline-account>` in every target account/region. Use CDK Pipelines for deploy ordering.
10. **Deploy order: Secrets → Auth → Data → Events → Backup → Web** — enforce as explicit pipeline stages.
11. **Bedrock region lock** — instantiate `BedrockRuntimeClient({ region: 'us-east-1' })` explicitly; Nova Pro is us-east-1 only.
12. **SES bounces via SNS** — use a configuration set event destination (SNS topic) → Lambda, not raw email feedback.

## Red Flags

- **L1 construct used where an L2 exists** — unnecessary verbosity, loses managed IAM/logging defaults.
- **Lambda without structured logging** — `console.log()` with plain strings; no Powertools Logger.
- **Secret value injected as env var** — `secret.secretValue.unsafeUnwrap()` baked into CloudFormation template.
- **Amplify SSR app missing `computeRoleArn`** — silent `AccessDenied` on every SDK call from SSR routes.
- **`AWS_` prefix on Amplify env vars** — silently dropped or causes deploy failures.
- **Catch-all EventBridge rule on default bus** — triggers on all AWS service events, unexpected invocations and costs.
- **Multi-table DynamoDB design** — separate tables per entity type adds cross-table joins and round-trips.
- **Hard-coded AWS account IDs in CDK** — breaks portability; use `cdk.Aws.ACCOUNT_ID` or context values.
- **No PITR on DynamoDB tables** — unrecoverable data loss risk; always enable `pointInTimeRecovery: true`.
- **Bedrock client with no region** — will fail in any stack region other than where the model is available.
