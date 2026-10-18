import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs-extra';
import os from 'node:os';
import path from 'node:path';
import { execSync } from 'node:child_process';
import yaml from 'yaml';
import installer from '../lib/installer.js';

const { writeCodexConfig, writeHermesConfig, sha256 } = installer._internal;

const PKG_ROOT = path.resolve(__dirname, '..');
const REPO_ROOT = path.resolve(PKG_ROOT, '..', '..');
const SRC_DIR = path.join(PKG_ROOT, 'src');

// writeCodexConfig/writeHermesConfig read from the built src/ (gitignored).
// Build it once if missing so the suite is self-sufficient locally and in a
// fresh CI checkout — mirrors install.integration.test.js.
beforeAll(() => {
  if (!fs.existsSync(SRC_DIR)) {
    execSync('node build/build.js', { cwd: REPO_ROOT, stdio: 'pipe' });
  }
}, 120000);

// Silent chalk stub (every writer here takes a chalk-like object).
const chalk = new Proxy({}, { get: () => (s) => s });
const platform = 'linux-native';

let projectDir, homeDir;

beforeEach(() => {
  projectDir = fs.mkdtempSync(path.join(os.tmpdir(), 'arcw-codex-proj-'));
  homeDir = fs.mkdtempSync(path.join(os.tmpdir(), 'arcw-codex-home-'));
  vi.spyOn(console, 'log').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  fs.rmSync(projectDir, { recursive: true, force: true });
  fs.rmSync(homeDir, { recursive: true, force: true });
});

// A fake `homes` object — never touches the real $HOME. resolveToolPath()
// joins this against relative paths for global installs.
const homes = () => ({ linux: homeDir, windows: null });

describe('writeCodexConfig — project install', () => {
  it('writes AGENTS.md with the managed Arcwright block', async () => {
    await writeCodexConfig(projectDir, ['awm', 'core'], chalk, false, homes(), platform);
    const agentsPath = path.join(projectDir, 'AGENTS.md');
    expect(fs.existsSync(agentsPath)).toBe(true);
    const content = fs.readFileSync(agentsPath, 'utf8');
    expect(content).toContain('<!-- arcwright-agent-start -->');
    expect(content).toContain('<!-- arcwright-agent-end -->');
    expect(content).toContain('## Arcwright');
    expect(content).toContain('Key modules: awm, core');
  });

  it('is idempotent — re-running does not duplicate the block', async () => {
    await writeCodexConfig(projectDir, ['awm'], chalk, false, homes(), platform);
    const first = fs.readFileSync(path.join(projectDir, 'AGENTS.md'), 'utf8');
    await writeCodexConfig(projectDir, ['awm'], chalk, false, homes(), platform);
    const second = fs.readFileSync(path.join(projectDir, 'AGENTS.md'), 'utf8');
    expect(second).toBe(first);
    expect((second.match(/<!-- arcwright-agent-start -->/g) || []).length).toBe(1);
  });

  it('preserves user content outside the managed block', async () => {
    fs.writeFileSync(path.join(projectDir, 'AGENTS.md'), '# My custom instructions\n\nDo the thing.\n');
    await writeCodexConfig(projectDir, ['awm'], chalk, false, homes(), platform);
    const content = fs.readFileSync(path.join(projectDir, 'AGENTS.md'), 'utf8');
    expect(content).toContain('# My custom instructions');
    expect(content).toContain('Do the thing.');
    expect(content).toContain('<!-- arcwright-agent-start -->');
  });

  it('copies .agents/skills/ into the project and returns matching manifest entries', async () => {
    const entries = await writeCodexConfig(projectDir, ['awm'], chalk, false, homes(), platform);
    const destSkills = path.join(projectDir, '.agents', 'skills');
    expect(fs.existsSync(destSkills)).toBe(true);
    expect(fs.existsSync(path.join(destSkills, 'triage', 'SKILL.md'))).toBe(true);
    expect(entries.length).toBeGreaterThan(0);
    for (const e of entries) {
      expect(e.relPath.startsWith('.agents/skills/')).toBe(true);
      const onDisk = fs.readFileSync(path.join(projectDir, e.relPath));
      expect(sha256(onDisk)).toBe(e.hash);
    }
  });

  it('skips team-* skills when teams are declined', async () => {
    const entries = await writeCodexConfig(projectDir, ['awm'], chalk, false, homes(), platform, false);
    expect(entries.some(e => /\/skills\/team-[^/]+\//.test(e.relPath))).toBe(false);
    expect(fs.existsSync(path.join(projectDir, '.agents', 'skills', 'team-arch-dev'))).toBe(false);
  });

  it('guards against copying .agents/skills onto itself', async () => {
    // Passing SRC_DIR as projectRoot makes skillsDest (projectRoot/.agents/skills)
    // resolve to the exact same path as skillsSrc (SRC_DIR/.agents/skills) —
    // the real-world case the guard exists for (installing Arcwright onto its
    // own built src/ during dogfood testing).
    try {
      const entries = await writeCodexConfig(SRC_DIR, ['awm'], chalk, false, homes(), platform);
      expect(entries).toEqual([]);
      const logged = console.log.mock.calls.flat().join('\n');
      expect(logged).toContain('already the source');
    } finally {
      fs.removeSync(path.join(SRC_DIR, 'AGENTS.md'));
    }
  });
});

describe('writeCodexConfig — global install', () => {
  it('writes ~/.codex/AGENTS.md and $HOME/.agents/skills (not ~/.codex/skills)', async () => {
    const rules = path.join(homeDir, '.codex', 'AGENTS.md');
    fs.outputFileSync(rules, '# Personal instructions\n\nKeep my project conventions.\n');
    const entries = await writeCodexConfig(projectDir, ['awm'], chalk, true, homes(), platform);
    expect(fs.existsSync(path.join(homeDir, '.codex', 'AGENTS.md'))).toBe(true);
    expect(fs.existsSync(path.join(homeDir, '.agents', 'skills'))).toBe(true);
    expect(fs.existsSync(path.join(homeDir, '.agents', 'skills', 'triage', 'SKILL.md'))).toBe(true);
    expect(fs.existsSync(path.join(homeDir, '.agents', 'skills', 'test-quality', 'SKILL.md'))).toBe(true);
    expect(fs.readFileSync(rules, 'utf8')).toContain('# Personal instructions');
    expect(fs.readFileSync(rules, 'utf8')).toContain('For writing or reviewing tests, load `test-quality`');
    expect(fs.existsSync(path.join(homeDir, '.codex', 'skills'))).toBe(false);
    expect(entries.length).toBeGreaterThan(0);
    for (const e of entries) {
      // Manifest bookkeeping prefix is '.codex/skills/' even though the real
      // path is $HOME/.agents/skills/ — orphan removal remaps it (installer.js
      // update-orphan branch), keeping it distinct from claude-code's global
      // '.agents/skills/' -> ~/.claude/skills/ remapping.
      expect(e.relPath.startsWith('.codex/skills/')).toBe(true);
    }
  });
});

describe('writeCodexConfig — native Unnamed MCP hooks', () => {
  it('seeds idempotent lifecycle hooks and preserves unrelated handlers', async () => {
    const hooksPath = path.join(projectDir, '.codex', 'hooks.json');
    fs.ensureDirSync(path.dirname(hooksPath));
    fs.writeJsonSync(hooksPath, {
      hooks: {
        UserPromptSubmit: [{ hooks: [{ type: 'command', command: 'echo user-hook' }] }],
        Stop: [{ hooks: [{ type: 'command', command: 'node old/unnamed-dev-context.js --harness=codex' }] }],
      },
    }, { spaces: 2 });

    const args = [projectDir, ['awm'], chalk, false, homes(), platform, true, false, false, true];
    const first = await writeCodexConfig(...args);
    const second = await writeCodexConfig(...args);
    const hooks = await fs.readJson(hooksPath);
    const userPromptGroups = hooks.hooks.UserPromptSubmit;

    expect(fs.existsSync(path.join(projectDir, '.codex', 'hooks', 'unnamed-dev-context.js'))).toBe(true);
    expect(userPromptGroups.filter((group) => group.hooks.some((h) => h.command === 'echo user-hook'))).toHaveLength(1);
    expect(userPromptGroups.filter((group) => group.hooks.some((h) => h.command?.includes('unnamed-dev-context.js')))).toHaveLength(0);
    expect(hooks.hooks.SessionStart).toHaveLength(1);
    expect(hooks.hooks.Stop).toBeUndefined();
    expect(first.some((entry) => entry.relPath === '.codex/hooks.json')).toBe(true);
    expect(second.some((entry) => entry.relPath === '.codex/hooks.json')).toBe(true);
  });

  it('preserves a hook configuration whose root is not an object', async () => {
    const hooksPath = path.join(projectDir, '.codex', 'hooks.json');
    fs.ensureDirSync(path.dirname(hooksPath));
    fs.writeFileSync(hooksPath, '[]');

    const entries = await writeCodexConfig(
      projectDir, ['awm'], chalk, false, homes(), platform, true, false, false, true
    );

    expect(fs.readFileSync(hooksPath, 'utf8')).toBe('[]');
    expect(fs.existsSync(path.join(projectDir, '.codex', 'hooks', 'unnamed-dev-context.js'))).toBe(false);
    expect(entries.some((entry) => entry.relPath === '.codex/hooks.json')).toBe(false);
  });
});

describe('writeHermesConfig — project install', () => {
  it('writes AGENTS.md and returns no manifest entries (no project skills dir)', async () => {
    const entries = await writeHermesConfig(projectDir, ['awm'], chalk, false, homes(), platform);
    expect(fs.existsSync(path.join(projectDir, 'AGENTS.md'))).toBe(true);
    const content = fs.readFileSync(path.join(projectDir, 'AGENTS.md'), 'utf8');
    expect(content).toContain('<!-- arcwright-agent-start -->');
    expect(content).toContain('## Arcwright');
    expect(entries).toEqual([]);
  });

  it('is idempotent — re-running does not duplicate the block', async () => {
    await writeHermesConfig(projectDir, ['awm'], chalk, false, homes(), platform);
    const first = fs.readFileSync(path.join(projectDir, 'AGENTS.md'), 'utf8');
    await writeHermesConfig(projectDir, ['awm'], chalk, false, homes(), platform);
    const second = fs.readFileSync(path.join(projectDir, 'AGENTS.md'), 'utf8');
    expect(second).toBe(first);
  });

  it('adds the MCP action trigger to the portable project instructions', async () => {
    await writeHermesConfig(projectDir, ['awm'], chalk, false, homes(), platform, true, false, false, true);
    expect(fs.readFileSync(path.join(projectDir, 'AGENTS.md'), 'utf8')).toContain('once at session start');
  });
});

describe('writeHermesConfig — global install', () => {
  it('never creates or touches SOUL.md or config.yaml', async () => {
    await writeHermesConfig(projectDir, ['awm'], chalk, true, homes(), platform);
    expect(fs.existsSync(path.join(homeDir, '.hermes', 'SOUL.md'))).toBe(false);
    expect(fs.existsSync(path.join(homeDir, '.hermes', 'config.yaml'))).toBe(false);
  });

  it('skips AGENTS.md entirely for global installs', async () => {
    await writeHermesConfig(projectDir, ['awm'], chalk, true, homes(), platform);
    expect(fs.existsSync(path.join(homeDir, 'AGENTS.md'))).toBe(false);
    expect(fs.existsSync(path.join(homeDir, '.hermes', 'AGENTS.md'))).toBe(false);
  });

  it('does not install a per-turn pre_llm_call hook when enabled', async () => {
    const configPath = path.join(homeDir, '.hermes', 'config.yaml');
    fs.ensureDirSync(path.dirname(configPath));
    fs.writeFileSync(configPath, 'hooks:\\n  pre_llm_call:\\n    - command: node old/unnamed-dev-context.js --harness=hermes\\n');

    const entries = await writeHermesConfig(projectDir, ['awm'], chalk, true, homes(), platform, true, false, false, true);
    const config = yaml.parse(await fs.readFile(path.join(homeDir, '.hermes', 'config.yaml'), 'utf8'));
    expect(config.hooks?.pre_llm_call).toBeUndefined();
    expect(fs.existsSync(path.join(homeDir, '.hermes', 'agent-hooks', 'unnamed-dev-context.js'))).toBe(false);
    expect(entries.some((entry) => entry.relPath === '.hermes/agent-hooks/unnamed-dev-context.js')).toBe(false);
  });

  it('preserves a config with an invalid hooks object', async () => {
    const configPath = path.join(homeDir, '.hermes', 'config.yaml');
    const config = 'hooks: not-an-object\n';
    fs.ensureDirSync(path.dirname(configPath));
    fs.writeFileSync(configPath, config);

    await writeHermesConfig(projectDir, ['awm'], chalk, true, homes(), platform, true, false, false, true);

    expect(fs.readFileSync(configPath, 'utf8')).toBe(config);
    expect(fs.existsSync(path.join(homeDir, '.hermes', 'agent-hooks', 'unnamed-dev-context.js'))).toBe(false);
  });

  it('copies skills to ~/.hermes/skills/ and returns matching manifest entries', async () => {
    const entries = await writeHermesConfig(projectDir, ['awm'], chalk, true, homes(), platform);
    const destSkills = path.join(homeDir, '.hermes', 'skills');
    expect(fs.existsSync(destSkills)).toBe(true);
    expect(fs.existsSync(path.join(destSkills, 'triage', 'SKILL.md'))).toBe(true);
    const skillEntries = entries.filter(e => e.relPath.startsWith('.hermes/skills/'));
    expect(skillEntries.length).toBeGreaterThan(0);
    for (const e of skillEntries) {
      const onDisk = fs.readFileSync(path.join(homeDir, e.relPath));
      expect(sha256(onDisk)).toBe(e.hash);
    }
  });

  it('writes one skill-bundle YAML per team-* skill when teams are enabled', async () => {
    const entries = await writeHermesConfig(projectDir, ['awm'], chalk, true, homes(), platform);
    const bundlesDir = path.join(homeDir, '.hermes', 'skill-bundles');
    expect(fs.existsSync(bundlesDir)).toBe(true);
    const bundleFiles = fs.readdirSync(bundlesDir);
    expect(bundleFiles.length).toBe(17); // 17 team-* skills shipped today
    expect(bundleFiles).toContain('team-arch-dev.yaml');
    const bundleContent = fs.readFileSync(path.join(bundlesDir, 'team-arch-dev.yaml'), 'utf8');
    expect(bundleContent).toContain('name: team-arch-dev');
    expect(bundleContent).toContain('- team-arch-dev');
    const bundleEntries = entries.filter(e => e.relPath.startsWith('.hermes/skill-bundles/'));
    expect(bundleEntries.length).toBe(17);
    for (const e of bundleEntries) {
      const onDisk = fs.readFileSync(path.join(homeDir, e.relPath));
      expect(sha256(onDisk)).toBe(e.hash);
    }
  });

  it('skips skill-bundles when teams are declined', async () => {
    const entries = await writeHermesConfig(projectDir, ['awm'], chalk, true, homes(), platform, false);
    expect(fs.existsSync(path.join(homeDir, '.hermes', 'skill-bundles'))).toBe(false);
    expect(entries.some(e => e.relPath.startsWith('.hermes/skill-bundles/'))).toBe(false);
    expect(entries.some(e => /\/skills\/team-[^/]+\//.test(e.relPath))).toBe(false);
  });
});

// OpenCode writer tests live in test/platform-opencode.test.js.
