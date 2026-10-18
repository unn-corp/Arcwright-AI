import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const REPO = path.resolve(__dirname, '../../..');
const RENDERER = path.join(REPO, '.agents/skills/writing-skills/render-graphs.js');
const POLLUTER = path.join(REPO, '.agents/skills/systematic-debugging/find-polluter.sh');
const ARTIFACTS = '_arcwright/_memory/skill-runs';

function fixture(fn) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'arcw-output-boundary-'));
  const project = path.join(root, 'active project');
  const skill = path.join(root, 'installed/.agents/skills/demo-skill');
  const bin = path.join(root, 'bin');
  fs.mkdirSync(path.join(project, '_arcwright'), { recursive: true });
  fs.mkdirSync(skill, { recursive: true });
  fs.mkdirSync(bin);
  const markdown = '# Fixture\r\n```dot\r\ndigraph first { a -> b; }\r\n```\r\n\n```dot\ndigraph second { b -> c; }\n```\n';
  fs.writeFileSync(path.join(skill, 'SKILL.md'), markdown);
  fs.writeFileSync(path.join(bin, 'dot'), `#!/usr/bin/env node
if (process.argv.includes('-V')) process.exit(0);
require('node:fs').readFileSync(0, 'utf8');
process.stdout.write('<svg>controlled graph</svg>');
`, { mode: 0o755 });
  fs.writeFileSync(path.join(bin, 'npm'), '#!/bin/sh\nprintf called > "$POLLUTER_TEST_CALL"\n', { mode: 0o755 });
  const env = { ...process.env, PATH: `${bin}${path.delimiter}${process.env.PATH}`, POLLUTER_TEST_CALL: path.join(root, 'npm-called') };
  const render = (args = [], cwd = project) => spawnSync(process.execPath, [RENDERER, skill, ...args], { cwd, env, encoding: 'utf8' });
  const unchanged = () => {
    expect(fs.readdirSync(skill)).toEqual(['SKILL.md']);
    expect(fs.readFileSync(path.join(skill, 'SKILL.md'), 'utf8')).toBe(markdown);
  };
  try { fn({ root, project, skill, env, render, unchanged }); }
  finally { fs.rmSync(root, { recursive: true, force: true }); }
}

function filesBelow(root) {
  if (!fs.existsSync(root)) return [];
  return fs.readdirSync(root, { recursive: true, withFileTypes: true })
    .filter(entry => entry.isFile()).map(entry => path.join(entry.parentPath || entry.path, entry.name));
}

describe.skipIf(process.platform === 'win32')('Superpowers runtime output isolation', () => {
  it('renders LF/CRLF inputs under the active project without changing the installed skill', () => fixture(({ project, render, unchanged }) => {
    const result = render();
    expect(result.status, result.stderr).toBe(0);
    const files = filesBelow(path.join(project, ARTIFACTS));
    expect(files.filter(file => file.endsWith('.svg'))).toHaveLength(2);
    unchanged();
  }));

  it('honors an explicit project from another working directory and preserves combined sources', () => fixture(({ root, project, render, unchanged }) => {
    const result = render(['--project-root', project, '--combine'], root);
    expect(result.status, result.stderr).toBe(0);
    const files = filesBelow(path.join(project, ARTIFACTS));
    expect(files.filter(file => file.endsWith('.svg'))).toHaveLength(1);
    expect(files.filter(file => file.endsWith('.dot'))).toHaveLength(1);
    unchanged();
  }));

  it('accepts a scoped explicit output directory and refuses to overwrite its files', () => fixture(({ project, render, unchanged }) => {
    const output = path.join(project, ARTIFACTS, 'chosen run/diagrams');
    const first = render(['--output-dir', output]);
    expect(first.status, first.stderr).toBe(0);
    const second = render(['--output-dir', output]);
    expect(second.status).not.toBe(0);
    expect(fs.readFileSync(path.join(output, 'first.svg'), 'utf8')).toBe('<svg>controlled graph</svg>');
    unchanged();
  }));

  it('rejects an output directory inside an installed skill before creating files', () => fixture(({ skill, render, unchanged }) => {
    const result = render(['--output-dir', path.join(skill, 'diagrams')]);
    expect(result.status).not.toBe(0);
    unchanged();
  }));

  it('rejects traversal outside the Arcwright run directory', () => fixture(({ project, render, unchanged }) => {
    const result = render(['--output-dir', `${ARTIFACTS}/../../../../escaped`]);
    expect(result.status).not.toBe(0);
    expect(fs.existsSync(path.join(project, 'escaped'))).toBe(false);
    unchanged();
  }));

  it('rejects a symlinked Arcwright root without touching its target', () => fixture(({ root, project, render, unchanged }) => {
    const external = path.join(root, 'external');
    fs.mkdirSync(external);
    fs.rmSync(path.join(project, '_arcwright'), { recursive: true });
    fs.symlinkSync(external, path.join(project, '_arcwright'));
    const result = render();
    expect(result.status).not.toBe(0);
    expect(fs.readdirSync(external)).toEqual([]);
    unchanged();
  }));

  it('rejects symlinked output descendants and files', () => fixture(({ root, project, render, unchanged }) => {
    const base = path.join(project, ARTIFACTS);
    const external = path.join(root, 'external');
    fs.mkdirSync(base, { recursive: true });
    fs.mkdirSync(external);
    fs.symlinkSync(external, path.join(base, 'redirect'));
    expect(render(['--output-dir', path.join(base, 'redirect/nested')]).status).not.toBe(0);
    expect(fs.readdirSync(external)).toEqual([]);
    const output = path.join(base, 'safe');
    fs.mkdirSync(output);
    const sentinel = path.join(external, 'sentinel.svg');
    fs.writeFileSync(sentinel, 'preserve');
    fs.symlinkSync(sentinel, path.join(output, 'first.svg'));
    expect(render(['--output-dir', output]).status).not.toBe(0);
    expect(fs.readFileSync(sentinel, 'utf8')).toBe('preserve');
    unchanged();
  }));

  it('rejects an installed skill as the project root or implicit working root', () => fixture(({ skill, render, unchanged }) => {
    expect(render(['--project-root', skill]).status).not.toBe(0);
    expect(render([], skill).status).not.toBe(0);
    unchanged();
  }));

  it('refuses an implicit project inside an arbitrary cached skill', () => fixture(({ root, render, unchanged }) => {
    const cached = path.join(root, 'plugin-cache/another-skill');
    fs.mkdirSync(cached, { recursive: true });
    fs.writeFileSync(path.join(cached, 'SKILL.md'), '# Cached skill\n');
    expect(render([], cached).status).not.toBe(0);
    expect(fs.readdirSync(cached)).toEqual(['SKILL.md']);
    unchanged();
  }));

  it('creates the Arcwright run area for a new project', () => fixture(({ project, render, unchanged }) => {
    fs.rmSync(path.join(project, '_arcwright'), { recursive: true });
    const result = render(['--project-root', project]);
    expect(result.status, result.stderr).toBe(0);
    expect(filesBelow(path.join(project, ARTIFACTS))).toHaveLength(2);
    unchanged();
  }));

  it('does not infer an unrelated ancestor project when the working directory has no marker', () => fixture(({ root, project, render, unchanged }) => {
    fs.rmSync(path.join(project, '_arcwright'), { recursive: true });
    fs.mkdirSync(path.join(root, '_arcwright'));
    const result = render();
    expect(result.status).not.toBe(0);
    expect(fs.readdirSync(path.join(root, '_arcwright'))).toEqual([]);
    expect(fs.readdirSync(project)).toEqual([]);
    unchanged();
  }));

  it('creates a distinct run on repeated default rendering', () => fixture(({ project, render, unchanged }) => {
    expect(render().status).toBe(0);
    expect(render().status).toBe(0);
    expect(fs.readdirSync(path.join(project, ARTIFACTS))).toHaveLength(2);
    unchanged();
  }));

  it('refuses to execute polluter tests from the skill installation directory', () => fixture(({ skill, env }) => {
    fs.mkdirSync(path.join(skill, 'src'));
    fs.writeFileSync(path.join(skill, 'src/example.test.ts'), 'fixture');
    const result = spawnSync('bash', [POLLUTER, 'unexpected', 'src/**/*.test.ts'], { cwd: skill, env, encoding: 'utf8' });
    expect(result.status).not.toBe(0);
    expect(fs.existsSync(env.POLLUTER_TEST_CALL)).toBe(false);
  }));

  it('also refuses a cached skill with no host-specific directory name', () => fixture(({ root, env }) => {
    const cached = path.join(root, 'plugin-cache/debugger');
    fs.mkdirSync(path.join(cached, 'src'), { recursive: true });
    fs.writeFileSync(path.join(cached, 'SKILL.md'), '# Cached skill\n');
    fs.writeFileSync(path.join(cached, 'src/example.test.ts'), 'fixture');
    const result = spawnSync('bash', [POLLUTER, 'unexpected', 'src/**/*.test.ts'], { cwd: cached, env, encoding: 'utf8' });
    expect(result.status).not.toBe(0);
    expect(fs.existsSync(env.POLLUTER_TEST_CALL)).toBe(false);
  }));
});
