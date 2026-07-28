#!/usr/bin/env node
/**
 * Arcwright PostToolUse(Write|Edit) leak gate. ADVISORY (warns, never blocks).
 * The build's verifyNoLeaks() only runs at build time; this catches a
 * Squidhub-specific string the moment it lands in a shippable source file, so
 * it never reaches a broken build. Exits 0 always.
 *
 * Patterns come from build/leak-patterns.js — the same module build/build.js
 * requires, so this gate cannot drift from the gate that fails the build.
 *
 * Scoped to the project root on purpose (same fix guard-src.js already carries):
 * the path test is applied to the path RELATIVE to $CLAUDE_PROJECT_DIR, so a
 * submodule that happens to have its own `.agents/skills/` tree (t3code does)
 * is not flagged. Only content that this repo actually publishes is checked.
 *
 * Marker: contains the literal "arcwright-hooks" via its install path so the
 * settings.json merge can find and replace it idempotently.
 */
'use strict';

const fs = require('fs');
const path = require('node:path');

// Anchor on __dirname, not $CLAUDE_PROJECT_DIR or cwd. This file's location
// (<root>/.claude/arcwright-hooks/) fixes the repo root exactly, whereas the env
// var can be unset and cwd can be anything — and a gate that silently no-ops
// when it can't find itself is worse than no gate.
const PROJECT_ROOT = path.resolve(__dirname, '..', '..');
const { LEAK_PATTERNS } = require(path.join(PROJECT_ROOT, 'build', 'leak-patterns.js'));

// Only source trees that get published into the generic package matter here.
// `.kiro/skills/` is deliberately absent: it exists only as generated build
// output under packages/*/src/, never as an editable source tree.
const SHIPPED_DIRS = ['.agents/skills/', '_arcwright/', '.claude/commands/'];

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

  const rel = path.relative(PROJECT_ROOT, path.resolve(filePath)).replace(/\\/g, '/');
  // A path outside the project root resolves to a `../…` relative path and is
  // not a shipped tree, so it is skipped.
  if (rel.startsWith('../') || !SHIPPED_DIRS.some((d) => rel.startsWith(d))) process.exit(0);

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
      `[leak-check] ${rel} contains Squidhub-specific content that must not ship ` +
        `in the generic package: ${[...new Set(hits)].join(', ')}. ` +
        `Genericize it before building (build/build.js verifyNoLeaks will hard-fail otherwise).`
    );
  }
  process.exit(0);
});
