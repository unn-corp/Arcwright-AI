#!/usr/bin/env node
'use strict';

// Read-only post-edit reviewer. It emits focused Lambda reminders; it never runs a
// build, calls AWS, invokes a function, changes a file, or blocks an edit.

const fs = require('node:fs');
const path = require('node:path');
const { projectRoot, readPayload, repoLooksLambda } = require('./lambda-context');

const LAMBDA_PATH = /(?:^|\/)(?:lambda|functions?|handlers?|serverless|sam|template|infra|infrastructure|cdk|api|backend)\b/i;
const CONFIG_PATH = /(?:^|\/)(?:template\.ya?ml|samconfig\.toml|serverless\.ya?ml|cdk\.json|package\.json|package-lock\.json|pnpm-lock\.yaml|yarn\.lock)$/i;
const SOURCE_PATH = /(?:^|\/)(?:src|app|api|backend|functions?|handlers?|lambda|services|infra|infrastructure)\/(?:[^/]+\/)*[^/]+\.(?:[cm]?[jt]sx?|py|java|go|rs|rb|cs)$/i;
const UI_SOURCE = /(?:^|\/)(?:src|app|pages|components|frontend|client)\/(?:[^/]+\/)*[^/]+\.(?:[cm]?[jt]sx?|vue|svelte)$/i;

function toolInput(payload = {}) {
  return payload.tool_input || payload.toolInput || payload.input || payload;
}

function changedPath(payload = {}) {
  const input = toolInput(payload);
  return String(input.file_path || input.filePath || input.path || payload.file_path || payload.filePath || '');
}

function changedText(payload = {}) {
  const input = toolInput(payload);
  return String(input.content || input.new_string || input.newString || input.new_text || input.newText || '');
}

function readRepoFile(root, relative) {
  try {
    return fs.readFileSync(path.join(root, relative), 'utf8');
  } catch {
    return '';
  }
}

function relevantPath(filePath, content, root) {
  const normalized = filePath.replaceAll('\\', '/');
  return LAMBDA_PATH.test(normalized) || CONFIG_PATH.test(normalized) ||
    (SOURCE_PATH.test(normalized) && (repoLooksLambda(root) || /(?:lambda|handler|aws-sdk|serverless|eventSource|exports\.handler)/i.test(content))) ||
    (UI_SOURCE.test(normalized) && repoLooksLambda(root) && /(?:lambda|invoke|fetch|api|async)/i.test(content));
}

function inspect(filePath, content, root) {
  const normalized = filePath.replaceAll('\\', '/');
  const fullText = content || (path.isAbsolute(filePath)
    ? readRepoFile(root, path.relative(root, filePath))
    : readRepoFile(root, normalized));
  const findings = [];
  const isSource = SOURCE_PATH.test(normalized);
  const isUi = UI_SOURCE.test(normalized);

  if (/(?:console\.(?:log|error|warn)|logger\.(?:info|error|debug))\s*\(\s*(?:event|req|request|record|body)\b/i.test(fullText) ||
      /JSON\.stringify\s*\(\s*(?:event|req|request|record|body)\b/i.test(fullText)) {
    findings.push('The edit appears to log a full Lambda event/request/record; redact tokens, credentials, payloads, and personal data and log only bounded correlation/outcome fields.');
  }

  if (isSource && /(?:exports?\.handler|module\.exports\s*=|export\s+(?:async\s+)?function\s+handler|export\s+const\s+handler)/i.test(fullText) &&
      /new\s+(?:AWS\.|[A-Z][A-Za-z0-9]*(?:Client|Pool|Connection)|(?:DynamoDB|S3|SQS|SNS|Lambda|SecretsManager|RDS))/i.test(fullText)) {
    findings.push('A reusable AWS client/connection appears near the Lambda handler; initialize safe reusable clients outside the handler, then handle stale keep-alive connections and never retain request/tenant state globally.');
  }

  if (/(?:InvokeCommand|lambda\.invoke|invoke\s*\(|invokeFunction)/i.test(fullText) &&
      /(?:handler|functionName|FunctionName|self|recursive|process\.env)/i.test(fullText)) {
    findings.push('Lambda invocation appears inside Lambda-related code; check for recursive self-invocation or event loops, explicit source guards, bounded depth/budget, and an emergency throttle plan.');
  }

  if (/(?:Promise\.all\s*\(|\.map\s*\(.*=>.*(?:fetch|invoke|put|send|query))/is.test(fullText)) {
    findings.push('Unbounded parallel downstream work may be introduced; cap concurrency and compare it with database connections, API quotas, tenant budgets, and queue visibility before using Promise.all/map fan-out.');
  }

  if (isSource && /(?:fetch\s*\(|axios\.|https\.(?:request|get|post)|http\.(?:request|get|post))/i.test(fullText) &&
      !/(?:AbortController|timeout|connectTimeout|socketTimeout|requestTimeout|deadline)/i.test(fullText)) {
    findings.push('An external network call appears without an evident timeout/deadline; bound connect/read/overall time and define retry/cancellation behavior below the upstream Lambda timeout.');
  }

  if (/(?:PutItem|UpdateItem|DeleteItem|TransactWrite|INSERT|UPDATE|DELETE|charge|payment|sendEmail|publish|sendMessage|putObject)/i.test(fullText) &&
      /(?:handler|eventSource|record|message|request)/i.test(fullText) &&
      !/(?:idempot|dedup|conditional|clientRequestToken|businessKey|eventId|sequenceNumber)/i.test(fullText)) {
    findings.push('A retriable side effect appears without an evident idempotency key/conditional write; handle duplicate delivery and timeout-after-commit before retrying the mutation.');
  }

  if (/(?:Action|actions)\s*[:=][\s\S]{0,180}[\"']\*[\"']|Resource\s*[:=]\s*[\"']\*[\"']|AdministratorAccess/i.test(fullText) &&
      (LAMBDA_PATH.test(normalized) || /AWS::Lambda::Function|lambda/i.test(fullText))) {
    findings.push('Broad IAM action/resource or administrator access appears near Lambda configuration; inspect generated execution/invoke policies and narrow actions, ARNs, conditions, and cross-account trust.');
  }

  if (/(?:VpcConfig|vpcConfig|subnetIds|securityGroupIds)/i.test(fullText)) {
    findings.push('Lambda VPC networking is in scope; verify the private dependency requirement, multi-AZ subnets, DNS/NAT or interface endpoints, security groups, database connections, and measured latency before keeping the path.');
  }

  if (/(?:tenant|multi.?tenant|organization|workspace|tenantId|orgId)/i.test(fullText) &&
      (LAMBDA_PATH.test(normalized) || isSource) &&
      !/(?:membership|entitlement|authorize|authorization|permission|object.?owner|tenant.?check|tenant.?predicate|current.?user)/i.test(fullText)) {
    findings.push('Tenant concepts appear without an evident server-side membership/authorization check; validate identity, tenant status, action, and object ownership for every sensitive read/write.');
  }

  if (isUi && /(?:invoke|fetch|api|lambda|request)/i.test(fullText)) {
    findings.push('A UI/API path depends on Lambda; verify no serial/N+1 invocation waterfall, measure p75/p95/p99 and Web Vitals, and represent async work as accepted/pending/failed with recovery.');
  }

  return [...new Set(findings)];
}

function emit(payload, findings) {
  const event = payload.hook_event_name || payload.event || process.env.CLAUDE_HOOK_EVENT_NAME || 'PostToolUse';
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: event,
      additionalContext: [
        'The lambda-best-practices post-edit review signal fired:',
        ...findings.map((finding) => `- ${finding}`),
        'Load the full skill before making a runtime, event, IAM, tenancy, deployment, or performance decision; this hook is advisory and read-only.',
      ].join('\n'),
    },
  }) + '\n');
}

if (require.main === module) {
  const payload = readPayload();
  const root = projectRoot(payload);
  const filePath = changedPath(payload);
  const content = changedText(payload);
  if (filePath && relevantPath(filePath, content, root)) {
    const findings = inspect(filePath, content, root);
    if (findings.length > 0) emit(payload, findings);
  }
}

module.exports = {
  changedPath,
  inspect,
  relevantPath,
};
