#!/usr/bin/env node
'use strict';

// Read-only S3 router. It never contacts AWS, reads credentials, edits files, or
// changes buckets; it only emits a short routing signal.

const fs = require('node:fs');
const path = require('node:path');

const S3_PROMPT_TERMS = /(?:amazon\s+s3|aws\s+s3|\bs3:\/\/|\bS3\b|bucket\s+policy|object\s+lock|multipart\s+upload|presigned\s+(?:url|post)|PutObject|GetObject|HeadObject|ListObjectsV2|S3Event)/i;
const S3_MARKERS = [
  's3',
  'storage',
  path.join('infra', 'storage'),
  path.join('infra', 's3'),
  path.join('infrastructure', 's3'),
  'bucket.tf',
  's3.tf',
];
const S3_PACKAGE_TERMS = /(?:@aws-sdk\/client-s3|aws-cdk-lib\/aws-s3|aws-cdk-lib[^\n]*aws-s3|@pulumi\/aws[^\n]*bucket|boto3[^\n]*s3)/i;

function parseJson(value) {
  if (!value) return {};
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch { return {}; }
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

function repoLooksS3(root) {
  if (S3_MARKERS.some((marker) => fs.existsSync(path.join(root, marker)))) return true;
  return packageFiles(root).some((file) => {
    try { return S3_PACKAGE_TERMS.test(fs.readFileSync(file, 'utf8')); }
    catch { return false; }
  });
}

function promptText(payload = {}) {
  return String(payload.prompt || payload.user_prompt || payload.message || '');
}

function isRelevant(payload = {}) {
  const event = String(payload.hook_event_name || payload.event || process.env.CLAUDE_HOOK_EVENT_NAME || 'UserPromptSubmit');
  if (/^SessionStart$/i.test(event)) return repoLooksS3(projectRoot(payload));
  return S3_PROMPT_TERMS.test(promptText(payload));
}

function context(event) {
  return [
    'The s3-best-practices skill is relevant to this request.',
    'Load its RULES.md first; load the full SKILL.md for S3 planning, implementation, deployment, runtime, data protection, or cost review.',
    'Start with the access matrix and recovery requirements; verify Object Ownership, Block Public Access, encryption, versioning/lifecycle, IAM, and CloudFront OAC where applicable.',
    'For performance, use bounded concurrency, pagination, checksums, conditional writes, resumable multipart transfers, idempotent events, and measured cost/recovery evidence.',
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

module.exports = { S3_PROMPT_TERMS, context, isRelevant, projectRoot, readPayload, repoLooksS3 };
