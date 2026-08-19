#!/usr/bin/env node
'use strict';

// Read-only Step Functions router. It never contacts AWS, starts executions, reads
// credentials, changes ASL, or authorizes a workflow deployment.

const fs = require('node:fs');
const path = require('node:path');

const STEP_FUNCTIONS_PROMPT_TERMS = /\b(?:aws\s+step\s+functions|step\s+functions|state\s+machine|amazon\s+states\s+language|ASL|standard\s+workflow|express\s+workflow|distributed\s+map|task\s+token|waitForTaskToken|startExecution|stepfunctions)\b/i;
const STEP_FUNCTIONS_MARKERS = [
  'step-functions',
  'stepfunctions',
  'statemachine',
  'state-machine',
  'asl',
  'workflows',
  path.join('amplify', 'backend', 'function'),
  path.join('infra', 'step-functions'),
  path.join('infrastructure', 'step-functions'),
];
const STEP_FUNCTIONS_PACKAGE_TERMS = /(?:@aws-sdk\/client-sfn|aws-sdk\/clients\/sfn|aws-cdk-lib\/aws-stepfunctions|@aws-cdk\/aws-stepfunctions|stepfunctions|step-functions|serverless-step-functions|aws_stepfunctions)/i;

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
  try {
    stdin = fs.readFileSync(0, 'utf8');
  } catch {
    // Some harnesses provide hook data through environment variables.
  }
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
  for (const workspace of ['apps', 'packages', 'src']) {
    const parent = path.join(root, workspace);
    let entries = [];
    try {
      entries = fs.readdirSync(parent, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      if (entry.isDirectory() && entry.name !== 'node_modules') {
        files.push(path.join(parent, entry.name, 'package.json'));
      }
    }
  }
  return files;
}

function repoLooksStepFunctions(root) {
  if (STEP_FUNCTIONS_MARKERS.some((marker) => fs.existsSync(path.join(root, marker)))) return true;
  return packageFiles(root).some((file) => {
    try {
      return STEP_FUNCTIONS_PACKAGE_TERMS.test(fs.readFileSync(file, 'utf8'));
    } catch {
      return false;
    }
  });
}

function promptText(payload = {}) {
  return String(payload.prompt || payload.user_prompt || payload.message || '');
}

function isRelevant(payload = {}) {
  const event = String(payload.hook_event_name || payload.event || process.env.CLAUDE_HOOK_EVENT_NAME || 'UserPromptSubmit');
  if (/^SessionStart$/i.test(event)) return repoLooksStepFunctions(projectRoot(payload));
  return STEP_FUNCTIONS_PROMPT_TERMS.test(promptText(payload));
}

function context(event) {
  return [
    'The step-functions-best-practices skill is relevant to this request.',
    'Load its RULES.md first; load the full SKILL.md for Step Functions/ASL planning, implementation, deployment, debugging, retries, callbacks, Map/Parallel, tenancy, or workflow-backed UI work.',
    'Choose Standard versus Express from execution semantics, duration, audit/history, callback/.sync needs, integration support, and idempotency—not cost alone.',
    'Keep state data bounded and sanitized, prefer direct service integrations, set typed retries/catches/timeouts, bound fan-out, and enforce tenant authorization at start and sensitive task/data boundaries.',
    `This ${event} hook is a routing signal only: it performs no AWS calls, credential reads, or file mutations.`,
  ].join('\n');
}

function emit(payload) {
  const event = payload.hook_event_name || payload.event || process.env.CLAUDE_HOOK_EVENT_NAME || 'UserPromptSubmit';
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: event,
      additionalContext: context(event),
    },
  }) + '\n');
}

if (require.main === module) {
  const payload = readPayload();
  if (isRelevant(payload)) emit(payload);
}

module.exports = {
  STEP_FUNCTIONS_PROMPT_TERMS,
  isRelevant,
  projectRoot,
  readPayload,
  repoLooksStepFunctions,
};
