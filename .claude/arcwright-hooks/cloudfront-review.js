#!/usr/bin/env node
'use strict';

// Read-only post-edit reviewer. It emits focused reminders and never calls AWS,
// invalidates a distribution, or blocks the edit.

const fs = require('node:fs');
const path = require('node:path');
const { projectRoot, readPayload, repoLooksCloudFront } = require('./cloudfront-context');

const CLOUDFRONT_CONFIG = /(?:^|\/)(?:cloudfront(?:\.[^/]+)?|cdn(?:\.[^/]+)?|distribution(?:\.[^/]+)?|amplify\.ya?ml|customHeaders\.ya?ml|template(?:\.[^/]+)?\.(?:ya?ml|json)|serverless\.[^/]+|main\.tf)(?:$|\/)/i;
const IAC_SOURCE = /(?:^|\/)[^/]+\.(?:tf|ya?ml|json|m?js|c?ts)$/i;
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
  return CLOUDFRONT_CONFIG.test(normalized) ||
    (IAC_SOURCE.test(normalized) && repoLooksCloudFront(root)) ||
    (UI_SOURCE.test(normalized) && repoLooksCloudFront(root));
}

function inspect(filePath, content, root) {
  const normalized = filePath.replaceAll('\\', '/');
  const fullText = content || (path.isAbsolute(filePath)
    ? readRepoFile(root, path.relative(root, filePath))
    : readRepoFile(root, normalized));
  const findings = [];

  if (/(?:ForwardedValues|cache.?policy|CachePolicy)/i.test(fullText) &&
      /(?:all|All|\*|"cookies"\s*:\s*\{\s*"forward"\s*:\s*"all)/i.test(fullText)) {
    findings.push('Review cache-key dimensions: forwarding all cookies, headers, or query strings can fragment the cache and may cache the wrong representation.');
  }
  if (/(?:MinimumTTL|minTTL)\s*[:=]\s*[1-9]/i.test(fullText) && /(?:private|no-store|no-cache)/i.test(fullText)) {
    findings.push('A positive minimum TTL can override private/no-store/no-cache intent; verify that shared caching is safe for this response.');
  }
  if (/(?:ViewerProtocolPolicy|viewerProtocolPolicy)[^\n]*(?:allow-all|ALLOW_ALL)/i.test(fullText)) {
    findings.push('Viewer HTTP is allowed; require HTTPS unless the exception is deliberate, documented, and tested.');
  }
  if (/(?:OriginAccessIdentity|originAccessIdentity|\bOAI\b)/i.test(fullText)) {
    findings.push('This uses legacy S3 Origin Access Identity; review migration to Origin Access Control and a private bucket policy for new designs.');
  }
  if (/(?:PublicReadAccess|publicReadAccess|BlockPublicAccess[^\n]*(?:false|NONE)|Principal[^\n]*["']\*["'])/i.test(fullText)) {
    findings.push('Review public origin access. Keep S3 private behind OAC and verify direct origin access is denied.');
  }
  if (/(?:invalidation|createInvalidation|paths)[\s\S]*["']\/\*["']/i.test(fullText)) {
    findings.push('A broad /* invalidation is high impact; prefer versioned immutable assets and narrow invalidation for mutable HTML/data.');
  }
  if (/(?:OriginShield|originShield)/i.test(fullText)) {
    findings.push('Validate Origin Shield with duplicate-origin-fetch, origin-cost, and latency evidence; it is not a default for every dynamic request.');
  }
  if (/(?:origin.?request.?policy)[\s\S]*(?:Accept-Encoding|accept-encoding)/i.test(fullText)) {
    findings.push('Check compression policy handling before forwarding Accept-Encoding separately; avoid an unnecessary cache dimension.');
  }
  if (/(?:failover|OriginGroup|originGroup)/i.test(fullText) && /(?:POST|PUT|PATCH|DELETE)/i.test(fullText)) {
    findings.push('CloudFront origin failover is read-path behavior; verify writes are not treated as safe to retry or fail over.');
  }
  if (UI_SOURCE.test(normalized)) {
    findings.push('For UI changes, verify production LCP/INP/CLS, asset cache-control/versioning, initial bundle, and the warm/cold request waterfall.');
  }

  return [...new Set(findings)];
}

function emit(payload, findings) {
  const event = payload.hook_event_name || payload.event || process.env.CLAUDE_HOOK_EVENT_NAME || 'PostToolUse';
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: event,
      additionalContext: [
        'The cloudfront-best-practices post-edit review signal fired:',
        ...findings.map((finding) => `- ${finding}`),
        'Load the full skill before making a delivery or performance decision; this hook is advisory and read-only.',
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
