import { describe, it, expect, afterEach } from 'vitest';
import { spawnSync, execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';

const binPath = fileURLToPath(new URL('../bin/arcwright.js', import.meta.url));
const libPath = fileURLToPath(new URL('../lib', import.meta.url));
const tempDirs = [];

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

describe('public CLI wrapper', () => {
  it('preserves omitted project hosts and honors explicit Claude-only and stable selections', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'arcw-cli-'));
    tempDirs.push(dir);
    const isolatedHome = path.join(dir, 'home');
    fs.mkdirSync(isolatedHome);
    const run = (command, ...flags) => execFileSync(process.execPath, [
      binPath, command, '--yes', '--directory', dir, '--hooks', 'none', ...flags,
    ], { cwd: dir, env: { ...process.env, HOME: isolatedHome }, stdio: 'pipe' });
    const manifest = () => YAML.parse(fs.readFileSync(path.join(dir, '_arcwright/_config/manifest.yaml'), 'utf8'));
    run('install', '--tools', 'codex,claude-code', '--channel', 'next');
    run('update');
    expect(manifest().tools).toEqual(['codex', 'claude-code']);
    expect(manifest().channel).toBe('next');
    run('update', '--tools', 'claude-code', '--channel', 'stable');
    expect(manifest().tools).toEqual(['claude-code']);
    expect(manifest().channel).toBe('stable');
  }, 60000);
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

  it('runs migrate from a relocated runtime', () => {
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

  it('passes literal arguments without re-evaluating shell syntax', () => {
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

describe('account sharing CLI', () => {
  const run = (home, ...args) => spawnSync(process.execPath, [binPath, ...args], {
    cwd: home, env: { ...process.env, HOME: home, CODEX_HOME: '', CLAUDE_CONFIG_DIR: '', GROK_HOME: '' }, encoding: 'utf8', timeout: 10000,
  });
  it('exposes account status and previews global enrollment without creating files', () => {
    const home = fs.mkdtempSync(path.join(os.tmpdir(), 'arcw-cli-sharing-'));
    tempDirs.push(home);
    const status = run(home, 'accounts', 'status', '--global', '--json');
    expect(status.status).toBe(0);
    expect(JSON.parse(status.stdout).sharing).toBe(null);
    const preview = run(home, 'update', '--global', '--yes', '--sharing', 'all', '--dry-run');
    expect(preview.status).toBe(0);
    expect(preview.stdout).toContain('.arcwright/AGENTS.md');
    expect(preview.stdout).toContain('No files written');
    expect(fs.readdirSync(home)).toEqual([]);
  });
  it('rejects contradictory options before creating installer state', () => {
    const home = fs.mkdtempSync(path.join(os.tmpdir(), 'arcw-cli-sharing-'));
    tempDirs.push(home);
    const result = run(home, 'install', '--global', '--yes', '--sharing', 'none', '--codex-self-heal', 'on');
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('contradicts');
    expect(fs.readdirSync(home)).toEqual([]);
    const custom = run(home, 'install', '--global', '--yes', '--sharing', 'custom');
    expect(custom.status).not.toBe(0);
    expect(custom.stderr).toContain('--sharing-config');
  });
});
