#!/usr/bin/env node
'use strict';

// Read-only Lambda router. It never contacts AWS, reads credentials, invokes a
// function, changes code, or authorizes a deployment.

const fs = require('node:fs');
const path = require('node:path');

const LAMBDA_PROMPT_TERMS = /\b(?:aws\s+lambda|lambda\s+(?:function|handler|runtime|trigger|invocation|event|cold.?start|concurrency)|serverless\s+function|lambda-backed|lambda\s+best\s+practice|provisioned\s+concurrency|lambda\s+layer|lambda\s+vpc|lambda\s+dlq)\b/i;
const LAMBDA_MARKERS = [
  'lambda',
  'functions',
  'samconfig.toml',
  'template.yaml',
  'template.yml',
  'serverless.yml',
  'serverless.yaml',
  path.join('amplify', 'backend', 'function'),
  path.join('infra', 'lambda'),
  path.join('infrastructure', 'lambda'),
];
const LAMBDA_PACKAGE_TERMS = /(?:@aws-sdk\/client-lambda|aws-lambda|aws-cdk-lib\/aws-lambda|@aws-cdk\/aws-lambda|serverless|\baws-sdk\b|@types\/aws-lambda|lambda_function)/i;

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

function repoLooksLambda(root) {
  if (LAMBDA_MARKERS.some((marker) => fs.existsSync(path.join(root, marker)))) return true;
  return packageFiles(root).some((file) => {
    try {
      return LAMBDA_PACKAGE_TERMS.test(fs.readFileSync(file, 'utf8'));
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
  if (/^SessionStart$/i.test(event)) return repoLooksLambda(projectRoot(payload));
  return LAMBDA_PROMPT_TERMS.test(promptText(payload));
}

function context(event) {
  return [
    'The lambda-best-practices skill is relevant to this request.',
    'Load its RULES.md first; load the full SKILL.md for Lambda planning, implementation, deployment, debugging, event-source, concurrency, security, tenant, or UI/API performance work.',
    'Measure Init Duration, p50/p95/p99, memory, cold starts, concurrency/throttles, queue/iterator age, retries/DLQ, and downstream saturation before tuning.',
    'Keep handlers stateless and idempotent, initialize reusable clients outside the handler, bound retries/timeouts/concurrency, use least-privilege IAM/secrets, and test the actual trigger semantics.',
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
  LAMBDA_PROMPT_TERMS,
  context,
  isRelevant,
  projectRoot,
  readPayload,
  repoLooksLambda,
};
