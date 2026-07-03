#!/usr/bin/env node
/**
 * Arcwright PostToolUse(Write|Edit) leak gate. ADVISORY (warns, never blocks).
 * The build's verifyNoLeaks() only runs at build time; this catches a
 * Squidhub-specific string the moment it lands in a shippable source file, so
 * it never reaches a broken build. Scans only edits under the published trees
 * (.agents/skills, .kiro/skills, _arcwright, .claude/commands). Exits 0 always.
 *
 * Patterns are kept in sync with LEAK_PATTERNS in build/build.js.
 *
 * Marker: contains the literal "arcwright-hooks" via its install path so the
 * settings.json merge can find and replace it idempotently.
 */
'use strict';

const fs = require('fs');

// Mirror of build/build.js LEAK_PATTERNS.
const LEAK_PATTERNS = [
  /squidhub/i,
  /unnportal\.io/i,
  /nautilus/i,
  /squid-master/i,
  /UNN-\d+/,
  /mcp__squidhub__/i,
  /SquidAI/,
];

// Only files that get published into the generic package matter here.
const SHIPPED_DIRS = ['.agents/skills/', '.kiro/skills/', '_arcwright/', '.claude/commands/'];

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

  const norm = filePath.replace(/\\/g, '/');
  if (!SHIPPED_DIRS.some((d) => norm.includes(d))) process.exit(0);

  let content = '';
  try {
    content = fs.readFileSync(filePath, 'utf8');
  } catch {
    process.exit(0);
  }

  const hits = [];
  for (const re of LEAK_PATTERNS) {
    const m = content.match(re);
    if (m) hits.push(m[0]);
  }
  if (hits.length) {
    console.log(
      `[leak-check] ${norm} contains Squidhub-specific content that must not ship ` +
        `in the generic package: ${[...new Set(hits)].join(', ')}. ` +
        `Genericize it before building (build/build.js verifyNoLeaks will hard-fail otherwise).`
    );
  }
  process.exit(0);
});
