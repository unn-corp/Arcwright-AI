import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { checkSources, refreshLocal } = require('../../../build/skill-sources.js');

function withFixture(callback) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'arcw-source-record-'));
  const skill = path.join(root, 'skills', 'demo');
  fs.mkdirSync(skill, { recursive: true });
  fs.writeFileSync(path.join(skill, 'SKILL.md'), 'Original reviewed skill\n');
  const manifest = {
    schemaVersion: 1,
    families: [{
      id: 'example', repository: 'https://github.com/example/skills',
      revision: 'a'.repeat(40), sourcePaths: ['skills/demo'], license: 'MIT',
      adaptations: 'Namespaced local adapter', localRoots: ['skills/demo'],
      upstreamFiles: { 'skills/demo/SKILL.md': 'b'.repeat(64) },
    }],
  };
  try { callback(root, manifest); }
  finally { fs.rmSync(root, { recursive: true, force: true }); }
}

describe('audited skill source records', () => {
  it('detects edited, added, and deleted local source files', () => {
    withFixture((root, initial) => {
      const manifest = refreshLocal(root, initial);
      expect(checkSources(root, manifest)).toEqual([]);
      fs.writeFileSync(path.join(root, 'skills/demo/SKILL.md'), 'Changed guidance\n');
      fs.writeFileSync(path.join(root, 'skills/demo/new.md'), 'New resource\n');
      expect(checkSources(root, manifest)).toEqual(expect.arrayContaining([
        'example: changed skills/demo/SKILL.md', 'example: added skills/demo/new.md',
      ]));
      fs.rmSync(path.join(root, 'skills/demo/SKILL.md'));
      expect(checkSources(root, manifest)).toContain('example: removed skills/demo/SKILL.md');
    });
  });

  it('refreshes local identities without rewriting audited upstream provenance', () => {
    withFixture((root, initial) => {
      const updated = refreshLocal(root, initial);
      expect(updated.families[0].revision).toBe(initial.families[0].revision);
      expect(updated.families[0].upstreamFiles).toEqual(initial.families[0].upstreamFiles);
      expect(updated.families[0].localFiles['skills/demo/SKILL.md']).toMatch(/^[a-f0-9]{64}$/);
      expect(initial.families[0].localFiles).toBeUndefined();
    });
  });

  it('excludes separately sourced collections and interpreter caches', () => {
    withFixture((root, initial) => {
      initial.families[0].exclude = ['skills/demo/mobile'];
      for (const name of ['mobile', '__pycache__']) {
        fs.mkdirSync(path.join(root, 'skills/demo', name));
        fs.writeFileSync(path.join(root, 'skills/demo', name, 'ignored.md'), 'Other source\n');
      }
      const manifest = refreshLocal(root, initial);
      expect(Object.keys(manifest.families[0].localFiles)).toEqual(['skills/demo/SKILL.md']);
    });
  });

  it('rejects unpinned revisions and source scopes outside the repository', () => {
    withFixture((root, initial) => {
      initial.families[0].revision = 'main';
      expect(() => refreshLocal(root, initial)).toThrow(/immutable revision/);
      initial.families[0].revision = 'a'.repeat(40);
      initial.families[0].localRoots = ['../outside'];
      expect(() => refreshLocal(root, initial)).toThrow(/outside the source scope/);
    });
  });

  it.skipIf(process.platform === 'win32')('refuses symlinks instead of hashing outside content', () => {
    withFixture((root, initial) => {
      fs.symlinkSync(path.join(root, 'skills/demo/SKILL.md'), path.join(root, 'skills/demo/alias.md'));
      expect(() => refreshLocal(root, initial)).toThrow(/symlinked provenance input/);
    });
  });
});
