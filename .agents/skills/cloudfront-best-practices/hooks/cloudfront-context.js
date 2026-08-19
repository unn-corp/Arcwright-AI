#!/usr/bin/env node
'use strict';

// Read-only CloudFront router. It never contacts AWS, reads credentials, edits files,
// invalidates paths, or changes a distribution. It only emits a short routing signal.

const fs = require('node:fs');
const path = require('node:path');

const CLOUDFRONT_PROMPT_TERMS = /(?:amazon\s+cloudfront|aws\s+cloudfront|\bcloudfront\b|cdn|cache\s+policy|origin\s+request\s+policy|origin\s+access\s+control|signed\s+(?:url|cookie)s?|origin\s+shield|lambda@edge|cloudfront\s+function)/i;
const CLOUDFRONT_MARKERS = [
  'cloudfront',
  path.join('infra', 'cdn'),
  path.join('infra', 'cloudfront'),
  path.join('infrastructure', 'cloudfront'),
  path.join('cdk', 'cloudfront'),
];
const CLOUDFRONT_PACKAGE_TERMS = /(?:cloudfront|@aws-cdk\/aws-cloudfront|@pulumi\/aws|origin-access-control)/i;

function parseJson(value) {
  if (!value) return {};
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function readPayload() {
  let stdin = '';
  try { stdin = fs.readFileSync(0, 'utf8'); } catch { /* environment-only harness */ }
  return {
    ...parseJson(process.env.CLAUDE_HOOK_INPUT),
    ...parseJson(process.env.CLAUDE_TOOL_INPUT),
    ...parseJson(stdin),
  };
}

function projectRoot(payload = {}) {
  const candidate = payload.cwd || payload.project_dir || payload.projectDir ||
    payload.current_working_directory || process.env.CLAUDE_PROJECT_DIR || process.cwd();
  return path.resolve(String(candidate));
}

function packageFiles(root) {
  const files = [path.join(root, 'package.json')];
  for (const workspace of ['apps', 'packages']) {
    const parent = path.join(root, workspace);
    let entries = [];
    try { entries = fs.readdirSync(parent, { withFileTypes: true }); } catch { continue; }
    for (const entry of entries) {
      if (entry.isDirectory() && entry.name !== 'node_modules') {
        files.push(path.join(parent, entry.name, 'package.json'));
      }
    }
  }
  return files;
}

function repoLooksCloudFront(root) {
  if (CLOUDFRONT_MARKERS.some((marker) => fs.existsSync(path.join(root, marker)))) return true;
  return packageFiles(root).some((file) => {
    try { return CLOUDFRONT_PACKAGE_TERMS.test(fs.readFileSync(file, 'utf8')); }
    catch { return false; }
  });
}

function promptText(payload = {}) {
  return String(payload.prompt || payload.user_prompt || payload.message || '');
}

function isRelevant(payload = {}) {
  const event = String(payload.hook_event_name || payload.event || process.env.CLAUDE_HOOK_EVENT_NAME || 'UserPromptSubmit');
  if (/^SessionStart$/i.test(event)) return repoLooksCloudFront(projectRoot(payload));
  return CLOUDFRONT_PROMPT_TERMS.test(promptText(payload));
}

function context(event) {
  return [
    'The cloudfront-best-practices skill is relevant to this request.',
    'Load its RULES.md first; load the full SKILL.md for CloudFront planning, implementation, deployment, runtime, UI, or security review.',
    'Inspect behavior order, cache policy, origin request policy, TTLs, origin authorization, TLS/WAF scope, and evidence before changing delivery settings.',
    'Keep cache keys minimal, protect private/personalized responses, prefer versioned assets over broad invalidations, and verify UI LCP/INP/CLS plus request waterfalls.',
    `This ${event} hook is a routing signal only: it performs no AWS calls or file mutations.`,
  ].join('\n');
}

function emit(payload) {
  const event = payload.hook_event_name || payload.event || process.env.CLAUDE_HOOK_EVENT_NAME || 'UserPromptSubmit';
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: { hookEventName: event, additionalContext: context(event) },
  }) + '\n');
}

if (require.main === module) {
  const payload = readPayload();
  if (isRelevant(payload)) emit(payload);
}

module.exports = { CLOUDFRONT_PROMPT_TERMS, isRelevant, projectRoot, readPayload, repoLooksCloudFront };
