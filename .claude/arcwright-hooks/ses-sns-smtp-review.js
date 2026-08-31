#!/usr/bin/env node
'use strict';

// Read-only post-edit reviewer. It emits concise messaging reminders and never
// sends email, publishes to SNS, calls AWS, reads credentials, or blocks edits.

const fs = require('node:fs');
const path = require('node:path');
const { projectRoot, readPayload, repoLooksMessaging } = require('./ses-sns-smtp-context');

const MESSAGING_CONFIG = /(?:^|\/)(?:ses|sesv2|sns|smtp|email|mail|messaging|notification|notifications|template|serverless|cdk|terraform)[^/]*\.(?:json|ya?ml|tf|tfvars|js|ts|mjs|cjs)$/i;
const MESSAGING_SOURCE = /(?:^|\/)[^/]+\.(?:[cm]?[jt]sx?|py|go|java|rb|php|cs|sql)$/i;
const UI_SOURCE = /(?:^|\/)(?:src|app|pages|components)\/[^/]+\.(?:[cm]?[jt]sx?|vue|svelte)$/i;

function toolInput(payload = {}) { return payload.tool_input || payload.toolInput || payload.input || payload; }
function changedPath(payload = {}) {
  const input = toolInput(payload);
  return String(input.file_path || input.filePath || input.path || payload.file_path || payload.filePath || '');
}
function changedText(payload = {}) {
  const input = toolInput(payload);
  return String(input.content || input.new_string || input.newString || input.new_text || input.newText || '');
}
function readRepoFile(root, relative) {
  try { return fs.readFileSync(path.join(root, relative), 'utf8'); } catch { return ''; }
}
function relevantPath(filePath, content, root) {
  const normalized = filePath.replaceAll('\\', '/');
  return MESSAGING_CONFIG.test(normalized) ||
    (MESSAGING_SOURCE.test(normalized) && (repoLooksMessaging(root) || /(?:@aws-sdk\/client-(?:ses|sns)|nodemailer|SendEmail|SendRawEmail|PutEvents|sns|smtp)/i.test(content))) ||
    (UI_SOURCE.test(normalized) && repoLooksMessaging(root));
}

function inspect(filePath, content, root) {
  const normalized = filePath.replaceAll('\\', '/');
  const fullText = content || (path.isAbsolute(filePath)
    ? readRepoFile(root, path.relative(root, filePath))
    : readRepoFile(root, normalized));
  const findings = [];

  if (/(?:smtp(?:Password|User|Username)|SES_SMTP|AWS_SECRET_ACCESS_KEY|awsSecretAccessKey|accessKeyId)\s*[:=]\s*["'][^$<{][^"']+["']/i.test(fullText)) {
    findings.push('A messaging credential may be hardcoded; use an approved secret/role reference and keep SMTP passwords, AWS keys, and tokens out of source, bundles, logs, and URLs.');
  }
  if (/(?:smtp|nodemailer)/i.test(fullText) && /(?:port\s*[:=]\s*(?:25|465|587|2465|2587)|smtp\.[^\n]*(?:25|465|587))/i.test(fullText) &&
      !/(?:secure|starttls|requireTLS|rejectUnauthorized|tls)/i.test(fullText)) {
    findings.push('SMTP configuration has no visible TLS requirement; SES SMTP requires encrypted transport and certificate validation with no plaintext downgrade.');
  }
  if (/(?:SendEmail|SendRawEmail|sendEmail|sendRawEmail|sendMail)\b/i.test(fullText) &&
      !/(?:ConfigurationSetName|configuration.?set|X-SES-CONFIGURATION-SET)/i.test(fullText)) {
    findings.push('SES send code has no visible configuration set; review production event publishing, correlation tags, bounce/complaint/delay handling, and suppression telemetry.');
  }
  if (/(?:FromEmailAddress|FromAddress|fromEmail|from:)\s*[:=][^\n]{0,160}(?:req\.|request|body|params|input|query|tenant)/i.test(fullText)) {
    findings.push('A sender identity may be influenced by request/tenant input; resolve From/Sender/MAIL FROM through a verified server-owned allow-list and authorization policy.');
  }
  if (/(?:SNS|sns|TopicArn|topicArn|Subscribe|subscription)/i.test(fullText) &&
      /(?:http:\/\/|protocol\s*[:=]\s*["']?http\b)/i.test(fullText) &&
      !/https:\/\//i.test(fullText)) {
    findings.push('SNS delivery appears to use HTTP rather than HTTPS; require TLS and verify SNS signatures/expected TopicArn before processing external notifications.');
  }
  if (/(?:SNS|sns|Topic|topic).*(?:Subscription|subscription|Lambda|handler|consumer)/is.test(fullText) &&
      !/(?:DeadLetter|dead.?letter|RedrivePolicy|retry|RetryPolicy|idempot|dedup|inbox|outbox|processed)/i.test(fullText)) {
    findings.push('SNS consumer wiring has no visible retry/DLQ/idempotency contract; use durable buffering where needed and make side effects safe for duplicate delivery.');
  }
  if (/(?:event|SNS|ses|notification).*(?:handler|consumer|process|deliver)/is.test(fullText) &&
      !/(?:idempot|dedup|inbox|outbox|processed|eventId|correlationId)/i.test(fullText)) {
    findings.push('Messaging event processing has no obvious idempotency key/state; SES/SNS events and retries can duplicate side effects.');
  }
  if (/(?:tenant|tenantId|tenant_id|multi[- ]?tenant|SaaS)/i.test(fullText) &&
      !/(?:membership|authorized|authorization|allow[- ]?list|tenant[- ]?(?:scope|context|boundary)|suppression|configuration.?set|topic.?map|server[- ]?side)/i.test(fullText)) {
    findings.push('Multi-tenant messaging code lacks an obvious server-side tenant/identity/topic boundary; review destination authorization, suppression, quotas, event context, and cross-tenant negative tests.');
  }
  if (UI_SOURCE.test(normalized) && /(?:@aws-sdk\/client-(?:ses|sns)|SendEmail|SendRawEmail|PublishCommand|smtp)/i.test(fullText)) {
    findings.push('Provider send/publish code appears in a UI source path; keep SES/SNS credentials and permissions server-side and expose only an authorized API operation.');
  }

  return [...new Set(findings)];
}

function emit(payload, findings) {
  const event = payload.hook_event_name || payload.event || process.env.CLAUDE_HOOK_EVENT_NAME || 'PostToolUse';
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: event,
      additionalContext: [
        'The ses-sns-smtp-best-practices post-edit review signal fired:',
        ...findings.map((finding) => `- ${finding}`),
        'Load the full skill before making a messaging, deliverability, security, or recovery decision; this hook is advisory and read-only.',
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
