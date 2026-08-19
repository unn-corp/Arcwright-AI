#!/usr/bin/env node
'use strict';

// Read-only Cognito router. It never contacts AWS, reads credentials, edits files,
// creates users, or authorizes an authentication/deployment change.

const fs = require('node:fs');
const path = require('node:path');

const COGNITO_PROMPT_TERMS = /\b(?:amazon\s+cognito|cognito|user\s+pool|identity\s+pool|managed\s+login|hosted\s+ui|cognito\s+jwt|cognito\s+token|cognito\s+trigger|cognito\s+multi.?tenant|amplify\s+auth|aws-jwt-verify|webAuthn|passkey)\b/i;
const COGNITO_MARKERS = [
  'cognito',
  'cognito.tf',
  'cognito.yaml',
  'cognito.yml',
  'cognito.json',
  'user-pool',
  'identity-pool',
  path.join('amplify', 'auth'),
  path.join('amplify', 'auth', 'resource.ts'),
];
const COGNITO_PACKAGE_TERMS = /(?:aws-amplify|@aws-amplify\/auth|amazon-cognito-identity-js|@aws-sdk\/client-cognito-identity(?:-provider)?|aws-jwt-verify|openid-client|oidc-client)/i;

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

function repoLooksCognito(root) {
  if (COGNITO_MARKERS.some((marker) => fs.existsSync(path.join(root, marker)))) return true;
  return packageFiles(root).some((file) => {
    try {
      return COGNITO_PACKAGE_TERMS.test(fs.readFileSync(file, 'utf8'));
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
  if (/^SessionStart$/i.test(event)) return repoLooksCognito(projectRoot(payload));
  return COGNITO_PROMPT_TERMS.test(promptText(payload));
}

function context(event) {
  return [
    'The cognito-best-practices skill is relevant to this request.',
    'Load its RULES.md first; load the full SKILL.md for Cognito, Amplify Auth, OAuth/OIDC, MFA/passkey, federation, Identity Pool, multi-tenant, or auth UI planning/review.',
    'Separate User Pool authentication/JWTs from Identity Pool temporary AWS credentials; verify issuer/signature/token use/audience/expiry and enforce tenant membership server-side.',
    'For public browser/mobile clients use authorization code + PKCE with exact callbacks and no embedded client secret; review refresh/revocation, MFA/recovery, trigger latency, IAM scope, quotas, and R&D isolation.',
    'For the UI, configure Amplify once, deduplicate session bootstrap/refresh, preserve loading/error/recovery states, and measure callback-to-render plus p75 LCP/INP/CLS.',
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
  COGNITO_PROMPT_TERMS,
  isRelevant,
  projectRoot,
  readPayload,
  repoLooksCognito,
};
