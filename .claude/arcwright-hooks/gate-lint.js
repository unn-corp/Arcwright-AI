#!/usr/bin/env node
/**
 * Arcwright ci-gates PostToolUse(Write|Edit) lint/format gate. ADVISORY (tiered
 * enforcement: lint warns, it never blocks). Reads the hook payload on stdin,
 * and for the edited file runs the appropriate fast linter/formatter:
 *
 *   .ts/.tsx/.js/.jsx → eslint + prettier --check
 *   .py               → ruff check + ruff format --check
 *
 * Findings are surfaced to the model on stdout so it can self-correct; the hook
 * always exits 0 (degrades silently when a tool is absent). Keep it fast: it
 * lints only the single changed file, never the whole tree.
 *
 * RESOLUTION RULES (this is what keeps it both fast and correct):
 *   1. Walk up from the edited file to the nearest package/config root and run
 *      the linter THERE. This is a monorepo with submodules (herdr, t3code,
 *      hermes-agent, collie, ungate) and a nested `website/` app, each with its
 *      own toolchain — linting a website file with repo-root config is noise.
 *   2. Only run a linter when that root actually has a config for it. No config
 *      means the project does not use that tool; running it anyway produces
 *      false findings (e.g. `website/` has eslint but no prettier).
 *   3. Only run a project-local binary from node_modules/.bin. Never fall back
 *      to a globally installed eslint/prettier — a global binary carries an
 *      unrelated version and no project config.
 *   4. Never go through `npx`. Even `npx --no-install` boots npm on every call
 *      (~930ms for eslint, ~230ms for prettier here). Spawning the resolved
 *      binary directly removes that entirely, and a project with no local
 *      toolchain now costs ~0ms instead of ~1.2s per edit.
 *
 * Marker: contains the literal "arcwright-hooks" via its install path so the
 * settings.json merge can find and replace it idempotently.
 */
'use strict';

const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ESLINT_CONFIGS = [
  'eslint.config.js',
  'eslint.config.mjs',
  'eslint.config.cjs',
  'eslint.config.ts',
  '.eslintrc',
  '.eslintrc.js',
  '.eslintrc.cjs',
  '.eslintrc.json',
  '.eslintrc.yml',
  '.eslintrc.yaml',
];
const PRETTIER_CONFIGS = [
  '.prettierrc',
  '.prettierrc.js',
  '.prettierrc.cjs',
  '.prettierrc.mjs',
  '.prettierrc.json',
  '.prettierrc.yml',
  '.prettierrc.yaml',
  '.prettierrc.toml',
  'prettier.config.js',
  'prettier.config.cjs',
  'prettier.config.mjs',
];
const RUFF_CONFIGS = ['ruff.toml', '.ruff.toml', 'pyproject.toml'];

/**
 * Ascend from `fromDir` calling `visit(dir)`, returning its first truthy result.
 *
 * The walk STOPS after inspecting a directory that contains `.git` — a real
 * directory in a normal clone, a gitlink file in a submodule. Either form marks
 * "this project ends here". Without that boundary the walk runs all the way to
 * the filesystem root, so a stray `~/.prettierrc` or a `node_modules` in the
 * user's home directory would silently govern linting for every project on the
 * machine. The current directory is always inspected before the boundary check,
 * so a repo-root config or a hoisted monorepo node_modules is still found.
 */
function walkUp(fromDir, visit) {
  let dir = fromDir;
  for (;;) {
    const hit = visit(dir);
    if (hit) return hit;
    if (fs.existsSync(path.join(dir, '.git'))) return null;
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

/** Nearest ancestor directory (inclusive) containing any of `names`, else null. */
function findUp(fromDir, names) {
  return walkUp(fromDir, (dir) =>
    names.some((name) => fs.existsSync(path.join(dir, name))) ? dir : null
  );
}

/** Nearest project-local node_modules/.bin/<name>, else null (no global fallback). */
function findLocalBin(fromDir, name) {
  return walkUp(fromDir, (dir) => {
    const bin = path.join(dir, 'node_modules', '.bin', name);
    return fs.existsSync(bin) ? bin : null;
  });
}

/** True when the nearest package.json declares a "prettier" config key. */
function hasPrettierPkgKey(fromDir) {
  const root = findUp(fromDir, ['package.json']);
  if (!root) return null;
  try {
    return JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')).prettier
      ? root
      : null;
  } catch {
    return null;
  }
}

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

  const abs = path.resolve(filePath);
  const dir = path.dirname(abs);

  try {
    if (/\.(ts|tsx|js|jsx|mjs|cjs)$/.test(abs)) {
      const eslintRoot = findUp(dir, ESLINT_CONFIGS);
      if (eslintRoot) {
        const bin = findLocalBin(dir, 'eslint');
        if (bin) run(bin, [abs], 'ESLint', eslintRoot);
      }
      const prettierRoot = findUp(dir, PRETTIER_CONFIGS) || hasPrettierPkgKey(dir);
      if (prettierRoot) {
        const bin = findLocalBin(dir, 'prettier');
        if (bin) run(bin, ['--check', abs], 'Prettier', prettierRoot);
      }
    } else if (/\.py$/.test(abs)) {
      // ruff is a standalone binary (uv/pipx installed), so PATH lookup is the
      // correct resolution here — but still require a config root so it runs
      // with the owning project's rule set, not repo-root defaults.
      const ruffRoot = findUp(dir, RUFF_CONFIGS);
      if (ruffRoot) {
        run('ruff', ['check', abs], 'Ruff lint', ruffRoot);
        run('ruff', ['format', '--check', abs], 'Ruff format', ruffRoot);
      }
    }
  } catch {
    /* advisory only — never fail the turn */
  }
  process.exit(0);

  // Run via spawnSync with an argument array: the file path is passed as a
  // literal argv entry, never through a shell, so a malicious file_path
  // (e.g. `foo$(cmd).ts`) cannot inject commands. shell:false is the default.
  function run(cmd, args, label, cwd) {
    const r = spawnSync(cmd, args, {
      cwd,
      stdio: 'pipe',
      timeout: 30000,
      encoding: 'utf8',
    });
    if (r.error) return; // tool missing (ENOENT) → degrade silently
    if (r.status === 0) return; // clean
    const out = ((r.stdout || '') + (r.stderr || '')).trim();
    const noise =
      /not found|cannot find module|couldn't find|no such file|command not found|ignored because|matching ignore pattern/i.test(
        out
      );
    if (out && !noise) {
      process.stdout.write(
        `[Arcwright ci-gates ${label}]\n` + out.split('\n').slice(0, 25).join('\n') + '\n'
      );
    }
  }
});
