import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import migrateModule from '../lib/migrate.js';

const { migrate } = migrateModule;

let dir;
let logSpy;
const extraDirs = [];

beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'arcw-migrate-'));
  // migrate() narrates to stdout; keep the test output readable.
  logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
});
afterEach(() => {
  logSpy.mockRestore();
  fs.rmSync(dir, { recursive: true, force: true });
  for (const extraDir of extraDirs.splice(0)) {
    fs.rmSync(extraDir, { recursive: true, force: true });
  }
});

/** Minimal bmad install: the _bmad marker plus a couple of referencing files. */
function seedBmadProject() {
  fs.mkdirSync(path.join(dir, '_bmad'), { recursive: true });
  fs.mkdirSync(path.join(dir, '.claude', 'commands'), { recursive: true });
  fs.writeFileSync(path.join(dir, '_bmad', 'marker.md'), 'x\n');
  fs.writeFileSync(
    path.join(dir, '.claude', 'commands', 'sample.md'),
    'See _bmad-output/ and /bmad-agent-bmm-dev for details.\n'
  );
  fs.writeFileSync(path.join(dir, 'CLAUDE.md'), 'Uses _bmad-output/ too.\n');
}

const contentActions = (result) =>
  (Array.isArray(result) ? result : result.actions || []).filter(
    (a) => a.type === 'content-replace'
  );

describe('migrate — dry run', () => {
  it('reports each file once', () => {
    seedBmadProject();
    const actions = contentActions(migrate(dir, true));
    const counts = {};
    for (const a of actions) counts[a.path] = (counts[a.path] || 0) + 1;

    // dirsToScan lists both .claude/commands and .claude, and the second
    // contains the first. In a real run the duplicate visit is a harmless
    // no-op because the file was already rewritten, but a dry run writes
    // nothing, so the file matched twice and was reported twice — inflating
    // the preview users read before deciding to migrate.
    expect(Object.values(counts).every((n) => n === 1)).toBe(true);
    expect(Object.keys(counts).sort()).toEqual(
      [path.join('.claude', 'commands', 'sample.md'), 'CLAUDE.md'].sort()
    );
  });

  it('changes nothing on disk', () => {
    seedBmadProject();
    const before = fs.readFileSync(path.join(dir, 'CLAUDE.md'), 'utf8');
    migrate(dir, true);
    expect(fs.readFileSync(path.join(dir, 'CLAUDE.md'), 'utf8')).toBe(before);
    expect(fs.existsSync(path.join(dir, '_bmad'))).toBe(true);
    expect(fs.existsSync(path.join(dir, '_arcwright'))).toBe(false);
  });

  it('is a no-op when there is no bmad install to migrate', () => {
    fs.writeFileSync(path.join(dir, 'CLAUDE.md'), 'nothing to do\n');
    expect(contentActions(migrate(dir, true))).toHaveLength(0);
  });
});

describe('migrate — apply', () => {
  it('migrates command-only BMAD artifacts', () => {
    const commands = path.join(dir, '.claude', 'commands');
    fs.mkdirSync(commands, { recursive: true });
    fs.writeFileSync(path.join(commands, 'bmad-track-compact.md'), 'legacy\n');

    const result = migrate(dir, false);

    expect(fs.existsSync(path.join(commands, 'bmad-track-compact.md'))).toBe(false);
    expect(fs.readFileSync(path.join(commands, 'arcwright-track-compact.md'), 'utf8')).toBe('legacy\n');
    expect(result.actions).toContainEqual({
      type: 'rename-file',
      from: '.claude/commands/bmad-track-compact.md',
      to: '.claude/commands/arcwright-track-compact.md',
    });
  });

  it('migrates a partial module tree without a legacy root directory', () => {
    fs.mkdirSync(path.join(dir, '_arcwright', 'bmm'), { recursive: true });
    fs.writeFileSync(path.join(dir, '_arcwright', 'bmm', 'marker.md'), 'legacy\n');

    migrate(dir, false);

    expect(fs.existsSync(path.join(dir, '_arcwright', 'bmm'))).toBe(false);
    expect(fs.readFileSync(path.join(dir, '_arcwright', 'awm', 'marker.md'), 'utf8')).toBe('legacy\n');
  });

  it('aborts before mutation when a rename target already exists', () => {
    seedBmadProject();
    fs.mkdirSync(path.join(dir, '_arcwright'));

    expect(() => migrate(dir, false)).toThrow(/_bmad.*_arcwright/);
    expect(fs.existsSync(path.join(dir, '_bmad'))).toBe(true);
    expect(fs.existsSync(path.join(dir, '_arcwright'))).toBe(true);
    expect(fs.readFileSync(path.join(dir, 'CLAUDE.md'), 'utf8')).toContain('_bmad-output/');
  });

  it('aborts before mutation when a command rename target already exists', () => {
    seedBmadProject();
    const commands = path.join(dir, '.claude', 'commands');
    fs.writeFileSync(path.join(commands, 'bmad-track-compact.md'), 'legacy\n');
    fs.writeFileSync(path.join(commands, 'arcwright-track-compact.md'), 'current\n');

    expect(() => migrate(dir, false)).toThrow(/bmad-track-compact.*arcwright-track-compact.*target already exists/);
    expect(fs.existsSync(path.join(dir, '_bmad'))).toBe(true);
    expect(fs.readFileSync(path.join(commands, 'bmad-track-compact.md'), 'utf8')).toBe('legacy\n');
    expect(fs.readFileSync(path.join(commands, 'arcwright-track-compact.md'), 'utf8')).toBe('current\n');
  });

  it.each([
    ['a chained module rename', ['_bmad/bmm', '_bmad/awm']],
    ['legacy output directories sharing a target', ['_bmad-output', '_bmad_output']],
  ])('preflights %s before any rename', (_case, directories) => {
    for (const directory of directories) {
      fs.mkdirSync(path.join(dir, ...directory.split('/')), { recursive: true });
    }

    expect(() => migrate(dir, false)).toThrow(/target already exists/);
    for (const directory of directories) {
      expect(fs.existsSync(path.join(dir, ...directory.split('/')))).toBe(true);
    }
  });

  it('aborts before following a managed symlink outside the project', () => {
    fs.mkdirSync(path.join(dir, '_bmad'));
    const externalDir = fs.mkdtempSync(path.join(os.tmpdir(), 'arcw-external-'));
    extraDirs.push(externalDir);
    const externalFile = path.join(externalDir, 'outside.md');
    fs.writeFileSync(externalFile, 'See _bmad-output/ here.\n');
    fs.symlinkSync(externalDir, path.join(dir, '.claude'), process.platform === 'win32' ? 'junction' : 'dir');

    expect(() => migrate(dir, false)).toThrow(/outside the project root/);
    expect(fs.existsSync(path.join(dir, '_bmad'))).toBe(true);
    expect(fs.readFileSync(externalFile, 'utf8')).toBe('See _bmad-output/ here.\n');
  });

  it('preserves an existing Arcwright track command during migration', () => {
    seedBmadProject();
    const commandsDir = path.join(dir, '.claude', 'commands');
    const sourcePath = path.join(commandsDir, 'bmad-track-compact.md');
    const destinationPath = path.join(commandsDir, 'arcwright-track-compact.md');
    const legacyContent = 'legacy track content\n';
    const userContent = 'user Arcwright content\n';
    fs.writeFileSync(sourcePath, legacyContent);
    fs.writeFileSync(destinationPath, userContent);

    const result = migrate(dir, false);

    expect(result.actions).toContainEqual(expect.objectContaining({
      type: 'skip',
      reason: 'Target already exists: arcwright-track-compact.md',
    }));
    expect(fs.readFileSync(sourcePath, 'utf8')).toBe(legacyContent);
    expect(fs.readFileSync(destinationPath, 'utf8')).toBe(userContent);
  });

  it('renames the module dir and rewrites references', () => {
    seedBmadProject();
    migrate(dir, false);

    expect(fs.existsSync(path.join(dir, '_arcwright'))).toBe(true);
    expect(fs.existsSync(path.join(dir, '_bmad'))).toBe(false);
    expect(fs.readFileSync(path.join(dir, 'CLAUDE.md'), 'utf8')).toContain('_arcwright-output/');
    const sample = fs.readFileSync(path.join(dir, '.claude', 'commands', 'sample.md'), 'utf8');
    expect(sample).toContain('_arcwright-output/');
    expect(sample).toContain('/arcwright-dev');
    expect(sample).not.toMatch(/bmad/);
  });

  it('is idempotent — a second run finds nothing left to change', () => {
    seedBmadProject();
    migrate(dir, false);
    const after = fs.readFileSync(path.join(dir, 'CLAUDE.md'), 'utf8');
    migrate(dir, false);
    expect(fs.readFileSync(path.join(dir, 'CLAUDE.md'), 'utf8')).toBe(after);
  });

  it('deletes obsolete bmad commands, renames surviving tracks, spares user commands', () => {
    seedBmadProject();
    const cmds = path.join(dir, '.claude', 'commands');
    const write = (name) => fs.writeFileSync(path.join(cmds, name), 'x\n');
    for (const f of [
      'bmad-agent-dev.md', 'bmad-help.md', 'bmad-party-mode.md',
      'orchestration-master.md',
      'bmad-track-medium.md', 'bmad-track-large.md', // deprecated tracks
      'bmad-track-compact.md',                        // survives, renamed
      'deploy.md',                                    // user's own
    ]) write(f);

    migrate(dir, false);
    const left = fs.readdirSync(cmds).sort();

    for (const gone of [
      'bmad-agent-dev.md', 'bmad-help.md', 'bmad-party-mode.md',
      'orchestration-master.md', 'bmad-track-medium.md', 'bmad-track-large.md',
      'bmad-track-compact.md',
    ]) expect(left).not.toContain(gone);

    expect(left).toContain('arcwright-track-compact.md');
    expect(left).toContain('deploy.md'); // never touch files the user wrote
  });
});
