#!/usr/bin/env node
'use strict';

// Read-only Aurora router. It never contacts AWS, reads credentials, edits files,
// runs SQL, fails over a cluster, or authorizes a database mutation.

const fs = require('node:fs');
const path = require('node:path');

const AURORA_PROMPT_TERMS = /(?:amazon\s+aurora|aws\s+aurora|aurora\s+(?:postgres(?:ql)?|mysql|db|cluster|global|serverless)|rds\s+proxy|aurora\s+global\s+database|aurora\s+serverless\s+v2|dbcluster|dbinstance|rds\s+cluster)/i;
const AURORA_MARKERS = [
  'aurora',
  'rds-proxy',
  path.join('infra', 'database'),
  path.join('infra', 'rds'),
  path.join('infra', 'aurora'),
  path.join('infrastructure', 'database'),
  path.join('infrastructure', 'rds'),
  'database.tf',
  'aurora.tf',
];
const AURORA_PACKAGE_TERMS = /(?:rds-proxy|aurora(?:-|-|\b)|serverless-v2)/i;

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

function repoLooksAurora(root) {
  if (AURORA_MARKERS.some((marker) => fs.existsSync(path.join(root, marker)))) return true;
  return packageFiles(root).some((file) => {
    try { return AURORA_PACKAGE_TERMS.test(fs.readFileSync(file, 'utf8')); }
    catch { return false; }
  });
}

function promptText(payload = {}) {
  return String(payload.prompt || payload.user_prompt || payload.message || '');
}

function isRelevant(payload = {}) {
  const event = String(payload.hook_event_name || payload.event || process.env.CLAUDE_HOOK_EVENT_NAME || 'UserPromptSubmit');
  if (/^SessionStart$/i.test(event)) return repoLooksAurora(projectRoot(payload));
  return AURORA_PROMPT_TERMS.test(promptText(payload));
}

function context(event) {
  return [
    'The aurora-db-best-practices skill is relevant to this request.',
    'Load its RULES.md first; load the full SKILL.md for Aurora architecture, query, connection, failover, security, recovery, migration, cost, or codebase review.',
    'Identify Aurora PostgreSQL vs MySQL and engine version, topology/endpoints, provisioned vs Serverless v2, connection budget, RPO/RTO, and measured workload evidence before recommending changes.',
    'Keep the database private, bound queries/connections/retries, test client failover and isolated restore, and coordinate API/UI work with the relevant frontend and Amplify skills.',
    'For multi-tenant SaaS, load references/multi-tenant-saas.md and verify pool/bridge/silo choice, server-side tenant membership, PostgreSQL RLS or a reviewed MySQL boundary, transaction-local tenant context, noisy-neighbor quotas, idempotent onboarding, migration fan-out, and R&D data separation.',
    `This ${event} hook is a routing signal only: it performs no AWS calls, SQL, or file mutations.`,
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

module.exports = { AURORA_PROMPT_TERMS, context, isRelevant, projectRoot, readPayload, repoLooksAurora };
