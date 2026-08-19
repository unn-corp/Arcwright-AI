#!/usr/bin/env node
'use strict';

// Read-only Amplify router. It never contacts AWS, reads credentials, edits files,
// or authorizes a deployment. It only injects a short routing signal when the prompt
// or repository indicates that Amplify is in scope.

const fs = require('node:fs');
const path = require('node:path');

const AMPLIFY_PROMPT_TERMS = /\b(?:aws\s+amplify|amplify|ampx|@aws-amplify|aws-amplify|amplify_outputs\.json|amplify\.ya?ml|amplify_(?:diff|monorepo))\b/i;
const AMPLIFY_MARKERS = [
  'amplify.yml',
  'amplify.yaml',
  'amplify_outputs.json',
  path.join('amplify', 'backend.ts'),
  path.join('amplify', 'tsconfig.json'),
];
const AMPLIFY_PACKAGE_TERMS = /(?:@aws-amplify\/|aws-amplify|@aws-amplify\/backend)/i;

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
    // Some harnesses provide hook data only through environment variables.
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
  for (const workspace of ['apps', 'packages']) {
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

function repoLooksAmplify(root) {
  if (AMPLIFY_MARKERS.some((marker) => fs.existsSync(path.join(root, marker)))) return true;
  return packageFiles(root).some((file) => {
    try {
      return AMPLIFY_PACKAGE_TERMS.test(fs.readFileSync(file, 'utf8'));
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
  if (/^SessionStart$/i.test(event)) return repoLooksAmplify(projectRoot(payload));
  return AMPLIFY_PROMPT_TERMS.test(promptText(payload));
}

function context(event) {
  return [
    'The amplify-best-practices skill is relevant to this request.',
    'Load its RULES.md first; load the full SKILL.md for Amplify planning, implementation, deployment, runtime, or UI review.',
    'Measure the real build phases before changing cache paths or deploy gates; fail open to a backend deploy when baseline, commit, or diff state is uncertain.',
    'For the UI, protect p75 LCP/INP/CLS, initial JavaScript, request waterfalls, cache/privacy semantics, and responsive loading/error states.',
    `This ${event} hook is a routing signal only: it performs no AWS calls or file mutations.`,
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
  AMPLIFY_PROMPT_TERMS,
  isRelevant,
  projectRoot,
  readPayload,
  repoLooksAmplify,
};
