#!/usr/bin/env node
'use strict';

// Read-only post-edit reviewer. It emits focused reminders for Amplify-related edits;
// it never runs a build, calls AWS, changes a file, or blocks the edit.

const fs = require('node:fs');
const path = require('node:path');
const { projectRoot, readPayload, repoLooksAmplify } = require('./amplify-context');

const AMPLIFY_CONFIG = /(?:^|\/)(?:amplify\.ya?ml|amplify_outputs\.json|customHeaders\.ya?ml)$/i;
const AMPLIFY_BACKEND = /(?:^|\/)amplify\//i;
const PACKAGE_OR_LOCK = /(?:^|\/)(?:package\.json|package-lock\.json|npm-shrinkwrap\.json|\.npmrc)$/i;
const FRONTEND_CONFIG = /(?:^|\/)(?:vite\.config\.[cm]?[jt]s|next\.config\.[cm]?[jt]s|astro\.config\.[cm]?[jt]s|tsconfig(?:\.[^/]+)?\.json)$/i;
const UI_SOURCE = /(?:^|\/)(?:src|app|pages|components)\/[^/]+\.(?:[cm]?[jt]sx?|vue|svelte)$/i;

function toolInput(payload = {}) {
  return payload.tool_input || payload.toolInput || payload.input || payload;
}

function changedPath(payload = {}) {
  const input = toolInput(payload);
  return String(input.file_path || input.filePath || input.path || payload.file_path || payload.filePath || '');
}

function changedText(payload = {}) {
  const input = toolInput(payload);
  return String(input.content || input.new_string || input.newString || input.new_text || input.newText || '');
}

function readRepoFile(root, relative) {
  try {
    return fs.readFileSync(path.join(root, relative), 'utf8');
  } catch {
    return '';
  }
}

function relevantPath(filePath, content, root) {
  const normalized = filePath.replaceAll('\\', '/');
  return AMPLIFY_CONFIG.test(normalized) ||
    AMPLIFY_BACKEND.test(normalized) ||
    PACKAGE_OR_LOCK.test(normalized) ||
    (FRONTEND_CONFIG.test(normalized) && repoLooksAmplify(root)) ||
    (UI_SOURCE.test(normalized) && (repoLooksAmplify(root) || /(?:@aws-amplify\/|aws-amplify|Amplify\.configure|generateClient|ampx)/i.test(content)));
}

function inspect(filePath, content, root) {
  const normalized = filePath.replaceAll('\\', '/');
  const fullText = content || (path.isAbsolute(filePath) ? readRepoFile(root, path.relative(root, filePath)) : readRepoFile(root, normalized));
  const findings = [];

  if (AMPLIFY_CONFIG.test(normalized) && /amplify\.ya?ml$/i.test(normalized)) {
    if (/(?:^|\n)\s*-\s*(?:\/|~\/|\$HOME\/?|\$\{HOME\}\/?)/m.test(fullText)) {
      findings.push('Buildspec cache paths must be repository-relative; absolute or home-directory paths can silently cache nothing.');
    }
    if (/ampx\s+pipeline-deploy\b/i.test(fullText) && !/(?:diff|baseline|envCache|generate outputs|backend.?guard|changed)/i.test(fullText)) {
      findings.push('Review whether pipeline-deploy runs for frontend-only changes; any skip guard must compare with the live backend commit and fail open.');
    }
    if (/cache:\s*[\s\S]*node_modules\/\*\*\/\*/i.test(fullText)) {
      findings.push('Measure cache file count and cache restore/create/upload time; do not assume a larger node_modules cache is faster.');
    }
  }

  if (PACKAGE_OR_LOCK.test(normalized)) {
    const packageInAmplify = /(?:^|\/)amplify\/package\.json$/i.test(normalized);
    if (packageInAmplify) findings.push('A package boundary inside amplify/ can break Gen 2 backend module resolution; validate the loader before keeping it.');
    if (/codeartifact/i.test(fullText)) findings.push('Check that private registry URLs/tokens are not leaking into a committed lockfile or build artifact.');
  }

  if (AMPLIFY_BACKEND.test(normalized)) {
    findings.push('For backend/function changes, update the backend-change path set and validate the same dependency/install scope that Amplify uses.');
  }

  if (UI_SOURCE.test(normalized) || FRONTEND_CONFIG.test(normalized)) {
    findings.push('For UI changes, verify the production bundle, request waterfall, and p75 LCP/INP/CLS; defer non-critical code and keep data reads bounded.');
    if (/from\s+["']aws-amplify["']/i.test(fullText)) {
      findings.push('Review whether category-specific imports are supported for this code path and confirm the bundle before/after; keep the single configure call at the app entrypoint.');
    }
  }

  return [...new Set(findings)];
}

function emit(payload, findings) {
  const event = payload.hook_event_name || payload.event || process.env.CLAUDE_HOOK_EVENT_NAME || 'PostToolUse';
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: event,
      additionalContext: [
        'The amplify-best-practices post-edit review signal fired:',
        ...findings.map((finding) => `- ${finding}`),
        'Load the full skill before making a performance or deployment decision; this hook is advisory and read-only.',
      ].join('\n'),
    },
  }) + '\n');
}

if (require.main === module) {
  const payload = readPayload();
  const root = projectRoot(payload);
  const filePath = changedPath(payload);
  const content = changedText(payload);
  if (filePath && relevantPath(filePath, content, root)) {
    const findings = inspect(filePath, content, root);
    if (findings.length > 0) emit(payload, findings);
  }
}

module.exports = {
  changedPath,
  inspect,
  relevantPath,
};
