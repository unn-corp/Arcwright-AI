import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs-extra';
import os from 'node:os';
import path from 'node:path';
import { execSync } from 'node:child_process';
import installer from '../lib/installer.js';

const { writeCodexConfig, writeHermesConfig, writeOpenCodeConfig, sha256 } = installer._internal;

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
    expect(entries.some(e => e.relPath.includes('/team-'))).toBe(false);
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
    const entries = await writeCodexConfig(projectDir, ['awm'], chalk, true, homes(), platform);
    expect(fs.existsSync(path.join(homeDir, '.codex', 'AGENTS.md'))).toBe(true);
    expect(fs.existsSync(path.join(homeDir, '.agents', 'skills'))).toBe(true);
    expect(fs.existsSync(path.join(homeDir, '.agents', 'skills', 'triage', 'SKILL.md'))).toBe(true);
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
    expect(entries.some(e => e.relPath.includes('/team-'))).toBe(false);
  });
});

describe('writeOpenCodeConfig — project install', () => {
  it('writes AGENTS.md with the managed Arcwright block', async () => {
    await writeOpenCodeConfig(projectDir, ['awm', 'core'], chalk, false, homes(), platform);
    const agentsMd = path.join(projectDir, 'AGENTS.md');
    expect(fs.existsSync(agentsMd)).toBe(true);
    expect(fs.readFileSync(agentsMd, 'utf8')).toContain('<!-- arcwright-agent-start -->');
  });

  it('copies skills to .agents/skills and commands to .opencode/commands, with matching entries', async () => {
    const entries = await writeOpenCodeConfig(projectDir, ['awm'], chalk, false, homes(), platform);
    expect(fs.existsSync(path.join(projectDir, '.agents', 'skills', 'triage', 'SKILL.md'))).toBe(true);
    const cmdDir = path.join(projectDir, '.opencode', 'commands');
    expect(fs.existsSync(cmdDir)).toBe(true);
    // A command shipped by the build (herdr.md) should be present verbatim.
    expect(fs.existsSync(path.join(cmdDir, 'herdr.md'))).toBe(true);
    const cmdEntries = entries.filter(e => e.relPath.startsWith('.opencode/commands/'));
    expect(cmdEntries.length).toBeGreaterThan(0);
    for (const e of cmdEntries) {
      const onDisk = fs.readFileSync(path.join(projectDir, e.relPath));
      expect(sha256(onDisk)).toBe(e.hash);
    }
  });

  it('guards against copying .agents/skills onto itself', async () => {
    try {
      const entries = await writeOpenCodeConfig(SRC_DIR, ['awm'], chalk, false, homes(), platform);
      expect(entries.some(e => e.relPath.startsWith('.agents/skills/'))).toBe(false);
    } finally {
      fs.removeSync(path.join(SRC_DIR, 'AGENTS.md'));
      fs.removeSync(path.join(SRC_DIR, '.opencode'));
    }
  });
});

describe('writeOpenCodeConfig — global install', () => {
  it('writes ~/.config/opencode/AGENTS.md, ~/.agents/skills, and ~/.config/opencode/commands', async () => {
    const entries = await writeOpenCodeConfig(projectDir, ['awm'], chalk, true, homes(), platform);
    expect(fs.existsSync(path.join(homeDir, '.config', 'opencode', 'AGENTS.md'))).toBe(true);
    expect(fs.existsSync(path.join(homeDir, '.agents', 'skills', 'triage', 'SKILL.md'))).toBe(true);
    expect(fs.existsSync(path.join(homeDir, '.config', 'opencode', 'commands', 'herdr.md'))).toBe(true);
    // Global skill entries use the '.opencode/skills/' bookkeeping prefix.
    const skillEntries = entries.filter(e => e.relPath.startsWith('.opencode/skills/'));
    expect(skillEntries.length).toBeGreaterThan(0);
    const cmdEntries = entries.filter(e => e.relPath.startsWith('.opencode/commands/'));
    expect(cmdEntries.length).toBeGreaterThan(0);
  });
});
