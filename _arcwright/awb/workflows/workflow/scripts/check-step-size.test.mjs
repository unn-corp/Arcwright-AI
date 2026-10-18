import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const checker = fileURLToPath(new URL('./check-step-size.mjs', import.meta.url));

function fixture(t) {
  const root = mkdtempSync(path.join(tmpdir(), 'awb step sizes '));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  return root;
}

function put(root, name, content) {
  const file = path.join(root, name);
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, content);
  return file;
}

function check(target) {
  const result = spawnSync(process.execPath, [checker, target], { encoding: 'utf8' });
  assert.ok(result.stdout, result.stderr);
  return { exit: result.status, report: JSON.parse(result.stdout) };
}

test('all modes use the same boundary and unrelated references are not step files', t => {
  const root = fixture(t);
  put(root, 'steps-c/a.md', 'x\n'.repeat(199));
  put(root, 'steps-e/b.md', 'x\n'.repeat(200));
  put(root, 'steps-v/nested/c.md', 'x\n'.repeat(250));
  put(root, 'steps-v/d.md', 'x\n'.repeat(251));
  put(root, 'data/large-reference.md', 'x\n'.repeat(500));
  const { exit, report } = check(root);
  assert.equal(exit, 1);
  assert.equal(report.status, 'FAIL');
  assert.deepEqual(report.files.map(f => [f.lines, f.status]).sort((a, b) => a[0] - b[0]), [[199, 'GOOD'], [200, 'WARN'], [250, 'WARN'], [251, 'FAIL']]);
});

test('CRLF and a missing terminal newline have the same boundary', t => {
  const root = fixture(t);
  for (const [name, text] of [['crlf', 'x\r\n'.repeat(250)], ['no-newline', Array(250).fill('x').join('\n')]]) {
    const { exit, report } = check(put(root, name + '.md', text));
    assert.equal(exit, 0);
    assert.equal(report.files[0].lines, 250);
    assert.equal(report.files[0].status, 'WARN');
  }
});

test('empty files count as zero lines without claiming content validity', t => {
  const { report } = check(put(fixture(t), 'empty.md', ''));
  assert.equal(report.files[0].lines, 0);
  assert.equal(report.files[0].status, 'GOOD');
});

test('token estimates are advisory even for a very long line', t => {
  const { exit, report } = check(put(fixture(t), 'long.md', 'a'.repeat(20000)));
  assert.equal(exit, 0);
  assert.equal(report.files[0].status, 'GOOD');
  assert.equal(report.files[0].tokenAdvice, 'REVIEW');
  assert.match(report.files[0].tokenMethod, /estimate/);
});

test('an absent step scope is incomplete, not a clean pass', t => {
  const { exit, report } = check(fixture(t));
  assert.equal(exit, 2);
  assert.equal(report.status, 'INCOMPLETE');
});

test('a symlinked step is reported as unchecked rather than silently clean', t => {
  const root = fixture(t);
  const actual = put(root, 'data/actual.md', 'x\n'.repeat(251));
  mkdirSync(path.join(root, 'steps-c'));
  symlinkSync(actual, path.join(root, 'steps-c/linked.md'));
  const { exit, report } = check(root);
  assert.equal(exit, 2);
  assert.equal(report.status, 'INCOMPLETE');
  assert.equal(report.issues.length, 1);
});
