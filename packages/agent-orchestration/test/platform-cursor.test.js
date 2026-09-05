import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs-extra';
import os from 'node:os';
import path from 'node:path';
import { execSync } from 'node:child_process';
import installer from '../lib/installer.js';

const { writeCursorConfig, sha256 } = installer._internal;
const PKG_ROOT = path.resolve(__dirname, '..');
const REPO_ROOT = path.resolve(PKG_ROOT, '..', '..');
const SRC_DIR = path.join(PKG_ROOT, 'src');
const chalk = new Proxy({}, { get: () => (s) => s });
const platform = 'linux-native';

beforeAll(() => {
  if (!fs.existsSync(SRC_DIR)) {
    execSync('node build/build.js', { cwd: REPO_ROOT, stdio: 'pipe' });
  }
}, 120000);

let projectDir, homeDir;
beforeEach(() => {
  projectDir = fs.mkdtempSync(path.join(os.tmpdir(), 'arcw-cursor-proj-'));
  homeDir = fs.mkdtempSync(path.join(os.tmpdir(), 'arcw-cursor-home-'));
  vi.spyOn(console, 'log').mockImplementation(() => {});
});
afterEach(() => {
  vi.restoreAllMocks();
  fs.rmSync(projectDir, { recursive: true, force: true });
  fs.rmSync(homeDir, { recursive: true, force: true });
});

const homes = () => ({ linux: homeDir, windows: null });

describe('writeCursorConfig — project install', () => {
  it('writes native Cursor rules, commands, and AGENTS.md', async () => {
    const entries = await writeCursorConfig(projectDir, ['awm', 'core'], chalk, false, homes(), platform);
    const rule = path.join(projectDir, '.cursor', 'rules', 'arcwright.mdc');
    const command = path.join(projectDir, '.cursor', 'commands', 'triage.md');
    expect(fs.existsSync(rule)).toBe(true);
    expect(fs.readFileSync(rule, 'utf8')).toContain('alwaysApply: true');
    expect(fs.existsSync(command)).toBe(true);
    expect(fs.readFileSync(command, 'utf8')).not.toMatch(/^---/);
    expect(fs.readFileSync(command, 'utf8')).toContain("the user's command input");
    expect(fs.readFileSync(path.join(projectDir, 'AGENTS.md'), 'utf8')).toContain('<!-- arcwright-agent-start -->');
    for (const entry of entries) {
      expect(sha256(fs.readFileSync(path.join(projectDir, entry.relPath)))).toBe(entry.hash);
    }
  });

  it('preserves user content in AGENTS.md and does not install opted-out commands', async () => {
    fs.writeFileSync(path.join(projectDir, 'AGENTS.md'), '# User instructions\n');
    await writeCursorConfig(projectDir, ['awm'], chalk, false, homes(), platform, false, false, false, false, false, false, false);
    expect(fs.readFileSync(path.join(projectDir, 'AGENTS.md'), 'utf8')).toContain('# User instructions');
    expect(fs.existsSync(path.join(projectDir, '.cursor', 'commands', 'team.md'))).toBe(false);
  });

  it('installs idempotent Unnamed MCP lifecycle hooks when the module is enabled', async () => {
    const args = [projectDir, ['awm'], chalk, false, homes(), platform, true, false, false, true];
    const first = await writeCursorConfig(...args);
    const second = await writeCursorConfig(...args);
    const hooks = await fs.readJson(path.join(projectDir, '.cursor', 'hooks.json'));
    const script = path.join(projectDir, '.cursor', 'hooks', 'unnamed-dev-context.js');

    expect(fs.existsSync(script)).toBe(true);
    expect(hooks.version).toBe(1);
    expect(hooks.hooks.sessionStart).toHaveLength(1);
    expect(hooks.hooks.beforeSubmitPrompt).toBeUndefined();
    expect(hooks.hooks.afterFileEdit).toBeUndefined();
    expect(hooks.hooks.stop).toBeUndefined();
    expect(first.filter((entry) => entry.relPath === '.cursor/hooks.json')).toHaveLength(1);
    expect(second.filter((entry) => entry.relPath === '.cursor/hooks.json')).toHaveLength(1);
  });

  it('removes a legacy managed stop hook while preserving foreign stop hooks', async () => {
    const hooksPath = path.join(projectDir, '.cursor', 'hooks.json');
    fs.ensureDirSync(path.dirname(hooksPath));
    fs.writeFileSync(hooksPath, JSON.stringify({
      hooks: {
        stop: [
          { command: '.cursor/hooks/unnamed-dev-context.js --harness=cursor', loop_limit: 1 },
          { command: 'user-owned-stop-hook' },
        ],
      },
    }));

    await writeCursorConfig(projectDir, ['awm'], chalk, false, homes(), platform, true, false, false, true);

    const hooks = await fs.readJson(hooksPath);
    expect(hooks.hooks.stop).toEqual([{ command: 'user-owned-stop-hook' }]);
  });

  it('preserves a malformed user hook configuration', async () => {
    const hooksPath = path.join(projectDir, '.cursor', 'hooks.json');
    const malformed = '{ "preserve": true,';
    fs.ensureDirSync(path.dirname(hooksPath));
    fs.writeFileSync(hooksPath, malformed);

    const entries = await writeCursorConfig(
      projectDir, ['awm'], chalk, false, homes(), platform, true, false, false, true
    );

    expect(fs.readFileSync(hooksPath, 'utf8')).toBe(malformed);
    expect(fs.existsSync(path.join(projectDir, '.cursor', 'hooks', 'unnamed-dev-context.js'))).toBe(false);
    expect(entries.some((entry) => entry.relPath === '.cursor/hooks.json')).toBe(false);
  });
});

describe('writeCursorConfig — global install', () => {
  it('stages a paste-ready User Rules file without inventing a global rules directory', async () => {
    const entries = await writeCursorConfig(projectDir, ['awm'], chalk, true, homes(), platform);
    const userRules = path.join(homeDir, '.cursor', 'arcwright-user-rules.md');
    expect(fs.existsSync(userRules)).toBe(true);
    expect(fs.readFileSync(userRules, 'utf8')).toContain('# Arcwright');
    expect(fs.existsSync(path.join(homeDir, '.cursor', 'rules'))).toBe(false);
    expect(entries).toEqual([{ relPath: '.cursor/arcwright-user-rules.md', hash: sha256(fs.readFileSync(userRules)) }]);
  });
});
