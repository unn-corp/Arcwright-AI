#!/usr/bin/env node
'use strict';

// Assemble an npm-independent runtime with pinned production dependencies.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const os = require('node:os');
const { execFileSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const source = path.join(root, 'packages/agent-orchestration');
const pkg = require(path.join(source, 'package.json'));
const output = path.resolve(process.argv[2] || path.join(root, 'dist'));
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'arcwright-release-'));

try {
  execFileSync(process.execPath, [path.join(root, 'build/build.js')], { cwd: root, stdio: 'inherit' });
  const runtime = path.join(temporary, 'arcwright');
  fs.mkdirSync(runtime);
  for (const name of ['bin', 'lib', 'src', 'package.json', 'package-lock.json']) {
    fs.cpSync(path.join(source, name), path.join(runtime, name), { recursive: true, dereference: true });
  }
  execFileSync(process.platform === 'win32' ? 'npm.cmd' : 'npm', [
    'ci', '--omit=dev', '--ignore-scripts', '--no-audit', '--no-fund', '--registry=https://registry.npmjs.org/',
  ], { cwd: runtime, stdio: 'inherit' });
  // Dependency command shims are unused by the Node runtime and otherwise turn
  // into hardlinks when tar dereferences them alongside their original files.
  fs.rmSync(path.join(runtime, 'node_modules/.bin'), { recursive: true, force: true });
  fs.copyFileSync(path.join(root, 'README.md'), path.join(runtime, 'README.md'));
  fs.mkdirSync(output, { recursive: true });
  const archive = `arcwright-${pkg.version}.tar.gz`;
  // Dereference npm's internal bin links; extraction needs no symlink privileges.
  execFileSync('tar', ['-chzf', path.join(output, archive), '-C', temporary, 'arcwright']);
  const sha256 = crypto.createHash('sha256').update(fs.readFileSync(path.join(output, archive))).digest('hex');
  const sourceCommit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
  fs.writeFileSync(path.join(output, 'release.json'), JSON.stringify({
    version: pkg.version, tag: `v${pkg.version}`, archive, sha256, sourceCommit,
  }, null, 2) + '\n');
  fs.copyFileSync(path.join(root, 'release/arcwright.cjs'), path.join(output, 'arcwright.cjs'));
  const checksums = [archive, 'release.json', 'arcwright.cjs'].map(name => {
    const hash = crypto.createHash('sha256').update(fs.readFileSync(path.join(output, name))).digest('hex');
    return `${hash}  ${name}`;
  });
  fs.writeFileSync(path.join(output, 'SHA256SUMS'), checksums.join('\n') + '\n');
  console.log(`GitHub Release v${pkg.version}: ${path.join(output, archive)}`);
} finally {
  fs.rmSync(temporary, { recursive: true, force: true });
}
