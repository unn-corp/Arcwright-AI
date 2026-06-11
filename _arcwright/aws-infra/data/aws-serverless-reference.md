# AWS Serverless Reference — Internal Cheat-Sheet

Internal reference document for the aws-infra agent and the aws-serverless-cdk skill.
Describes the canonical multi-account serverless SaaS architecture on CDK v2.

---

## Project Architecture Summary

**Pattern:** Multi-account, serverless-first, event-driven SaaS on AWS CDK v2 (TypeScript).

| Layer | Service | Notes |
|-------|---------|-------|
| Frontend / SSR | Amplify Hosting Compute (Next.js) | Monorepo root: `AMPLIFY_MONOREPO_APP_ROOT=app` |
| Auth | Cognito User Pool | Groups, optional TOTP, Google IdP federation |
| API | 8 × Node 20 Lambda workers | Event-driven via custom EventBridge bus |
| Data | DynamoDB single-table | PITR, Streams, GSI1, GSI2, TTL |
| Events | Custom EventBridge bus | 8 domain event types |
| Email | SES + SNS bounce/complaint pipeline | Configuration set → SNS topic → Lambda |
| Secrets | Secrets Manager | ARN-only injection + placeholder provisioning |
| Backup | AWS Backup + cross-account copy | Vault lock enabled |
| AI | Bedrock (Nova Pro) | Region-locked: us-east-1 only |

---

## Stack List and Deploy Order

Deploy stacks in this exact order to satisfy cross-stack dependencies:

```
1. SecretsStack     — provision placeholder secrets; all other stacks reference ARNs
2. AuthStack        — Cognito user pool, Google IdP, groups; depends on SecretsStack
3. DataStack        — DynamoDB single-table (PITR + Streams + GSI1/GSI2 + TTL)
4. EventsStack      — custom EventBridge bus + 8 Lambda worker functions + SES config
5. BackupStack      — AWS Backup plan with cross-account copy + vault lock
6. WebStack         — Amplify Hosting Compute (Next.js SSR) with computeRoleArn
```

---

## DynamoDB Single-Table Schema

- **Table keys:** `PK` (string), `SK` (string)
- **GSI1:** `GSI1PK` / `GSI1SK` — projection: ALL
- **GSI2:** `GSI2PK` / `GSI2SK` — projection: ALL
- **TTL attribute:** `TTL`
- **Streams:** NEW_AND_OLD_IMAGES
- **PITR:** enabled
- **Billing:** PAY_PER_REQUEST

Access patterns drive all key design. Generic attribute names allow key overloading across entity types (users, orders, sessions, etc.).

---

## EventBridge Lambda Workers (8 functions)

All workers listen on the custom domain bus. Each worker:
- Is single-purpose (one domain event type)
- Uses Node 20 runtime
- Initialises Powertools Logger/Tracer/Metrics at module scope
- Reads secret values by ARN at runtime (module-scope cache)

---

## Cognito Configuration

- Self sign-up enabled
- Email auto-verify
- MFA: OPTIONAL (TOTP only; SMS disabled)
- Password: 12+ chars, symbols required
- Groups: Admins (mapped to AdminRole), Users (default)
- Google IdP: OpenID Connect, scopes: openid + email + profile
- Removal policy: RETAIN

---

## Amplify SSR Configuration

```typescript
// Critical: L1 escape hatch required for computeRoleArn
const cfnApp = amplifyApp.node.defaultChild as amplify.CfnApp;
cfnApp.addPropertyOverride('ComputeRoleArn', computeRole.roleArn);

// Env vars — never AWS_ prefix
AMPLIFY_MONOREPO_APP_ROOT: 'app'
UNNAMED_ACCOUNT_ID: this.account   // NOT AWS_ACCOUNT_ID
```

**Without `computeRoleArn`:** every AWS SDK call from SSR (DynamoDB, Secrets Manager, Cognito) returns `AccessDenied`. This is the single most common deployment failure.

---

## Secrets Manager Patterns

1. **Placeholder provisioning in SecretsStack** — create the secret record with a dummy value on first deploy; rotate/fill value in AWS Console or via rotation Lambda. All downstream stacks reference the ARN, not the value.
2. **ARN injection** — pass `DB_SECRET_ARN` (not value) as Lambda env var; `grantRead()` on the role.
3. **Module-scope cache** — resolve once per cold start, cache in module-level variable. Avoids ~10 ms per-invocation latency.
4. **Never `unsafeUnwrap()`** — bakes plaintext into CloudFormation template, visible in CloudTrail and Lambda environment variable APIs.

---

## Multi-Account Bootstrap

```bash
# Run once per account/region before first CDK deploy
cdk bootstrap aws://<target-account>/<region> \
  --trust <pipeline-account-id> \
  --cloudformation-execution-policies arn:aws:iam::aws:policy/AdministratorAccess
```

CDK Pipelines self-mutates. Pipeline account needs `sts:AssumeRole` trust in all target accounts.

---

## Bedrock Notes

- **Model:** `amazon.nova-pro-v1:0`
- **Available region:** `us-east-1` only
- **Client:** always `new BedrockRuntimeClient({ region: 'us-east-1' })` — never inherit stack region
- **No Lambda Powertools tracing for Bedrock calls yet** — manual X-Ray subsegments required

---

## Known Gotchas

| Area | Gotcha | Fix |
|------|--------|-----|
| Amplify SSR | `computeRoleArn` not exposed on L2 `App` construct | `cfnApp.addPropertyOverride('ComputeRoleArn', role.roleArn)` |
| Amplify env vars | `AWS_` prefix reserved by Amplify runtime | Use `UNNAMED_ACCOUNT_ID` or any non-`AWS_` prefix |
| Bedrock | `us-east-1` only for Nova Pro | Explicit `{ region: 'us-east-1' }` on client |
| DynamoDB streams | Streams must be on at table creation for Lambda event source mapping | `stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES` in table construct |
| Secrets | Rotation requires the secret to exist before the consuming Lambda deploys | SecretsStack deploys first; placeholders filled post-deploy |
| Lambda Powertools | Not yet added to this project | Gap — planned for next iteration |
| SES sandbox | New accounts are in SES sandbox; must request production access | Manual AWS console step outside CDK |
| Cross-account Backup copy | Destination vault must exist before the plan deploys | Create destination vault in backup account in a pre-stage |

---

## 8 Knowledge Domains

| # | Domain | Canonical Source |
|---|--------|-----------------|
| 1 | Well-Architected Serverless Lens | https://docs.aws.amazon.com/wellarchitected/latest/serverless-applications-lens/welcome.html |
| 2 | CDK Construct Levels (L1/L2/L3) | https://docs.aws.amazon.com/cdk/v2/guide/constructs.html |
| 3 | Lambda Powertools TypeScript | https://docs.powertools.aws.dev/lambda/typescript/latest/ |
| 4 | DynamoDB Single-Table Design | https://www.dynamodbbook.com/ · https://www.alexdebrie.com/posts/dynamodb-single-table/ |
| 5 | EventBridge Patterns | https://docs.aws.amazon.com/eventbridge/latest/userguide/eb-best-practices.html |
| 6 | Amplify SSR + IAM Compute Roles | https://docs.aws.amazon.com/amplify/latest/userguide/ssr-compute-role.html |
| 7 | Multi-Account CDK + Organizations | https://docs.aws.amazon.com/cdk/v2/guide/cdk_pipeline.html |
| 8 | Secrets Manager Patterns | https://docs.aws.amazon.com/secretsmanager/latest/userguide/best-practices.html |
