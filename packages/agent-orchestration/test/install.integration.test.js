import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs-extra';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, execSync } from 'node:child_process';
import installer, { publicInstaller } from './organization-fixture.js';

const { install, uninstall } = installer;
const { readManifest, writeManifest } = installer._internal;

const PKG_ROOT = path.resolve(__dirname, '..');
const REPO_ROOT = path.resolve(PKG_ROOT, '..', '..');
const SRC_DIR = installer.sourceDir;

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
  it('updates global skills and retires owned Herdr and Sol Loop routes across hosts', async () => {
    const opts = baseOpts({ global: true, tools: 'claude-code,codex,hermes,kiro,opencode,grok,cursor', hooks: 'none' });
    await install(opts);
    const manifestDir = path.join(homeDir, '.arcwright');
    const entries = await installer._internal.readFilesManifest(manifestDir);
    // Seed independently specified files from a previous release, using each
    // host's real ownership alias. No old package or network access is needed.
    const roots = [
      ['.claude/skills', '.agents/skills'], ['.agents/skills', '.codex/skills'],
      ['.hermes/skills', '.hermes/skills'], ['.kiro/skills', '.kiro/skills'],
      ['.grok/skills', '.grok/skills'],
    ];
    for (const [physical, logical] of roots) {
      for (const name of ['herdr', 'sol-loop']) {
        const text = `---\nname: ${name}\ndescription: Previous release fixture\n---\nOld procedure.\n`;
        fs.outputFileSync(path.join(homeDir, physical, name, 'SKILL.md'), text);
        entries.push({ relPath: `${logical}/${name}/SKILL.md`, hash: installer._internal.sha256(text) });
      }
    }
    const commandRoots = [
      ['.claude/commands', '.claude/commands', 'md'],
      ['.cursor/commands', '.cursor/commands', 'md'],
      ['.config/opencode/commands', '.opencode/commands', 'md'],
      ['.grok/commands', '.grok/commands', 'md'],
      ['.kiro/agents', '.kiro/agents', 'json'],
    ];
    for (const [physical, logical, extension] of commandRoots) {
      for (const name of ['herdr', 'sol-loop']) {
        const text = extension === 'json' ? '{"prompt":"Old procedure"}\n' : 'Old procedure.\n';
        fs.outputFileSync(path.join(homeDir, physical, `${name}.${extension}`), text);
        entries.push({ relPath: `${logical}/${name}.${extension}`, hash: installer._internal.sha256(text) });
      }
    }
    const custom = path.join(homeDir, '.agents/skills/herdr/personal-note.md');
    fs.outputFileSync(custom, 'User-owned terminal notes.\n');
    await installer._internal.writeFilesManifest(manifestDir, entries);
    await install({ ...opts, action: 'update' });
    for (const [physical] of roots) {
      for (const name of ['herdr', 'sol-loop']) {
        expect(fs.existsSync(path.join(homeDir, physical, name, 'SKILL.md'))).toBe(false);
      }
      for (const name of ['review-loop', 'caveman', 'caveman-compress', 'ponytail', 'ponytail-review', 'ponytail-audit', 'ponytail-debt', 'ponytail-gain', 'ponytail-help']) {
        expect(fs.readFileSync(path.join(homeDir, physical, name, 'SKILL.md'), 'utf8')).toContain(`name: ${name}`);
      }
    }
    for (const [physical, , extension] of commandRoots) {
      for (const name of ['herdr', 'sol-loop']) expect(fs.existsSync(path.join(homeDir, physical, `${name}.${extension}`))).toBe(false);
      // Cursor's global install stages User Rules; native commands are project-scoped.
      if (physical !== '.cursor/commands') {
        for (const name of ['ponytail', 'ponytail-review', 'review-loop']) expect(fs.existsSync(path.join(homeDir, physical, `${name}.${extension}`))).toBe(true);
      }
    }
    expect(fs.existsSync(path.join(homeDir, '.cursor/arcwright-user-rules.md'))).toBe(true);
    expect(fs.readFileSync(custom, 'utf8')).toBe('User-owned terminal notes.\n');
  }, 60000);

  it('requires an explicit private source and preserves enabled private installs on public-only updates', async () => {
    await expect(publicInstaller.install(baseOpts({ unnamedPm: true }))).rejects.toThrow('skills are private');
    expect(fs.readdirSync(projectDir)).toEqual([]);
    await install(baseOpts({ unnamedPm: true }));
    const privateSkill = path.join(projectDir, '.agents/skills/unnamed-dev-mcp/SKILL.md');
    const before = fs.readFileSync(privateSkill, 'utf8');
    await expect(publicInstaller.install(baseOpts({ action: 'update' }))).rejects.toThrow('private Unnamed Development pack enabled');
    expect(fs.readFileSync(privateSkill, 'utf8')).toBe(before);
  });
  it('keeps the Matt Pocock pack optional across every platform', async () => {
    await install(baseOpts({ tools: 'claude-code,cursor,kiro,codex,hermes,opencode,grok' }));
    for (const rel of [
      '.agents/skills/matt-pocock/SKILL.md', '.kiro/skills/matt-pocock/SKILL.md',
      '.claude/commands/matt-pocock.md', '.cursor/commands/matt-pocock.md',
      '.opencode/commands/matt-pocock.md', '.grok/commands/matt-pocock.md',
      '.kiro/agents/matt-pocock.json',
      '.agents/skills/arcwright/commands/matt-pocock.md',
      '.kiro/skills/arcwright/commands/matt-pocock.md',
    ]) expect(fs.existsSync(path.join(projectDir, rel))).toBe(false);
    expect(fs.existsSync(path.join(homeDir, '.hermes/skills/matt-pocock/SKILL.md'))).toBe(false);
    expect((await readManifest(path.join(projectDir, '_arcwright'))).mattPocock).toBe(false);
    const router = path.join(projectDir, '.agents/skills/arcwright/scripts/find-entrypoint.cjs');
    const routes = JSON.parse(execFileSync(process.execPath, [router, '/debug'], { cwd: projectDir, encoding: 'utf8' }));
    expect(routes[0]).toMatchObject({ name: 'debug', kind: 'command', path: 'commands/debug.md' });
    for (const name of ['arcwright', 'full-send', 'full-stop', 'review-loop']) {
      const agent = JSON.parse(fs.readFileSync(path.join(projectDir, `.kiro/agents/${name}.json`), 'utf8'));
      expect(agent.tools).toContain('subagent');
      expect(agent.includeMcpJson).toBe(true);
    }
  }, 60000);

  it('installs and retains the namespaced pack, then removes only unchanged files when disabled', async () => {
    const tools = 'claude-code,cursor,kiro,codex,hermes,opencode,grok';
    await install(baseOpts({ tools, mattPocock: true }));
    for (const rel of [
      '.agents/skills/matt-pocock/SKILL.md', '.kiro/skills/matt-pocock/SKILL.md',
      '.claude/commands/matt-pocock.md', '.cursor/commands/matt-pocock.md',
      '.opencode/commands/matt-pocock.md', '.grok/commands/matt-pocock.md',
      '.kiro/agents/matt-pocock.json', '.agents/skills/matt-pocock-tdd/LICENSE',
      '.agents/skills/arcwright/commands/matt-pocock.md',
      '.kiro/skills/arcwright/commands/matt-pocock.md',
    ]) expect(fs.existsSync(path.join(projectDir, rel))).toBe(true);
    expect(fs.readFileSync(path.join(projectDir, '.agents/skills/grill-me/SKILL.md'), 'utf8'))
      .toBe(fs.readFileSync(path.join(SRC_DIR, '.agents/skills/grill-me/SKILL.md'), 'utf8'));
    await install(baseOpts({ action: 'update', tools }));
    expect((await readManifest(path.join(projectDir, '_arcwright'))).mattPocock).toBe(true);
    const custom = path.join(projectDir, '.agents/skills/matt-pocock-tdd/SKILL.md');
    fs.appendFileSync(custom, '\nUser customization\n');
    await install(baseOpts({ action: 'update', tools, mattPocock: false }));
    expect((await readManifest(path.join(projectDir, '_arcwright'))).mattPocock).toBe(false);
    expect(fs.readFileSync(custom, 'utf8')).toContain('User customization');
    expect(fs.existsSync(path.join(projectDir, '.agents/skills/matt-pocock/SKILL.md'))).toBe(false);
    expect(fs.existsSync(path.join(projectDir, '.kiro/agents/matt-pocock.json'))).toBe(false);
    expect(fs.existsSync(path.join(homeDir, '.hermes/skills/matt-pocock/SKILL.md'))).toBe(false);
  }, 60000);

  it('installs the optional pack globally and removes it through the public CLI', async () => {
    const bin = path.join(PKG_ROOT, 'bin/arcwright.js');
    const run = (command, ...flags) => execFileSync(process.execPath, [
      bin, command, '--global', '--yes', '--tools', 'claude-code,codex,hermes,kiro,opencode,grok,cursor',
      '--directory', projectDir, '--hooks', 'none', ...flags,
    ], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    run('install', '--matt-pocock');
    for (const dir of ['.claude/skills', '.agents/skills', '.hermes/skills', '.kiro/skills']) {
      expect(fs.existsSync(path.join(homeDir, dir, 'matt-pocock/SKILL.md'))).toBe(true);
    }
    run('update');
    expect((await readManifest(path.join(homeDir, '.arcwright'))).mattPocock).toBe(true);
    run('update', '--no-matt-pocock');
    expect((await readManifest(path.join(homeDir, '.arcwright'))).mattPocock).toBe(false);
    for (const dir of ['.claude/skills', '.agents/skills', '.hermes/skills', '.kiro/skills']) {
      expect(fs.existsSync(path.join(homeDir, dir, 'matt-pocock/SKILL.md'))).toBe(false);
    }
  }, 60000);

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

  it('gates the Unnamed MCP skill and hooks behind --unnamed-pm', async () => {
    await install(baseOpts());
    expect(fs.existsSync(path.join(projectDir, '.agents', 'skills', 'unnamed-dev-mcp', 'SKILL.md'))).toBe(false);

    execSync('git init -q && git remote add origin https://github.com/example/project.git', { cwd: projectDir, stdio: 'pipe' });
    await install(baseOpts({ action: 'update', tools: 'claude-code,cursor,kiro,codex,opencode,grok', unnamedPm: true }));
    const manifest = await readManifest(path.join(projectDir, '_arcwright'));
    const settings = await fs.readJson(path.join(projectDir, '.claude', 'settings.json'));
    const cursorHooks = await fs.readJson(path.join(projectDir, '.cursor', 'hooks.json'));
    const codexHooks = await fs.readJson(path.join(projectDir, '.codex', 'hooks.json'));
    const kiroHooks = await fs.readJson(path.join(projectDir, '.kiro', 'hooks', 'unnamed-dev-mcp.json'));
    const grokHooks = await fs.readJson(path.join(projectDir, '.grok', 'hooks', 'unnamed-dev-mcp.json'));

    expect(manifest.unnamedPm).toBe(true);
    expect(fs.existsSync(path.join(projectDir, '.agents', 'skills', 'unnamed-dev-mcp', 'SKILL.md'))).toBe(true);
    expect(fs.existsSync(path.join(projectDir, '.claude', 'commands', 'unnamed-dev-mcp.md'))).toBe(true);
    expect(fs.existsSync(path.join(projectDir, '.cursor', 'commands', 'unnamed-dev-mcp.md'))).toBe(true);
    expect(fs.existsSync(path.join(projectDir, '.codex', 'hooks', 'unnamed-dev-context.js'))).toBe(true);
    expect(fs.existsSync(path.join(projectDir, '.kiro', 'agents', 'unnamed-dev-mcp.json'))).toBe(true);
    expect(fs.existsSync(path.join(projectDir, '.grok', 'hooks', 'unnamed-dev-context.js'))).toBe(true);
    expect(settings.hooks.UserPromptSubmit?.some((group) => group.hooks.some((hook) => hook.type === 'mcp_tool' && hook.tool === 'get_project_context'))).not.toBe(true);
    expect(settings.hooks.SessionStart.some((group) => group.hooks.some((hook) => hook.type === 'mcp_tool' && hook.tool === 'get_project_context'))).toBe(true);
    expect(fs.readFileSync(path.join(projectDir, 'AGENTS.md'), 'utf8')).toContain('Unnamed Development MCP trigger');
    expect(fs.readFileSync(path.join(projectDir, '.cursor', 'rules', 'arcwright.mdc'), 'utf8')).toContain('Refresh manually with');
    expect(cursorHooks.hooks.sessionStart).toHaveLength(1);
    expect(codexHooks.hooks.UserPromptSubmit).toBeUndefined();
    expect(kiroHooks.hooks).toHaveLength(1);
    expect(kiroHooks.hooks[0].trigger).toBe('SessionStart');
    expect(grokHooks.hooks.UserPromptSubmit).toBeUndefined();
    expect(fs.existsSync(path.join(projectDir, '.cursor', 'hooks', 'unnamed-dev-context.js'))).toBe(true);

    await uninstall({ directory: projectDir, yes: true });
    const uninstalledSettings = await fs.readJson(path.join(projectDir, '.claude', 'settings.json'));
    const uninstalledCursorHooks = await fs.readJson(path.join(projectDir, '.cursor', 'hooks.json'));
    expect(fs.existsSync(path.join(projectDir, '.agents', 'skills', 'unnamed-dev-mcp', 'SKILL.md'))).toBe(false);
    expect(fs.existsSync(path.join(projectDir, '.codex', 'hooks', 'unnamed-dev-context.js'))).toBe(false);
    expect(fs.existsSync(path.join(projectDir, '.codex', 'hooks.json'))).toBe(false);
    expect(fs.existsSync(path.join(projectDir, '.kiro', 'hooks', 'unnamed-dev-mcp.json'))).toBe(false);
    expect(fs.existsSync(path.join(projectDir, '.grok', 'hooks', 'unnamed-dev-context.js'))).toBe(false);
    expect(fs.existsSync(path.join(projectDir, '.grok', 'hooks', 'unnamed-dev-mcp.json'))).toBe(false);
    expect(JSON.stringify(uninstalledSettings.hooks || {})).not.toContain('unnamed-dev-context.js');
    expect(JSON.stringify(uninstalledCursorHooks.hooks || {})).not.toContain('unnamed-dev-context.js');
    expect(fs.existsSync(path.join(projectDir, '.cursor', 'hooks', 'unnamed-dev-context.js'))).toBe(false);
  }, 90000);

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

  it('personalizes, customizes, and updates optional module configs', async () => {
    const customDir = path.join(projectDir, '_arcwright', 'custom');
    await fs.mkdirp(customDir);
    await Promise.all(['aws-infra', 'unnamed-pm'].map((mod) => (
      fs.writeFile(path.join(customDir, `${mod}.toml`), 'project_name = "Configured Project"\n')
    )));

    await install(baseOpts({
      awsInfra: true,
      unnamedPm: true,
      userName: 'Configured Agent',
      outputFolder: '.arcout',
    }));

    for (const mod of ['aws-infra', 'unnamed-pm']) {
      const cfg = await fs.readFile(path.join(projectDir, '_arcwright', mod, 'config.yaml'), 'utf8');
      expect(cfg).toMatch(/^project_name: Configured Project$/m);
      expect(cfg).toMatch(/^user_name: Configured Agent$/m);
      expect(cfg).toMatch(/^output_folder:.*\.arcout/m);
      expect(cfg).not.toMatch(/Unnamed Developer/);
      expect(cfg).not.toMatch(/_arcwright-output/);
    }

    const awsConfig = path.join(projectDir, '_arcwright', 'aws-infra', 'config.yaml');
    await fs.appendFile(awsConfig, 'manual_setting: keep-me\n');
    await Promise.all(['aws-infra', 'unnamed-pm'].map((mod) => (
      fs.writeFile(path.join(customDir, `${mod}.toml`), 'project_name = "Updated Project"\n')
    )));

    await install(baseOpts({ action: 'update', awsInfra: true, unnamedPm: true }));

    for (const mod of ['aws-infra', 'unnamed-pm']) {
      const cfg = await fs.readFile(path.join(projectDir, '_arcwright', mod, 'config.yaml'), 'utf8');
      expect(cfg).toMatch(/^project_name: Updated Project$/m);
    }
    expect(await fs.readFile(awsConfig, 'utf8')).toMatch(/^manual_setting: keep-me$/m);
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

  it('uninstall removes generated assets and owned Claude hook state', async () => {
    await install(baseOpts({ hooks: 'safe' }));

    expect(fs.existsSync(path.join(projectDir, '.agents', 'skills', 'triage', 'SKILL.md'))).toBe(true);
    expect(fs.existsSync(path.join(projectDir, '.claude', 'commands', 'triage.md'))).toBe(true);
    expect(fs.existsSync(path.join(projectDir, '.claude', 'agents', 'arcwright-dev.md'))).toBe(true);
    expect(fs.existsSync(path.join(projectDir, '.claude', 'arcwright-hooks', 'guard-bash.js'))).toBe(true);

    const before = await readManifest(path.join(projectDir, '_arcwright'));
    expect(before.managedSettings).toEqual(expect.arrayContaining([
      expect.objectContaining({ path: '.claude', hooks: true, defaultMode: true }),
    ]));

    await uninstall({ directory: projectDir, yes: true });

    expect(fs.existsSync(path.join(projectDir, '.agents', 'skills', 'triage', 'SKILL.md'))).toBe(false);
    expect(fs.existsSync(path.join(projectDir, '.claude', 'commands', 'triage.md'))).toBe(false);
    expect(fs.existsSync(path.join(projectDir, '.claude', 'agents', 'arcwright-dev.md'))).toBe(false);
    expect(fs.existsSync(path.join(projectDir, '.claude', 'arcwright-hooks', 'guard-bash.js'))).toBe(false);
    const settings = await fs.readJson(path.join(projectDir, '.claude', 'settings.json'));
    expect(settings.hooks).toBeUndefined();
    expect(settings.permissions).toBeUndefined();
  }, 90000);

  it('tracks Kiro assets and removes disabled team files on update', async () => {
    await install(baseOpts({ tools: 'kiro', teams: true }));
    const teamSkill = path.join(projectDir, '.kiro', 'skills', 'team-arch-dev', 'SKILL.md');
    const filesManifest = path.join(projectDir, '_arcwright', '_config', 'files-manifest.csv');
    expect(fs.existsSync(teamSkill)).toBe(true);
    expect((await fs.readFile(filesManifest, 'utf8'))).toContain('.kiro/skills/team-arch-dev/SKILL.md');

    await install(baseOpts({ action: 'update', tools: 'kiro', teams: false }));

    expect(fs.existsSync(teamSkill)).toBe(false);
    expect((await fs.readFile(filesManifest, 'utf8'))).not.toContain('.kiro/skills/team-arch-dev/SKILL.md');
  }, 120000);

  it('keeps a project install from mutating the global Claude rules file', async () => {
    await install(baseOpts());
    expect(fs.existsSync(path.join(homeDir, '.claude', 'CLAUDE.md'))).toBe(false);
  }, 60000);
});

describe('install() — project manifest trust boundaries', () => {
  it('does not restore global-side-effect options from a project manifest', async () => {
    await install(baseOpts());
    const manifestPath = path.join(projectDir, '_arcwright');
    const manifest = await readManifest(manifestPath);
    await writeManifest(manifestPath, {
      ...manifest,
      tools: ['hermes'],
      modelLaunchers: true,
      modelSurface: true,
      unnamedPm: true,
    });

    await install(baseOpts({
      action: 'update',
      modelLaunchers: null,
      modelSurface: null,
      unnamedPm: false,
    }));

    const updated = await readManifest(manifestPath);
    expect(updated.tools).toEqual(['claude-code']);
    expect(updated.modelLaunchers).toBe(false);
    expect(updated.modelSurface).toBe(false);
    expect(updated.unnamedPm).toBe(false);
    expect(fs.existsSync(path.join(homeDir, '.config', 'zai'))).toBe(false);
    expect(fs.existsSync(path.join(projectDir, '_arcwright', 'unnamed-pm'))).toBe(false);
  }, 90000);
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

  it('update --yes preserves the custom output folder for new configs and uninstall', async () => {
    await install(baseOpts({ outputFolder: '.arcout' }));
    expect(fs.existsSync(path.join(projectDir, '.arcout'))).toBe(true);
    expect(await fs.readFile(path.join(projectDir, '.gitignore'), 'utf8')).toContain('.arcout/');
    await install(baseOpts({ action: 'update', modules: 'awm,awb,core' }));

    const manifest = await readManifest(path.join(projectDir, '_arcwright'));
    expect(manifest.outputFolder).toBe('.arcout');
    const awbConfig = await fs.readFile(path.join(projectDir, '_arcwright', 'awb', 'config.yaml'), 'utf8');
    expect(awbConfig).toMatch(/^output_folder:.*\.arcout/m);

    await uninstall({ directory: projectDir, yes: true });
    expect(fs.existsSync(path.join(projectDir, '.arcout'))).toBe(false);
  }, 120000);

  it('repeated updates keep shared rules in AGENTS.md and one stable Claude import', async () => {
    await install(baseOpts());
    const agentsMd = path.join(projectDir, 'AGENTS.md');
    const claudeMd = path.join(projectDir, 'CLAUDE.md');
    const first = await fs.readFile(agentsMd, 'utf8');
    const firstImport = await fs.readFile(claudeMd, 'utf8');
    expect(first).toContain('Use `subagent-protocol` as the shared delegation lifecycle');
    expect(firstImport).toBe('<!-- arcwright-instructions-start -->\n@AGENTS.md\n<!-- arcwright-instructions-end -->\n');
    expect(fs.existsSync(path.join(projectDir, '.claude', 'CLAUDE.md'))).toBe(false);

    await install(baseOpts({ action: 'update' }));
    await install(baseOpts({ action: 'update' }));
    const third = await fs.readFile(agentsMd, 'utf8');

    expect(third).toBe(first);
    expect(await fs.readFile(claudeMd, 'utf8')).toBe(firstImport);
    const count = (s, needle) => s.split(needle).length - 1;
    for (const marker of [
      '<!-- arcwright-agent-start -->', '<!-- arcwright-agent-end -->',
    ]) {
      expect(count(third, marker)).toBe(1);
    }
  }, 120000);

  it('honors explicit Claude import retirement across installation and update', async () => {
    const policy = '# Project conventions\n\n<!-- arcwright-claude-imports: retired -->\nUse AGENTS.md only.\n';
    const agentsMd = path.join(projectDir, 'AGENTS.md');
    const rootClaude = path.join(projectDir, 'CLAUDE.md');
    const nestedClaude = path.join(projectDir, '.claude', 'CLAUDE.md');
    fs.writeFileSync(agentsMd, policy);
    fs.outputFileSync(rootClaude, '<!-- arcwright-instructions-start -->\n@AGENTS.md\n<!-- arcwright-instructions-end -->\n');
    fs.outputFileSync(nestedClaude, '<!-- arcwright-instructions-start -->\n@../AGENTS.md\n<!-- arcwright-instructions-end -->\n');

    await install(baseOpts());
    expect(fs.existsSync(rootClaude)).toBe(false);
    expect(fs.existsSync(nestedClaude)).toBe(false);
    const first = await fs.readFile(agentsMd, 'utf8');
    expect(first).toContain(policy.trimEnd());
    expect(first).toContain('Run focused tests first, then required checks');

    await install(baseOpts({ action: 'update' }));
    expect(fs.existsSync(rootClaude)).toBe(false);
    expect(fs.existsSync(nestedClaude)).toBe(false);
    expect(await fs.readFile(agentsMd, 'utf8')).toBe(first);
  }, 60000);

  it('preserves unowned host instructions when Claude imports are retired', async () => {
    const prefix = '# Private host preference\n\nKeep this exact spacing.\n\n';
    const suffix = '\n\n## Local note\nKeep this too.\n';
    const imported = '<!-- arcwright-instructions-start -->\n@AGENTS.md\n<!-- arcwright-instructions-end -->';
    const rootClaude = path.join(projectDir, 'CLAUDE.md');
    const nestedClaude = path.join(projectDir, '.claude', 'CLAUDE.md');
    const personal = '# Independent host instruction\nDo not move private content.\n';
    fs.writeFileSync(path.join(projectDir, 'AGENTS.md'), '<!-- arcwright-claude-imports: retired -->\n');
    fs.outputFileSync(rootClaude, prefix + imported + suffix);
    fs.outputFileSync(nestedClaude, personal);

    await install(baseOpts());
    expect(await fs.readFile(rootClaude, 'utf8')).toBe(prefix + suffix);
    expect(await fs.readFile(nestedClaude, 'utf8')).toBe(personal);
    expect(await fs.readFile(path.join(projectDir, 'AGENTS.md'), 'utf8')).not.toContain('Private host preference');
    expect(await fs.readFile(path.join(projectDir, 'AGENTS.md'), 'utf8')).not.toContain('Independent host instruction');
  }, 60000);

  it('migrates owned Claude rules without moving user content, and removes imports on uninstall', async () => {
    const personal = '# Host preferences\n\nKeep this spacing.\n\n\n';
    const owned = '<!-- arcwright-agent-start -->\nOld package rules\n<!-- arcwright-agent-end -->';
    const legacy = '<!-- arcwright-orchestration-start -->\nOld model policy\n<!-- arcwright-orchestration-end -->';
    const trailing = '\n\n## Local notes\nKeep these too.\n';
    const rootClaude = path.join(projectDir, 'CLAUDE.md');
    const nestedClaude = path.join(projectDir, '.claude', 'CLAUDE.md');
    fs.outputFileSync(rootClaude, personal + owned + legacy + trailing);
    fs.outputFileSync(nestedClaude, personal + owned + trailing);
    fs.writeFileSync(path.join(projectDir, 'AGENTS.md'), '# Project conventions\nKeep this rule.\n');

    await install(baseOpts());
    const shared = await fs.readFile(path.join(projectDir, 'AGENTS.md'), 'utf8');
    expect(shared).toContain('# Project conventions\nKeep this rule.');
    expect(shared).toContain('Run focused tests first, then required checks');
    expect(shared).not.toContain('Host preferences');
    for (const [file, relative] of [[rootClaude, 'AGENTS.md'], [nestedClaude, '../AGENTS.md']]) {
      const content = await fs.readFile(file, 'utf8');
      const block = `<!-- arcwright-instructions-start -->\n@${relative}\n<!-- arcwright-instructions-end -->`;
      expect(content).toBe(personal + block + trailing);
      expect(await fs.realpath(path.resolve(path.dirname(file), relative))).toBe(await fs.realpath(path.join(projectDir, 'AGENTS.md')));
    }

    await uninstall({ directory: projectDir, yes: true });
    for (const file of [rootClaude, nestedClaude]) {
      const content = await fs.readFile(file, 'utf8');
      expect(content).toContain('Host preferences');
      expect(content).toContain('Keep these too.');
      expect(content).not.toContain('@');
    }
    expect(await fs.readFile(path.join(projectDir, 'AGENTS.md'), 'utf8')).toContain('Keep this rule.');
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

  it('migrates a command-only BMAD install before recording migratedAt', async () => {
    const commands = path.join(projectDir, '.claude', 'commands');
    fs.mkdirpSync(commands);
    fs.writeFileSync(path.join(commands, 'bmad-track-compact.md'), 'legacy\n');

    await install(baseOpts({ migrateBmad: true }));

    const manifest = await readManifest(path.join(projectDir, '_arcwright'));
    expect(typeof manifest.migratedAt).toBe('string');
    expect(fs.existsSync(path.join(commands, 'bmad-track-compact.md'))).toBe(false);
    expect(fs.existsSync(path.join(commands, 'arcwright-track-compact.md'))).toBe(true);
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

  it('keeps global shared rules in ~/.arcwright/AGENTS.md and preserves personal Claude instructions', async () => {
    const personal = '# Personal instructions\n\nPrivate local preference.\n';
    fs.outputFileSync(path.join(homeDir, '.claude', 'CLAUDE.md'), personal);
    fs.outputFileSync(path.join(homeDir, '.arcwright', 'AGENTS.md'), '# Shared preference\nKeep this convention.\n');
    await install(baseOpts({ global: true, directory: projectDir }));
    const shared = await fs.readFile(path.join(homeDir, '.arcwright', 'AGENTS.md'), 'utf8');
    expect(shared).toContain('## Skill selection and test effort');
    expect(shared).toContain('Keep this convention.');
    expect(shared).not.toContain('Private local preference.');
    expect(await fs.readFile(path.join(homeDir, '.claude', 'CLAUDE.md'), 'utf8')).toBe(personal + '\n<!-- arcwright-instructions-start -->\n@../.arcwright/AGENTS.md\n<!-- arcwright-instructions-end -->\n');
    expect(fs.existsSync(path.join(projectDir, '.claude', 'CLAUDE.md'))).toBe(false);
    expect(fs.existsSync(path.join(projectDir, 'AGENTS.md'))).toBe(false);

    await uninstall({ global: true, directory: projectDir, yes: true });
    const after = await fs.readFile(path.join(homeDir, '.claude', 'CLAUDE.md'), 'utf8');
    expect(after).toContain('Private local preference.');
    expect(after).not.toContain('@../.arcwright/AGENTS.md');
    expect(await fs.readFile(path.join(homeDir, '.arcwright', 'AGENTS.md'), 'utf8')).toContain('Keep this convention.');
    expect(await readManifest(path.join(homeDir, '.arcwright'))).toBeNull();
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

  it.each(['codex', 'opencode'])('preserves shared global skills when updating to %s only', async (remainingTool) => {
    await install(baseOpts({ global: true, tools: 'codex,opencode' }));
    const sharedSkill = path.join(homeDir, '.agents', 'skills', 'triage', 'SKILL.md');
    expect(fs.existsSync(sharedSkill)).toBe(true);

    await install(baseOpts({ global: true, action: 'update', tools: remainingTool }));

    expect(fs.existsSync(sharedSkill)).toBe(true);
  }, 120000);

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
