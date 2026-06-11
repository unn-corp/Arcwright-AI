---
name: "aws-serverless-cdk"
description: "TRIGGER when working on AWS CDK / serverless infrastructure (Lambda, DynamoDB, EventBridge, Cognito, Amplify SSR, Secrets Manager, multi-account CDK, or any AWS Well-Architected serverless design). Covers CDK construct levels, Lambda Powertools, single-table DynamoDB, EventBridge patterns, Amplify SSR compute roles, and Secrets Manager ARN injection."
allowed-tools: Read Write Edit Grep Glob Bash(*)  WebFetch
---

# Skill: aws-serverless-cdk

Authoritative rules for AWS CDK v2 serverless infrastructure in TypeScript. Covers the 8 canonical knowledge domains: Well-Architected Serverless Lens, CDK construct levels, Lambda Powertools, DynamoDB single-table design, EventBridge patterns, Amplify SSR IAM, multi-account CDK, and Secrets Manager patterns.

---

## Rule 1 — Single-Purpose Share-Nothing Lambda Functions

**Statement:** Each Lambda function does one thing. No shared mutable state between invocations; no shared DB connections outside module-level singleton initialisation.

**Wrong:**
```typescript
// Fat function — auth + business logic + persistence in one handler
export const handler = async (event: APIGatewayEvent) => {
  const user = await verifyJwt(event.headers.Authorization);
  const order = await processOrder(event.body);
  await sendEmail(user.email, order);
  await db.put(order);
};
```

**Correct:**
```typescript
// Single-purpose: only processes orders; auth and email are separate functions
export const handler = async (event: SQSEvent) => {
  for (const record of event.Records) {
    const order = JSON.parse(record.body) as OrderPayload;
    await db.put({ TableName: TABLE_NAME, Item: order });
  }
};
```

**Why:** The Well-Architected Serverless Lens requires functions to be independently deployable and scalable. Fat functions bloat cold starts, couple failure domains, and make IAM least-privilege impossible.

---

## Rule 2 — CDK Construct Levels: L2 Default, L1 Escape Hatch, L3 for Org Opinions

**Statement:** Use L2 constructs as the default. Use L1 (`CfnXxx`) only when an L2 property is absent. Use L3 Patterns or custom constructs to encode org-wide opinions.

**Wrong:**
```typescript
// L1 for everything — verbose, no type safety, no sensible defaults
const fn = new lambda.CfnFunction(this, 'Fn', {
  functionName: 'my-fn',
  runtime: 'nodejs20.x',
  handler: 'index.handler',
  code: { s3Bucket: bucket.bucketName, s3Key: 'fn.zip' },
  role: role.roleArn,
});
```

**Correct:**
```typescript
// L2 default; L1 escape hatch only for the missing property
const fn = new lambda.Function(this, 'Fn', {
  runtime: lambda.Runtime.NODEJS_20_X,
  handler: 'index.handler',
  code: lambda.Code.fromBucket(bucket, 'fn.zip'),
});
// L1 escape hatch for a property L2 doesn't expose
const cfnFn = fn.node.defaultChild as lambda.CfnFunction;
cfnFn.addPropertyOverride('SnapStart', { ApplyOn: 'PublishedVersions' });
```

**Why:** L2 constructs manage IAM, logging, and permissions automatically. Dropping to L1 everywhere surrenders those defaults and couples the code to raw CloudFormation property names that change across CDK versions.

---

## Rule 3 — Lambda Powertools: Logger, Tracer, Metrics on Every Function

**Statement:** Initialise Powertools Logger, Tracer, and Metrics at module scope. Use the `@logger.injectLambdaContext()`, `@tracer.captureLambdaHandler()`, and `@metrics.logMetrics()` middy middlewares (or decorators).

**Wrong:**
```typescript
export const handler = async (event: unknown) => {
  console.log('Processing event', event);
  // No structured logging, no X-Ray trace, no CloudWatch EMF metrics
};
```

**Correct:**
```typescript
import { Logger } from '@aws-lambda-powertools/logger';
import { Tracer } from '@aws-lambda-powertools/tracer';
import { Metrics, MetricUnit } from '@aws-lambda-powertools/metrics';
import middy from '@middy/core';

const logger = new Logger({ serviceName: 'order-processor' });
const tracer = new Tracer({ serviceName: 'order-processor' });
const metrics = new Metrics({ namespace: 'MyApp', serviceName: 'order-processor' });

const baseHandler = async (event: SQSEvent) => {
  logger.info('Processing batch', { count: event.Records.length });
  metrics.addMetric('OrdersProcessed', MetricUnit.Count, event.Records.length);
};

export const handler = middy(baseHandler)
  .use(logger.injectLambdaContext())
  .use(tracer.captureLambdaHandler())
  .use(metrics.logMetrics({ captureColdStartMetric: true }));
```

**Why:** Structured JSON logs enable CloudWatch Insights queries. X-Ray traces expose latency in distributed calls. EMF metrics avoid custom metric put-metric-data API costs. All three are zero-overhead when using Powertools module-scope init (no per-invocation setup cost).

---

## Rule 4 — DynamoDB Single-Table: Access-Pattern-First, GSI Design

**Statement:** Design the table schema around access patterns, not entity shapes. Use generic attribute names (`PK`, `SK`, `GSI1PK`, `GSI1SK`) to support overloading. Enable PITR, Streams, and TTL at construct time.

**Wrong:**
```typescript
// Entity-per-table with natural key names — adds tables and cross-table joins
new dynamodb.Table(this, 'UsersTable', { partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING } });
new dynamodb.Table(this, 'OrdersTable', { partitionKey: { name: 'orderId', type: dynamodb.AttributeType.STRING } });
```

**Correct:**
```typescript
const table = new dynamodb.Table(this, 'MainTable', {
  partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
  sortKey:      { name: 'SK', type: dynamodb.AttributeType.STRING },
  billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
  pointInTimeRecovery: true,
  stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
  timeToLiveAttribute: 'TTL',
  removalPolicy: cdk.RemovalPolicy.RETAIN,
});

table.addGlobalSecondaryIndex({
  indexName: 'GSI1',
  partitionKey: { name: 'GSI1PK', type: dynamodb.AttributeType.STRING },
  sortKey:      { name: 'GSI1SK', type: dynamodb.AttributeType.STRING },
  projectionType: dynamodb.ProjectionType.ALL,
});
```

**Why:** Single-table design (Alex DeBrie) reduces round-trips, eliminates cross-table joins, and keeps costs predictable at scale. Generic attribute names allow the same index to serve multiple entity types via key overloading.

---

## Rule 5 — EventBridge: Precise Patterns, Custom Buses, Multi-Account Forwarding

**Statement:** Use precise `detail-type` and `source` filters in rules. Never use catch-all patterns on the default bus. Use a custom bus for domain events. Forward events cross-account via `EventBusPolicy`.

**Wrong:**
```typescript
// Catch-all on default bus — triggers on AWS service events too
new events.Rule(this, 'AllEvents', {
  eventBus: events.EventBus.fromEventBusName(this, 'Default', 'default'),
  eventPattern: { source: [{ prefix: '' }] }, // matches everything
  targets: [new targets.LambdaFunction(fn)],
});
```

**Correct:**
```typescript
const bus = new events.EventBus(this, 'DomainBus', { eventBusName: 'my-app-events' });

new events.Rule(this, 'OrderCreatedRule', {
  eventBus: bus,
  eventPattern: {
    source: ['my-app.orders'],
    detailType: ['OrderCreated'],
    detail: { status: ['PENDING'] },
  },
  targets: [new targets.LambdaFunction(orderProcessor)],
});

// Multi-account forwarding
bus.addToResourcePolicy(new iam.PolicyStatement({
  sid: 'AllowCrossAccountPut',
  effect: iam.Effect.ALLOW,
  principals: [new iam.AccountPrincipal(peerAccountId)],
  actions: ['events:PutEvents'],
  resources: [bus.eventBusArn],
}));
```

**Why:** Precise patterns prevent accidental triggers and reduce invocation costs. Custom buses isolate domain traffic and enable cross-account event mesh without VPC peering.

---

## Rule 6 — Amplify SSR: Always Set computeRoleArn via L1 Escape Hatch

**Statement:** Amplify SSR (Hosting Compute) requires an explicit `computeRoleArn` so the SSR Lambda can call AWS SDK. The L2 `App` construct does not expose this property — use `CfnResource.addPropertyOverride`.

**Wrong:**
```typescript
// Missing computeRoleArn — every SDK call from SSR returns AccessDenied
const amplifyApp = new amplify.App(this, 'Web', {
  sourceCodeProvider: new amplify.GitHubSourceCodeProvider({ ... }),
  environmentVariables: { AMPLIFY_MONOREPO_APP_ROOT: 'app' },
});
```

**Correct:**
```typescript
const computeRole = new iam.Role(this, 'AmplifyComputeRole', {
  assumedBy: new iam.ServicePrincipal('amplify.amazonaws.com'),
  managedPolicies: [iam.ManagedPolicy.fromAwsManagedPolicyName('AdministratorAccess-Amplify')],
});
// Add any additional permissions your SSR routes need
computeRole.addToPrincipalPolicy(new iam.PolicyStatement({
  actions: ['dynamodb:GetItem', 'dynamodb:Query'],
  resources: [table.tableArn],
}));

const amplifyApp = new amplify.App(this, 'Web', {
  sourceCodeProvider: new amplify.GitHubSourceCodeProvider({ ... }),
  environmentVariables: {
    AMPLIFY_MONOREPO_APP_ROOT: 'app',
    // NEVER use AWS_ prefix — Amplify reserves it
    UNNAMED_ACCOUNT_ID: this.account,
  },
});

// L1 escape hatch: inject computeRoleArn
const cfnApp = amplifyApp.node.defaultChild as amplify.CfnApp;
cfnApp.addPropertyOverride('ComputeRoleArn', computeRole.roleArn);
```

**Why:** Without `computeRoleArn`, Amplify SSR runs with no identity and all AWS SDK calls fail with `AccessDenied`. The `AWS_` env-var prefix is reserved by Amplify — use a project-specific prefix (e.g. `UNNAMED_ACCOUNT_ID`) to pass account/region values to the SSR runtime.

---

## Rule 7 — Secrets Manager: ARN Injection, No Plaintext Values in Env Vars

**Statement:** Pass secret ARNs to Lambda as environment variables. Resolve the secret value inside the function at runtime using `SecretsManagerClient`. Never inject plaintext secret values into env vars or CDK tokens.

**Wrong:**
```typescript
// Resolves secret value at synth time — baked into CloudFormation template
const secret = secretsmanager.Secret.fromSecretNameV2(this, 'DbSecret', 'prod/db');
new lambda.Function(this, 'Fn', {
  environment: {
    DB_PASSWORD: secret.secretValue.unsafeUnwrap(), // NEVER do this
  },
});
```

**Correct:**
```typescript
// ARN only in env var — value resolved at Lambda runtime
const secret = secretsmanager.Secret.fromSecretNameV2(this, 'DbSecret', 'prod/db');
const fn = new lambda.Function(this, 'Fn', {
  environment: {
    DB_SECRET_ARN: secret.secretArn,
  },
});
secret.grantRead(fn);

// In the Lambda handler — module-scope cache avoids per-invocation API calls
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
const sm = new SecretsManagerClient({});
let cachedSecret: Record<string, string> | null = null;

async function getSecret() {
  if (cachedSecret) return cachedSecret;
  const { SecretString } = await sm.send(new GetSecretValueCommand({ SecretId: process.env.DB_SECRET_ARN }));
  cachedSecret = JSON.parse(SecretString!);
  return cachedSecret;
}
```

**Why:** Injecting plaintext values exposes secrets in CloudFormation templates, CloudTrail, and Lambda environment variable APIs. ARN injection keeps secrets encrypted at rest and lets rotation work transparently. Module-scope caching avoids the ~10 ms API latency on every invocation.

---

## Rule 8 — Multi-Account CDK: Bootstrap Trust + CDK Pipelines Deploy Order

**Statement:** Bootstrap each account/region with `--trust <pipeline-account>`. Define explicit deploy order in CDK Pipelines (`addStage` with `pre`/`post` steps). Never hard-code account IDs — use `cdk.Aws.ACCOUNT_ID` or environment context.

**Wrong:**
```typescript
// Hard-coded account IDs, no pipeline — manual cdk deploy in each account
new MyStack(app, 'ProdStack', { env: { account: '123456789012', region: 'us-east-1' } });
```

**Correct:**
```typescript
// config/accounts.ts — injected via CDK context, not hard-coded
const accounts = app.node.tryGetContext('accounts') as AccountConfig;

const pipeline = new pipelines.CodePipeline(this, 'Pipeline', {
  synth: new pipelines.ShellStep('Synth', {
    input: pipelines.CodePipelineSource.gitHub('org/repo', 'main'),
    commands: ['npm ci', 'npx cdk synth'],
  }),
});

// Explicit deploy order: Secrets → Auth → Data → Events → Backup → Web
pipeline.addStage(new SecretsStage(app, 'Secrets', { env: accounts.prod }));
pipeline.addStage(new AuthStage(app, 'Auth',    { env: accounts.prod }));
pipeline.addStage(new DataStage(app, 'Data',    { env: accounts.prod }));
pipeline.addStage(new EventsStage(app, 'Events',{ env: accounts.prod }));
pipeline.addStage(new BackupStage(app, 'Backup',{ env: accounts.prod }));
pipeline.addStage(new WebStage(app, 'Web',      { env: accounts.prod }));
```

**Why:** Cross-account deployments require bootstrap trust so the pipeline role can assume the deployment role in the target account. Explicit stage ordering ensures infrastructure dependencies (e.g., DynamoDB table ARN available before Lambda env var is set) are satisfied before each stage runs.

---

## Rule 9 — Cognito: Groups + IdP Federation + TOTP via L2, MFA Optional

**Statement:** Define user pool groups in CDK and assign IAM roles per group. Wire Google IdP via `UserPoolIdentityProviderGoogle`. Set MFA to OPTIONAL (not REQUIRED) unless compliance mandates it; enable TOTP as the second factor.

**Correct:**
```typescript
const userPool = new cognito.UserPool(this, 'UserPool', {
  selfSignUpEnabled: true,
  autoVerify: { email: true },
  mfa: cognito.Mfa.OPTIONAL,
  mfaSecondFactor: { sms: false, otp: true },
  passwordPolicy: { minLength: 12, requireSymbols: true },
  removalPolicy: cdk.RemovalPolicy.RETAIN,
});

new cognito.UserPoolIdentityProviderGoogle(this, 'Google', {
  userPool,
  clientId: googleClientId,
  clientSecretValue: googleClientSecret.secretValue,
  attributeMapping: { email: cognito.ProviderAttribute.GOOGLE_EMAIL },
  scopes: ['openid', 'email', 'profile'],
});

// Groups with IAM role mapping
const adminRole = new iam.Role(this, 'AdminRole', { assumedBy: new iam.ServicePrincipal('cognito-idp.amazonaws.com') });
new cognito.CfnUserPoolGroup(this, 'AdminGroup', {
  userPoolId: userPool.userPoolId,
  groupName: 'Admins',
  roleArn: adminRole.roleArn,
});
```

**Why:** MFA OPTIONAL improves conversion while supporting power users who want TOTP. Group-to-role mapping enables fine-grained authorization without custom Lambda authorizers for the common case.

---

## Rule 10 — Bedrock Region Lock: Region-Specific Client Instantiation

**Statement:** Bedrock model availability is region-locked. Instantiate the Bedrock client with an explicit region rather than inheriting the stack region.

**Wrong:**
```typescript
// Inherits stack region — fails if stack is in us-west-2 and Nova Pro is us-east-1 only
const bedrock = new BedrockRuntimeClient({});
```

**Correct:**
```typescript
// Explicit region where the model is available
const bedrock = new BedrockRuntimeClient({ region: 'us-east-1' }); // Nova Pro: us-east-1 only
```

**Why:** Bedrock model availability varies by region and model generation. Nova Pro (amazon.nova-pro-v1:0) is currently available only in `us-east-1`. Hardcoding the region at the client level (not the stack level) allows the rest of the infrastructure to deploy in any region.

---

## Rule 11 — SES Bounce/Complaint Pipeline: SNS → Lambda, Not Direct SES Feedback

**Statement:** Route SES bounce and complaint notifications through an SNS topic to a Lambda processor, not to raw email or webhook endpoints. Register the SNS topic as the SES configuration set event destination.

**Correct:**
```typescript
const bounceTopic = new sns.Topic(this, 'BounceTopic');
const complaintTopic = new sns.Topic(this, 'ComplaintTopic');

const configSet = new ses.ConfigurationSet(this, 'ConfigSet', {
  configurationSetName: 'transactional',
});

new ses.CfnConfigurationSetEventDestination(this, 'BounceDestination', {
  configurationSetName: configSet.configurationSetName!,
  eventDestination: {
    enabled: true,
    matchingEventTypes: ['bounce', 'complaint'],
    snsDestination: { topicArn: bounceTopic.topicArn },
  },
});

bounceTopic.addSubscription(new subs.LambdaSubscription(bounceProcessorFn));
```

**Why:** SNS decouples SES event delivery from processing logic, supports fan-out to multiple consumers, and provides retry semantics. Direct email feedback loops are unreliable for automated suppression list management.

---

## Rule 12 — AWS Backup: Cross-Account Copy + Vault Lock

**Statement:** Configure AWS Backup plans with cross-account copy to a secondary account. Use `BackupVaultLockConfiguration` to prevent deletion of recovery points during the retention window.

**Correct:**
```typescript
const vault = new backup.BackupVault(this, 'Vault', {
  backupVaultName: 'prod-vault',
  removalPolicy: cdk.RemovalPolicy.RETAIN,
});

const plan = new backup.BackupPlan(this, 'Plan', {
  backupVault: vault,
  backupPlanRules: [
    new backup.BackupPlanRule({
      ruleName: 'daily-35day',
      scheduleExpression: events.Schedule.cron({ hour: '3', minute: '0' }),
      deleteAfter: cdk.Duration.days(35),
      copyActions: [{
        destinationBackupVault: backup.BackupVault.fromBackupVaultArn(
          this, 'CrossAccountVault', crossAccountVaultArn
        ),
        deleteAfter: cdk.Duration.days(90),
      }],
    }),
  ],
});

// Add all DynamoDB tables and Lambda sources via tag-based selection
new backup.BackupSelection(this, 'TagSelection', {
  backupPlan: plan,
  resources: [backup.BackupResource.fromTag('backup', 'true')],
});
```

**Why:** Cross-account backup copy protects against accidental or malicious deletion in the primary account. Vault Lock enforces WORM (write-once-read-many) semantics on recovery points to satisfy compliance requirements.

---

## Source References

- [AWS Well-Architected Serverless Lens](https://docs.aws.amazon.com/wellarchitected/latest/serverless-applications-lens/welcome.html)
- [AWS CDK Constructs guide](https://docs.aws.amazon.com/cdk/v2/guide/constructs.html)
- [Lambda Powertools TypeScript](https://docs.powertools.aws.dev/lambda/typescript/latest/)
- [aws-powertools/powertools-lambda-typescript (GitHub)](https://github.com/aws-powertools/powertools-lambda-typescript)
- [The DynamoDB Book — Alex DeBrie](https://www.dynamodbbook.com/) · [Single-table design primer](https://www.alexdebrie.com/posts/dynamodb-single-table/)
- [EventBridge best practices](https://docs.aws.amazon.com/eventbridge/latest/userguide/eb-best-practices.html)
- [Amplify SSR compute role (ComputeRoleArn)](https://docs.aws.amazon.com/amplify/latest/userguide/ssr-compute-role.html)
- [CDK Pipelines multi-account bootstrapping](https://docs.aws.amazon.com/cdk/v2/guide/cdk_pipeline.html)
- [Secrets Manager best practices](https://docs.aws.amazon.com/secretsmanager/latest/userguide/best-practices.html)
