<!-- Conditional reference. The current SKILL.md and host policy take precedence. Paths are relative to this skill folder. -->

## First-pass inventory

Search for and inspect, as applicable:

- CDK, CloudFormation, Terraform, Pulumi, Serverless, Amplify, migration tools,
  database modules, and application deployment configuration;
- engine, engine mode/version, cluster and instance classes, Serverless v2 minimum
  and maximum ACUs, promotion tiers, reader count, global-cluster membership,
  deletion protection, and copy-tags settings;
- writer, reader, custom, proxy, instance, and Data API endpoints; connection
  strings, DNS caching, timeouts, retry policy, transaction boundaries, and pool
  settings across every service, Lambda concurrency, job, and local tool;
- schemas, migrations, extensions, functions/triggers, indexes, views, query
  builders/ORMs, repositories, transaction code, pagination, and tests;
- tenant identity/membership and authorization, tenant control-plane/catalog,
  pool/bridge/silo placement, `tenant_id` constraints/indexes/RLS, per-tenant
  routing, onboarding, quotas, background jobs, exports, deletion, and migration
  status;
- VPC/subnets, security groups, private/public accessibility, TLS enforcement,
  IAM database authentication, Secrets Manager, KMS, audit/log exports, and
  cross-account access;
- automated-backup/PITR retention, snapshots, cross-Region/cross-account copies,
  restore drills, maintenance windows, minor/major upgrade policy, parameter groups,
  and blue/green or staged rollout controls; and
- CloudWatch metrics/alarms, Performance Insights or Database Insights, Enhanced
  Monitoring, slow-query logs, engine logs, tracing, dashboards, and cost reports.

If a deployed fact or downstream consumer cannot be inspected, mark it unknown. Do
not infer safety from a clean `cdk diff`, a healthy instance, or a successful local
migration alone.
