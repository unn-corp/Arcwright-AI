#!/usr/bin/env node
'use strict';

// Read-only post-edit reviewer. It emits focused reminders and never calls AWS,
// deletes data, changes retention, or blocks the edit.

const fs = require('node:fs');
const path = require('node:path');
const { projectRoot, readPayload, repoLooksS3 } = require('./s3-context');

const S3_CONFIG = /(?:^|\/)(?:s3(?:\.[^/]+)?|bucket(?:\.[^/]+)?|storage(?:\.[^/]+)?|amplify\/storage|storage\.resource|template(?:\.[^/]+)?\.(?:ya?ml|json)|serverless\.[^/]+)(?:$|\/)/i;
const IAC_OR_S3_SOURCE = /(?:^|\/)[^/]+\.(?:tf|ya?ml|json|m?js|c?ts|py)$/i;
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
  return S3_CONFIG.test(normalized) ||
    (IAC_OR_S3_SOURCE.test(normalized) && repoLooksS3(root)) ||
    (UI_SOURCE.test(normalized) && repoLooksS3(root));
}

function inspect(filePath, content, root) {
  const normalized = filePath.replaceAll('\\', '/');
  const fullText = content || (path.isAbsolute(filePath)
    ? readRepoFile(root, path.relative(root, filePath))
    : readRepoFile(root, normalized));
  const findings = [];

  if (/(?:s3:\*|Principal[^\n]*["']\*["']|publicReadAccess|PublicRead|AccessControl[^\n]*(?:PUBLIC|public)|blockPublicAccess[^\n]*(?:false|NONE))/i.test(fullText)) {
    findings.push('Review for public or wildcard S3 access; keep Block Public Access enabled and use resource-scoped principals/actions.');
  }
  if (/(?:RemovalPolicy\.DESTROY|deletionPolicy[^\n]*(?:Delete|delete)|autoDeleteObjects)/i.test(fullText)) {
    findings.push('Destructive bucket cleanup is configured; verify this is non-production or explicitly protected and that data replacement cannot occur accidentally.');
  }
  if (/(?:Bucket|bucketName|aws_s3_bucket)/i.test(fullText) && /(?:versioned|versioning)[^\n]*false/i.test(fullText)) {
    findings.push('Versioning is disabled; confirm overwrite/delete recovery, replication, and rollback do not require it, and document the data-class decision.');
  }
  if (/(?:PutObjectCommand|putObject|upload|UploadPart)/i.test(fullText) && !/(?:Checksum|checksum|ContentMD5|contentMD5)/i.test(fullText)) {
    findings.push('Review upload integrity and retry behavior; use SDK checksum support where the data path needs end-to-end validation.');
  }
  if (/(?:ListObjects|listObjects|ListObjectsV2)/i.test(fullText) && !/(?:ContinuationToken|continuationToken|IsTruncated|isTruncated|NextContinuationToken|nextToken)/i.test(fullText)) {
    findings.push('This list path may assume a single page; paginate with continuation tokens and keep full-bucket scans out of request paths.');
  }
  if (/(?:NotificationConfiguration|S3Event|onObjectCreated|ObjectCreated)/i.test(fullText) &&
      !/(?:idempot|dedup|eventId|versionId|SQS|queue|EventBridge)/i.test(fullText)) {
    findings.push('S3 notifications are at-least-once and unordered; buffer/deduplicate and make the consumer idempotent before relying on the event.');
  }
  if (/(?:ObjectLock|objectLock)/i.test(fullText) && !/(?:Lifecycle|lifecycle|NoncurrentVersion|noncurrent)/i.test(fullText)) {
    findings.push('Object Lock/retention needs an explicit lifecycle and restore/operational plan; verify irreversible retention choices deliberately.');
  }
  if (/(?:replication|ReplicationConfiguration)/i.test(fullText) && /(?:KMS|kms|SSEKMS)/i.test(fullText) &&
      !/(?:kms:Decrypt|kms:Encrypt|kms\.Decrypt|kms\.Encrypt)/i.test(fullText)) {
    findings.push('Encrypted replication needs source/destination KMS permissions and key-policy validation; do not assume the bucket role is sufficient.');
  }
  if (UI_SOURCE.test(normalized)) {
    findings.push('For UI/storage changes, verify content type, cache-control, immutable naming or invalidation, upload latency, and the authenticated/public access boundary.');
  }

  return [...new Set(findings)];
}

function emit(payload, findings) {
  const event = payload.hook_event_name || payload.event || process.env.CLAUDE_HOOK_EVENT_NAME || 'PostToolUse';
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: event,
      additionalContext: [
        'The s3-best-practices post-edit review signal fired:',
        ...findings.map((finding) => `- ${finding}`),
        'Load the full skill before making a data, security, performance, or recovery decision; this hook is advisory and read-only.',
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
