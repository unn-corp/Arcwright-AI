<!-- Conditional reference. The current SKILL.md and host policy take precedence. Paths are relative to this skill folder. -->

## Security, operations, and cost

- Use least-privilege administrative IAM; separate operators who manage pools,
  clients, IdPs, triggers, and IAM roles from application runtime roles. Protect
  client secrets and signing/IdP material in managed secret stores.
- Put WAF and rate controls in front of public authentication surfaces where the
  threat model warrants it. Monitor credential stuffing, sign-up abuse, enumeration,
  MFA/SMS spend, token endpoint throttles, trigger failures, refresh anomalies, and
  unusual tenant concentration.
- Configure verification/recovery messages with a verified sender/domain, safe
  templates, anti-enumeration behavior, bounce/complaint handling, and links that
  cannot be redirected to an untrusted host. Coordinate delivery with SES/SNS/SMTP
  best practices.
- Tag pools, clients, identity pools, domains, triggers, and supporting resources
  with environment/owner/data-classification/cost-center metadata. Keep audit logs
  and CloudTrail retention aligned with incident and compliance needs.
- Treat quotas and billing as design inputs. Record per-account/Region quotas,
  token endpoint rates, user/tenant growth, MAU/trigger/message costs, and expected
  peaks. Request quota increases or shard by account/Region only after documenting
  why the isolation and operating model justify it.
