import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import herdr from '../lib/herdrSetup.js';

const {
  setupHerdr, detectHerdr, parsePluginIds, buildKeybindingsBlock,
  upsertTomlSetting, installHerdrAssets,
  DEFAULT_PLUGINS, KEYS_START, KEYS_END, SHELL_START,
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
    if (cmd === 'command -v wl-paste') return '/usr/bin/wl-paste\n';
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
    expect(block).toMatch(/herdr-clipboard-paste/);
  });
  it('always emits the universal clipboard binding', () => {
    expect(buildKeybindingsBlock(new Set(['herdr-tab-rename']))).toMatch(/key = "ctrl\+v"/);
  });
});

describe('Herdr standards', () => {
  it('upserts TOML settings without duplicating existing sections', async () => {
    const configPath = path.join(dir, 'config.toml');
    fs.writeFileSync(configPath, '[ui]\nagent_panel_sort = "priority"\n\n[theme]\nname = "vesper"\n');
    await upsertTomlSetting(configPath, 'ui', 'agent_panel_sort', '"spaces"');
    await upsertTomlSetting(configPath, 'terminal', 'new_cwd', '"follow"');
    const toml = fs.readFileSync(configPath, 'utf8');
    expect(toml.match(/\[ui\]/g)).toHaveLength(1);
    expect(toml).toContain('agent_panel_sort = "spaces"');
    expect(toml).toContain('[terminal]\nnew_cwd = "follow"');
  });

  it('installs launch assets and profile-aware hooks idempotently', async () => {
    fs.mkdirSync(path.join(dir, '.claude-work'), { recursive: true });
    fs.writeFileSync(path.join(dir, '.claude-work', 'settings.json'), JSON.stringify({ hooks: {} }));
    await installHerdrAssets(dir);
    await installHerdrAssets(dir);

    expect(fs.statSync(path.join(dir, '.local/bin/herdr-clipboard-paste')).mode & 0o111).toBeTruthy();
    const bashrc = fs.readFileSync(path.join(dir, '.bashrc'), 'utf8');
    expect(bashrc.match(new RegExp(SHELL_START, 'g'))).toHaveLength(1);
    const settings = JSON.parse(fs.readFileSync(path.join(dir, '.claude-work/settings.json'), 'utf8'));
    expect(settings.hooks.SessionStart).toHaveLength(1);
    expect(settings.hooks.SessionStart[0].hooks[0].command).toMatch(/herdr-agent-session\.sh/);
  });

  it('launches restored agents with the requested flags and Claude profile', async () => {
    await installHerdrAssets(dir);
    const stubDir = path.join(dir, 'stubs');
    fs.mkdirSync(stubDir, { recursive: true });
    fs.writeFileSync(path.join(stubDir, 'claude'), '#!/bin/sh\nprintf "claude:%s:%s\\n" "${CLAUDE_CONFIG_DIR:-default}" "$*"\n', { mode: 0o755 });
    fs.writeFileSync(path.join(stubDir, 'codex'), '#!/bin/sh\nprintf "codex:%s\\n" "$*"\n', { mode: 0o755 });
    const stateDir = path.join(dir, '.local/state/herdr/claude-session-profiles');
    fs.mkdirSync(stateDir, { recursive: true });
    fs.writeFileSync(path.join(stateDir, 'session-1'), `${path.join(dir, '.claude-work')}\n`);

    const launcher = path.join(dir, '.config/arcwright/herdr-agent-launchers.sh');
    const output = execFileSync('/bin/bash', ['-c', `source "$1"; claude --resume session-1; codex resume session-2`, 'test', launcher], {
      encoding: 'utf8',
      env: { ...process.env, HOME: dir, PATH: `${stubDir}:${process.env.PATH}` },
    });
    expect(output).toContain(`claude:${path.join(dir, '.claude-work')}:--dangerously-skip-permissions --resume session-1`);
    expect(output).toContain('codex:--yolo resume session-2');
  });
});

describe('setupHerdr', () => {
  it('returns not-installed and touches nothing when herdr is absent', async () => {
    const run = fakeRun({ notInstalled: true });
    const configPath = path.join(dir, 'config.toml');
    const res = await setupHerdr({ run, quiet: true, configPath, homeDir: dir });
    expect(res.status).toBe('not-installed');
    expect(fs.existsSync(configPath)).toBe(false);
    // Only the version probe should have run — no install attempts.
    expect(run.calls.every((c) => c.startsWith('herdr --version'))).toBe(true);
  });

  it('installs all default plugins and writes a managed keybindings block', async () => {
    const run = fakeRun();
    const configPath = path.join(dir, 'config.toml');
    const res = await setupHerdr({ run, quiet: true, configPath, homeDir: dir });
    expect(res.status).toBe('configured');
    expect(res.installed.sort()).toEqual(DEFAULT_PLUGINS.map((p) => p.id).sort());
    const toml = fs.readFileSync(configPath, 'utf8');
    expect(toml).toContain(KEYS_START);
    expect(toml).toContain(KEYS_END);
    expect(toml).toMatch(/jt\.command-palette\.open/);
    expect(toml).toContain('resume_agents_on_restore = true');
    expect(toml).toContain('new_cwd = "follow"');
    expect(toml).toContain('agent_panel_sort = "spaces"');
    expect(run.calls).toContain('herdr integration install claude');
    expect(run.calls).toContain('herdr integration install codex');
  });

  it('skips already-installed plugins', async () => {
    const run = fakeRun({ alreadyInstalled: [{ plugin_id: 'persiyanov.reviewr' }] });
    const res = await setupHerdr({ run, quiet: true, configPath: path.join(dir, 'config.toml'), homeDir: dir });
    expect(res.skipped).toContain('persiyanov.reviewr');
    expect(run.calls).not.toContain('herdr plugin install persiyanov/herdr-reviewr --yes');
  });

  it('tolerates a plugin whose build fails and still configures the rest', async () => {
    const run = fakeRun({ failInstalls: ['x0d7x/herdr-fzf-url'] });
    const res = await setupHerdr({ run, quiet: true, configPath: path.join(dir, 'config.toml'), homeDir: dir });
    expect(res.status).toBe('configured');
    expect(res.skipped).toContain('url.fzf-picker');
    expect(res.installed).toContain('persiyanov.reviewr');
  });

  it('is idempotent — a second run rewrites the block in place, not duplicated', async () => {
    const configPath = path.join(dir, 'config.toml');
    await setupHerdr({ run: fakeRun(), quiet: true, configPath, homeDir: dir });
    await setupHerdr({ run: fakeRun(), quiet: true, configPath, homeDir: dir });
    const toml = fs.readFileSync(configPath, 'utf8');
    expect(toml.match(new RegExp(KEYS_START.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')).length).toBe(1);
  });
});
