import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs-extra';
import os from 'node:os';
import path from 'node:path';
import { execSync } from 'node:child_process';
import installer from '../lib/installer.js';

const { install, uninstall } = installer;
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

let projectDir, homeDir, savedHome;

beforeEach(() => {
  projectDir = fs.mkdtempSync(path.join(os.tmpdir(), 'arcw-proj-'));
  homeDir = fs.mkdtempSync(path.join(os.tmpdir(), 'arcw-home-'));
  // Redirect every home-directed write (global CLAUDE.md, ~/.arcwright, shell rc)
  // into a throwaway HOME so the real environment is never touched.
  savedHome = process.env.HOME;
  process.env.HOME = homeDir;
  // install() is very chatty; silence stdout to keep test output readable.
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  if (savedHome === undefined) delete process.env.HOME; else process.env.HOME = savedHome;
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

  it('preserves module-specific config keys instead of overwriting them', async () => {
    await install(baseOpts());
    const cfg = await fs.readFile(
      path.join(projectDir, '_arcwright', 'awm', 'config.yaml'),
      'utf8'
    );
    // buildModuleConfig() only knows the generic keys. AWM ships six more that
    // its workflows resolve directly (`{planning_artifacts}`, `{{project_name}}`
    // and friends, used across ~170 files). Overwriting rather than merging
    // dropped all six on every fresh install.
    for (const key of [
      'project_name',
      'user_skill_level',
      'planning_artifacts',
      'implementation_artifacts',
      'project_knowledge',
      'mcp_standards',
    ]) {
      expect(cfg).toMatch(new RegExp(`^${key}:`, 'm'));
    }
    // ...and the generated keys are still applied on top.
    expect(cfg).toMatch(/^user_name:/m);
    expect(cfg).toMatch(/^awm_output_folder:/m);
  }, 60000);

  it('retargets shipped artifact paths at a custom --output-folder', async () => {
    await install(baseOpts({ outputFolder: '.arcout' }));
    const cfg = await fs.readFile(
      path.join(projectDir, '_arcwright', 'awm', 'config.yaml'),
      'utf8'
    );
    // The shipped values hardcode _arcwright-output; preserving them verbatim
    // would point artifacts at a folder the user opted out of.
    expect(cfg).toMatch(/planning_artifacts:.*\.arcout\/planning-artifacts/);
    expect(cfg).not.toMatch(/_arcwright-output/);
  }, 60000);

  it('uninstall leaves no Arcwright content behind', async () => {
    await install(baseOpts({ tools: 'cursor,codex', awsInfra: true }));

    const agentsMd = path.join(projectDir, 'AGENTS.md');
    const cursorRule = path.join(projectDir, '.cursor', 'rules', 'arcwright.mdc');
    expect(await fs.readFile(agentsMd, 'utf8')).toMatch(/arcwright-agent-start/);
    expect(fs.existsSync(cursorRule)).toBe(true);
    expect(fs.existsSync(path.join(projectDir, '_arcwright', 'aws-infra'))).toBe(true);

    await uninstall({ directory: projectDir, yes: true });

    // AGENTS.md is where Codex/OpenCode/Grok/Hermes/Cursor get their block, but
    // uninstall only knew about CLAUDE.md — leaving "To update Arcwright: npx …"
    // in the user's file permanently.
    expect(await fs.readFile(agentsMd, 'utf8')).not.toMatch(/arcwright-/);
    // Owned outright by the installer and marked alwaysApply, so an orphan kept
    // injecting Arcwright guidance into every Cursor session post-uninstall.
    expect(fs.existsSync(cursorRule)).toBe(false);
    // Module removal was a hardcoded four, so optional modules survived.
    expect(fs.existsSync(path.join(projectDir, '_arcwright', 'aws-infra'))).toBe(false);
  }, 90000);

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

  it('update --yes restores modules from the manifest instead of the CLI default', async () => {
    await install(baseOpts()); // modules: 'awm,core' — no awb
    // Commander always passes the default when the flag is omitted.
    await install(baseOpts({ action: 'update', modules: 'awm,awb,core,_memory' }));

    const manifest = await readManifest(path.join(projectDir, '_arcwright'));
    expect(manifest.modules).toEqual(expect.arrayContaining(['awm', 'core']));
    expect(manifest.modules).not.toContain('awb');
    expect(fs.existsSync(path.join(projectDir, '_arcwright', 'awb'))).toBe(false);
  }, 90000);

  it('update --yes still honors an explicit non-default --modules value', async () => {
    await install(baseOpts()); // modules: 'awm,core'
    await install(baseOpts({ action: 'update', modules: 'awm,awb,core' }));

    const manifest = await readManifest(path.join(projectDir, '_arcwright'));
    expect(manifest.modules).toContain('awb');
    expect(fs.existsSync(path.join(projectDir, '_arcwright', 'awb'))).toBe(true);
  }, 90000);

  it('repeated updates leave CLAUDE.md managed blocks intact (no marker loss or duplication)', async () => {
    await install(baseOpts());
    const claudeMd = path.join(projectDir, 'CLAUDE.md');
    const first = await fs.readFile(claudeMd, 'utf8');

    await install(baseOpts({ action: 'update' }));
    await install(baseOpts({ action: 'update' }));
    const third = await fs.readFile(claudeMd, 'utf8');

    expect(third).toBe(first);
    const count = (s, needle) => s.split(needle).length - 1;
    for (const marker of [
      '<!-- arcwright-agent-start -->', '<!-- arcwright-agent-end -->',
      '<!-- arcwright-orchestration-start -->', '<!-- arcwright-orchestration-end -->',
      '<!-- arcwright-proactive-start -->', '<!-- arcwright-proactive-end -->',
    ]) {
      expect(count(third, marker)).toBe(1);
    }
  }, 120000);
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

  it('writes the Claude rules file to the global ~/.claude dir, not the cwd project', async () => {
    await install(baseOpts({ global: true, directory: projectDir }));
    expect(fs.existsSync(path.join(homeDir, '.claude', 'CLAUDE.md'))).toBe(true);
    // Pre-fix, --global fell back to <cwd>/.claude/CLAUDE.md and littered the
    // directory the user happened to run from.
    expect(fs.existsSync(path.join(projectDir, '.claude', 'CLAUDE.md'))).toBe(false);
  }, 60000);

  it('writes settings.json to every Claude config home, not just ~/.claude', async () => {
    // Users run several Claude accounts from one machine via CLAUDE_CONFIG_DIR
    // and commonly symlink agents/commands/skills back to ~/.claude — but
    // settings.json is per-profile and cannot be symlinked that way. Pre-fix,
    // only ~/.claude got the agent-teams env var and the guard hooks, so
    // SendMessage agent reuse silently stayed off in the sibling profiles.
    const profiles = ['.claude-alt', '.claude-work'];
    for (const p of profiles) fs.mkdirSync(path.join(homeDir, p), { recursive: true });

    await install(baseOpts({ global: true, directory: projectDir, hooks: 'safe' }));

    for (const p of ['.claude', ...profiles]) {
      const settingsPath = path.join(homeDir, p, 'settings.json');
      expect(fs.existsSync(settingsPath), `${p}/settings.json missing`).toBe(true);
      const s = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
      expect(s.env.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS, `${p} agent teams`).toBe('1');
      expect(s.permissions.defaultMode, `${p} permission mode`).toBe('acceptEdits');
      // Guards are referenced by absolute path inside that profile's own dir.
      const guards = JSON.stringify(s.hooks.PreToolUse);
      expect(guards).toContain(path.join(homeDir, p, 'arcwright-hooks', 'guard-bash.js'));
      expect(fs.existsSync(path.join(homeDir, p, 'arcwright-hooks', 'guard-write.js'))).toBe(true);
    }
  }, 60000);

  it('does not invent Claude profile dirs that the user never created', async () => {
    await install(baseOpts({ global: true, directory: projectDir }));
    expect(fs.existsSync(path.join(homeDir, '.claude-alt'))).toBe(false);
  }, 60000);

  it.each([
    ['project', false],
    ['global', true],
  ])('applies %s TOML customization to the module config', async (_label, global) => {
    const customDir = global
      ? path.join(homeDir, '.arcwright', 'custom')
      : path.join(projectDir, '_arcwright', 'custom');
    fs.mkdirpSync(customDir);
    fs.writeFileSync(path.join(customDir, 'awm.toml'), 'user_name = "Configured Agent"\n');

    await install(baseOpts({ global }));

    const configPath = global
      ? path.join(homeDir, '.arcwright', 'awm', 'config.yaml')
      : path.join(projectDir, '_arcwright', 'awm', 'config.yaml');
    const config = await fs.readFile(configPath, 'utf8');
    expect(config).toMatch(/^user_name: Configured Agent$/m);
  }, 60000);
});
