import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import herdr from '../lib/herdrSetup.js';
import herdrAssets from '../lib/herdrAssets.js';
import { parseToml } from '../lib/customization.js';

const {
  setupHerdr, detectHerdr, parsePluginIds, buildKeybindingsBlock,
  upsertTomlSetting, installHerdrAssets, listClaudeProfileDirs,
  DEFAULT_PLUGINS, KEYS_START, KEYS_END, SHELL_START,
} = herdr;
const { installProfileHook, shellSingleQuote } = herdrAssets;

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
  it('writes the clipboard command as an absolute path, never $HOME (herdr does not expand env vars)', () => {
    const block = buildKeybindingsBlock(new Set(), { homeDir: '/home/tester' });
    expect(block).toMatch(/command = "\/home\/tester\/\.local\/bin\/herdr-clipboard-paste"/);
    expect(block).not.toMatch(/\$HOME/);
  });
  it('skips keys already bound outside the managed block (avoids duplicate-key partial reloads)', () => {
    const existingKeys = new Set(['ctrl+v', 'prefix+p']);
    const block = buildKeybindingsBlock(new Set(['jt.command-palette', 'url.fzf-picker']), {
      existingKeys,
    });
    // prefix+p and ctrl+v are user-owned → skipped; alt+u is not → emitted.
    expect(block).not.toMatch(/key = "prefix\+p"/);
    expect(block).not.toMatch(/key = "ctrl\+v"/);
    expect(block).toMatch(/key = "alt\+u"/);
  });
  it('returns null when every candidate key is already user-bound', () => {
    const existingKeys = new Set(['prefix+p', 'ctrl+v']);
    expect(buildKeybindingsBlock(new Set(['jt.command-palette']), { existingKeys })).toBeNull();
  });
});

describe('listClaudeProfileDirs', () => {
  it('finds every Claude config home and ignores unrelated entries', async () => {
    for (const name of ['.claude', '.claude-alt', '.claude-work', '.claudia', '.codex']) {
      fs.mkdirSync(path.join(dir, name), { recursive: true });
    }
    // A file named like a profile must not be mistaken for one.
    fs.writeFileSync(path.join(dir, '.claude.json'), '{}');

    const found = (await listClaudeProfileDirs(dir)).map((p) => path.basename(p));
    expect(found.sort()).toEqual(['.claude', '.claude-alt', '.claude-work']);
  });

  it('always includes the default ~/.claude even when it does not exist yet', async () => {
    fs.mkdirSync(path.join(dir, '.claude-alt'), { recursive: true });
    const found = await listClaudeProfileDirs(dir);
    expect(found[0]).toBe(path.join(dir, '.claude'));
    expect(found).toContain(path.join(dir, '.claude-alt'));
  });

  it('returns just the default profile for an unreadable home', async () => {
    const missing = path.join(dir, 'nope');
    expect(await listClaudeProfileDirs(missing)).toEqual([path.join(missing, '.claude')]);
  });
});

describe('profile hook settings validation', () => {
  it('preserves valid JSON that is not a usable Claude settings object', async () => {
    const profileDir = path.join(dir, '.claude-invalid');
    const settingsPath = path.join(profileDir, 'settings.json');
    fs.mkdirSync(profileDir, { recursive: true });

    for (const contents of ['[]', '{"hooks":[]}']) {
      fs.writeFileSync(settingsPath, contents);
      await installProfileHook(profileDir, '/tmp/herdr-agent-session.sh');
      expect(fs.readFileSync(settingsPath, 'utf8')).toBe(contents);
    }
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

  it('session hook records the profile under herdr and fast-paths out otherwise', async () => {
    await installHerdrAssets(dir);
    const hook = path.join(dir, '.claude/hooks/herdr-agent-session.sh');
    const recorded = path.join(dir, '.local/state/herdr/claude-session-profiles/sess-x');
    const payload = JSON.stringify({ session_id: 'sess-x', source: 'startup' });
    const runHook = (herdrEnv) =>
      execFileSync('sh', [hook], {
        input: payload,
        env: {
          ...process.env,
          HOME: dir,
          HERDR_ENV: herdrEnv,
          CLAUDE_CONFIG_DIR: path.join(dir, '.claude-alt'),
        },
      });

    // Not driven by herdr (t3code, a plain terminal, …): nothing to record, and
    // the hook must not pay for a mktemp/cat/exec on a discarded payload.
    runHook('');
    expect(fs.existsSync(recorded)).toBe(false);

    // Inside a herdr pane the profile is still recorded for session restore.
    runHook('1');
    expect(fs.readFileSync(recorded, 'utf8').trim()).toBe(path.join(dir, '.claude-alt'));
  });

  it('launches restored agents with the requested flags and Claude profile', async () => {
    await installHerdrAssets(dir);
    const stubDir = path.join(dir, 'stubs');
    fs.mkdirSync(stubDir, { recursive: true });
    fs.writeFileSync(path.join(stubDir, 'claude'), '#!/bin/sh\nprintf "claude:%s:%s\\n" "${CLAUDE_CONFIG_DIR:-default}" "$*"\n', { mode: 0o755 });
    fs.writeFileSync(path.join(stubDir, 'codex'), '#!/bin/sh\nprintf "codex:%s\\n" "$*"\n', { mode: 0o755 });
    fs.writeFileSync(path.join(stubDir, 'grok'), '#!/bin/sh\nprintf "grok:%s\\n" "$*"\n', { mode: 0o755 });
    const stateDir = path.join(dir, '.local/state/herdr/claude-session-profiles');
    fs.mkdirSync(stateDir, { recursive: true });
    fs.writeFileSync(path.join(stateDir, 'session-1'), `${path.join(dir, '.claude-work')}\n`);

    const launcher = path.join(dir, '.config/arcwright/herdr-agent-launchers.sh');
    const output = execFileSync('/bin/bash', ['-c', `source "$1"; claude --resume session-1; codex resume session-2; grok --resume session-3`, 'test', launcher], {
      encoding: 'utf8',
      env: { ...process.env, HOME: dir, PATH: `${stubDir}:${process.env.PATH}` },
    });
    expect(output).toContain(`claude:${path.join(dir, '.claude-work')}:--resume session-1`);
    expect(output).toContain('codex:resume session-2');
    expect(output).toContain('grok:--resume session-3');
  });
});

describe('setupHerdr', () => {
  it('returns not-installed and touches nothing when herdr is absent', async () => {
    const run = fakeRun({ notInstalled: true });
    const configPath = path.join(dir, 'config.toml');
    const res = await setupHerdr({ run, quiet: true, configPath, homeDir: dir, installPlugins: true });
    expect(res.status).toBe('not-installed');
    expect(fs.existsSync(configPath)).toBe(false);
    // Only the version probe should have run — no install attempts.
    expect(run.calls.every((c) => c.startsWith('herdr --version'))).toBe(true);
  });

  it('does not install third-party plugins without explicit opt-in', async () => {
    const run = fakeRun();
    const res = await setupHerdr({ run, quiet: true, configPath: path.join(dir, 'config.toml'), homeDir: dir });
    expect(res.installed).toEqual([]);
    expect(run.calls.some((call) => call.startsWith('herdr plugin install'))).toBe(false);
  });

  it('installs all default plugins and writes a managed keybindings block', async () => {
    const run = fakeRun();
    const configPath = path.join(dir, 'config.toml');
    const res = await setupHerdr({ run, quiet: true, configPath, homeDir: dir, installPlugins: true });
    expect(res.status).toBe('configured');
    expect(res.installed.sort()).toEqual(DEFAULT_PLUGINS.map((p) => p.id).sort());
    const toml = fs.readFileSync(configPath, 'utf8');
    expect(toml).toContain(KEYS_START);
    expect(toml).toContain(KEYS_END);
    expect(toml).toMatch(/jt\.command-palette\.open/);
    expect(toml).toContain('resume_agents_on_restore = true');
    expect(toml).toContain('new_cwd = "follow"');
    expect(toml).toContain('agent_panel_sort = "spaces"');
    expect(toml).toContain('system_monitor = true');
    expect(run.calls).toContain('herdr integration install claude');
    expect(run.calls).toContain('herdr integration install codex');
    expect(run.calls).toContain('herdr integration install hermes');
    expect(run.calls).toContain('herdr integration install opencode');
    expect(run.calls).toContain('herdr integration install grok');
    for (const plugin of DEFAULT_PLUGINS) {
      expect(run.calls).toContain(`herdr plugin install ${plugin.repo} --ref ${plugin.commit} --yes`);
    }
  });

  it('skips already-installed plugins', async () => {
    const run = fakeRun({ alreadyInstalled: [{ plugin_id: 'persiyanov.reviewr' }] });
    const res = await setupHerdr({ run, quiet: true, configPath: path.join(dir, 'config.toml'), homeDir: dir, installPlugins: true });
    expect(res.skipped).toContain('persiyanov.reviewr');
    expect(run.calls).not.toContain(`herdr plugin install ${DEFAULT_PLUGINS[0].repo} --ref ${DEFAULT_PLUGINS[0].commit} --yes`);
  });

  it('tolerates a plugin whose build fails and still configures the rest', async () => {
    const run = fakeRun({ failInstalls: ['x0d7x/herdr-fzf-url'] });
    const res = await setupHerdr({ run, quiet: true, configPath: path.join(dir, 'config.toml'), homeDir: dir, installPlugins: true });
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

  it('quotes hostile home paths in shell and TOML outputs', async () => {
    const marker = path.join(dir, 'shell-command-executed');
    const homeDir = path.join(dir, `home' "$(touch ${marker})"\\literal`);
    const configPath = path.join(dir, 'config.toml');

    await setupHerdr({ run: fakeRun(), quiet: true, configPath, homeDir });

    const hookPath = path.join(homeDir, '.claude', 'hooks', 'herdr-agent-session.sh');
    const settings = JSON.parse(
      fs.readFileSync(path.join(homeDir, '.claude', 'settings.json'), 'utf8')
    );
    const hookCommand = settings.hooks.SessionStart[0].hooks[0].command;
    expect(hookCommand).toBe(`bash ${shellSingleQuote(hookPath)}`);

    const launcherPath = path.join(homeDir, '.config', 'arcwright', 'herdr-agent-launchers.sh');
    const bashrcPath = path.join(homeDir, '.bashrc');
    expect(fs.readFileSync(bashrcPath, 'utf8')).toContain(
      `[ -f ${shellSingleQuote(launcherPath)} ] && source ${shellSingleQuote(launcherPath)}`
    );

    const tomlText = fs.readFileSync(configPath, 'utf8');
    const parsed = parseToml(tomlText);
    const clipboard = parsed.keys.command.find((binding) => binding.key === 'ctrl+v');
    const clipboardPath = path.join(homeDir, '.local', 'bin', 'herdr-clipboard-paste');
    expect(tomlText).toContain(`command = ${JSON.stringify(clipboardPath)}`);
    expect(JSON.parse(`"${clipboard.command}"`)).toBe(clipboardPath);

    expect(() => execFileSync('/bin/bash', [
      '--noprofile', '--norc', '-c', 'source "$1"', 'herdr-test', bashrcPath,
    ], {
      env: { ...process.env, HOME: homeDir },
    })).not.toThrow();
    expect(() => execFileSync('/bin/bash', ['-c', hookCommand], {
      input: '{}',
      env: { ...process.env, HOME: homeDir, HERDR_ENV: '' },
    })).not.toThrow();
    expect(fs.existsSync(marker)).toBe(false);
  });
});
