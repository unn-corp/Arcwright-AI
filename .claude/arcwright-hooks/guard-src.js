#!/usr/bin/env node
/**
 * Arcwright PreToolUse(Write|Edit) guard. BLOCKS writes to this repo's
 * packages/*\/src/, which is generated build output wiped on every
 * `node build/build.js` run (see CLAUDE.md "Never edit src/ directories").
 * Edits belong in lib/ or the source skill/command trees. Exits 2 to block; 0 to allow.
 *
 * Scoped to the project root on purpose: submodules (herdr, collie, t3code)
 * carry their own packages/*\/src/ trees that are real, hand-written source.
 * Matching the pattern anywhere in the path blocked legitimate edits there.
 *
 * Marker: contains the literal "arcwright-hooks" via its install path so the
 * settings.json merge can find and replace it idempotently.
 */
'use strict';

const path = require('node:path');

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

  const projectDir = process.env.CLAUDE_PROJECT_DIR || process.cwd();
  // Compare against the project root so only THIS repo's generated tree is
  // guarded. A path outside the root, or inside a submodule, produces a
  // relative path that does not start with packages/, so it is allowed.
  const relative = path.relative(path.resolve(projectDir), path.resolve(filePath));
  const norm = relative.replace(/\\/g, '/');

  if (/^packages\/[^/]+\/src\//.test(norm)) {
    console.error(
      `[guard-src] ${norm} is generated build output (wiped by node build/build.js). ` +
        `Edit the source instead: lib/ for installer logic, .agents/skills or .claude/commands for content, ` +
        `then rebuild.`
    );
    process.exit(2);
  }
  process.exit(0);
});
