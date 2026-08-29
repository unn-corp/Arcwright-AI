'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const test = require('node:test');

const {
  buildPosixAliasBlock,
  buildPowerShellAliasBlock,
  quoteForPosixShell,
  quoteForPowerShell,
} = require('../lib/shell-quoting');

const availableShell = (shell) => spawnSync(shell, ['-fc', ':']).error === undefined;

function runAlias(shell, aliasName, projectRoot) {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'arcwright-tmux-quote-'));
  const logPath = path.join(tempDir, 'tmux-args');
  const fakeTmuxPath = path.join(tempDir, 'tmux');
  fs.writeFileSync(
    fakeTmuxPath,
    '#!/bin/sh\nprintf "%s\\n" "$@" > "$TMUX_LOG"\n',
    { mode: 0o755 },
  );

  const shellSetup = shell === 'bash' ? 'shopt -s expand_aliases' : 'setopt aliases';
  // eval reparses the command after the alias definition; zsh otherwise
  // lexes the whole -c script before the alias is available.
  const script = `${shellSetup}\n${buildPosixAliasBlock(projectRoot)}\neval '${aliasName}'\n`;
  try {
    const result = spawnSync(shell, ['-fc', script], {
      encoding: 'utf8',
      env: {
        ...process.env,
        PATH: `${tempDir}${path.delimiter}${process.env.PATH || ''}`,
        TMUX_LOG: logPath,
      },
    });
    assert.equal(result.error, undefined, `${shell} failed to start`);
    assert.equal(result.status, 0, `${shell} stderr: ${result.stderr}`);
    return fs.readFileSync(logPath, 'utf8').trimEnd().split('\n');
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

test('POSIX serializer escapes apostrophes and preserves shell metacharacters as data', () => {
  assert.equal(quoteForPosixShell("/tmp/it's;$(touch injected)"), "'/tmp/it'\\''s;$(touch injected)'");
});

test('PowerShell serializer uses its own single-quote escaping', () => {
  const root = "C:\\work\\it's;$(touch injected)`\"";
  assert.equal(quoteForPowerShell(root), "'C:\\work\\it''s;$(touch injected)`\"'");
  const block = buildPowerShellAliasBlock(root, 'Ubuntu;$(whoami)');
  assert.ok(block.includes(`--cd ${quoteForPowerShell(root)}`));
  assert.ok(block.includes(`wsl -d ${quoteForPowerShell('Ubuntu;$(whoami)')}`));
});

test('control characters are rejected for both startup-file formats', () => {
  assert.throws(() => buildPosixAliasBlock('/tmp/project\nmalicious'), /control characters/);
  assert.throws(() => buildPosixAliasBlock('/tmp/project\rmalicious'), /control characters/);
  assert.throws(() => buildPowerShellAliasBlock('C:\\project\nmalicious'), /control characters/);
});

for (const shell of ['bash', 'zsh']) {
  test(`${shell} aliases preserve a quoted path without executing injected text`, { skip: !availableShell(shell) }, () => {
    const sentinel = path.join(os.tmpdir(), `arcwright-tmux-injected-${shell}-${process.pid}`);
    const projectRoot = `/tmp/project'; touch ${sentinel}; $(touch ${sentinel}); #`;
    try {
      assert.deepEqual(runAlias(shell, 'tmux-ai', projectRoot), [
        'new-session',
        '-c',
        projectRoot,
      ]);
      assert.deepEqual(runAlias(shell, 'tmux-claude', projectRoot), [
        'new-session',
        '-c',
        projectRoot,
        'claude --dangerously-skip-permissions',
      ]);
      assert.equal(fs.existsSync(sentinel), false);
    } finally {
      fs.rmSync(sentinel, { force: true });
    }
  });
}
