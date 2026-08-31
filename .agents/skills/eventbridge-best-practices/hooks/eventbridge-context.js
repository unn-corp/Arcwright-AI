#!/usr/bin/env node
'use strict';

// Read-only EventBridge router. It never publishes, enables, disables, replays,
// calls AWS, reads credentials, edits files, or mutates event infrastructure.

const fs = require('node:fs');
const path = require('node:path');

const EVENTBRIDGE_PROMPT_TERMS = /(?:amazon\s+eventbridge|eventbridge|event\s+bus|putevents|putrule|puttargets|event\s+pattern|eventbridge\s+(?:pipes|scheduler|archive|replay|global\s+endpoint)|cross[- ]account\s+event(?:bridge)?)/i;
const EVENTBRIDGE_MARKERS = [
  'eventbridge',
  'event-bus',
  'event-pattern',
  'event-patterns',
  'eventbridge.tf',
  'events.tf',
  'scheduler',
];
const EVENTBRIDGE_PACKAGE_TERMS = /(?:@aws-sdk\/client-(?:eventbridge|pipes|scheduler)|aws-cdk-lib\/aws-events|aws_cloudwatch_event|eventbridge|PutEvents|EventBusName)/i;

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
  return { ...parseJson(process.env.CLAUDE_HOOK_INPUT), ...parseJson(process.env.CLAUDE_TOOL_INPUT), ...parseJson(stdin) };
}
function projectRoot(payload = {}) {
  const candidate = payload.cwd || payload.project_dir || payload.projectDir || payload.current_working_directory || process.env.CLAUDE_PROJECT_DIR || process.cwd();
  return path.resolve(String(candidate));
}
function packageFiles(root) {
  const files = [path.join(root, 'package.json')];
  for (const workspace of ['apps', 'packages']) {
    const parent = path.join(root, workspace);
    let entries = [];
    try { entries = fs.readdirSync(parent, { withFileTypes: true }); } catch { continue; }
    for (const entry of entries) if (entry.isDirectory() && entry.name !== 'node_modules') files.push(path.join(parent, entry.name, 'package.json'));
  }
  return files;
}
function repoLooksEventBridge(root) {
  if (EVENTBRIDGE_MARKERS.some((marker) => fs.existsSync(path.join(root, marker)))) return true;
  return packageFiles(root).some((file) => {
    try { return EVENTBRIDGE_PACKAGE_TERMS.test(fs.readFileSync(file, 'utf8')); } catch { return false; }
  });
}
function promptText(payload = {}) { return String(payload.prompt || payload.user_prompt || payload.message || ''); }
function isRelevant(payload = {}) {
  const event = String(payload.hook_event_name || payload.event || process.env.CLAUDE_HOOK_EVENT_NAME || 'UserPromptSubmit');
  if (/^SessionStart$/i.test(event)) return repoLooksEventBridge(projectRoot(payload));
  return EVENTBRIDGE_PROMPT_TERMS.test(promptText(payload));
}
function context(event) {
  return [
    'The eventbridge-best-practices skill is relevant to this request.',
    'Load its RULES.md first; load the full SKILL.md for EventBridge buses, rules/patterns, targets, Pipes, Scheduler, retries/DLQs, schemas, archives/replay, global endpoints, or cross-account/Region work.',
    'Identify account/Region, environment, bus/source/schema, target contract, retry/DLQ, idempotency, archive/replay, security, tenant boundary, and measured latency/volume before recommending changes.',
    'Treat EventBridge as a router: validate precise patterns, prevent loops, make consumers idempotent, and do not confuse PutEvents acceptance with completed processing.',
    `This ${event} hook is a routing signal only: it performs no AWS calls, publishes no events, replays no archives, reads no credentials, and makes no file mutations.`,
  ].join('\n');
}
function emit(payload) {
  const event = payload.hook_event_name || payload.event || process.env.CLAUDE_HOOK_EVENT_NAME || 'UserPromptSubmit';
  process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: event, additionalContext: context(event) } }) + '\n');
}
if (require.main === module) { const payload = readPayload(); if (isRelevant(payload)) emit(payload); }
module.exports = { EVENTBRIDGE_PROMPT_TERMS, context, isRelevant, projectRoot, readPayload, repoLooksEventBridge };
