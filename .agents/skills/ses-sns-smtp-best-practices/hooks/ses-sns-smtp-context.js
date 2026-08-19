#!/usr/bin/env node
'use strict';

// Read-only SES/SNS/SMTP router. It never sends email, publishes messages,
// reads credentials, changes DNS, edits files, or mutates AWS resources.

const fs = require('node:fs');
const path = require('node:path');

const MESSAGING_PROMPT_TERMS = /(?:amazon\s+(?:ses|sns)|simple\s+(?:email|notification)\s+service|ses\s+(?:smtp|email|sandbox|configuration|suppression)|smtp\s+(?:ses|email)|sns\s+(?:topic|subscription|dlq|fifo|filter)|email\s+(?:bounce|complaint|deliverability)|configuration\s+set|suppression\s+list)/i;
const MESSAGING_MARKERS = [
  'ses',
  'sns',
  'smtp',
  'email',
  'messaging',
  'notifications',
  'notification',
  'mail-service',
];
const MESSAGING_PACKAGE_TERMS = /(?:@aws-sdk\/client-(?:ses|sesv2|sns)|aws-sdk|nodemailer|ses|sns|smtp)/i;

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
      if (entry.isDirectory() && entry.name !== 'node_modules') files.push(path.join(parent, entry.name, 'package.json'));
    }
  }
  return files;
}

function repoLooksMessaging(root) {
  if (MESSAGING_MARKERS.some((marker) => fs.existsSync(path.join(root, marker)))) return true;
  return packageFiles(root).some((file) => {
    try { return MESSAGING_PACKAGE_TERMS.test(fs.readFileSync(file, 'utf8')); }
    catch { return false; }
  });
}

function promptText(payload = {}) {
  return String(payload.prompt || payload.user_prompt || payload.message || '');
}

function isRelevant(payload = {}) {
  const event = String(payload.hook_event_name || payload.event || process.env.CLAUDE_HOOK_EVENT_NAME || 'UserPromptSubmit');
  if (/^SessionStart$/i.test(event)) return repoLooksMessaging(projectRoot(payload));
  return MESSAGING_PROMPT_TERMS.test(promptText(payload));
}

function context(event) {
  return [
    'The ses-sns-smtp-best-practices skill is relevant to this request.',
    'Load its RULES.md first; load the full SKILL.md for SES deliverability, SES SMTP, SNS routing, event feedback, tenant isolation, R&D, or deployment/review work.',
    'Identify account/Region, SES sandbox/production status, verified identities, quotas, configuration sets/events, SNS topic/subscriber topology, retries/DLQs, and idempotency before recommending changes.',
    'Keep credentials and provider access server-side, require TLS, treat acceptance as asynchronous, and validate bounce/complaint/suppression and subscriber recovery paths.',
    `This ${event} hook is a routing signal only: it performs no AWS calls, sends no messages, reads no credentials, and makes no file mutations.`,
  ].join('\n');
}

function emit(payload) {
  const event = payload.hook_event_name || payload.event || process.env.CLAUDE_HOOK_EVENT_NAME || 'UserPromptSubmit';
  process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: event, additionalContext: context(event) } }) + '\n');
}

if (require.main === module) {
  const payload = readPayload();
  if (isRelevant(payload)) emit(payload);
}

module.exports = { MESSAGING_PROMPT_TERMS, isRelevant, projectRoot, readPayload, repoLooksMessaging };
