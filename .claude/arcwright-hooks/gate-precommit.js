#!/usr/bin/env node
/**
 * Arcwright ci-gates PreToolUse(Bash) commit gate. Intercepts `git commit` and
 * runs the local gate battery before the commit is allowed. TIERED enforcement:
 *
 *   - Secret scan (gitleaks on staged, or a built-in high-confidence fallback)
 *       → BLOCKING. Exit 2 denies the commit and shows stderr to the model.
 *   - Conventional-commit message shape (from -m / -F)
 *       → ADVISORY. Warns on stderr, does not block.
 *   - Lint / type-check / tests are handled by gate-lint.js (per edit) and CI;
 *       this hook stays fast and focused on the commit boundary.
 *
 * Only a real, unquoted `git commit` trips the gate — a command that merely
 * mentions it inside quotes or a comment is ignored (same effective-command
 * stripping the Bash guard uses).
 *
 * Marker: "arcwright-hooks" via its install path so settings.json merges are
 * idempotent.
 */
'use strict';

const { execSync } = require('child_process');

function effectiveCommand(cmd) {
  let out = '';
  let quote = null;
  for (let i = 0; i < cmd.length; i++) {
    const ch = cmd[i];
    if (quote) {
      if (ch === quote) quote = null;
      continue;
    }
    if (ch === "'" || ch === '"') {
      quote = ch;
      out += ' ';
      continue;
    }
    if (ch === '#' && (i === 0 || /\s/.test(cmd[i - 1]))) {
      while (i < cmd.length && cmd[i] !== '\n') i++;
      out += '\n';
      continue;
    }
    out += ch;
  }
  return out;
}

// High-confidence secret patterns for the fallback scan (gitleaks preferred).
const SECRET_PATTERNS = [
  [/-----BEGIN (?:RSA |EC |OPENSSH |PGP |DSA )?PRIVATE KEY-----/, 'private key block'],
  [/AKIA[0-9A-Z]{16}/, 'AWS access key id'],
  [/\bgh[pousr]_[A-Za-z0-9]{36,}\b/, 'GitHub token'],
  [/\bxox[baprs]-[A-Za-z0-9-]{10,}\b/, 'Slack token'],
  [/\bsk-[A-Za-z0-9]{32,}\b/, 'OpenAI-style secret key'],
  [/-----BEGIN PRIVATE KEY-----/, 'PKCS#8 private key'],
];

let raw = '';
process.stdin.on('data', (c) => (raw += c));
process.stdin.on('end', () => {
  let cmd = '';
  try {
    const p = JSON.parse(raw || '{}');
    cmd = (p.tool_input && p.tool_input.command) || '';
  } catch {
    process.exit(0);
  }
  if (!cmd) process.exit(0);

  const scanned = effectiveCommand(cmd);
  if (!/\bgit\s+commit\b/.test(scanned)) process.exit(0);

  // ---- BLOCKING: secret scan of the staged diff ----
  const secret = scanStagedForSecrets();
  if (secret) {
    process.stderr.write(
      `[Arcwright ci-gates] Commit blocked: ${secret} detected in the staged diff.\n` +
        `Remove the secret (and rotate it if it was ever real), unstage the file, then commit again.\n` +
        `If this is a false positive, commit outside the gate or adjust the gitleaks allowlist.\n`
    );
    process.exit(2);
  }

  // ---- ADVISORY: conventional-commit shape ----
  const msg = extractCommitMessage(cmd);
  if (msg && !isConventional(msg)) {
    process.stderr.write(
      `[Arcwright ci-gates] Advisory: commit subject is not Conventional Commits format.\n` +
        `Expected "type(scope): summary" (type ∈ feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert).\n` +
        `Got: ${msg.split('\n')[0]}\n`
    );
    // advisory only — fall through to allow.
  }
  process.exit(0);
});

function scanStagedForSecrets() {
  // Prefer gitleaks if present (protect mode scans staged changes).
  try {
    execSync('gitleaks protect --staged --no-banner', { stdio: 'pipe', timeout: 60000 });
    return null; // gitleaks ran clean
  } catch (e) {
    const out = ((e.stdout || '') + (e.stderr || '')).toString();
    if (/leaks found|secret/i.test(out)) return 'a secret (gitleaks)';
    // gitleaks absent or errored → fall back to the built-in scan below.
  }
  try {
    const diff = execSync('git diff --cached --no-color', { stdio: 'pipe', timeout: 30000 })
      .toString();
    const added = diff
      .split('\n')
      .filter((l) => l.startsWith('+') && !l.startsWith('+++'))
      .join('\n');
    for (const [re, label] of SECRET_PATTERNS) {
      if (re.test(added)) return label;
    }
  } catch {
    /* no repo / nothing staged → nothing to block */
  }
  return null;
}

function extractCommitMessage(cmd) {
  // -m "msg" / -m 'msg' / --message=msg
  let m = cmd.match(/(?:-m|--message)[=\s]+(["'])([\s\S]*?)\1/);
  if (m) return m[2];
  m = cmd.match(/(?:-m|--message)[=\s]+(\S+)/);
  if (m) return m[1];
  return null; // -F file / editor commit → can't see it here, skip advisory
}

function isConventional(msg) {
  return /^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\([^)]+\))?!?:\s.+/.test(
    msg.trim()
  );
}
