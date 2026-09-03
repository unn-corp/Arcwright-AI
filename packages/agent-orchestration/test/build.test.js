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
    [
      path.join(REPO_ROOT, 'packages', 'agent-orchestration', 'lib', 'kiro-adapter.js'),
      path.join(root, 'packages', 'agent-orchestration', 'lib', 'kiro-adapter.js'),
    ],
    [
      path.join(REPO_ROOT, 'packages', 'agent-orchestration', 'lib', 'activation-root.js'),
      path.join(root, 'packages', 'agent-orchestration', 'lib', 'activation-root.js'),
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

const unixDescribe = process.platform === 'win32' ? describe.skip : describe;

unixDescribe('build input symlink boundaries', () => {
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

unixDescribe('build cleanup fallback', () => {
  it('removes a metacharacter path after the initial rmSync attempt fails', () => {
    const markerDir = fs.mkdtempSync(path.join(os.tmpdir(), 'arcw-wipe-markers-'));
    const dollarMarker = path.join(markerDir, 'dollar-side-effect');
    const backtickMarker = path.join(markerDir, 'backtick-side-effect');
    const unsafeName = 'checkout-"-$(touch $ARCWRIGHT_TEST_DOLLAR_MARKER)-`touch $ARCWRIGHT_TEST_BACKTICK_MARKER`-"-suffix';
    const fixture = createFixture();
    const unsafeRoot = path.join(path.dirname(fixture.root), unsafeName);
    fs.renameSync(fixture.root, unsafeRoot);
    fixture.root = unsafeRoot;

    const srcDir = path.join(fixture.root, 'packages', 'agent-orchestration', 'src');
    fs.mkdirSync(srcDir, { recursive: true });
    fs.writeFileSync(path.join(srcDir, 'stale.txt'), 'stale\n');

    const attemptMarker = path.join(markerDir, 'initial-rm-attempt');
    const preloadPath = path.join(markerDir, 'force-initial-rm-failure.cjs');
    fs.writeFileSync(preloadPath, String.raw`
'use strict';

const fs = require('node:fs');
const originalRmSync = fs.rmSync;
let forced = false;

fs.rmSync = function (target, ...args) {
  if (!forced && target === process.env.ARCWRIGHT_TEST_WIPE_SRC) {
    forced = true;
    fs.writeFileSync(process.env.ARCWRIGHT_TEST_RM_ATTEMPT, 'forced\n');
    throw Object.assign(new Error('forced initial rmSync failure'), { code: 'EIO' });
  }
  return originalRmSync.call(this, target, ...args);
};
`);

    try {
      execFileSync(process.execPath, ['--require', preloadPath, path.join(fixture.root, 'build', 'build.js')], {
        cwd: fixture.root,
        env: {
          ...process.env,
          ARCWRIGHT_TEST_WIPE_SRC: srcDir,
          ARCWRIGHT_TEST_RM_ATTEMPT: attemptMarker,
          ARCWRIGHT_TEST_DOLLAR_MARKER: dollarMarker,
          ARCWRIGHT_TEST_BACKTICK_MARKER: backtickMarker,
        },
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      expect(fs.readFileSync(attemptMarker, 'utf8')).toBe('forced\n');
      expect(fs.existsSync(dollarMarker)).toBe(false);
      expect(fs.existsSync(backtickMarker)).toBe(false);
      expect(fs.existsSync(path.join(srcDir, 'stale.txt'))).toBe(false);
      expect(fs.existsSync(path.join(srcDir, 'awb', 'inside.md'))).toBe(true);
    } finally {
      removeFixture(fixture);
      fs.rmSync(markerDir, { recursive: true, force: true });
    }
  });
});

describe('ordinary build inputs', () => {
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
