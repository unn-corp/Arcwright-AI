#!/usr/bin/env node
/**
 * Arcwright domain hook dispatcher.
 *
 * The individual domain hooks remain installable skill assets, but Claude
 * should not start one Node process per skill for every prompt and edit. This
 * dispatcher loads the relevant routers once and emits one combined result.
 */
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const CONTEXT_ROUTES = [
  ['dynamodb', 'dynamodb-context.js'],
  ['amplify', 'amplify-context.js'],
  ['cloudfront', 'cloudfront-context.js'],
  ['s3', 's3-context.js'],
  ['aurora', 'aurora-context.js'],
  ['ses-sns-smtp', 'ses-sns-smtp-context.js'],
  ['eventbridge', 'eventbridge-context.js'],
  ['cognito', 'cognito-context.js'],
  ['lambda', 'lambda-context.js'],
  ['step-functions', 'step-functions-context.js'],
];

const REVIEW_ROUTES = [
  ['amplify', 'amplify-review.js'],
  ['cloudfront', 'cloudfront-review.js'],
  ['s3', 's3-review.js'],
  ['aurora', 'aurora-review.js'],
  ['ses-sns-smtp', 'ses-sns-smtp-review.js'],
  ['eventbridge', 'eventbridge-review.js'],
  ['cognito', 'cognito-review.js'],
  ['lambda', 'lambda-review.js'],
  ['step-functions', 'step-functions-review.js'],
];

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

function eventName(payload) {
  return String(payload.hook_event_name || payload.hookEventName || payload.event ||
    process.env.CLAUDE_HOOK_EVENT_NAME || 'UserPromptSubmit');
}

function projectRoot(payload) {
  return path.resolve(String(payload.cwd || payload.project_dir || payload.projectDir ||
    payload.current_working_directory || process.env.CLAUDE_PROJECT_DIR || process.cwd()));
}

function toolInput(payload) {
  return payload.tool_input || payload.toolInput || payload.input || payload;
}

function promptText(payload) {
  return String(payload.prompt || payload.user_prompt || payload.message || '');
}

function changedPath(payload) {
  const input = toolInput(payload);
  return String(input.file_path || input.filePath || input.path || payload.file_path || payload.filePath || '');
}

function changedText(payload) {
  const input = toolInput(payload);
  return String(input.content || input.new_string || input.newString || input.new_text || input.newText || '');
}

function loadRoutes(routes) {
  return routes.flatMap(([name, file]) => {
    try {
      return [{ name, module: require(path.join(__dirname, file)) }];
    } catch {
      return [];
    }
  });
}

function emit(event, additionalContext) {
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: { hookEventName: event, additionalContext },
  }) + '\n');
}

function runContextHooks(payload, event) {
  const prompt = promptText(payload);
  const contexts = loadRoutes(CONTEXT_ROUTES).flatMap(({ name, module }) => {
    const relevant = name === 'dynamodb'
      ? module.isRelevant(prompt)
      : module.isRelevant(payload);
    if (!relevant || typeof module.context !== 'function') return [];
    return [module.context(event)];
  });
  if (!contexts.length) return;
  emit(event, [
    'The following Arcwright domain routing signals are relevant:',
    ...contexts,
    'These signals are advisory and read-only; load the relevant skill before making a domain decision.',
  ].join('\n'));
}

function runReviewHooks(payload, event) {
  const filePath = changedPath(payload);
  if (!filePath) return;
  const content = changedText(payload);
  const root = projectRoot(payload);
  const findings = loadRoutes(REVIEW_ROUTES).flatMap(({ name, module }) => {
    if (typeof module.relevantPath !== 'function' || typeof module.inspect !== 'function' ||
        !module.relevantPath(filePath, content, root)) return [];
    return module.inspect(filePath, content, root).map((finding) => ({ name, finding }));
  });
  const unique = [];
  const seen = new Set();
  for (const finding of findings) {
    const key = `${finding.name}\n${finding.finding}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(finding);
  }
  if (!unique.length) return;
  emit(event, [
    'Arcwright post-edit review signals fired:',
    ...unique.map(({ name, finding }) => `- [${name}] ${finding}`),
    'Load the relevant skill before making a security, data, deployment, performance, or recovery decision; these hooks are advisory and read-only.',
  ].join('\n'));
}

const payload = readPayload();
const event = eventName(payload);
if (/^(?:SessionStart|WorkspaceOpen)$/i.test(event)) {
  runContextHooks(payload, event);
} else if (/^(?:UserPromptSubmit|BeforeSubmitPrompt|PreLlmCall)$/i.test(event)) {
  runContextHooks(payload, event);
} else if (/^PostToolUse$/i.test(event)) {
  runReviewHooks(payload, event);
}
