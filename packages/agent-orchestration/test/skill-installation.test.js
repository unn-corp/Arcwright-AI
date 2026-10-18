import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import fs from 'fs-extra';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import installer from '../lib/installer.js';
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
