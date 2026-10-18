import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const REPO_ROOT = path.resolve(__dirname, '..', '..', '..');
const BUILD_SCRIPT = path.join(REPO_ROOT, 'build', 'build.js');
const OUTSIDE_CONTENT = 'outside-build-fixture-secret';

function createFixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'arcw-build-fixture-'));
  const external = fs.mkdtempSync(path.join(os.tmpdir(), 'arcw-build-external-'));

  const copyPairs = [
    [BUILD_SCRIPT, path.join(root, 'build', 'build.js')],
    [path.join(REPO_ROOT, 'build', 'leak-patterns.js'), path.join(root, 'build', 'leak-patterns.js')],
    [path.join(REPO_ROOT, 'build', 'matt-pocock.js'), path.join(root, 'build', 'matt-pocock.js')],
    [path.join(REPO_ROOT, 'build', 'invocation.js'), path.join(root, 'build', 'invocation.js')],
    [path.join(REPO_ROOT, 'build', 'host-commands.js'), path.join(root, 'build', 'host-commands.js')],
    [path.join(REPO_ROOT, '.agents/skills/arcwright/scripts/skill-metadata.cjs'), path.join(root, '.agents/skills/arcwright/scripts/skill-metadata.cjs')],
    [path.join(REPO_ROOT, 'packages', 'agent-orchestration', 'lib', 'skill-policy.js'), path.join(root, 'packages', 'agent-orchestration', 'lib', 'skill-policy.js')],
    [
      path.join(REPO_ROOT, 'packages', 'agent-orchestration', 'lib', 'kiro-adapter.js'),
      path.join(root, 'packages', 'agent-orchestration', 'lib', 'kiro-adapter.js'),
    ],
  ];

  for (const [source, destination] of copyPairs) {
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.copyFileSync(source, destination);
  }

  fs.mkdirSync(path.join(root, '_arcwright', 'awb'), { recursive: true });
  fs.writeFileSync(path.join(root, '_arcwright', 'awb', 'inside.md'), 'inside package content\n');

  fs.mkdirSync(path.join(root, '.agents', 'skills', 'fixture-skill'), { recursive: true });
  fs.writeFileSync(
    path.join(root, '.agents', 'skills', 'fixture-skill', 'SKILL.md'),
    '---\nname: fixture-skill\ndescription: Fixture skill\n---\n\nInside skill content.\n'
  );

  fs.mkdirSync(
    path.join(root, 'packages', 'agent-orchestration', 'lib', 'templates', 'launchers'),
    { recursive: true }
  );
  fs.writeFileSync(
    path.join(root, 'packages', 'agent-orchestration', 'lib', 'templates', 'launchers', 'inside.sh'),
    '#!/bin/sh\n'
  );

  const outsideFile = path.join(external, 'outside-source.txt');
  fs.writeFileSync(outsideFile, OUTSIDE_CONTENT);

  return { root, external, outsideFile };
}

function removeFixture(fixture) {
  fs.rmSync(fixture.root, { recursive: true, force: true });
  fs.rmSync(fixture.external, { recursive: true, force: true });
}

function withFixture(callback) {
  const fixture = createFixture();
  try {
    callback(fixture);
  } finally {
    removeFixture(fixture);
  }
}

function runBuild(fixture) {
  return execFileSync(process.execPath, [path.join(fixture.root, 'build', 'build.js')], {
    cwd: fixture.root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

function expectBuildToRejectSymlink(fixture) {
  let error;
  try {
    runBuild(fixture);
  } catch (caught) {
    error = caught;
  }

  expect(error).toBeDefined();
  expect(`${error.message}\n${error.stderr || ''}`).toMatch(/Refusing symlinked build input/);
}

function link(target, linkPath) {
  fs.symlinkSync(
    target,
    linkPath,
    process.platform === 'win32' ? (fs.statSync(target).isDirectory() ? 'junction' : 'file') : undefined
  );
}

const symlinkDescribe = process.platform === 'win32' ? describe.skip : describe;

symlinkDescribe('build input symlink boundaries', () => {
  it('rejects a symlinked package file', () => {
    withFixture((fixture) => {
      const linkPath = path.join(fixture.root, '_arcwright', 'awb', 'outside-package.txt');
      link(fixture.outsideFile, linkPath);

      expectBuildToRejectSymlink(fixture);
      expect(fs.existsSync(path.join(fixture.root, 'packages', 'agent-orchestration', 'src', 'awb', 'outside-package.txt')))
        .toBe(false);
    });
  });

  it('rejects a symlinked skill file', () => {
    withFixture((fixture) => {
      const linkPath = path.join(fixture.root, '.agents', 'skills', 'fixture-skill', 'outside-skill.txt');
      link(fixture.outsideFile, linkPath);

      expectBuildToRejectSymlink(fixture);
      expect(fs.existsSync(path.join(
        fixture.root,
        'packages', 'agent-orchestration', 'src', '.agents', 'skills', 'fixture-skill', 'outside-skill.txt'
      ))).toBe(false);
    });
  });

  it('rejects a symlinked launcher file', () => {
    withFixture((fixture) => {
      const linkPath = path.join(
        fixture.root,
        'packages', 'agent-orchestration', 'lib', 'templates', 'launchers', 'outside-launcher.txt'
      );
      link(fixture.outsideFile, linkPath);

      expectBuildToRejectSymlink(fixture);
      expect(fs.existsSync(path.join(
        fixture.root, 'packages', 'agent-orchestration', 'src', 'launchers', 'outside-launcher.txt'
      ))).toBe(false);
    });
  });

  it('rejects a symlinked package root', () => {
    withFixture((fixture) => {
      const packageRoot = path.join(fixture.root, '_arcwright', 'awb');
      fs.rmSync(packageRoot, { recursive: true, force: true });
      link(fixture.external, packageRoot);

      expectBuildToRejectSymlink(fixture);
      expect(fs.existsSync(path.join(fixture.root, 'packages', 'agent-orchestration', 'src', 'awb', 'outside-source.txt')))
        .toBe(false);
    });
  });

  it('rejects a symlinked skill root', () => {
    withFixture((fixture) => {
      const skillRoot = path.join(fixture.root, '.agents', 'skills', 'fixture-skill');
      fs.rmSync(skillRoot, { recursive: true, force: true });
      link(fixture.external, skillRoot);

      expectBuildToRejectSymlink(fixture);
      expect(fs.existsSync(path.join(
        fixture.root,
        'packages', 'agent-orchestration', 'src', '.agents', 'skills', 'fixture-skill', 'outside-source.txt'
      ))).toBe(false);
    });
  });

  it('rejects a symlinked launcher root', () => {
    withFixture((fixture) => {
      const launcherRoot = path.join(
        fixture.root, 'packages', 'agent-orchestration', 'lib', 'templates', 'launchers'
      );
      fs.rmSync(launcherRoot, { recursive: true, force: true });
      link(fixture.external, launcherRoot);

      expectBuildToRejectSymlink(fixture);
      expect(fs.existsSync(path.join(fixture.root, 'packages', 'agent-orchestration', 'src', 'launchers', 'outside-source.txt')))
        .toBe(false);
    });
  });
});

describe('ordinary build inputs', () => {
  it('does not package local skill runs with the reusable memory module', () => {
    withFixture((fixture) => {
      const memory = path.join(fixture.root, '_arcwright', '_memory');
      fs.mkdirSync(path.join(memory, 'skill-runs', 'local-run'), { recursive: true });
      fs.writeFileSync(path.join(memory, 'skill-runs', 'local-run', 'private-report.md'), 'Local run only\n');
      if (process.platform !== 'win32') {
        fs.symlinkSync(fixture.external, path.join(memory, 'skill-runs', 'local-run', 'fixture-link'));
      }
      fs.writeFileSync(path.join(memory, 'README.md'), 'Reusable memory instructions\n');
      runBuild(fixture);
      const out = path.join(fixture.root, 'packages', 'agent-orchestration', 'src', '_memory');
      expect(fs.existsSync(path.join(out, 'skill-runs'))).toBe(false);
      expect(fs.readFileSync(path.join(out, 'README.md'), 'utf8')).toContain('Reusable memory');
    });
  });

  it('rejects a missing sibling skill linked by a bundled reference', () => {
    withFixture((fixture) => {
      const skill = path.join(fixture.root, '.agents', 'skills', 'fixture-skill');
      fs.mkdirSync(path.join(skill, 'references'));
      fs.writeFileSync(path.join(skill, 'references', 'measurement.md'),
        'Read [runtime evidence](../../missing-performance/SKILL.md).\n');

      expect(() => runBuild(fixture)).toThrow(/missing-performance/);
    });
  });

  it('ships shared source notices required by skill links', () => {
    withFixture((fixture) => {
      const skills = path.join(fixture.root, '.agents', 'skills');
      fs.writeFileSync(path.join(skills, 'SOURCES-FIXTURE.md'), 'Required upstream source notice\n');
      fs.appendFileSync(path.join(skills, 'fixture-skill', 'SKILL.md'),
        '\n[Source notice](../SOURCES-FIXTURE.md)\n');
      runBuild(fixture);
      expect(fs.readFileSync(path.join(fixture.root, 'packages', 'agent-orchestration', 'src',
        '.agents', 'skills', 'SOURCES-FIXTURE.md'), 'utf8')).toContain('Required upstream source notice');
    });
  });

  it('accepts linked resources with fragments and ignores example links inside fences', () => {
    withFixture((fixture) => {
      const skill = path.join(fixture.root, '.agents', 'skills', 'fixture-skill');
      fs.mkdirSync(path.join(skill, 'references'));
      fs.writeFileSync(path.join(skill, 'references', 'evidence.md'), '# Evidence\n');
      fs.appendFileSync(path.join(skill, 'SKILL.md'),
        '\n[Evidence](references/evidence.md#evidence)\n\n```markdown\n[Example](../absent-example/SKILL.md)\n```\n');
      expect(() => runBuild(fixture)).not.toThrow();
    });
  });

  it('ignores retired submodule configuration when building local source', () => {
    withFixture((fixture) => {
      fs.writeFileSync(path.join(fixture.root, '.gitmodules'), '[submodule "skills"]\n path = vendor/mattpocock-skills\n');
      expect(() => runBuild(fixture)).not.toThrow();
    });
  });

  it('builds an isolated fixture without including outside content', () => {
    withFixture((fixture) => {
      runBuild(fixture);

      const src = path.join(fixture.root, 'packages', 'agent-orchestration', 'src');
      expect(fs.readFileSync(path.join(src, 'awb', 'inside.md'), 'utf8')).toContain('inside package content');
      expect(fs.readFileSync(path.join(src, '.agents', 'skills', 'fixture-skill', 'SKILL.md'), 'utf8'))
        .toContain('Inside skill content.');
      expect(fs.readFileSync(path.join(src, 'launchers', 'inside.sh'), 'utf8')).toContain('#!/bin/sh');

      const allOutput = [];
      const collect = (dir) => {
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
          const full = path.join(dir, entry.name);
          if (entry.isDirectory()) collect(full);
          else allOutput.push(fs.readFileSync(full, 'utf8'));
        }
      };
      collect(src);
      expect(allOutput.join('\n')).not.toContain(OUTSIDE_CONTENT);
    });
  });
});
