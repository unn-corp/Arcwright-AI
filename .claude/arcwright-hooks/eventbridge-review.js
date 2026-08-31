#!/usr/bin/env node
'use strict';

// Read-only post-edit reviewer. It never publishes, enables, disables, replays,
// calls AWS, reads credentials, edits files, or blocks an edit.

const fs = require('node:fs');
const path = require('node:path');
const { projectRoot, readPayload, repoLooksEventBridge } = require('./eventbridge-context');

const EVENTBRIDGE_CONFIG = /(?:^|\/)(?:eventbridge|events?|event-bus|event-pattern|scheduler|pipes|archive|replay|global-endpoint|serverless|cdk|terraform)[^/]*\.(?:json|ya?ml|tf|tfvars|js|ts|mjs|cjs)$/i;
const EVENTBRIDGE_SOURCE = /(?:^|\/)[^/]+\.(?:[cm]?[jt]sx?|py|go|java|rb|php|cs|sql)$/i;

function toolInput(payload = {}) { return payload.tool_input || payload.toolInput || payload.input || payload; }
function changedPath(payload = {}) { const input = toolInput(payload); return String(input.file_path || input.filePath || input.path || payload.file_path || payload.filePath || ''); }
function changedText(payload = {}) { const input = toolInput(payload); return String(input.content || input.new_string || input.newString || input.new_text || input.newText || ''); }
function readRepoFile(root, relative) { try { return fs.readFileSync(path.join(root, relative), 'utf8'); } catch { return ''; } }
function relevantPath(filePath, content, root) {
  const normalized = filePath.replaceAll('\\', '/');
  return EVENTBRIDGE_CONFIG.test(normalized) ||
    (EVENTBRIDGE_SOURCE.test(normalized) && (repoLooksEventBridge(root) || /(?:EventBridge|PutEvents|PutRule|PutTargets|eventPattern|eventBus|Scheduler|Pipe)/i.test(content)));
}

function inspect(filePath, content, root) {
  const normalized = filePath.replaceAll('\\', '/');
  const fullText = content || (path.isAbsolute(filePath) ? readRepoFile(root, path.relative(root, filePath)) : readRepoFile(root, normalized));
  const findings = [];

  if (/(?:PutEvents|putEvents|PutEventsCommand)/i.test(fullText) && !/(?:FailedEntryCount|Entries\s*\.filter|entry\.(?:ErrorCode|ErrorMessage)|partial|failed)/i.test(fullText)) {
    findings.push('PutEvents handling has no visible per-entry failure path; inspect partial batch results and retry only failed/idempotent entries.');
  }
  if (/(?:eventPattern|EventPattern|event-pattern|"source"\s*:\s*\[[^\]]+\])/i.test(fullText) &&
      !/(?:detail-type|detailType|DetailType)/i.test(fullText)) {
    findings.push('EventBridge pattern may be scoped only by source; add detail-type and required detail/account/Region predicates to prevent future event matches and loops.');
  }
  if (/(?:Rule|rule|PutRule|putRule|EventBridge)/i.test(fullText) && /(?:Target|target|PutTargets|putTargets)/i.test(fullText) &&
      !/(?:RetryPolicy|retryPolicy|MaximumEventAge|MaximumRetryAttempts|DeadLetterConfig|DeadLetterArn|dead.?letter|SQS)/i.test(fullText)) {
    findings.push('EventBridge target wiring has no visible bounded retry or DLQ contract; review loss-sensitive delivery, target capacity, and redrive ownership.');
  }
  if (/(?:EventBridge|eventbridge|event bus|eventBus)/i.test(fullText) && /(?:handler|consumer|process|target)/i.test(fullText) &&
      !/(?:idempot|dedup|inbox|outbox|processed|eventId|correlationId)/i.test(fullText)) {
    findings.push('EventBridge consumer code has no obvious idempotency key/state; duplicate delivery, retries, failover, redrive, and replay can repeat side effects.');
  }
  if (/(?:Archive|archive|Replay|replay)/i.test(fullText) && !/(?:replay-name|replayName|idempot|side.?effect|isolat|migration.?mode)/i.test(fullText)) {
    findings.push('EventBridge archive/replay behavior lacks visible side-effect and idempotency handling; treat replay as production-like work and do not assume original ordering.');
  }
  if (/(?:Principal|principal)\s*[:=]\s*["']?\*/i.test(fullText) && /(?:events|eventbridge|event.?bus|PutEvents)/i.test(fullText)) {
    findings.push('EventBridge access policy appears to allow a wildcard principal; narrow cross-account publisher/receiver permissions by account, Organization, source, rule, or Region.');
  }
  if (/(?:cross.?account|cross.?region|event.?bus.*arn|EventBusArn)/i.test(fullText) &&
      !/(?:iam.?role|RoleArn|roleArn|resource.?policy|aws:PrincipalOrgID|organization|account)/i.test(fullText)) {
    findings.push('Cross-account/Region EventBridge routing lacks an obvious IAM/resource-policy boundary; review sender role, receiver bus policy, account/Region filters, and KMS grants.');
  }
  if (/(?:tenant|tenantId|tenant_id|multi[- ]?tenant|SaaS)/i.test(fullText) &&
      !/(?:membership|authorized|authorization|allow[- ]?list|tenant[- ]?(?:scope|context|boundary)|server[- ]?side|quota|dedup|idempot)/i.test(fullText)) {
    findings.push('Multi-tenant EventBridge code lacks an obvious server-side tenant boundary; review publisher/consumer authorization, event context, filters, replay/DLQ access, and per-tenant quotas.');
  }
  if (/(?:EventBridge|eventbridge|events\.)/i.test(fullText) && /(?:prod|production)/i.test(fullText) && /(?:dev|development|test|rnd|r&d)/i.test(fullText) &&
      !/(?:account|region|bus|environment|stage|allowlist|allow-list|separate)/i.test(fullText)) {
    findings.push('EventBridge configuration mixes R&D/test and production signals without a visible environment boundary; separate buses/accounts/roles/archives and reject cross-environment ARNs.');
  }

  return [...new Set(findings)];
}

function emit(payload, findings) {
  const event = payload.hook_event_name || payload.event || process.env.CLAUDE_HOOK_EVENT_NAME || 'PostToolUse';
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: event,
      additionalContext: [
        'The eventbridge-best-practices post-edit review signal fired:',
        ...findings.map((finding) => `- ${finding}`),
        'Load the full skill before making an event-routing, reliability, security, tenant, or recovery decision; this hook is advisory and read-only.',
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

module.exports = { changedPath, inspect, relevantPath };
