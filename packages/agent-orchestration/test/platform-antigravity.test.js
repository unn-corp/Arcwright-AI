import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs-extra';
import os from 'node:os';
import path from 'node:path';
import { execSync } from 'node:child_process';
import installer from './organization-fixture.js';

const { writeAntigravityConfig, resolveInstalledPath, preflightProjectManagedPaths, sha256 } = installer._internal;

const PKG_ROOT = path.resolve(__dirname, '..');
const REPO_ROOT = path.resolve(PKG_ROOT, '..', '..');
const SRC_DIR = installer.sourceDir;

// writeAntigravityConfig reads from the built src/ (gitignored). Build it once
// if missing so the suite is self-sufficient locally and in a fresh CI checkout.
beforeAll(() => {
  if (!fs.existsSync(SRC_DIR)) {
    execSync('node build/build.js', { cwd: REPO_ROOT, stdio: 'pipe' });
  }
}, 120000);

const chalk = new Proxy({}, { get: () => (s) => s });
const platform = 'linux-native';

let projectDir, homeDir;

beforeEach(() => {
  projectDir = fs.mkdtempSync(path.join(os.tmpdir(), 'arcw-agy-proj-'));
  homeDir = fs.mkdtempSync(path.join(os.tmpdir(), 'arcw-agy-home-'));
  vi.spyOn(console, 'log').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  fs.rmSync(projectDir, { recursive: true, force: true });
  fs.rmSync(homeDir, { recursive: true, force: true });
});

const homes = () => ({ linux: homeDir, windows: null });

describe('writeAntigravityConfig — project install', () => {
  it('adds one managed block to GEMINI.md and keeps user content', async () => {
    const geminiMd = path.join(projectDir, 'GEMINI.md');
    fs.writeFileSync(geminiMd, '# My project rules\n\nKeep this.\n');
    await writeAntigravityConfig(projectDir, ['awm'], chalk, false, homes(), platform);
    const first = fs.readFileSync(geminiMd, 'utf8');
    await writeAntigravityConfig(projectDir, ['awm'], chalk, false, homes(), platform);
    const second = fs.readFileSync(geminiMd, 'utf8');
    expect(second).toBe(first);
    expect(second).toContain('Keep this.');
    expect((second.match(/<!-- arcwright-agent-start -->/g) || []).length).toBe(1);
  });

  it('installs skills into the shared .agents/skills/ and never touches the home dir', async () => {
    const entries = await writeAntigravityConfig(projectDir, ['awm'], chalk, false, homes(), platform);
    expect(fs.existsSync(path.join(projectDir, '.agents', 'skills', 'triage', 'SKILL.md'))).toBe(true);
    expect(entries.length).toBeGreaterThan(0);
    expect(entries.every(e => e.relPath.startsWith('.agents/skills/'))).toBe(true);
    expect(fs.existsSync(path.join(homeDir, '.gemini'))).toBe(false);
  });

  it('refuses a project GEMINI.md that links outside the project', async () => {
    const outside = path.join(homeDir, 'shared-rules.md');
    fs.writeFileSync(outside, '# shared\n');
    fs.symlinkSync(outside, path.join(projectDir, 'GEMINI.md'));
    await expect(preflightProjectManagedPaths(projectDir)).rejects.toThrow(/GEMINI\.md resolves outside the project root/);
  });
});

describe('writeAntigravityConfig — global install', () => {
  it('writes ~/.gemini/GEMINI.md and ~/.gemini/config/skills/ with resolvable manifest entries', async () => {
    const entries = await writeAntigravityConfig(projectDir, ['awm'], chalk, true, homes(), platform);
    expect(fs.readFileSync(path.join(homeDir, '.gemini', 'GEMINI.md'), 'utf8')).toContain('<!-- arcwright-agent-start -->');
    expect(fs.existsSync(path.join(homeDir, '.gemini', 'config', 'skills', 'triage', 'SKILL.md'))).toBe(true);
    expect(fs.existsSync(path.join(homeDir, '.agents', 'skills'))).toBe(false);
    expect(entries.length).toBeGreaterThan(0);
    const context = { isGlobal: true, projectRoot: projectDir, effectiveArwDir: path.join(homeDir, '.arcwright'), homes: homes(), platform };
    for (const e of entries) {
      // Update/uninstall must map each manifest entry back to the file it wrote.
      const full = resolveInstalledPath(e.relPath, context);
      expect(full.startsWith(path.join(homeDir, '.gemini', 'config', 'skills') + path.sep)).toBe(true);
      expect(sha256(fs.readFileSync(full))).toBe(e.hash);
    }
  });

  it('preserves existing user skills and skills.json under ~/.gemini/config/', async () => {
    const own = path.join(homeDir, '.gemini', 'config', 'skills', 'my-skill', 'SKILL.md');
    const skillsJson = path.join(homeDir, '.gemini', 'config', 'skills.json');
    fs.ensureDirSync(path.dirname(own));
    fs.writeFileSync(own, '---\nname: my-skill\n---\n# Mine\n');
    fs.writeFileSync(skillsJson, '{"entries":[{"path":"/elsewhere"}]}\n');
    await writeAntigravityConfig(projectDir, ['awm'], chalk, true, homes(), platform);
    expect(fs.readFileSync(own, 'utf8')).toContain('# Mine');
    expect(fs.readFileSync(skillsJson, 'utf8')).toBe('{"entries":[{"path":"/elsewhere"}]}\n');
  });
});
