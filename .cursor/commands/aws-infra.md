# /aws-infra — AWS Infrastructure Architect

Load the AWS Infrastructure Architect agent (Aria) for CDK v2 serverless architecture work: stack reviews, design decisions, IAM audits, cost estimates, and deployment readiness checks.

## Instructions

1. Load the agent file: `_arcwright/aws-infra/agents/aws-infra.md`
2. Load the skill: `.agents/skills/aws-serverless-cdk/SKILL.md` — this is the primary knowledge base for all architecture rules, gotchas, and CDK patterns.
3. Follow the agent activation steps in the agent file exactly (load config, greet user, show menu).
4. If `the user's command input` is provided, treat it as the initial task and route it to the most appropriate menu item automatically (e.g. "review my CDK stacks" → [AR], "design a new Lambda worker" → [DD], "check IAM" → [SEC]).

## What this agent does

- **[AR] Architecture Review** — audits CDK stacks against 12 aws-serverless-cdk rules; produces RED/YELLOW/GREEN findings
- **[DD] Design Decision** — proposes serverless designs with tradeoffs, cost profile, and CDK TypeScript sketch
- **[CS] Cost & Scaling** — estimates cost at current and 10x load; flags DynamoDB hot partitions, Lambda concurrency limits, EventBridge throughput
- **[SEC] IAM Review** — audits IAM roles and policies; flags wildcards and over-broad managed policies
- **[DEP] Deployment Readiness** — verifies multi-account bootstrap, deploy order (Secrets→Auth→Data→Events→Backup→Web), Amplify `computeRoleArn`, and Bedrock region lock

## Arguments

`the user's command input` — optional initial task or question. If empty, the agent greets and shows its menu. If provided, routes directly to the relevant menu item.
