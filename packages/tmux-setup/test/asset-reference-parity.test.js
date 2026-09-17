'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const PACKAGE_ROOT = path.join(__dirname, '..');
const TMUX_SOURCE_ROOT = path.join(PACKAGE_ROOT, 'src', 'tmux');
const INSTALLER_PATH = path.join(PACKAGE_ROOT, 'lib', 'installer.js');
const INSTALLER_SOURCE = fs.readFileSync(INSTALLER_PATH, 'utf8');
const TEST_HOME = path.join(os.tmpdir(), 'tmux-asset-reference-parity-home');

function extractFileMap() {
  const mapBody = INSTALLER_SOURCE.match(/const FILE_MAP = \[(.*?)\n  \];/s)?.[1];
  assert.ok(mapBody, 'installer FILE_MAP must remain discoverable for parity checks');

  const map = new Map([
    ['tmux.conf', path.join(TEST_HOME, '.tmux.conf')],
    ['colors.conf', path.join(TEST_HOME, '.config', 'tmux', 'colors.conf')],
  ]);

  for (const match of mapBody.matchAll(
    /\['([^']+)',\s+path\.join\(tmuxBin,\s*'([^']+)'\)\]/g,
  )) {
    map.set(match[1], path.join(TEST_HOME, '.config', 'tmux', 'bin', match[2]));
  }

  return map;
}

function extractRuntimeReferences() {
  const sourceFiles = ['tmux.conf', 'actions_popup.py', 'actions_popup.sh', 'dispatch.sh'];
  const references = [];
  const referencePattern = /~\/(?:\.tmux\.conf|\.config\/tmux\/(?:bin\/)?[A-Za-z0-9_.-]+)/g;

  for (const sourceFile of sourceFiles) {
    const source = fs.readFileSync(path.join(TMUX_SOURCE_ROOT, sourceFile), 'utf8');
    for (const match of source.matchAll(referencePattern)) {
      references.push({ sourceFile, reference: match[0] });
    }
  }

  return references;
}

function expandRuntimeReference(reference) {
  return path.join(TEST_HOME, reference.slice(2));
}

test('all runtime tmux asset references are covered by FILE_MAP outputs', () => {
  const fileMap = extractFileMap();
  const missing = extractRuntimeReferences().filter(({ reference }) => {
    const runtimePath = expandRuntimeReference(reference);
    return ![...fileMap.values()].includes(runtimePath);
  });

  assert.deepEqual(missing, [], `unmapped tmux runtime references: ${JSON.stringify(missing)}`);
});

test('every FILE_MAP source asset exists', () => {
  const fileMap = extractFileMap();
  const missing = [...fileMap.keys()].filter((sourceFile) => {
    return !fs.existsSync(path.join(TMUX_SOURCE_ROOT, sourceFile));
  });

  assert.deepEqual(missing, [], `FILE_MAP entries without source assets: ${JSON.stringify(missing)}`);
});

test('open_path passes untrusted clicked text only as a quoted opener argument', () => {
  const source = fs.readFileSync(path.join(TMUX_SOURCE_ROOT, 'open_path.sh'), 'utf8');

  assert.match(source, /wslview "\$t"/);
  assert.doesNotMatch(source, /powershell(?:\.exe)?[^\n]*-(?:Command|EncodedCommand)/i);
  assert.doesNotMatch(source, /(?:eval|bash\s+-c|sh\s+-c)[^\n]*\$t/);
});
