# 13. AWS Infrastructure-as-Code Posture (CDK / CloudFormation / Terraform)
**Maps to:** `references/misconfiguration.md`, `references/data-protection.md`, `references/supply-chain.md`

A static scan of **IaC source** — AWS CDK (TypeScript/Python), the synthesized
CloudFormation in `cdk.out/`, raw CloudFormation/SAM templates, and Terraform `.tf`. It
asks *"does the infrastructure this repo defines follow AWS security best practice?"* No
live account access — this reads the code that will become infrastructure.

> For a deployed-account audit (live IAM, S3 public access, GuardDuty), that's a separate
> exercise (Prowler/ScoutSuite) and is **out of scope** here.

**Detect (skip to N/A if none match):**
```bash
ls cdk.json && ls lib/ bin/ 2>/dev/null            # CDK app
ls cdk.out/*.template.json 2>/dev/null             # synthesized CFN (best signal — scan this)
git ls-files | grep -E "\.tf$|template\.ya?ml$|\.template\.json$|serverless\.yml$" | head
```

**Run tools (use whichever are installed; note unavailable, fall back to grep):**
```bash
# Synthesize first if it's a CDK app and cdk.out is stale
command -v cdk >/dev/null && [ -f cdk.json ] && cdk synth >/dev/null 2>&1 || echo "cdk synth skipped"

# Policy-as-code scanners (any of these)
command -v checkov   >/dev/null && checkov -d . --compact --quiet 2>/dev/null | tail -40
command -v cfn-lint  >/dev/null && cfn-lint cdk.out/*.template.json 2>/dev/null | head -40
command -v cfn_nag_scan >/dev/null && cfn_nag_scan --input-path cdk.out 2>/dev/null | tail -40
command -v trivy     >/dev/null && trivy config --severity HIGH,CRITICAL . 2>/dev/null | tail -40
command -v tfsec     >/dev/null && tfsec . 2>/dev/null | tail -40   # Terraform
# cdk-nag is a construct-level aspect — check whether the app already wires it:
grep -rniE "cdk-nag|AwsSolutionsChecks|NagSuppressions" --include=*.{ts,js,py} . | head
```

> **cdk-nag** is the highest-signal control for a CDK app: if `AwsSolutionsChecks` is added
> as an Aspect, the team already gets these checks at synth time. If it's absent, recommend
> adding it — that alone covers most of the items below.

**What good looks like:**

- **IAM — least privilege.** No `Action: "*"` or `Resource: "*"` on custom policies; no
  `AdministratorAccess`; scoped `iam:PassRole` (a wildcard `PassRole` is a privilege-
  escalation path); assume-role trust policies pinned to known principals (no
  `Principal: "*"`, and cross-account trust requires `ExternalId` or a specific account).
  Watch for **`NotAction` / `NotResource`** allow statements (often broader than intended)
  and `Condition`-less `sts:AssumeRole`. Prefer **permission boundaries** on roles that can
  create other roles; prefer CDK `grant*()` helpers over hand-written `PolicyStatement`
  wildcards. No long-lived IAM user **access keys** baked into infra (use roles).
- **S3.** `BlockPublicAcls`/`BlockPublicPolicy`/`IgnorePublicAcls`/`RestrictPublicBuckets`
  all true (or `s3.BlockPublicAccess.BLOCK_ALL`); default encryption on; `enforceSSL: true`
  (TLS-only bucket policy); versioning where data matters. No `publicReadAccess: true`.
- **Secrets.** Pulled from Secrets Manager / SSM `SecureString` at deploy/runtime — **not**
  hardcoded in CDK source, CFN `Parameters` (plaintext), or `environment:` blocks. No
  `NoEcho: false` secrets; no secrets in Lambda env vars in plaintext.
- **Networking.** Security groups don't open `0.0.0.0/0` to sensitive ports (22, 3389, 3306,
  5432, 6379, 27017); databases (RDS/ElastiCache) in private subnets, `publiclyAccessible:
  false`; no default-VPC reliance for prod.
- **Encryption at rest.** RDS/Aurora `storageEncrypted: true`; EBS encrypted; DynamoDB
  encryption (default AWS-owned at minimum, CMK for sensitive); SNS/SQS/Kinesis encrypted;
  KMS keys with rotation enabled.
- **API Gateway / Lambda.** Routes have an authorizer (IAM/Cognito/Lambda) or are
  intentionally public; Lambda **Function URLs** set `authType: AWS_IAM` (not `NONE`);
  resource policies scoped; no `*` invoke permissions.
- **API throttling & quotas (AWS-native rate limiting).** API Gateway has **throttling**
  set — account/stage `throttlingRateLimit` + `throttlingBurstLimit`, and **usage plans
  with API keys + quotas** for partner/public APIs. REST APIs default to 10k rps account-
  wide; without per-stage/per-method limits one caller can exhaust it. HTTP APIs and ALB
  have no built-in per-route throttle → enforce at **WAF rate-based rules** instead. This is
  the cloud-edge counterpart to app-level rate limiting (topic 6) — they complement, not
  replace, each other.
- **WAF (edge protection).** Internet-facing **CloudFront, ALB, and API Gateway** fronted by
  a **WAFv2 WebACL** that is actually **associated** (a WebACL defined but not associated
  protects nothing). WebACL includes: AWS **managed rule groups**
  (`AWSManagedRulesCommonRuleSet`, `KnownBadInputs`, `SQLiRuleSet`, `IpReputationList`),
  at least one **rate-based rule** (e.g. 2000 req/5min/IP) for brute-force/DDoS, and default
  action `BLOCK` with explicit allows. Logging enabled to CloudWatch/S3/Firehose.
- **Edge / transport.** CloudFront `viewerProtocolPolicy: redirect-to-https` + modern
  `minimumProtocolVersion` (TLSv1.2_2021); ALB HTTP→HTTPS redirect.
- **Logging & monitoring.** CloudTrail enabled (multi-region, log-file validation); S3/ALB/
  CloudFront access logs on; CloudWatch **log retention set** (not infinite/never-expire);
  GuardDuty / AWS Config / Security Hub enabled at the account/org level.
- **Removal & data safety.** Stateful resources (RDS, DynamoDB, S3 with data) use
  `RemovalPolicy.RETAIN` or have deletion protection in prod, not silent `DESTROY`.

**Red flags (findings):**
| Pattern | Severity |
|---------|----------|
| IAM policy with `Action:"*"` + `Resource:"*"`, or `AdministratorAccess` on a role | **Critical/High** |
| Wildcard `iam:PassRole`, or cross-account `AssumeRole` trust with no `ExternalId`/condition | **High** |
| Internet-facing CloudFront/ALB/API GW with **no WAF associated** | **High/Medium** |
| WAFv2 WebACL with no rate-based rule, or default action `ALLOW` | **Medium** |
| API Gateway with no throttling / no usage-plan quotas on public routes | **Medium** |
| S3 bucket public (no BlockPublicAccess, `publicReadAccess:true`) holding non-public data | **Critical/High** |
| Hardcoded secret/key in CDK source or plaintext CFN Parameter / Lambda env | **Critical** |
| Security group `0.0.0.0/0` → 22/3389/3306/5432/6379 | **High** |
| RDS/ElastiCache `publiclyAccessible:true` | **High** |
| Lambda Function URL `authType: NONE` exposing privileged logic | **High** |
| Encryption at rest disabled on RDS/EBS/DynamoDB/SQS holding sensitive data | **High/Medium** |
| CloudFront/ALB serving plain HTTP, weak TLS min version | **Medium/High** |
| No CloudTrail / no log retention / no GuardDuty | **Medium** |
| `RemovalPolicy.DESTROY` (or default) on a production data store | **Medium** |

**Grep fallbacks (when no scanner is installed):**
```bash
grep -rniE "Action.{0,8}[\"']\\*[\"']|Resource.{0,8}[\"']\\*[\"']|AdministratorAccess|managedPolicies.*Admin" --include=*.{ts,js,py,json,yaml,yml} .
grep -rniE "publicReadAccess.*true|publiclyAccessible.*true|BlockPublicAccess|enforceSSL|blockPublicAccess" --include=*.{ts,js,py} .
grep -rniE "anyIpv4|0\.0\.0\.0/0|Peer\.anyIpv4|allowAllOutbound" --include=*.{ts,js,py} .
grep -rniE "storageEncrypted|encryption[: ]|encrypted.*false|RemovalPolicy\.(DESTROY|RETAIN)|deletionProtection" --include=*.{ts,js,py} .
grep -rniE "authType.*(NONE|AWS_IAM)|FunctionUrlAuthType|viewerProtocolPolicy|minimumProtocolVersion" --include=*.{ts,js,py} .
grep -rniE "retention|RetentionDays|removalPolicy|logRetention" --include=*.{ts,js,py} .
# IAM depth
grep -rniE "PassRole|NotAction|NotResource|sts:AssumeRole|ExternalId|PermissionsBoundary|AccessKey|CfnAccessKey" --include=*.{ts,js,py,json,yaml,yml} .
# WAF + API throttling (rate limiting at the edge)
grep -rniE "CfnWebACL|WebACL|wafv2|associateWebAcl|WebACLAssociation|ManagedRuleGroup|RateBasedStatement|rate-based" --include=*.{ts,js,py,json,yaml,yml} .
grep -rniE "throttlingRateLimit|throttlingBurstLimit|UsagePlan|addUsagePlan|QuotaSettings|ThrottleSettings|apiKeyRequired" --include=*.{ts,js,py} .
```

**Verdict guidance:**
- ✅ **Pass** — cdk-nag/checkov clean (or grep shows least-privilege IAM, blocked-public S3,
  encryption on, secrets externalized, scoped SGs, logging+retention configured).
- ⚠️ **Weak** — mostly good but gaps: missing log retention, no cdk-nag, a couple of
  over-broad grants, no WAF.
- ❌ **Fail** — any Critical (wildcard admin IAM, public S3 with data, hardcoded secret,
  DB open to the internet).

Report findings as `SCAN-NN` with the synthesized-template or construct `file:line`.
