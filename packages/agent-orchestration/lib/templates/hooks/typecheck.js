#!/usr/bin/env node
/**
 * Arcwright PostToolUse(Write|Edit) typecheck (full mode only). Best-effort,
 * non-blocking: if the edited file is TS/TSX it runs `tsc --noEmit`; if Python
 * it runs `pyright`. Surfaces the first errors to the model via stdout. Never
 * fails the turn — degrades silently when the tool is absent.
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
    if (/\.(ts|tsx)$/.test(filePath)) {
      run('npx', ['--no-install', 'tsc', '--noEmit'], 'TypeScript');
    } else if (/\.py$/.test(filePath)) {
      run('pyright', ['--outputjson'], 'Pyright');
    }
  } catch {
    /* never fail the turn */
  }
  process.exit(0);

  // spawnSync with an argument array — no shell, so nothing here can be turned
  // into command injection. These commands take no model-controlled input today
  // (they run project-wide); the no-shell form keeps it that way defensively.
  function run(cmd, args, label) {
    const r = spawnSync(cmd, args, { stdio: 'pipe', timeout: 120000, encoding: 'utf8' });
    if (r.error) return; // tool absent (ENOENT) → degrade silently
    if (r.status === 0) return; // clean
    const out = ((r.stdout || '') + (r.stderr || '')).trim();
    if (out) {
      process.stdout.write(`[Arcwright ${label} check]\n` + out.split('\n').slice(0, 25).join('\n') + '\n');
    }
  }
});
