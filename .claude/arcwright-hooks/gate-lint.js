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

const { execSync } = require('child_process');

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

  const q = JSON.stringify(filePath);
  try {
    if (/\.(ts|tsx|js|jsx|mjs|cjs)$/.test(filePath)) {
      run(`npx --no-install eslint ${q}`, 'ESLint');
      run(`npx --no-install prettier --check ${q}`, 'Prettier');
    } else if (/\.py$/.test(filePath)) {
      run(`ruff check ${q}`, 'Ruff lint');
      run(`ruff format --check ${q}`, 'Ruff format');
    }
  } catch {
    /* advisory only — never fail the turn */
  }
  process.exit(0);

  function run(command, label) {
    try {
      execSync(command, { stdio: 'pipe', timeout: 60000 });
      // exit 0, no output = clean
    } catch (e) {
      // Missing tool / no config → degrade silently. Only surface real findings.
      const out = ((e.stdout || '') + (e.stderr || '')).toString().trim();
      const missing = /not found|cannot find module|couldn't find|no such file|command not found|ENOENT/i.test(out);
      if (out && !missing) {
        process.stdout.write(
          `[Arcwright ci-gates ${label}]\n` + out.split('\n').slice(0, 25).join('\n') + '\n'
        );
      }
    }
  }
});
