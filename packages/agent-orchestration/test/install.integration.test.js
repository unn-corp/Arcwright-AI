import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs-extra';
import os from 'node:os';
import path from 'node:path';
import { execSync } from 'node:child_process';
import installer from '../lib/installer.js';

const { install } = installer;
const { readManifest } = installer._internal;

const PKG_ROOT = path.resolve(__dirname, '..');
const REPO_ROOT = path.resolve(PKG_ROOT, '..', '..');
const SRC_DIR = path.join(PKG_ROOT, 'src');

// install() reads from the built src/ (gitignored). Build it once if missing so
// the suite is self-sufficient locally and in a fresh CI checkout.
beforeAll(() => {
  if (!fs.existsSync(SRC_DIR)) {
    execSync('node build/build.js', { cwd: REPO_ROOT, stdio: 'pipe' });
  }
}, 120000);

let projectDir, homeDir, savedHome, savedNoOpen;

beforeEach(() => {
  projectDir = fs.mkdtempSync(path.join(os.tmpdir(), 'arcw-proj-'));
  homeDir = fs.mkdtempSync(path.join(os.tmpdir(), 'arcw-home-'));
  // Redirect every home-directed write (global CLAUDE.md, ~/.arcwright, shell rc)
  // into a throwaway HOME so the real environment is never touched.
  savedHome = process.env.HOME;
  process.env.HOME = homeDir;
  savedNoOpen = process.env.ARCWRIGHT_NO_OPEN;
  process.env.ARCWRIGHT_NO_OPEN = '1'; // never spawn a browser
  // install() is very chatty; silence stdout to keep test output readable.
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  if (savedHome === undefined) delete process.env.HOME; else process.env.HOME = savedHome;
  if (savedNoOpen === undefined) delete process.env.ARCWRIGHT_NO_OPEN; else process.env.ARCWRIGHT_NO_OPEN = savedNoOpen;
  fs.rmSync(projectDir, { recursive: true, force: true });
  fs.rmSync(homeDir, { recursive: true, force: true });
});

// Baseline opts that keep an install fully contained (no tmux/launchers/browser).
const baseOpts = (over = {}) => ({
  directory: projectDir,
  yes: true,
  tools: 'claude-code',
  modules: 'awm,core',
  tmux: false,
  modelLaunchers: false,
  ...over,
});

describe('install() — fresh project install', () => {
  it('creates _arcwright, a manifest, and Claude Code assets', async () => {
    await install(baseOpts());

    const arwDir = path.join(projectDir, '_arcwright');
    expect(fs.existsSync(arwDir)).toBe(true);
    expect(fs.existsSync(path.join(arwDir, 'awm'))).toBe(true);
    expect(fs.existsSync(path.join(arwDir, 'core'))).toBe(true);

    const manifest = await readManifest(arwDir);
    expect(manifest).toBeTruthy();
    expect(manifest.global).toBe(false);
    expect(manifest.tools).toEqual(['claude-code']);
    expect(manifest.modules).toEqual(expect.arrayContaining(['awm', 'core']));
    expect(typeof manifest.version).toBe('string');

    // Claude Code assets + settings land in the project.
    expect(fs.existsSync(path.join(projectDir, '.claude'))).toBe(true);
    const settings = await fs.readJson(path.join(projectDir, '.claude', 'settings.json'));
    expect(settings.env.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS).toBe('1');
  }, 60000);

  it('writes a managed Arcwright block into .gitignore (output-only default)', async () => {
    await install(baseOpts());
    const gi = await fs.readFile(path.join(projectDir, '.gitignore'), 'utf8');
    expect(gi).toMatch(/Arcwright installation/);
    expect(gi).toMatch(/_arcwright-output\//);
  }, 60000);

  it('isolates home-directed writes into the throwaway HOME, not the real one', async () => {
    await install(baseOpts());
    // Project install applies the global rules file under the redirected HOME.
    expect(fs.existsSync(path.join(homeDir, '.claude', 'CLAUDE.md'))).toBe(true);
  }, 60000);
});

describe('install() — flag handling', () => {
  it('--no-teams is recorded in the manifest', async () => {
    await install(baseOpts({ teams: false }));
    const manifest = await readManifest(path.join(projectDir, '_arcwright'));
    expect(manifest.teams).toBe(false);
  }, 60000);

  it('hooks: "safe" seeds guard hooks + settings posture', async () => {
    await install(baseOpts({ hooks: 'safe' }));
    const manifest = await readManifest(path.join(projectDir, '_arcwright'));
    expect(manifest.hooks).toBe('safe');
    const settings = await fs.readJson(path.join(projectDir, '.claude', 'settings.json'));
    expect(settings.permissions.defaultMode).toBe('acceptEdits');
    expect(settings.hooks.PreToolUse.some((g) => g.hooks.some((h) => h.command.includes('arcwright-hooks')))).toBe(true);
    expect(fs.existsSync(path.join(projectDir, '.claude', 'arcwright-hooks', 'guard-bash.js'))).toBe(true);
  }, 60000);
});

describe('install() — update / idempotency', () => {
  it('a second install preserves installDate and is an update', async () => {
    await install(baseOpts());
    const first = await readManifest(path.join(projectDir, '_arcwright'));

    await install(baseOpts({ action: 'update' }));
    const second = await readManifest(path.join(projectDir, '_arcwright'));

    expect(second.installDate).toBe(first.installDate); // preserved across runs
    expect(fs.existsSync(path.join(projectDir, '_arcwright', 'awm'))).toBe(true);
  }, 90000);
});

describe('install() — bmad migration', () => {
  it('detects a _bmad install and records migratedAt', async () => {
    // Minimal legacy bmad signal.
    fs.mkdirpSync(path.join(projectDir, '_bmad'));
    fs.writeFileSync(path.join(projectDir, '_bmad', 'marker.txt'), 'legacy');

    await install(baseOpts({ migrateBmad: true }));

    const manifest = await readManifest(path.join(projectDir, '_arcwright'));
    expect(typeof manifest.migratedAt).toBe('string');
  }, 60000);
});

describe('install() — global install', () => {
  it('installs to ~/.arcwright (redirected HOME) with global=true', async () => {
    await install(baseOpts({ global: true, directory: projectDir }));
    const globalArw = path.join(homeDir, '.arcwright');
    const manifest = await readManifest(globalArw);
    expect(manifest).toBeTruthy();
    expect(manifest.global).toBe(true);
    expect(fs.existsSync(path.join(homeDir, '.claude'))).toBe(true);
  }, 60000);
});
