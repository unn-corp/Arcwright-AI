import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import herdr from '../lib/herdrSetup.js';

const {
  setupHerdr, detectHerdr, parsePluginIds, buildKeybindingsBlock,
  DEFAULT_PLUGINS, KEYS_START, KEYS_END,
} = herdr;

let dir;
beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'arcw-herdr-'));
});
afterEach(() => {
  fs.rmSync(dir, { recursive: true, force: true });
});

// A fake exec: routes commands to canned responses, records the call list, and
// can be told which plugin installs should throw (missing build tool, etc).
function fakeRun(opts = {}) {
  const calls = [];
  const fail = new Set(opts.failInstalls || []);
  const run = (cmd) => {
    calls.push(cmd);
    if (cmd.startsWith('herdr --version')) {
      if (opts.notInstalled) throw new Error('command not found');
      return `herdr ${opts.version || '0.7.1'}\n`;
    }
    if (cmd.startsWith('herdr plugin list --json')) {
      return JSON.stringify(opts.alreadyInstalled || []);
    }
    if (cmd.startsWith('herdr plugin install')) {
      const repo = cmd.split(' ')[3];
      if (fail.has(repo)) throw new Error('build failed');
      return 'installed';
    }
    return '';
  };
  run.calls = calls;
  return run;
}

describe('detectHerdr', () => {
  it('reports installed + version when herdr responds', () => {
    expect(detectHerdr(fakeRun())).toEqual({ installed: true, version: '0.7.1' });
  });
  it('reports not-installed when herdr is missing', () => {
    expect(detectHerdr(fakeRun({ notInstalled: true }))).toEqual({
      installed: false, version: null,
    });
  });
});

describe('parsePluginIds', () => {
  it('reads plugin_id from a plain array', () => {
    const ids = parsePluginIds(JSON.stringify([{ plugin_id: 'a' }, { plugin_id: 'b' }]));
    expect([...ids].sort()).toEqual(['a', 'b']);
  });
  it('reads from a {plugins:[...]} wrapper and id/pluginId aliases', () => {
    const ids = parsePluginIds(JSON.stringify({ plugins: [{ id: 'x' }, { pluginId: 'y' }] }));
    expect([...ids].sort()).toEqual(['x', 'y']);
  });
  it('returns an empty set on malformed JSON', () => {
    expect(parsePluginIds('not json').size).toBe(0);
  });
});

describe('buildKeybindingsBlock', () => {
  it('emits only bindings for installed plugins', () => {
    const block = buildKeybindingsBlock(new Set(['jt.command-palette']));
    expect(block).toMatch(/jt\.command-palette\.open/);
    expect(block).not.toMatch(/open-file-viewer/);
  });
  it('returns null when no keybinding plugin is present', () => {
    expect(buildKeybindingsBlock(new Set(['herdr-tab-rename']))).toBeNull();
  });
});

describe('setupHerdr', () => {
  it('returns not-installed and touches nothing when herdr is absent', async () => {
    const run = fakeRun({ notInstalled: true });
    const configPath = path.join(dir, 'config.toml');
    const res = await setupHerdr({ run, quiet: true, configPath });
    expect(res.status).toBe('not-installed');
    expect(fs.existsSync(configPath)).toBe(false);
    // Only the version probe should have run — no install attempts.
    expect(run.calls.every((c) => c.startsWith('herdr --version'))).toBe(true);
  });

  it('installs all default plugins and writes a managed keybindings block', async () => {
    const run = fakeRun();
    const configPath = path.join(dir, 'config.toml');
    const res = await setupHerdr({ run, quiet: true, configPath });
    expect(res.status).toBe('configured');
    expect(res.installed.sort()).toEqual(DEFAULT_PLUGINS.map((p) => p.id).sort());
    const toml = fs.readFileSync(configPath, 'utf8');
    expect(toml).toContain(KEYS_START);
    expect(toml).toContain(KEYS_END);
    expect(toml).toMatch(/jt\.command-palette\.open/);
    expect(run.calls).toContain('herdr integration install claude');
  });

  it('skips already-installed plugins', async () => {
    const run = fakeRun({ alreadyInstalled: [{ plugin_id: 'persiyanov.reviewr' }] });
    const res = await setupHerdr({ run, quiet: true, configPath: path.join(dir, 'config.toml') });
    expect(res.skipped).toContain('persiyanov.reviewr');
    expect(run.calls).not.toContain('herdr plugin install persiyanov/herdr-reviewr --yes');
  });

  it('tolerates a plugin whose build fails and still configures the rest', async () => {
    const run = fakeRun({ failInstalls: ['x0d7x/herdr-fzf-url'] });
    const res = await setupHerdr({ run, quiet: true, configPath: path.join(dir, 'config.toml') });
    expect(res.status).toBe('configured');
    expect(res.skipped).toContain('url.fzf-picker');
    expect(res.installed).toContain('persiyanov.reviewr');
  });

  it('is idempotent — a second run rewrites the block in place, not duplicated', async () => {
    const configPath = path.join(dir, 'config.toml');
    await setupHerdr({ run: fakeRun(), quiet: true, configPath });
    await setupHerdr({ run: fakeRun(), quiet: true, configPath });
    const toml = fs.readFileSync(configPath, 'utf8');
    expect(toml.match(new RegExp(KEYS_START.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')).length).toBe(1);
  });
});
