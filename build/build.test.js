'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { test } = require('node:test');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const BUILD_SCRIPT = path.join(PROJECT_ROOT, 'build', 'build.js');
const PACKAGE_SRC = path.join(PROJECT_ROOT, 'packages', 'agent-orchestration', 'src');

function runBuild() {
  const result = spawnSync(process.execPath, [BUILD_SCRIPT], {
    cwd: PROJECT_ROOT,
    encoding: 'utf8',
  });
  assert.ifError(result.error);
  return result;
}

function combinedOutput(result) {
  return `${result.stdout || ''}\n${result.stderr || ''}`;
}

function removeSymlink(linkPath) {
  const stat = fs.lstatSync(linkPath, { throwIfNoEntry: false });
  if (stat?.isSymbolicLink()) fs.unlinkSync(linkPath);
  else if (stat) throw new Error(`Test fixture path was replaced: ${linkPath}`);
}

function assertGeneratedTreeContained() {
  const rootReal = fs.realpathSync(PACKAGE_SRC);
  const pending = [PACKAGE_SRC];
  while (pending.length) {
    const directory = pending.pop();
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const full = path.join(directory, entry.name);
      assert.equal(entry.isSymbolicLink(), false, `generated symlink found: ${full}`);
      const real = fs.realpathSync(full);
      const relative = path.relative(rootReal, real);
      assert.equal(
        relative === '' || (!relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative)),
        true,
        `generated path escaped package src: ${full} -> ${real}`
      );
      if (entry.isDirectory()) pending.push(full);
    }
  }
}

test('rejects symlinked files in every copied build-input root', (t) => {
  const outsideDir = fs.mkdtempSync(path.join(os.tmpdir(), 'arcwright-build-outside-'));
  const outsideFile = path.join(outsideDir, 'outside.md');
  const fixtureName = `zz-build-symlink-escape-${process.pid}-${Date.now()}`;
  fs.writeFileSync(outsideFile, 'outside-build-fixture-marker\n');

  const fixtures = [
    {
      root: '_arcwright',
      link: path.join(PROJECT_ROOT, '_arcwright', 'awm', `${fixtureName}.md`),
      output: path.join(PACKAGE_SRC, 'awm', `${fixtureName}.md`),
    },
    {
      root: '.agents/skills',
      link: path.join(PROJECT_ROOT, '.agents', 'skills', 'security-review', `${fixtureName}.md`),
      output: path.join(PACKAGE_SRC, '.agents', 'skills', 'security-review', `${fixtureName}.md`),
    },
    {
      root: 'launcher templates',
      link: path.join(PROJECT_ROOT, 'packages', 'agent-orchestration', 'lib', 'templates', 'launchers', `${fixtureName}.sh`),
      output: path.join(PACKAGE_SRC, 'launchers', `${fixtureName}.sh`),
    },
  ];

  t.after(() => {
    for (const fixture of fixtures) removeSymlink(fixture.link);
    fs.rmSync(outsideDir, { recursive: true, force: true });

    const restored = runBuild();
    assert.equal(restored.status, 0, `cleanup build failed:\n${combinedOutput(restored)}`);
    assertGeneratedTreeContained();
  });

  for (const fixture of fixtures) {
    assert.equal(fs.lstatSync(fixture.link, { throwIfNoEntry: false }), undefined);
    fs.symlinkSync(outsideFile, fixture.link, 'file');

    try {
      const result = runBuild();
      assert.notEqual(result.status, 0, `${fixture.root} symlink was accepted`);
      assert.match(combinedOutput(result), /refusing symbolic link/i);
      assert.equal(fs.existsSync(fixture.output), false, `${fixture.root} copied an outside file`);
    } finally {
      removeSymlink(fixture.link);
    }
  }
});
