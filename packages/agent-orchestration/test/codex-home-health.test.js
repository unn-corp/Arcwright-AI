import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { discoverCodexHomes, runCodexHomeHealth, formatCodexHomeHealth } from '../lib/codex-home-health.js';

let homeDir;
let backupRoot;
beforeEach(() => {
  homeDir = fs.mkdtempSync(path.join(os.tmpdir(), 'arcw-codex-health-'));
  backupRoot = path.join(homeDir, 'recovery');
});
afterEach(() => {
  vi.restoreAllMocks();
  fs.rmSync(homeDir, { recursive: true, force: true });
});

function makeHome(label, token) {
  const home = path.join(homeDir, label);
  fs.mkdirSync(home, { recursive: true });
  fs.writeFileSync(path.join(home, 'config.toml'), '');
  if (token !== undefined) fs.writeFileSync(path.join(home, 'auth.json'), JSON.stringify({ tokens: { refresh_token: token } }));
  return home;
}

function linkDirectory(target, link) {
  fs.symlinkSync(target, link, process.platform === 'win32' ? 'junction' : 'dir');
}

function run(overrides = {}) {
  return runCodexHomeHealth({ homeDir, backupRoot,
    codeHomes: { status: 'missing', codex: [], claude: [] },
    policy: { selfHeal: true, copiedLoginCheck: 'local' }, ...overrides });
}

describe('discovery', () => {
  it('requires markers, excludes backups and nested homes, and deduplicates aliases lexically', () => {
    const primary = makeHome('.codex');
    makeHome('.codex_work');
    fs.mkdirSync(path.join(homeDir, '.codex-prefix-only'));
    for (const name of ['.codex.bak', '.codex-work.bak-old', '.codex-backup', '.codex-work.tmp', '.codex-work.t3-shadow-backups']) {
      makeHome(name);
    }
    makeHome('nested/.codex-hidden');
    linkDirectory(primary, path.join(homeDir, '.codex-z-alias'));
    fs.symlinkSync(path.join(homeDir, 'nonexistent'), path.join(homeDir, '.codex-broken'), 'dir');
    expect(discoverCodexHomes({ homeDir })).toEqual([
      { path: primary, label: '.codex' },
      { path: path.join(homeDir, '.codex_work'), label: '.codex_work' },
    ]);
  });
});

describe('daemon state', () => {
  it('repairs only links, keeps targets untouched, records each target privately, and is idempotent', () => {
    const home = makeHome('.codex');
    const target = path.join(homeDir, 'daemon-target');
    fs.mkdirSync(target);
    fs.writeFileSync(path.join(target, 'sentinel'), 'untouched');
    for (const entry of ['app-server-daemon', 'app-server-control']) linkDirectory(target, path.join(home, entry));
    const result = run();
    expect(result.homes[0]).toEqual({ path: home, label: '.codex', managedBy: 'standalone',
      daemon: 'repaired', control: 'repaired', auth: 'missing' });
    for (const entry of ['app-server-daemon', 'app-server-control']) {
      const repaired = path.join(home, entry);
      expect(fs.lstatSync(repaired).isSymbolicLink()).toBe(false);
      expect(fs.lstatSync(repaired).isDirectory()).toBe(true);
      expect(fs.readdirSync(repaired)).toEqual([]);
      if (process.platform !== 'win32') expect(fs.statSync(repaired).mode & 0o777).toBe(0o700);
    }
    expect(fs.readdirSync(target)).toEqual(['sentinel']);
    expect(fs.readFileSync(path.join(target, 'sentinel'), 'utf8')).toBe('untouched');
    const backups = fs.readdirSync(backupRoot).sort();
    expect(backups).toHaveLength(2);
    const records = backups.map(name => {
      expect(name).toMatch(/^codex-home-health-\d+\.json$/);
      const recordPath = path.join(backupRoot, name);
      if (process.platform !== 'win32') expect(fs.statSync(recordPath).mode & 0o777).toBe(0o600);
      return JSON.parse(fs.readFileSync(recordPath, 'utf8'));
    });
    expect(records.map(record => record.path).sort()).toEqual([
      path.join(home, 'app-server-control'), path.join(home, 'app-server-daemon'),
    ]);
    for (const record of records) {
      expect(record.linkTarget).toBe(target);
      expect(Number.isNaN(Date.parse(record.at))).toBe(false);
      expect(Object.keys(record).sort()).toEqual(['at', 'linkTarget', 'path']);
    }
    if (process.platform !== 'win32') expect(fs.statSync(backupRoot).mode & 0o777).toBe(0o700);
    expect(formatCodexHomeHealth(result)).toEqual([
      '.codex: Codex daemon state is now account-local.',
      'Codex home health: 2 repaired, 0 would repair, 0 unchanged, 0 pending, 0 conflicted, 0 not checked.',
    ]);
    expect(formatCodexHomeHealth(run())).toEqual([]);
    expect(fs.readdirSync(backupRoot).sort()).toEqual(backups);
  });

  it('makes no changes in dry run, including for a dangling daemon link', () => {
    const home = makeHome('.codex-work');
    const link = path.join(home, 'app-server-daemon');
    const missingTarget = path.join(homeDir, 'missing-target');
    fs.symlinkSync(missingTarget, link, 'dir');
    const result = run({ dryRun: true });
    expect(result.homes[0]).toMatchObject({ daemon: 'would-repair', control: 'absent' });
    expect(fs.readlinkSync(link)).toBe(missingTarget);
    expect(fs.existsSync(backupRoot)).toBe(false);
    expect(fs.existsSync(missingTarget)).toBe(false);
    expect(formatCodexHomeHealth(result)[0]).toBe('.codex-work: would make Codex daemon state account-local (dry run).');
    expect(run().homes[0].daemon).toBe('repaired');
    expect(fs.lstatSync(link).isDirectory()).toBe(true);
    expect(fs.existsSync(missingTarget)).toBe(false);
  });

  it('leaves the link intact if its recovery record cannot be written', () => {
    const home = makeHome('.codex');
    const target = path.join(homeDir, 'target');
    fs.mkdirSync(target);
    const link = path.join(home, 'app-server-daemon');
    linkDirectory(target, link);
    fs.writeFileSync(backupRoot, 'existing file');
    expect(run().homes[0].daemon).toBe('conflict');
    expect(fs.readlinkSync(link)).toBe(target);
    expect(fs.readFileSync(backupRoot, 'utf8')).toBe('existing file');
  });

  it('leaves Code shadows pending when ownership is identified through an alias', () => {
    const shadow = makeHome('.codex-shadow');
    const target = path.join(homeDir, 'shared-state');
    fs.mkdirSync(target);
    linkDirectory(target, path.join(shadow, 'app-server-daemon'));
    const alias = path.join(homeDir, '.codex-z-alias');
    linkDirectory(shadow, alias);
    const result = run({ codeHomes: { status: 'ok', codex: [{ instanceId: 'work', shadowHome: alias }], claude: [] } });
    expect(result.homes).toHaveLength(1);
    expect(result.homes[0]).toMatchObject({ managedBy: 'arcwright-code', daemon: 'pending-arcwright-code' });
    expect(fs.lstatSync(path.join(shadow, 'app-server-daemon')).isSymbolicLink()).toBe(true);
    expect(fs.existsSync(backupRoot)).toBe(false);
    expect(result.counts.pending).toBe(1);
    expect(formatCodexHomeHealth(result)[0]).toBe(".codex-shadow: Arcwright Code links this home's daemon state. Install an Arcwright Code build with per-account daemon state; no change made.");
  });

  it('preserves real files and leaves symlinks alone when self-heal is disabled', () => {
    const home = makeHome('.codex');
    const target = path.join(homeDir, 'target');
    fs.mkdirSync(target);
    fs.writeFileSync(path.join(home, 'app-server-daemon'), 'keep this file');
    linkDirectory(target, path.join(home, 'app-server-control'));
    const result = run({ policy: { selfHeal: false, copiedLoginCheck: 'local' } });
    expect(result.homes[0]).toMatchObject({ daemon: 'conflict', control: 'conflict' });
    expect(result.counts.conflicted).toBe(2);
    expect(fs.readFileSync(path.join(home, 'app-server-daemon'), 'utf8')).toBe('keep this file');
    expect(fs.readlinkSync(path.join(home, 'app-server-control'))).toBe(target);
    expect(fs.existsSync(backupRoot)).toBe(false);
    expect(formatCodexHomeHealth(result)[0]).toBe('.codex: app-server-daemon is not a directory or link; left unchanged.');
  });
});

describe('local copied-login inspection', () => {
  it('groups refresh tokens across differing metadata and hardlinks, without exposing credentials or full digests', () => {
    const a = makeHome('.codex-a', 'abc');
    const b = makeHome('.codex-b');
    fs.writeFileSync(path.join(b, 'auth.json'), JSON.stringify({ unrelated: 'private-metadata', tokens: { refresh_token: 'abc', access_token: 'private-access-token' } }));
    const c = makeHome('.codex-c');
    fs.linkSync(path.join(a, 'auth.json'), path.join(c, 'auth.json'));
    makeHome('.codex-d', 'different-refresh-token');
    linkDirectory(a, path.join(homeDir, '.codex-z-alias'));
    const originalAuth = fs.readFileSync(path.join(b, 'auth.json'));
    const result = run();
    expect(result.duplicates).toEqual([{ labels: ['.codex-a', '.codex-b', '.codex-c'], fingerprint: 'ba7816bf8f01' }]);
    expect(result.homes.map(home => home.auth)).toEqual(['shared-copy', 'shared-copy', 'shared-copy', 'private']);
    expect(fs.readFileSync(path.join(b, 'auth.json'))).toEqual(originalAuth);
    const lines = formatCodexHomeHealth(result);
    expect(lines[0]).toBe('These homes contain the same Codex refresh credential: .codex-a, .codex-b, .codex-c (fingerprint ba7816bf8f01). Keep it in one home. In each other home, move auth.json out of the home first, then sign in with CODEX_HOME=<home> codex login. Signing in or out over a copy revokes the session for every home that shares it. Do not copy auth.json.');
    const output = JSON.stringify({ result, lines });
    for (const privateText of ['abc', 'private-metadata', 'private-access-token', 'different-refresh-token',
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad']) {
      expect(output.includes(privateText)).toBe(false);
    }
    expect(fs.existsSync(backupRoot)).toBe(false);
  });

  it('does not group distinct credentials or count aliases as copies', () => {
    const primary = makeHome('.codex', 'first-credential');
    makeHome('.codex-work', 'second-credential');
    linkDirectory(primary, path.join(homeDir, '.codex-z-alias'));
    const result = run();
    expect(result.duplicates).toEqual([]);
    expect(result.homes.map(home => home.auth)).toEqual(['private', 'private']);
    expect(formatCodexHomeHealth(result)).toEqual([]);
  });

  it.each(['malformed', 'no-token', 'non-string', 'oversized', 'directory'])('reports %s auth as not checked', kind => {
    const home = makeHome('.codex');
    const auth = path.join(home, 'auth.json');
    if (kind === 'malformed') fs.writeFileSync(auth, '{ invalid');
    if (kind === 'no-token') fs.writeFileSync(auth, '{}');
    if (kind === 'non-string') fs.writeFileSync(auth, JSON.stringify({ tokens: { refresh_token: 42 } }));
    if (kind === 'oversized') fs.writeFileSync(auth, Buffer.alloc(1024 * 1024 + 1));
    if (kind === 'directory') fs.mkdirSync(auth);
    const result = run();
    expect(result.homes[0].auth).toBe('not-checked');
    expect(result.counts.notChecked).toBe(1);
    expect(result.duplicates).toEqual([]);
  });

  it('reports linked auth without opening its target', () => {
    const home = makeHome('.codex');
    const target = path.join(homeDir, 'missing-auth');
    fs.symlinkSync(target, path.join(home, 'auth.json'), 'file');
    const open = vi.spyOn(fs, 'openSync');
    const result = run();
    expect(open).not.toHaveBeenCalled();
    expect(result.homes[0].auth).toBe('symlink');
    expect(formatCodexHomeHealth(result)[0]).toBe('.codex: auth.json is a link to another home. Sign in separately in this home.');
    expect(fs.existsSync(target)).toBe(false);
  });

  it('does not open auth files when the check is off', () => {
    makeHome('.codex', 'abc');
    const open = vi.spyOn(fs, 'openSync');
    const result = run({ policy: { selfHeal: false, copiedLoginCheck: 'off' } });
    expect(open).not.toHaveBeenCalled();
    expect(result.homes[0].auth).toBe('not-checked');
    expect(result.duplicates).toEqual([]);
    expect(formatCodexHomeHealth(result)).toEqual([]);
  });
});
