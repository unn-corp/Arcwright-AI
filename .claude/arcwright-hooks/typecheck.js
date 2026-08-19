#!/usr/bin/env node
/**
 * Arcwright PostToolUse(Write|Edit) typecheck (full mode only). Best-effort,
 * non-blocking: if the edited file is TS/TSX it runs `tsc --noEmit`; if Python
 * it runs `pyright`. Surfaces the first errors to the model via stdout. Never
 * fails the turn — degrades silently when the tool is absent.
 *
 * RESOLUTION RULES (these keep the hook from being the slowest thing in a turn):
 *   1. Resolve the project from the EDITED FILE, not the process cwd. Walk up to
 *      the nearest tsconfig.json / pyproject.toml and run the checker there.
 *      In a monorepo the repo root is usually the wrong project.
 *   2. Only run a project-local node_modules/.bin/tsc. A global tsc would use a
 *      different compiler version than the project's real gate.
 *   3. Never go through `npx`. Even `npx --no-install` boots npm on every call
 *      (~1s), on top of the type-check itself, on every single edit.
 *   4. Type-check Python per-file rather than project-wide, and in plain text —
 *      `--outputjson` spent the model's context on JSON envelope instead of
 *      diagnostics.
 *
 * TS is still checked project-wide: `tsc` has no correct single-file mode (a
 * file's errors depend on its imports). That is inherently the expensive branch,
 * which is exactly why this hook is opt-in `full` mode and not the `safe`
 * default.
 */
'use strict';

const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Ascend from `fromDir` calling `visit(dir)`, returning its first truthy result.
 *
 * The walk STOPS after inspecting a directory that contains `.git` — a real
 * directory in a normal clone, a gitlink file in a submodule. Either form marks
 * "this project ends here". Without that boundary the walk runs all the way to
 * the filesystem root, so a stray `tsconfig.json` or `node_modules` in the
 * user's home directory would silently govern type-checking for every project
 * on the machine. The current directory is always inspected before the boundary
 * check, so a repo-root config or a hoisted monorepo node_modules is still found.
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

/**
 * Pick the tsc arguments for this project.
 *
 * A "solution-style" tsconfig (`"files": []` + `"references": [...]`, the shape
 * Vite/React scaffolds emit) has no inputs of its own. Plain `tsc --noEmit`
 * against it type-checks NOTHING and exits 0 in ~50ms — a vacuous pass that
 * makes the hook look like it is working while catching zero errors. Build mode
 * (`-b`) is what follows the project references; it is also what such a
 * project's own `npm run build` uses.
 *
 * `-b --noEmit` requires TypeScript >= 5.6, so fall back to plain `--noEmit`
 * on older compilers rather than risk build mode writing output files.
 */
function tscArgs(tsRoot, binPath) {
  const flat = ['--noEmit', '--pretty', 'false'];
  let cfg;
  try {
    // Strip comments/trailing commas conservatively — tsconfig is JSONC.
    const text = fs
      .readFileSync(path.join(tsRoot, 'tsconfig.json'), 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/(^|\s)\/\/.*$/gm, '$1')
      .replace(/,(\s*[}\]])/g, '$1');
    cfg = JSON.parse(text);
  } catch {
    return flat;
  }
  const hasRefs = Array.isArray(cfg.references) && cfg.references.length > 0;
  const hasOwnInputs =
    (Array.isArray(cfg.files) && cfg.files.length > 0) ||
    (Array.isArray(cfg.include) && cfg.include.length > 0);
  if (!hasRefs || hasOwnInputs) return flat;

  // Solution-style: needs build mode, which needs a new enough compiler.
  try {
    const tsPkg = path.join(path.dirname(binPath), '..', 'typescript', 'package.json');
    const [maj, min] = JSON.parse(fs.readFileSync(tsPkg, 'utf8')).version.split('.').map(Number);
    if (maj > 5 || (maj === 5 && min >= 6)) return ['-b', '--noEmit', '--pretty', 'false'];
  } catch {
    /* version unknown → stay on the safe path */
  }
  return flat;
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
    if (/\.(ts|tsx)$/.test(abs)) {
      const tsRoot = findUp(dir, ['tsconfig.json']);
      if (tsRoot) {
        const bin = findLocalBin(dir, 'tsc');
        if (bin) run(bin, tscArgs(tsRoot, bin), 'TypeScript', tsRoot, 120000);
      }
    } else if (/\.py$/.test(abs)) {
      const pyRoot = findUp(dir, ['pyproject.toml', 'pyrightconfig.json', 'setup.cfg']);
      if (pyRoot) run('pyright', [abs], 'Pyright', pyRoot, 60000);
    }
  } catch {
    /* never fail the turn */
  }
  process.exit(0);

  // spawnSync with an argument array — no shell, so nothing here can be turned
  // into command injection, including the model-controlled file path.
  function run(cmd, args, label, cwd, timeout) {
    const r = spawnSync(cmd, args, { cwd, stdio: 'pipe', timeout, encoding: 'utf8' });
    if (r.error) return; // tool absent (ENOENT) → degrade silently
    if (r.status === 0) return; // clean
    const out = ((r.stdout || '') + (r.stderr || '')).trim();
    if (out) {
      process.stdout.write(
        `[Arcwright ${label} check]\n` + out.split('\n').slice(0, 25).join('\n') + '\n'
      );
    }
  }
});
