---
name: "aws-serverless-cdk"
description: "Design or review AWS serverless infrastructure using CDK, including service integration, IAM, deployment boundaries, and operational requirements."
allowed-tools: Read Write Edit Grep Glob Bash(*)  WebFetch
---

# AWS CDK v2 serverless infrastructure

Implement the requested TypeScript infrastructure change with an explicit account,
Region/environment, existing service contracts and deployment boundary. Reuse the
project's constructs and lockfile. Review-only work stays analytical; synthesis or
a tool allowlist does not authorize deploy, bootstrap, IAM changes or production
traffic. Preserve the user's chosen architecture and required repository checks.

## Core decisions

- Use L2 constructs by default. Use a typed L1 child/escape hatch for a property
  the installed L2 lacks; reserve L3/custom patterns for established organizational
  policy. Verify generated CloudFormation instead of assuming defaults.
- Give Lambda a focused event contract, least-privilege role, validated/idempotent
  effects and bounded retries. Reuse clients at module scope; do not keep durable
  or request-specific mutable state there. Keep structured logs, traces and metrics;
  use existing Powertools instrumentation where the project adopts it.
- Design DynamoDB from access patterns and index/key requirements. Preserve the
  established single-table key scheme and assess PITR/retention/Streams/TTL for
  their actual data/event contracts. Do not enable unrelated features or redesign
  every entity solely because the skill was invoked.
- Use precise EventBridge source/detail-type/detail filters and a domain bus where
  appropriate. Verify cross-account resource policy and target permissions; broad
  default-bus matches can produce unexpected traffic or recursive effects.
- For Amplify SSR routes that call AWS services, configure the appropriate compute
  role with narrowly scoped resources/actions. Use the installed L2 property or
  `ComputeRoleArn` escape hatch when needed. Keep Amplify variables free of reserved
  `AWS_` names; the compute role differs from the build/service role.
- Pass secret references/ARNs to functions and resolve values through authorized
  runtime access with bounded refresh/rotation. Never expose secret values in
  synthesized output, environment snapshots or logs. A permanent cache does not
  transparently follow rotations.
- For multi-account pipelines, verify bootstrap trust and deployment-role scope in
  each target account/Region. Derive account configuration from approved context;
  order stages from real dependencies (for example Secrets → Auth → Data → Events
  → Backup → Web when that matches the project).
- Preserve the required Cognito federation, group/authorization and MFA policy.
  Optional TOTP is an example posture, not authority to weaken mandatory MFA.
  Verify Bedrock model/Region or inference-profile availability from current AWS
  documentation rather than copying a stale region restriction.
- For SES automation, route bounce/complaint events through a monitored event
  destination and idempotent consumer, not an unattended email feedback inbox.
  For backup changes, verify cross-account copies, retention and restore policy;
  Vault Lock can create irreversible retention commitments and needs explicit scope.

## Verification

Run the affected type/build checks, synth and existing assertions. Inspect the diff
for replacement/deletion, wider roles/trust, secret values, target/trigger drift and
cross-environment references. Use `test-quality` when changing behavior tests; do not
build a new harness for a small construct edit. Verify a deployment only in an
authorized environment with bounded synthetic traffic and rollback/restore evidence
appropriate to the change. Report what was observed, pending checks and risks.

## Conditional recipes

The [rule-by-rule guide](references/workflow-guide.md#rule-1-single-purpose-share-nothing-lambda-functions)
contains construct examples. Read only the rule for the affected service: L2/L1,
Powertools, DynamoDB, EventBridge, Amplify, secrets, pipelines, Cognito, Bedrock,
SES or backup. Check the [official sources](references/workflow-guide.md#source-references)
for installed API/current service behavior before applying example syntax.
