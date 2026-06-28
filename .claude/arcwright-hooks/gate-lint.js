#!/usr/bin/env node
/**
 * Arcwright ci-gates PostToolUse(Write|Edit) lint/format gate. ADVISORY (tiered
 * enforcement: lint warns, it never blocks). Reads the hook payload on stdin,
 * and for the edited file runs the appropriate fast linter/formatter:
 *
 *   .ts/.tsx/.js/.jsx → eslint (if configured) + prettier --check
 *   .py               → ruff check + ruff format --check
 *
 * Findings are surfaced to the model on stdout so it can self-correct; the hook
 * always exits 0 (degrades silently when a tool is absent). Keep it fast: it
 * lints only the single changed file, never the whole tree.
 *
 * Marker: contains the literal "arcwright-hooks" via its install path so the
 * settings.json merge can find and replace it idempotently.
 */
'use strict';

const { spawnSync } = require('child_process');

let raw = '';
process.stdin.on('data', (c) => (raw += c));
process.stdin.on('end', () => {
  let filePath = '';
  try {
    const p = JSON.parse(raw || '{}');
    filePath = (p.tool_input && (p.tool_input.file_path || p.tool_input.path)) || '';
  } catch {
    process.exit(0);
  }
  if (!filePath) process.exit(0);

  try {
    if (/\.(ts|tsx|js|jsx|mjs|cjs)$/.test(filePath)) {
      run('npx', ['--no-install', 'eslint', filePath], 'ESLint');
      run('npx', ['--no-install', 'prettier', '--check', filePath], 'Prettier');
    } else if (/\.py$/.test(filePath)) {
      run('ruff', ['check', filePath], 'Ruff lint');
      run('ruff', ['format', '--check', filePath], 'Ruff format');
    }
  } catch {
    /* advisory only — never fail the turn */
  }
  process.exit(0);

  // Run via spawnSync with an argument array: the file path is passed as a
  // literal argv entry, never through a shell, so a malicious file_path
  // (e.g. `foo$(cmd).ts`) cannot inject commands. shell:false is the default.
  function run(cmd, args, label) {
    const r = spawnSync(cmd, args, { stdio: 'pipe', timeout: 60000, encoding: 'utf8' });
    if (r.error) return; // tool missing (ENOENT) → degrade silently
    if (r.status === 0) return; // clean
    const out = ((r.stdout || '') + (r.stderr || '')).trim();
    const missing = /not found|cannot find module|couldn't find|no such file|command not found/i.test(out);
    if (out && !missing) {
      process.stdout.write(
        `[Arcwright ci-gates ${label}]\n` + out.split('\n').slice(0, 25).join('\n') + '\n'
      );
    }
  }
});
