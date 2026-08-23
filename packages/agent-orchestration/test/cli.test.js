import { describe, it, expect, afterEach } from 'vitest';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const binPath = fileURLToPath(new URL('../bin/arcwright.js', import.meta.url));
const libPath = fileURLToPath(new URL('../lib', import.meta.url));
const tempDirs = [];

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

describe('public CLI wrapper', () => {
  it('passes migrate --dry-run through as a top-level command', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'arcw-cli-'));
    tempDirs.push(dir);
    fs.mkdirSync(path.join(dir, '_bmad'));

    const result = spawnSync(process.execPath, [binPath, 'migrate', '--dry-run'], {
      cwd: dir,
      encoding: 'utf8',
      timeout: 10_000,
    });

    expect(result.error).toBeUndefined();
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('DRY RUN');
    expect(fs.existsSync(path.join(dir, '_bmad'))).toBe(true);
    expect(fs.existsSync(path.join(dir, '_arcwright'))).toBe(false);
  });

  it('passes migrate through the npx-specific execution path', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'arcw-cli-'));
    tempDirs.push(dir);
    fs.mkdirSync(path.join(dir, '_bmad'));

    const fixtureRoot = path.join(dir, '_npx', 'package');
    const fixtureBin = path.join(fixtureRoot, 'bin', 'arcwright.js');
    fs.mkdirSync(path.dirname(fixtureBin), { recursive: true });
    fs.copyFileSync(binPath, fixtureBin);
    fs.symlinkSync(libPath, path.join(fixtureRoot, 'lib'), process.platform === 'win32' ? 'junction' : 'dir');

    const result = spawnSync(process.execPath, [fixtureBin, 'migrate', '--dry-run'], {
      cwd: dir,
      encoding: 'utf8',
      timeout: 10_000,
    });

    expect(result.error).toBeUndefined();
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('DRY RUN');
    expect(fs.existsSync(path.join(dir, '_bmad'))).toBe(true);
    expect(fs.existsSync(path.join(dir, '_arcwright'))).toBe(false);
  });

  it('passes literal npx arguments without re-evaluating shell syntax', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'arcw-cli-'));
    tempDirs.push(dir);
    const fixtureRoot = path.join(dir, '_npx', 'package');
    const fixtureBin = path.join(fixtureRoot, 'bin', 'arcwright.js');
    const sentinel = path.join(dir, 'npx-shell-evaluation');
    fs.mkdirSync(path.dirname(fixtureBin), { recursive: true });
    fs.copyFileSync(binPath, fixtureBin);
    fs.symlinkSync(libPath, path.join(fixtureRoot, 'lib'), process.platform === 'win32' ? 'junction' : 'dir');

    const result = spawnSync(process.execPath, [fixtureBin, 'migrate', '--dry-run', `$(touch ${sentinel})`], {
      cwd: dir,
      encoding: 'utf8',
      timeout: 10_000,
    });

    expect(result.error).toBeUndefined();
    expect(fs.existsSync(sentinel)).toBe(false);
  });

  it('returns a failure without mutation when migration preflight fails', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'arcw-cli-'));
    tempDirs.push(dir);
    fs.mkdirSync(path.join(dir, '_bmad'));
    fs.mkdirSync(path.join(dir, '_arcwright'));

    const result = spawnSync(process.execPath, [binPath, 'migrate'], {
      cwd: dir,
      encoding: 'utf8',
      timeout: 10_000,
    });

    expect(result.error).toBeUndefined();
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('Migration aborted');
    expect(fs.existsSync(path.join(dir, '_bmad'))).toBe(true);
    expect(fs.existsSync(path.join(dir, '_arcwright'))).toBe(true);
  });
});
