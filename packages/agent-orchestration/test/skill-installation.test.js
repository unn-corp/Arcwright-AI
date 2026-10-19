import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import fs from 'fs-extra';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import installerApi from '../lib/installer.js';
// Read source metadata directly so these focused tests never trigger a package build.
const installer = { ...installerApi.createInstaller({ sourceDir: path.resolve(__dirname, '../../..') }), createInstaller: installerApi.createInstaller };
import kiro from '../lib/kiro-adapter.js';

const { copySkillTree, sha256, writeFilesManifest, readFilesManifest, removeTrackedEntry } = installer._internal;
const chalk = new Proxy({}, { get: () => value => value });
let root, source, destination, manifestDir;
const put = (base, relative, content) => fs.outputFile(path.join(base, relative), content);
const read = relative => fs.readFile(path.join(destination, relative), 'utf8');
const run = async (options = {}) => {
  const entries = [];
  await copySkillTree({ skillsSrc: source, skillsDest: destination, flags: {}, entries,
    relPrefix: '.agents/skills', chalk, logLabel: 'skills/', manifestDir, ...options });
  return entries;
};
const track = async files => writeFilesManifest(manifestDir, Object.entries(files).map(([relative, content]) => ({
  relPath: `.agents/skills/${relative}`, hash: sha256(Buffer.from(content)),
})));

beforeEach(async () => {
  root = await fs.mkdtemp(path.join(os.tmpdir(), 'arcw-skills-'));
  source = path.join(root, 'package'); destination = path.join(root, 'project/.agents/skills');
  manifestDir = path.join(root, 'project/_arcwright');
  await put(source, 'demo/SKILL.md', 'Current procedure');
  await put(source, 'demo/references/detail.md', 'Current detail');
  vi.spyOn(console, 'log').mockImplementation(() => {});
});
afterEach(async () => { vi.restoreAllMocks(); await fs.remove(root); });

describe('managed skill updates', () => {
  it('upgrades an owned bundle and retains one manifest identity on repeated installation', async () => {
    await put(destination, 'demo/SKILL.md', 'Previous procedure');
    await track({ 'demo/SKILL.md': 'Previous procedure' });
    const first = await run();
    expect(await read('demo/SKILL.md')).toBe('Current procedure');
    expect(await read('demo/references/detail.md')).toBe('Current detail');
    await writeFilesManifest(manifestDir, first);
    const before = await fs.stat(path.join(destination, 'demo/SKILL.md'));
    const second = await run();
    const after = await fs.stat(path.join(destination, 'demo/SKILL.md'));
    expect(after.mtimeMs).toBe(before.mtimeMs);
    await writeFilesManifest(manifestDir, [...first, ...second]);
    expect(await readFilesManifest(manifestDir)).toEqual(first);
  });

  it('preserves the entire customized bundle without adopting its edited bytes', async () => {
    await put(destination, 'demo/SKILL.md', 'Personal procedure');
    await put(destination, 'demo/references/detail.md', 'Previous detail');
    await track({ 'demo/SKILL.md': 'Previous procedure', 'demo/references/detail.md': 'Previous detail' });
    const entries = await run();
    expect(await read('demo/SKILL.md')).toBe('Personal procedure');
    expect(await read('demo/references/detail.md')).toBe('Previous detail');
    expect(entries.find(e => e.relPath.endsWith('/demo/SKILL.md')).hash)
      .toBe(sha256(Buffer.from('Previous procedure')));
  });

  it('protects a customization in a reference removed from the new package', async () => {
    await put(destination, 'demo/SKILL.md', 'Previous procedure');
    await put(destination, 'demo/retired.md', 'Personal notes');
    await track({ 'demo/SKILL.md': 'Previous procedure', 'demo/retired.md': 'Previous notes' });
    await run();
    expect(await read('demo/SKILL.md')).toBe('Previous procedure');
    expect(await read('demo/retired.md')).toBe('Personal notes');
    expect(await fs.pathExists(path.join(destination, 'demo/references/detail.md'))).toBe(false);
  });

  it('preserves an untracked same-named skill while installing unrelated skills', async () => {
    await put(destination, 'demo/SKILL.md', 'User-owned skill');
    await put(source, 'other/SKILL.md', 'Another procedure');
    const entries = await run();
    expect(await read('demo/SKILL.md')).toBe('User-owned skill');
    expect(await read('other/SKILL.md')).toBe('Another procedure');
    expect(entries.map(e => e.relPath)).toEqual(['.agents/skills/other/SKILL.md']);
  });

  it('recognizes transformed platform bytes as managed during an upgrade', async () => {
    await put(destination, 'demo/SKILL.md', 'PLATFORM Previous procedure');
    await track({ 'demo/SKILL.md': 'PLATFORM Previous procedure' });
    const entries = await run({ transform: content => `PLATFORM ${content}` });
    expect(await read('demo/SKILL.md')).toBe('PLATFORM Current procedure');
    expect(entries.find(e => e.relPath.endsWith('/SKILL.md')).hash)
      .toBe(sha256(Buffer.from('PLATFORM Current procedure')));
  });

  it('redirects adapted aliases directly while preserving customized aliases and commands on update', async () => {
    const alias = 'Read `.agents/skills/current/SKILL.md`.\n';
    const command = 'Load `.agents/skills/legacy/SKILL.md` for $ARGUMENTS.\n';
    const redirect = { name: 'current', path: '.agents/skills/current/SKILL.md',
      sources: [{ path: '.agents/skills/legacy/SKILL.md', hash: sha256(Buffer.from(alias)) }] };
    await put(source, 'legacy/SKILL.md', alias);
    await put(source, 'current/SKILL.md', 'Canonical procedure.\n');
    await put(source, 'arcwright/commands/legacy.md', command);
    await put(source, 'arcwright/catalog.json', JSON.stringify({ schemaVersion: 1, entries: [
      { name: 'legacy', description: 'Legacy procedure', kind: 'skill', path: '.agents/skills/legacy/SKILL.md', redirect },
      { name: 'legacy', description: 'Legacy command', kind: 'command', path: 'commands/legacy.md',
        redirect: { ...redirect, commandHash: sha256(Buffer.from(command)) } },
    ] }));
    await put(source, 'arcwright/scripts/find-entrypoint.cjs', await fs.readFile(
      path.resolve(__dirname, '../../../.agents/skills/arcwright/scripts/find-entrypoint.cjs')));
    await put(source, 'arcwright/scripts/skill-metadata.cjs', await fs.readFile(
      path.resolve(__dirname, '../../../.agents/skills/arcwright/scripts/skill-metadata.cjs')));
    destination = path.join(root, 'project/.kiro/skills');
    const options = { transform: kiro.adaptKiroContent, relPrefix: '.kiro/skills' };
    const find = () => {
      const result = spawnSync(process.execPath, [path.join(destination, 'arcwright/scripts/find-entrypoint.cjs'), 'legacy'], {
        cwd: path.join(root, 'project'), encoding: 'utf8',
      });
      expect(result.status, result.stderr).toBe(0);
      return JSON.parse(result.stdout)[0];
    };
    await writeFilesManifest(manifestDir, await run(options));
    expect(find()).toMatchObject({ executionKind: 'skill', aliasFor: 'current',
      resolvedPath: path.join(destination, 'current/SKILL.md') });
    const catalogFile = path.join(destination, 'arcwright/catalog.json');
    const before = await fs.stat(catalogFile);
    await writeFilesManifest(manifestDir, await run(options));
    expect((await fs.stat(catalogFile)).mtimeMs).toBe(before.mtimeMs);

    for (const relative of ['legacy/SKILL.md', 'arcwright/commands/legacy.md']) {
      const original = await read(relative);
      await put(destination, relative, original + 'Run my personal check.\n');
      const entries = await run(options);
      expect(find()).toMatchObject({ executionKind: 'command',
        resolvedPath: path.join(destination, 'arcwright/commands/legacy.md') });
      expect(await read(relative)).toContain('Run my personal check.');
      expect(entries.find(entry => entry.relPath === `.kiro/skills/${relative}`).hash)
        .toBe(sha256(Buffer.from(original)));
      await put(destination, relative, original);
    }
    // A stale package guard must not declare changed source equivalent either.
    await put(source, 'legacy/SKILL.md', alias + 'Unreviewed package-specific step.\n');
    await run(options);
    expect(find().executionKind).toBe('command');
  });

  it('upgrades a shared global install when its bookkeeping host changes', async () => {
    await put(destination, 'demo/SKILL.md', 'Previous procedure');
    await writeFilesManifest(manifestDir, [{
      relPath: '.codex/skills/demo/SKILL.md', hash: sha256(Buffer.from('Previous procedure')),
    }]);
    const entries = await run({ relPrefix: '.opencode/skills', ownershipPrefixes: ['.codex/skills'] });
    expect(await read('demo/SKILL.md')).toBe('Current procedure');
    expect(entries.map(e => e.relPath)).toContain('.opencode/skills/demo/SKILL.md');
  });

  it('keeps an optional forwarding command and its skill under the same module choice', async () => {
    await put(source, 'tauri-testing/SKILL.md', 'Tauri test procedure');
    await put(source, 'arcwright/commands/tauri-testing.md', 'Read the Tauri test procedure');
    await run();
    expect(await fs.pathExists(path.join(destination, 'tauri-testing/SKILL.md'))).toBe(false);
    expect(await fs.pathExists(path.join(destination, 'arcwright/commands/tauri-testing.md'))).toBe(false);
    await run({ flags: { resolvedTauri: true } });
    expect(await read('tauri-testing/SKILL.md')).toBe('Tauri test procedure');
    expect(await read('arcwright/commands/tauri-testing.md')).toBe('Read the Tauri test procedure');
  });

  it.skipIf(process.platform === 'win32')('preserves a linked bundle without writing through it', async () => {
    const target = path.join(root, 'personal');
    await put(target, 'SKILL.md', 'Personal linked procedure');
    await fs.ensureDir(destination);
    await fs.symlink(target, path.join(destination, 'demo'), 'dir');
    expect(await run()).toEqual([]);
    expect(await fs.readFile(path.join(target, 'SKILL.md'), 'utf8')).toBe('Personal linked procedure');
    expect(await fs.pathExists(path.join(target, 'references/detail.md'))).toBe(false);
  });

  it.skipIf(process.platform === 'win32')('keeps linked personal files during global orphan cleanup', async () => {
    const target = path.join(root, 'personal');
    await put(target, 'SKILL.md', 'Previous procedure');
    await fs.ensureDir(destination);
    await fs.symlink(target, path.join(destination, 'demo'), 'dir');
    const removed = await removeTrackedEntry({
      relPath: '.codex/skills/demo/SKILL.md', hash: sha256(Buffer.from('Previous procedure')),
    }, { isGlobal: true, projectRoot: path.join(root, 'project'), effectiveArwDir: manifestDir,
      homes: { linux: path.join(root, 'project'), windows: null }, platform: 'linux-native' });
    expect(removed).toBe(false);
    expect(await fs.readFile(path.join(target, 'SKILL.md'), 'utf8')).toBe('Previous procedure');
    expect((await fs.lstat(path.join(destination, 'demo'))).isSymbolicLink()).toBe(true);
  });
});

import sharing from '../lib/global-sharing.js';
import accounts from '../lib/account-environments.js';
import sharingState from '../lib/sharing-state.js';
import accountPrompts from '../lib/account-prompts.js';
const noCodeHomes = { status: 'missing', codex: [], claude: [] };
const discover = homeDir => accounts.discoverAccountEnvironments({ homeDir, env: {}, codeHomes: noCodeHomes });
const selection = providers => ({ schemaVersion: 1, mode: 'custom', offered: true, providers, adoptedPersonalItems: [], codexSelfHeal: false, credentialCopyCheck: 'off' });
const makePlan = async (homeDir, prefs, extra = {}) => sharing.buildSharingPlan({ homeDir, sharing: prefs, discovery: await discover(homeDir), rules: '## Arcwright\nShared rules.', ...extra });

describe('global account sharing', () => {
  it('preserves legacy and omitted choices, freezes all enrollment, and rejects contradictory flags', async () => {
    const discovery = await discover(root);
    expect(await sharing.resolveSharingPreferences({ discovery, options: { yes: true } })).toBeUndefined();
    const saved = await sharing.resolveSharingPreferences({ discovery, options: { sharing: 'all' } });
    await put(root, '.codex-client/config.toml', '');
    const next = await sharing.resolveSharingPreferences({ saved, discovery: await discover(root), options: { yes: true } });
    expect(next).toEqual(saved);
    expect(next.providers.codex.accounts[path.join(root, '.codex-client')]).toBeUndefined();
    await expect(sharing.resolveSharingPreferences({ discovery, options: { sharing: 'none', credentialCopyCheck: 'local' } })).rejects.toThrow(/contradicts/);
    const before = await sharingState.snapshot(root);
    await sharing.applyGlobalSharing(await makePlan(root, undefined));
    expect(await sharingState.snapshot(root)).toEqual(before);
  });

  it('dry-run and cancellation write no files', async () => {
    const prefs = selection({ codex: { instructions: true, skills: true } });
    const before = await sharingState.snapshot(root);
    await sharing.applyGlobalSharing(await makePlan(root, prefs), { dryRun: true });
    expect(await sharingState.snapshot(root)).toEqual(before);
    const cancelled = await accountPrompts.prepareGlobalSharing({ homeDir: root, options: { sharing: 'all' }, codeHomes: noCodeHomes, env: {}, prompts: { confirm: async () => false, isCancel: () => false }, log: () => {} });
    expect(cancelled.cancelled).toBe(true);
    expect(await sharingState.snapshot(root)).toEqual(before);
  });

  it('links managed host instructions, preserves personal rules and overrides, and reruns without writes', async () => {
    const original = '<!-- arcwright-agent-start -->\nPrevious rules\n<!-- arcwright-agent-end -->\n';
    await put(root, '.codex/AGENTS.md', original);
    await put(root, '.grok/AGENTS.md', '# Personal\nKeep this.\n');
    await put(root, '.codex/AGENTS.override.md', 'Override');
    const prefs = selection({ codex: { instructions: true }, grok: { instructions: true } });
    const plan = await makePlan(root, prefs);
    expect(sharing.formatSharingPlan(plan).join('\n')).toContain('takes precedence');
    expect(plan.pending.join('\n')).toContain('existing personal content');
    await sharing.applyGlobalSharing(plan);
    expect(await fs.readlink(path.join(root, '.codex/AGENTS.md'))).toBe(path.join(root, '.arcwright/AGENTS.md'));
    expect(await fs.readFile(path.join(root, '.grok/AGENTS.md'), 'utf8')).toBe('# Personal\nKeep this.\n');
    expect(await fs.readFile(path.join(root, '.codex/AGENTS.md'), 'utf8')).toContain('Shared rules.');
    expect(await fs.readFile(plan.operations.find(op => op.path.endsWith('.codex/AGENTS.md')).backup, 'utf8')).toBe(original);
    const before = await sharingState.snapshot(root);
    const rerun = await makePlan(root, prefs);
    expect(rerun.operations).toHaveLength(0);
    await sharing.applyGlobalSharing(rerun);
    expect(await sharingState.snapshot(root)).toEqual(before);
  });

  it('adopts approved whole bundles into Claude and neutral roots, retaining conflicts and resisting orphan cleanup', async () => {
    await put(root, '.claude/skills/personal-guide/SKILL.md', 'Personal procedure');
    await put(root, '.claude/skills/personal-guide/assets/example.txt', 'Asset');
    await put(root, '.claude/skills/conflict/SKILL.md', 'Claude version');
    await put(root, '.agents/skills/conflict/SKILL.md', 'Neutral version');
    const approvals = (await sharing.personalCandidates({ homeDir: root, discovery: await discover(root) })).filter(item => item.kind === 'skill');
    const prefs = selection({ claude: { skills: true }, codex: { skills: true } });
    const plan = await makePlan(root, prefs, { personalApprovals: approvals });
    expect(plan.pending.join('\n')).toContain('same-name bundle');
    await sharing.applyGlobalSharing(plan);
    const canonical = path.join(root, '.arcwright/skills/personal-guide');
    expect(await fs.readlink(path.join(root, '.claude/skills/personal-guide'))).toBe(canonical);
    expect(await fs.readlink(path.join(root, '.agents/skills/personal-guide'))).toBe(canonical);
    expect(await fs.readFile(path.join(root, '.agents/skills/personal-guide/assets/example.txt'), 'utf8')).toBe('Asset');
    expect(await fs.readFile(path.join(root, '.claude/skills/conflict/SKILL.md'), 'utf8')).toBe('Claude version');
    expect(await removeTrackedEntry({ relPath: '.codex/skills/personal-guide/SKILL.md', hash: sha256(Buffer.from('Personal procedure')) }, { isGlobal: true, projectRoot: root, effectiveArwDir: path.join(root, '.arcwright'), homes: { linux: root }, platform: 'linux' })).toBe(false);
    const rerun = await makePlan(root, prefs);
    expect(rerun.operations).toHaveLength(0);
    expect(rerun.detach.operations).toHaveLength(0);
    await installer._internal.writeManifest(path.join(root, '.arcwright'), { global: true, sharing: prefs, tools: ['codex'] });
    await installer.uninstall({ global: true, yes: true, homes: { linux: root }, codeHomes: noCodeHomes, directory: root });
    expect(await fs.readFile(path.join(canonical, 'SKILL.md'), 'utf8')).toBe('Personal procedure');
    expect(await fs.readFile(path.join(root, '.claude/skills/personal-guide/SKILL.md'), 'utf8')).toBe('Personal procedure');
    expect(await fs.pathExists(path.join(root, '.agents/skills/personal-guide'))).toBe(false);
    expect(await fs.pathExists(path.join(root, '.arcwright/_config/sharing-state.json'))).toBe(true);
    expect((await fs.readdir(path.join(root, '.arcwright/backups/sharing'))).length).toBeGreaterThan(0);
  });

  it('reviews instruction sections individually and never adopts them unattended', async () => {
    await put(root, '.codex/AGENTS.md', '# Writing\nUse plain words.\n# Work\nRun checks.\n');
    const approvals = (await sharing.personalCandidates({ homeDir: root, discovery: await discover(root) })).filter(item => item.kind === 'section' && item.heading === 'Writing');
    const prefs = selection({ codex: { instructions: true } });
    const unattended = await makePlan(root, prefs, { personalApprovals: approvals, unattended: true });
    expect(unattended.operations.find(op => op.canonical).content).not.toContain('Use plain words.');
    await sharing.applyGlobalSharing(await makePlan(root, prefs, { personalApprovals: approvals }));
    expect((await fs.lstat(path.join(root, '.codex/AGENTS.md'))).isFile()).toBe(true);
    expect(await fs.readFile(path.join(root, '.codex/AGENTS.md'), 'utf8')).toContain('# Work\nRun checks.');
    expect(await fs.readFile(path.join(root, '.codex/AGENTS.md'), 'utf8')).toContain('Use plain words.');
    expect(await fs.readFile(path.join(root, '.arcwright/AGENTS.md'), 'utf8')).toContain('Use plain words.');
  });

  it('restores matching preimages on opt-out, preserving later edits and canonical content', async () => {
    const original = '<!-- arcwright-agent-start -->\nOld\n<!-- arcwright-agent-end -->\n';
    await put(root, '.codex/AGENTS.md', original);
    const prefs = selection({ codex: { instructions: true }, grok: { instructions: true } });
    await sharing.applyGlobalSharing(await makePlan(root, prefs));
    await fs.remove(path.join(root, '.grok/AGENTS.md'));
    await put(root, '.grok/AGENTS.md', 'Later edit');
    const none = { ...selection({}), mode: 'none' };
    const restore = await makePlan(root, none);
    expect(restore.pending.join('\n')).toContain('later user changes preserved');
    await sharing.applyGlobalSharing(restore);
    expect(await fs.readFile(path.join(root, '.codex/AGENTS.md'), 'utf8')).toBe(original);
    expect(await fs.readFile(path.join(root, '.grok/AGENTS.md'), 'utf8')).toBe('Later edit');
    expect(await fs.pathExists(path.join(root, '.arcwright/AGENTS.md'))).toBe(true);
    expect((await makePlan(root, none)).operations).toHaveLength(0);
  });

  it('discovers marked accounts once, excludes backups, and never writes Code shadows', async () => {
    await put(root, '.codex-work/config.toml', '');
    await put(root, '.codex_unknown/no-marker', '');
    await put(root, '.codex-work.t3-shadow-backups/config.toml', '');
    await fs.symlink(path.join(root, '.codex-work'), path.join(root, '.codex_alias'));
    const shadow = path.join(root, '.codex-shadow');
    await put(root, '.codex-shadow/private.txt', 'Private state');
    const codeHomes = { status: 'ok', codex: [{ instanceId: 'work', sharedHome: path.join(root, '.codex'), shadowHome: shadow }], claude: [] };
    const discovery = await accounts.discoverAccountEnvironments({ homeDir: root, env: {}, codeHomes });
    expect(discovery.homes.filter(home => home.provider === 'codex')).toHaveLength(3);
    expect(discovery.homes.find(home => home.path === shadow).owner).toBe('arcwright-code');
    const prefs = selection({ codex: { instructions: true, skills: true, accounts: { [shadow]: { instructions: true, skills: true } } } });
    const before = await sharingState.snapshot(shadow);
    const plan = await makePlan(root, prefs, { discovery });
    await sharing.applyGlobalSharing(plan);
    expect(await sharingState.snapshot(shadow)).toEqual(before);
    expect(plan.operations.some(op => op.path.startsWith(shadow + path.sep))).toBe(false);
  });

  it('creates private homes and launchers preserving argv, cwd, HOME and exit status, refusing foreign launchers', async () => {
    const home = path.join(root, '.codex-work');
    const prefs = selection({ codex: { instructions: true, skills: true, accounts: { [home]: { create: true, name: 'work', instructions: true, skills: true } } } });
    const discovery = await accounts.discoverAccountEnvironments({ homeDir: root, env: {}, codeHomes: noCodeHomes, saved: prefs });
    await sharing.applyGlobalSharing(await makePlan(root, prefs, { discovery }));
    expect((await fs.stat(home)).mode & 0o777).toBe(0o700);
    expect(await fs.readlink(path.join(home, 'AGENTS.md'))).toBe(path.join(root, '.codex/AGENTS.md'));
    expect(await fs.readlink(path.join(home, 'skills'))).toBe(path.join(root, '.codex/skills'));
    expect(await fs.pathExists(path.join(home, 'auth.json'))).toBe(false);
    const bin = path.join(root, 'fake-bin');
    await put(bin, 'codex', '#!/bin/sh\nprintf "%s\\n" "$CODEX_HOME" "$HOME" "$PWD" "$@"\nexit 17\n');
    await fs.chmod(path.join(bin, 'codex'), 0o700);
    const result = spawnSync(path.join(root, '.local/bin/codex-work'), ['with spaces', '$(literal)', '--flag'], { cwd: root, env: { ...process.env, HOME: root, PATH: `${bin}:${process.env.PATH}` }, encoding: 'utf8' });
    expect(result.status).toBe(17);
    expect(result.stdout.trim().split('\n')).toEqual([home, root, root, 'with spaces', '$(literal)', '--flag']);
    await fs.remove(path.join(root, '.local/bin/codex-work'));
    await put(root, '.local/bin/codex-work', '#!/bin/sh\necho personal\n');
    const collision = await makePlan(root, prefs, { discovery });
    expect(collision.pending.join('\n')).toContain('foreign launcher');
    await sharing.applyGlobalSharing(collision);
    expect(await fs.readFile(path.join(root, '.local/bin/codex-work'), 'utf8')).toContain('echo personal');
  });

  it('passes saved health policy and Code ownership to the integration hook', async () => {
    const prefs = { ...selection({}), codexSelfHeal: true, credentialCopyCheck: 'local' };
    const prepared = await accountPrompts.prepareGlobalSharing({ homeDir: root, saved: prefs, codeHomes: noCodeHomes, env: {}, options: { yes: true }, log: () => {} });
    const calls = [];
    await accountPrompts.runGlobalSharing(prepared, { yes: true, dryRun: true, log: () => {}, health: { runCodexHomeHealth: async input => { calls.push(input); return { homes: [], duplicates: [], counts: {} }; }, formatCodexHomeHealth: () => ['Health checked'] } });
    expect(calls).toEqual([{ homeDir: root, codeHomes: noCodeHomes, policy: { selfHeal: true, copiedLoginCheck: 'local' }, dryRun: true, backupRoot: path.join(root, '.arcwright/backups/codex-home-health'), platform: process.platform }]);
  });
});

describe('global sharing installer lifecycle', () => {
    it('preserves choices through update, previews without writes, and opts out without recreating links', async () => {
      const coreInstaller = installer.createInstaller({ sourceDir: path.join(root, 'empty-source') });
      const options = { global: true, yes: true, homes: { linux: root }, env: {}, codeHomes: noCodeHomes, directory: root, tools: 'codex', modules: 'core', hooks: 'none', toolsExplicit: true };
      await coreInstaller.install(options);
      let manifest = await coreInstaller._internal.readManifest(path.join(root, '.arcwright'));
      expect(manifest.sharing).toBeUndefined();
      const original = await fs.readFile(path.join(root, '.codex/AGENTS.md'), 'utf8');
      await coreInstaller.install({ ...options, action: 'update', sharing: 'custom', sharingConfig: JSON.stringify({ providers: { codex: { instructions: true, skills: true } } }) });
      manifest = await coreInstaller._internal.readManifest(path.join(root, '.arcwright'));
      expect(manifest.sharing.mode).toBe('custom');
      expect(await fs.readlink(path.join(root, '.codex/AGENTS.md'))).toBe(path.join(root, '.arcwright/AGENTS.md'));
      await coreInstaller.install({ ...options, action: 'update' });
      expect((await coreInstaller._internal.readManifest(path.join(root, '.arcwright'))).sharing).toEqual(manifest.sharing);
      const before = await sharingState.snapshot(root);
      await coreInstaller.install({ ...options, action: 'update', sharing: 'none', dryRun: true });
      expect(await sharingState.snapshot(root)).toEqual(before);
      await coreInstaller.install({ ...options, action: 'update', sharing: 'none' });
      expect((await fs.lstat(path.join(root, '.codex/AGENTS.md'))).isFile()).toBe(true);
      expect(await fs.readFile(path.join(root, '.codex/AGENTS.md'), 'utf8')).toBe(original);
      expect((await coreInstaller._internal.readManifest(path.join(root, '.arcwright'))).sharing.mode).toBe('none');
    });

    it('never writes host blocks through instruction links or modifies excluded Claude settings', async () => {
      await put(root, '.arcwright/AGENTS.md', 'Canonical user text');
      await fs.ensureDir(path.join(root, '.codex'));
      await fs.symlink(path.join(root, '.arcwright/AGENTS.md'), path.join(root, '.codex/AGENTS.md'));
      await installer._internal.upsertManagedBlock(path.join(root, '.codex/AGENTS.md'), '<!-- arcwright-agent-start -->', '<!-- arcwright-agent-end -->', 'Wrong host block');
      expect(await fs.readFile(path.join(root, '.arcwright/AGENTS.md'), 'utf8')).toBe('Canonical user text');
      await put(root, '.claude-work/settings.json', '{"personal":true}');
      const { listClaudeProfileDirs } = await import('../lib/herdrAssets.js');
      const dirs = await listClaudeProfileDirs(root, { sharing: selection({ claude: { instructions: true } }) });
      expect(dirs).toEqual([path.join(root, '.claude')]);
    });
  });

describe('global sharing safety boundaries', () => {
  it('preserves changed paths after preview and never creates dependent links to a failed canonical adoption', async () => {
    await put(root, '.claude/skills/notes/SKILL.md', 'Reviewed');
    const approvals = (await sharing.personalCandidates({ homeDir: root, discovery: await discover(root) })).filter(item => item.kind === 'skill');
    const prefs = selection({ claude: { skills: true }, codex: { skills: true } });
    const plan = await makePlan(root, prefs, { personalApprovals: approvals });
    await put(root, '.claude/skills/notes/SKILL.md', 'Changed after review');
    const result = await sharing.applyGlobalSharing(plan);
    expect(result.pending.join('\n')).toContain('changed after preview');
    expect(await fs.readFile(path.join(root, '.claude/skills/notes/SKILL.md'), 'utf8')).toBe('Changed after review');
    expect(await fs.pathExists(path.join(root, '.agents/skills/notes'))).toBe(false);
  });

  it('honors retired Claude imports and preserves private state acquired by a new account on opt-out', async () => {
    const retired = '<!-- arcwright-claude-imports: retired -->\n';
    await put(root, '.arcwright/AGENTS.md', retired);
    await put(root, '.claude/CLAUDE.md', '<!-- arcwright-instructions-start -->\n@../.arcwright/AGENTS.md\n<!-- arcwright-instructions-end -->\n');
    const home = path.join(root, '.codex-work');
    const prefs = selection({ claude: { instructions: true }, codex: { instructions: true, skills: true, accounts: { [home]: { create: true, name: 'work', instructions: true, skills: true } } } });
    const discovery = await accounts.discoverAccountEnvironments({ homeDir: root, env: {}, codeHomes: noCodeHomes, saved: prefs });
    await sharing.applyGlobalSharing(await makePlan(root, prefs, { discovery }));
    expect(await fs.pathExists(path.join(root, '.claude/CLAUDE.md'))).toBe(false);
    await put(home, 'auth.json', '{"synthetic":"private-state-sentinel"}');
    const restore = await makePlan(root, { ...selection({}), mode: 'none' });
    await sharing.applyGlobalSharing(restore);
    expect(await fs.readFile(path.join(home, 'auth.json'), 'utf8')).toBe('{"synthetic":"private-state-sentinel"}');
    expect(await fs.pathExists(path.join(home, 'AGENTS.md'))).toBe(false);
    expect(await fs.pathExists(path.join(root, '.local/bin/codex-work'))).toBe(false);
    expect(await fs.readFile(path.join(root, '.arcwright/_config/sharing-state.json'), 'utf8')).not.toContain('private-state-sentinel');
  });

  it('does not write on native Windows or unreadable Code ownership and never signs in under yes', async () => {
    const prefs = selection({ codex: { instructions: true, skills: true } });
    const before = await sharingState.snapshot(root);
    const windows = await makePlan(root, prefs, { platform: 'win32' });
    await sharing.applyGlobalSharing(windows);
    expect(await sharingState.snapshot(root)).toEqual(before);
    const discovery = await accounts.discoverAccountEnvironments({ homeDir: root, env: {}, codeHomes: { status: 'unreadable', codex: [], claude: [] } });
    const unknown = await makePlan(root, prefs, { discovery });
    expect(unknown.pending.join('\n')).toContain('ownership unreadable');
    await sharing.applyGlobalSharing(unknown);
    expect(await sharingState.snapshot(root)).toEqual(before);
    const prepared = { sharing: prefs, discovery };
    await accountPrompts.signInWalkthrough(prepared, { yes: true, run: () => { throw new Error('Unexpected provider command'); } });
    expect(accounts.loginCommand('codex', '/tmp/account', true).display).toBe("CODEX_HOME='/tmp/account' codex login --device-auth");
    expect(accounts.loginCommand('grok', '/tmp/account', false).display).toBe("GROK_HOME='/tmp/account' grok login --oauth");
  });

  it('keeps saved health options when custom JSON changes only content enrollment', async () => {
    const saved = { ...selection({ codex: { instructions: true } }), codexSelfHeal: true, credentialCopyCheck: 'local' };
    const next = await sharing.resolveSharingPreferences({ saved, discovery: await discover(root), options: { yes: true, sharing: 'custom', sharingConfig: '{"providers":{"claude":{"skills":true}}}' } });
    expect(next.codexSelfHeal).toBe(true);
    expect(next.credentialCopyCheck).toBe('local');
    expect(next.providers).toEqual({ claude: { skills: true } });
  });
});

describe('global sharing Code dependency groups', () => {
  it('blocks shared-home changes that would enroll an excluded shadow and skips restoring a home that Code now owns', async () => {
    const prefs = selection({ codex: { instructions: true } });
    await sharing.applyGlobalSharing(await makePlan(root, prefs));
    const main = path.join(root, '.codex');
    const shadow = path.join(root, '.codex-shadow');
    await put(root, '.codex-shadow/private.txt', 'Code state');
    const codeHomes = { status: 'ok', codex: [{ instanceId: 'work', sharedHome: main, shadowHome: shadow }], claude: [] };
    const discovery = await accounts.discoverAccountEnvironments({ homeDir: root, env: {}, codeHomes });
    const plan = await makePlan(root, prefs, { discovery, rules: 'Changed shared rules' });
    expect(plan.pending.join('\n')).toContain('matching shared-home enrollment');
    expect(plan.operations).toHaveLength(0);
    expect(plan.detach.operations).toHaveLength(0);
    // A previously standalone home may become a Code shadow between installer runs.
    const nowCodeOwned = { status: 'ok', codex: [{ instanceId: 'moved', sharedHome: path.join(root, '.codex-base'), shadowHome: main }], claude: [] };
    const moved = await accounts.discoverAccountEnvironments({ homeDir: root, env: {}, codeHomes: nowCodeOwned });
    const none = await makePlan(root, { ...selection({}), mode: 'none' }, { discovery: moved });
    expect(none.operations.some(operation => operation.path.startsWith(main + path.sep))).toBe(false);
    expect(none.pending.join('\n')).toContain('restore pending');
  });
});
