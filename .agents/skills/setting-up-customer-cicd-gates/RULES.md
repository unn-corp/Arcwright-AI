# RULES — setting-up-customer-cicd-gates

> Load full `SKILL.md` when actually building/editing CI/CD gates, branch
> protection, or a dev/prod split for an unn-corp repo, or wiring WAF↔Amplify.

## Core Rules

1. `unn-corp` is on GitHub **Free**. Never promise classic branch protection,
   rulesets, or Environment required-reviewers/wait-timer — they 403 for
   private repos. Verify live with `gh api`, don't assume.
2. The only free-tier deploy gate that works: Environment
   `deployment_branch_policy`. It scopes *which branch deploys where*, not PR
   review or push blocking — say so explicitly, don't imply real protection.
3. Two dev/prod patterns exist in this org: same-account (stack-name split,
   `envName` prop) vs. separate-account-per-branch. Check the repo's own
   project instructions/`bin/*.ts` before picking one — don't default blindly.
4. Same-account pattern: use **explicit stack lists per branch** in the deploy
   workflow, never `cdk deploy --all`, once `-dev` stacks exist.
5. Adding `environment:` to a deploy job changes the OIDC `sub` claim to
   `repo:org/repo:environment:NAME`. Add that as a trusted subject alongside
   the ref-based ones or auth breaks with `Not authorized to perform
   sts:AssumeRoleWithWebIdentity`.
6. WAF↔Amplify WebACL association is a **WAFv2** call
   (`wafv2:AssociateWebACL`), not an Amplify SDK command (doesn't exist).
   WebACL `scope` must be `CLOUDFRONT`, not `REGIONAL`.
7. That WAFv2 call proxies internally to Amplify — IAM also needs
   `amplify:AssociateWebACL`/`DisassociateWebACL`/`GetWebACL` grants even
   though nothing calls them directly, plus `wafv2:Get/PutPermissionPolicy`.
8. A clean `cdk synth`/`diff` proves nothing about custom resources or
   IAM/OIDC — verify with a real deploy and a real `gh run watch`.

## Red Flags (stop and apply skill)

- About to write "add branch protection rules" for an unn-corp repo without
  first checking `gh api repos/.../branches/main/protection`.
- Adding `environment:` to a workflow job that has existing OIDC role trust.
- Writing a WAF↔Amplify association custom resource from memory instead of
  checking the actual SDK command list.
- Assuming a customer repo's dev/prod pattern instead of checking precedent.
