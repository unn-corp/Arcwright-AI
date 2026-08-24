import { describe, it, expect } from 'vitest';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

// The guard hooks are standalone, dependency-free scripts that Claude Code runs
// as PreToolUse commands: stdin carries the tool payload, exit 2 means "deny".
// They are BLOCKING security gates shipped to every user, so behaviour is
// pinned here rather than only asserting the files were copied.
const HOOKS = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  'lib',
  'templates',
  'hooks'
);

/** Run a guard with a tool payload; returns the process exit code. */
function runGuard(script, toolInput) {
  const r = spawnSync(process.execPath, [path.join(HOOKS, script)], {
    input: JSON.stringify({ tool_input: toolInput }),
    encoding: 'utf8',
  });
  return r.status;
}

const bash = (command) => runGuard('guard-bash.js', { command });
const DENY = 2;
const ALLOW = 0;

// Credential-shaped fixtures, assembled from fragments so the literals never
// appear in a diff. Written out whole, a test for a secret scanner trips the
// commit-time secret gate — correctly, since it cannot tell a fixture from the
// real thing. The guards under test still receive the full string at runtime.
const PEM_HEADER = ['-----BEGIN RSA', 'PRIVATE', 'KEY-----'].join(' ');
const AWS_KEY_ID = 'AKIA' + '3XQ7NPWZ2VLMRT4D';

describe('guard-bash: destructive command guard', () => {
  // Every one of these except `rm -rf /` slipped past the original
  // `/\brm\s+-rf?\s+(\/|~|\$HOME)(\s|$)/` pattern — trailing globs and slashes
  // defeated the `(\s|$)` anchor, and reordered/separated flags defeated `-rf?`.
  it.each([
    ['rm -rf /'],
    ['rm -rf "/"'],
    ['rm -rf "$HOME"'],
    ["rm -rf '$HOME'"],
    ['rm -rf /*'],
    ['rm -fr /'],
    ['rm -rf ~'],
    ['rm -rf ~/'],
    ['rm -rf $HOME/'],
    ['rm -rf ${HOME}'],
    ['rm -r -f /'],
    ['rm --recursive --force /'],
    ['sudo rm -rf /'],
    ['rm -rf --no-preserve-root /'],
    ['ls && rm -rf /'],
  ])('denies %j', (cmd) => {
    expect(bash(cmd)).toBe(DENY);
  });

  it.each([
    ['rm -rf ./build'],
    ['rm -rf node_modules'],
    ['rm -rf dist/'],
    ['rm -rf /tmp/scratch'],
    ['rm file.txt'],
    ['rm -rf "$BUILD_DIR"'],
    ['git push origin dev'],
    // Merely naming a dangerous command in quoted text, a comment, or a
    // here-document fixture must not trip the guard.
    ['echo "rm -rf /"'],
    ['# rm -rf /'],
    ['echo ok # rm -rf /'],
    ["cat <<'EOF'\nrm -rf /\nEOF"],
    ["cat <<'EOF'\ngit push --force origin main\nEOF"],
  ])('allows %j', (cmd) => {
    expect(bash(cmd)).toBe(ALLOW);
  });

  it('denies a force-push to a protected branch, either argument order', () => {
    expect(bash('git push --force origin main')).toBe(DENY);
    expect(bash('git push -f origin master')).toBe(DENY);
    expect(bash('git push origin main --force')).toBe(DENY);
  });

  // git accepts global options BEFORE the subcommand, so `\bgit\s+push\b` does
  // not match a real push spelled `git -C <dir> push`. `-C` is the ordinary way
  // to act on a subdirectory, so this was reachable in normal use, not just
  // adversarially.
  it('sees the push through git global options', () => {
    expect(bash('git -C /repo push --force origin main')).toBe(DENY);
    expect(bash('git -c protocol.version=2 push --force origin main')).toBe(DENY);
    expect(bash('git --no-pager push --force origin master')).toBe(DENY);
    expect(bash('git -C /r push origin main --force')).toBe(DENY);
  });

  it('does not over-match: global options on a safe push stay allowed', () => {
    expect(bash('git -C /repo push origin dev')).toBe(ALLOW);
    expect(bash('git -C /r push --force origin feature-x')).toBe(ALLOW);
  });

  it('allows --force-with-lease, which is the safe force-push variant', () => {
    expect(bash('git push --force-with-lease origin main')).toBe(ALLOW);
  });

  it('denies other high-confidence destructive patterns', () => {
    expect(bash('chmod -R 777 /etc')).toBe(DENY);
    expect(bash('git reset --hard origin/main')).toBe(DENY);
    expect(bash('dd if=/dev/zero of=/dev/sda')).toBe(DENY);
  });
});

describe('guard-write: secret/key-file write guard', () => {
  const write = (file_path, content = '') =>
    runGuard('guard-write.js', { file_path, content });

  it('denies writes to key material and credential files', () => {
    expect(write('.env')).toBe(DENY);
    expect(write('config/prod.env')).toBe(DENY);
    expect(write('certs/server.pem')).toBe(DENY);
    expect(write('/home/u/.ssh/id_ed25519')).toBe(DENY);
    expect(write('.npmrc')).toBe(DENY);
  });

  it('denies ordinary files whose content carries a real credential', () => {
    expect(write('notes.md', PEM_HEADER)).toBe(DENY);
    expect(write('setup.md', `aws key ${AWS_KEY_ID} here`)).toBe(DENY);
  });

  it('allows ordinary source files', () => {
    expect(write('src/index.ts', 'export const x = 1;')).toBe(ALLOW);
    expect(write('README.md', 'Set AWS_ACCESS_KEY_ID in your shell.')).toBe(ALLOW);
  });

  it('blocks both dotenv spellings', () => {
    expect(write('.env.production')).toBe(DENY);
    expect(write('config/prod.env')).toBe(DENY); // `<name>.env`, previously missed
    // …without catching files that merely start with "env".
    expect(write('src/environment.ts', 'export {}')).toBe(ALLOW);
    expect(write('src/env.d.ts', 'export {}')).toBe(ALLOW);
  });

  // The `Write|Edit` matcher is a regex, so MultiEdit and NotebookEdit also
  // reach this hook — but they carry the new text under different keys, and
  // reading only content/new_string skipped the content scan for them.
  it('scans the content of every payload shape the matcher selects', () => {
    const KEY = PEM_HEADER;
    expect(runGuard('guard-write.js', { file_path: 'a.md', content: KEY })).toBe(DENY);
    expect(runGuard('guard-write.js', { file_path: 'a.md', new_string: KEY })).toBe(DENY);
    expect(
      runGuard('guard-write.js', {
        file_path: 'a.md',
        edits: [{ old_string: 'x', new_string: KEY }],
      })
    ).toBe(DENY);
    expect(runGuard('guard-write.js', { notebook_path: 'a.ipynb', new_source: KEY })).toBe(DENY);
  });
});
