---
name: setting-up-customer-cicd-gates
description: Use when setting up CI/CD, branch protection, or a dev/prod branch split for a customer-* or AWS-* repo in the unn-corp org, or when wiring a WAF WebACL to an Amplify Hosting app, or when a GitHub Actions job adds `environment:` to a workflow that already has an OIDC role trust policy.
---

# Setting Up Customer CI/CD Gates (unn-corp)

## Overview

unn-corp customer/workload repos share one CI/CD shape: a reusable
`unn-corp/.github/.github/workflows/aws-deploy.yml@v1` workflow (OIDC-assumes
a `WorkloadDeployer` role, `cdk synth`+`diff` on PRs, `cdk deploy` on push).
What varies — and what silently breaks if you assume generic AWS/GitHub
knowledge applies — are org-specific constraints only discoverable by testing
live. This skill captures those, found while building this pipeline for
`customer-frontporch-site` (2026-07-01): a GitHub plan limit, an OIDC claim
gotcha, and a wrong-service bug in a WAF↔Amplify association that had been
silently failing in CI for weeks despite looking correct.

**Core principle: verify live, don't assume.** Every fact below was confirmed
by hitting the actual GitHub API or reading a real `AccessDeniedException`,
not inferred from general AWS/GitHub knowledge — general knowledge gets the
*shape* of these right and the *specifics* wrong.

## When to Use

- Standing up CI/CD + branch protection for a new or existing customer/workload
  repo in `unn-corp`.
- Adding a dev/prod (or dev/staging/prod) split to a repo that only deploys one
  environment today.
- A `cdk deploy` step wires a WAF WebACL to an Amplify Hosting app via a CDK
  custom resource.
- A GitHub Actions job needs `environment:` added to gate a deploy, and an
  OIDC role trust policy already exists for that repo.

## Org Constraint: GitHub Free Plan Blocks Real Branch Protection

`unn-corp` is on GitHub Free. **Do not assume classic branch protection,
repository rulesets, or Environment "required reviewers"/"wait timer" rules
work — they return `403 Upgrade to GitHub Pro` for private repos.** Verify
before promising them:

```bash
gh api repos/unn-corp/<repo>/branches/main/protection   # 403 = blocked
gh api repos/unn-corp/<repo>/rulesets                    # 403 = blocked
gh api -X PUT repos/unn-corp/<repo>/environments/<name> -F wait_timer=1   # 422 "billing plan" = blocked
```

If any of these unexpectedly return 200 (org upgraded to Team), the guidance
below still applies but you can layer real branch protection on top.

**What still works for free**, and is the only real lever until someone
upgrades the org: an Environment's `deployment_branch_policy`, scoping which
branch may deploy to that environment.

```bash
gh api -X PUT repos/unn-corp/<repo>/environments/production \
  -F 'deployment_branch_policy[protected_branches]=false' \
  -F 'deployment_branch_policy[custom_branch_policies]=true'
gh api -X POST repos/unn-corp/<repo>/environments/production/deployment-branch-policies -f name=main
```

This does **not** require PR review or block direct pushes — document that
gap explicitly in the repo's CLAUDE.md rather than implying real protection
exists. Don't spend time on CODEOWNERS auto-assignment either: it requests
reviews but can't require them without the same blocked branch-protection
feature.

## Dev/Prod Split: Two Established Patterns, Pick Deliberately

| Pattern | When | Precedent |
|---|---|---|
| **Same-account, stack-name split** | Repo's `main` account is a single-tenant silo (no dev account exists/planned) | `customer-redoit-renevations`, `customer-brothers-fabrication` |
| **Separate account per branch** | Repo is an internal multi-env workload with real dev/prod account separation | `AWS-UnnamedDev`, `AWS-Squidhub` (see `AWS-Platform/bin/aws-platform.ts`) |

Don't default to "dev branch → dev AWS account" without checking which
pattern the specific repo already follows — grep the repo's own CLAUDE.md and
`bin/*.ts` for `Tenancy` / `envName` / account-ID constants before assuming.

For the same-account pattern:
- Thread an `envName: 'prod' | 'dev'` prop through every stack; namespace every
  resource name that's account-unique (S3 buckets, Secrets Manager paths) or
  *globally* unique (Cognito Hosted UI domain prefixes — collide across ALL of
  AWS, not just your account).
- In the deploy workflow, use **explicit stack name lists per branch, never
  `--all`** once dev stacks exist in the same CDK app — `--all` on a `main`
  push will also deploy the `-dev` stacks.
- The IAM `WorkloadDeployer` role's OIDC trust needs `ref:refs/heads/main`
  AND `ref:refs/heads/dev` subjects (see `WorkloadAccessStack` in
  `AWS-Platform/lib/workload-access-stack.ts` — `workloadStack()` there
  accepts an array of branches for this).
- Not every stack needs a dev counterpart. If a stack watches a *shared*
  external repo (e.g. an Amplify app pointed at a shared Next.js app repo used
  by every tenant), check whether that shared repo even has a `dev` branch
  before promising a dev web environment — creating one is a decision that
  affects every tenant, not just this repo, so flag it rather than doing it
  unprompted.

## Gotcha: `environment:` Changes the OIDC Subject Claim

Adding `environment: <name>` to a job in the reusable `aws-deploy.yml`
workflow (to get the `deployment_branch_policy` gate above) changes the GitHub
OIDC token's `sub` claim from the ref-based form to
`repo:org/repo:environment:<name>`. An OIDC trust policy written only for
`ref:refs/heads/<branch>` subjects will then fail with:

```
Could not assume role with OIDC: Not authorized to perform sts:AssumeRoleWithWebIdentity
```

Fix: add `repo:unn-corp/<repo>:environment:<name>` as an additional trusted
subject for every environment name used, alongside the ref-based ones — don't
replace the ref-based subjects, since PR/diff jobs still use them.

## Gotcha: WAF WebACL ↔ Amplify Hosting Association

There is no `amplify:AssociateWebACL` SDK command — `@aws-sdk/client-amplify`
has no WebACL-related command at all (verify: `npm view @aws-sdk/client-amplify`
then list `dist-types/commands/`). The real call is WAFv2's:

```ts
new cr.AwsCustomResource(this, 'WafAssociation', {
  onUpdate: {
    service: 'wafv2',
    action: 'associateWebACL',
    parameters: { ResourceArn: amplifyAppArn, WebACLArn: webAcl.attrArn },
    physicalResourceId: cr.PhysicalResourceId.of(`${app.appId}-waf`),
  },
  onDelete: {
    service: 'wafv2',
    action: 'disassociateWebACL',
    parameters: { ResourceArn: amplifyAppArn },
  },
  policy: cr.AwsCustomResourcePolicy.fromStatements([
    new iam.PolicyStatement({
      actions: ['wafv2:AssociateWebACL', 'wafv2:DisassociateWebACL',
                'wafv2:GetPermissionPolicy', 'wafv2:PutPermissionPolicy'],
      resources: [webAcl.attrArn, amplifyAppArn],
    }),
    // WAFv2's call proxies internally to Amplify, which re-checks the CALLER
    // against these actions even though nothing invokes them as SDK commands.
    // Omitting this grant fails with an AccessDeniedException naming
    // amplify:AssociateWebACL specifically — easy to misread as "add
    // installLatestAwsSdk" (it isn't an SDK-staleness issue).
    new iam.PolicyStatement({
      actions: ['amplify:AssociateWebACL', 'amplify:DisassociateWebACL', 'amplify:GetWebACL'],
      resources: [amplifyAppArn],
    }),
    new iam.PolicyStatement({
      actions: ['wafv2:GetWebACLForResource'],
      resources: ['*'],  // authorizes on the looked-up resource, not the WebACL
    }),
  ]),
});
```

- The WebACL's `scope` must be **`CLOUDFRONT`**, not `REGIONAL` — Amplify Hosting
  is CloudFront-backed. `AssociateWebACLRequest`'s `ResourceArn` docs
  (`@aws-sdk/client-wafv2` models) confirm the Amplify ARN pattern directly:
  `arn:<partition>:amplify:<region>:<account-id>:apps/<app-id>`.
- Each of the three IAM statements above surfaces as a *distinct*
  `AccessDeniedException` one at a time as you add them — that's expected,
  not a sign something else is wrong. Iterate: deploy, read the exact denied
  action from the error, add it, redeploy.

## Verification Checklist

Don't declare a CI/CD pipeline "done" from a clean `cdk synth`/`diff` alone —
these gotchas only surface at real deploy time:

- [ ] `gh api repos/.../branches/main/protection` (or rulesets) checked live,
      not assumed
- [ ] Every stack in the deploy job's stack list actually `cdk deploy`s clean
      against the real account (not just `--all` locally)
- [ ] If `environment:` is used, the OIDC trust policy has the
      `environment:<name>` subject
- [ ] If a WAF↔Amplify association exists, `aws wafv2 get-web-acl-for-resource
      --resource-arn <amplify-app-arn>` returns the expected WebACL
- [ ] Push to each branch (main AND dev) watched end-to-end with
      `gh run watch <id> --exit-status`, not just "workflow file looks right"

## Common Mistakes

| Mistake | Reality |
|---|---|
| Assuming branch protection works because it's a standard GitHub feature | Free-plan private repos get `403`; test the actual API before promising it |
| Adding `environment:` to a job that already has OIDC trust | Breaks auth unless the trust policy also covers the `environment:` subject form |
| "AssociateWebACL" → default to Amplify's SDK client | That command doesn't exist; it's a WAFv2 call, and it *also* needs `amplify:*` IAM grants for WAF's internal proxy call |
| WAF WebACL `scope: REGIONAL` for an Amplify app | Must be `CLOUDFRONT` — Amplify Hosting is CloudFront-backed |
| `cdk deploy --all` once `-dev` stacks exist in the same app | Deploys dev stacks on a `main` push too; use explicit per-branch stack lists |
| Treating a clean `cdk diff` as proof the pipeline works | Diff doesn't execute custom resources or hit the actual IAM/OIDC checks a live deploy does |
