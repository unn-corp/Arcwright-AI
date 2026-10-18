import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs-extra';
import os from 'node:os';
import path from 'node:path';
import { execSync } from 'node:child_process';
import installer from '../lib/installer.js';

const { writeOpenCodeConfig, sha256 } = installer._internal;

const PKG_ROOT = path.resolve(__dirname, '..');
const REPO_ROOT = path.resolve(PKG_ROOT, '..', '..');
const SRC_DIR = path.join(PKG_ROOT, 'src');

// writeOpenCodeConfig reads from the built src/ (gitignored). Build it once if
// missing so the suite is self-sufficient locally and in a fresh CI checkout —
// mirrors platform-codex-hermes.test.js / install.integration.test.js.
beforeAll(() => {
  if (!fs.existsSync(SRC_DIR)) {
    execSync('node build/build.js', { cwd: REPO_ROOT, stdio: 'pipe' });
  }
}, 120000);

const chalk = new Proxy({}, { get: () => (s) => s });
const platform = 'linux-native';

let projectDir, homeDir;

beforeEach(() => {
  projectDir = fs.mkdtempSync(path.join(os.tmpdir(), 'arcw-opencode-proj-'));
  homeDir = fs.mkdtempSync(path.join(os.tmpdir(), 'arcw-opencode-home-'));
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

describe('writeOpenCodeConfig — project install', () => {
  it('writes AGENTS.md with the managed Arcwright block', async () => {
    await writeOpenCodeConfig(projectDir, ['awm', 'core'], chalk, false, homes(), platform);
    const agentsPath = path.join(projectDir, 'AGENTS.md');
    expect(fs.existsSync(agentsPath)).toBe(true);
    const content = fs.readFileSync(agentsPath, 'utf8');
    expect(content).toContain('<!-- arcwright-agent-start -->');
    expect(content).toContain('<!-- arcwright-agent-end -->');
    expect(content).toContain('## Arcwright');
    expect(content).toContain('Key modules: awm, core');
  });

  it('is idempotent — re-running does not duplicate the block', async () => {
    await writeOpenCodeConfig(projectDir, ['awm'], chalk, false, homes(), platform);
    const first = fs.readFileSync(path.join(projectDir, 'AGENTS.md'), 'utf8');
    await writeOpenCodeConfig(projectDir, ['awm'], chalk, false, homes(), platform);
    const second = fs.readFileSync(path.join(projectDir, 'AGENTS.md'), 'utf8');
    expect(second).toBe(first);
    expect((second.match(/<!-- arcwright-agent-start -->/g) || []).length).toBe(1);
  });

  it('adds the MCP action trigger to the portable project instructions', async () => {
    await writeOpenCodeConfig(projectDir, ['awm'], chalk, false, homes(), platform, true, false, false, true);
    expect(fs.readFileSync(path.join(projectDir, 'AGENTS.md'), 'utf8')).toContain('once at session start');
    expect(fs.existsSync(path.join(projectDir, '.opencode', 'plugins', 'unnamed-dev-mcp.js'))).toBe(true);
    const plugin = fs.readFileSync(path.join(projectDir, '.opencode', 'plugins', 'unnamed-dev-mcp.js'), 'utf8');
    expect(plugin).toContain('experimental.chat.system.transform');
    expect(plugin).toContain('preflightInjected');
  });

  it('preserves user content outside the managed block', async () => {
    fs.writeFileSync(path.join(projectDir, 'AGENTS.md'), '# My custom instructions\n\nDo the thing.\n');
    await writeOpenCodeConfig(projectDir, ['awm'], chalk, false, homes(), platform);
    const content = fs.readFileSync(path.join(projectDir, 'AGENTS.md'), 'utf8');
    expect(content).toContain('# My custom instructions');
    expect(content).toContain('Do the thing.');
    expect(content).toContain('<!-- arcwright-agent-start -->');
  });

  it('copies .agents/skills/ into the project (the same path OpenCode natively reads) and returns matching manifest entries', async () => {
    const entries = await writeOpenCodeConfig(projectDir, ['awm'], chalk, false, homes(), platform);
    const destSkills = path.join(projectDir, '.agents', 'skills');
    expect(fs.existsSync(destSkills)).toBe(true);
    expect(fs.existsSync(path.join(destSkills, 'triage', 'SKILL.md'))).toBe(true);
    const skillEntries = entries.filter(e => e.relPath.startsWith('.agents/skills/'));
    expect(skillEntries.length).toBeGreaterThan(0);
    for (const e of skillEntries) {
      const onDisk = fs.readFileSync(path.join(projectDir, e.relPath));
      expect(sha256(onDisk)).toBe(e.hash);
    }
  });

  it('copies .claude/commands/ into .opencode/commands/ verbatim and returns matching manifest entries', async () => {
    const entries = await writeOpenCodeConfig(projectDir, ['awm'], chalk, false, homes(), platform);
    const destCommands = path.join(projectDir, '.opencode', 'commands');
    expect(fs.existsSync(destCommands)).toBe(true);
    expect(fs.existsSync(path.join(destCommands, 'team.md'))).toBe(true);
    const srcContent = fs.readFileSync(path.join(SRC_DIR, '.claude', 'commands', 'team.md'), 'utf8');
    const destContent = fs.readFileSync(path.join(destCommands, 'team.md'), 'utf8');
    expect(destContent).toBe(srcContent); // verbatim, no content rewrite
    const cmdEntries = entries.filter(e => e.relPath.startsWith('.opencode/commands/'));
    expect(cmdEntries.length).toBeGreaterThan(0);
    for (const e of cmdEntries) {
      const onDisk = fs.readFileSync(path.join(projectDir, e.relPath));
      expect(sha256(onDisk)).toBe(e.hash);
    }
  });

  it('skips team-* skills when teams are declined', async () => {
    const entries = await writeOpenCodeConfig(projectDir, ['awm'], chalk, false, homes(), platform, false);
    expect(entries.some(e => /\/skills\/team-[^/]+\//.test(e.relPath))).toBe(false);
    expect(fs.existsSync(path.join(projectDir, '.agents', 'skills', 'team-arch-dev'))).toBe(false);
    expect(fs.existsSync(path.join(projectDir, '.opencode', 'commands', 'team.md'))).toBe(false);
  });

  it('guards against copying .agents/skills onto itself', async () => {
    // Passing SRC_DIR as projectRoot makes skillsDest (projectRoot/.agents/skills)
    // resolve to the exact same path as skillsSrc (SRC_DIR/.agents/skills) —
    // the real-world case the guard exists for (installing Arcwright onto its
    // own built src/ during dogfood testing).
    try {
      const entries = await writeOpenCodeConfig(SRC_DIR, ['awm'], chalk, false, homes(), platform);
      expect(entries.every(e => !e.relPath.startsWith('.agents/skills/'))).toBe(true);
      const logged = console.log.mock.calls.flat().join('\n');
      expect(logged).toContain('already the source');
    } finally {
      fs.removeSync(path.join(SRC_DIR, 'AGENTS.md'));
      fs.removeSync(path.join(SRC_DIR, '.opencode'));
    }
  });
});

describe('writeOpenCodeConfig — global install', () => {
  it('writes ~/.config/opencode/AGENTS.md and $HOME/.agents/skills (not ~/.config/opencode/skills)', async () => {
    const entries = await writeOpenCodeConfig(projectDir, ['awm'], chalk, true, homes(), platform);
    expect(fs.existsSync(path.join(homeDir, '.config', 'opencode', 'AGENTS.md'))).toBe(true);
    expect(fs.existsSync(path.join(homeDir, '.agents', 'skills'))).toBe(true);
    expect(fs.existsSync(path.join(homeDir, '.agents', 'skills', 'triage', 'SKILL.md'))).toBe(true);
    expect(fs.existsSync(path.join(homeDir, '.config', 'opencode', 'skills'))).toBe(false);
    const skillEntries = entries.filter(e => e.relPath.startsWith('.opencode/skills/'));
    expect(skillEntries.length).toBeGreaterThan(0);
  });

  it('writes ~/.config/opencode/commands/ and returns matching manifest entries', async () => {
    const entries = await writeOpenCodeConfig(projectDir, ['awm'], chalk, true, homes(), platform);
    const destCommands = path.join(homeDir, '.config', 'opencode', 'commands');
    expect(fs.existsSync(destCommands)).toBe(true);
    expect(fs.existsSync(path.join(destCommands, 'team.md'))).toBe(true);
    // relPath is a '.opencode/commands/' bookkeeping prefix (like skills'
    // '.opencode/skills/'), NOT the literal on-disk path relative to
    // homeDir — the real global destination is ~/.config/opencode/commands/,
    // remapped by the orphan-removal switch in install(). Verify hashes
    // against the real resolved destCommands dir instead.
    const cmdEntries = entries.filter(e => e.relPath.startsWith('.opencode/commands/'));
    expect(cmdEntries.length).toBeGreaterThan(0);
    for (const e of cmdEntries) {
      const rel = e.relPath.slice('.opencode/commands/'.length);
      const onDisk = fs.readFileSync(path.join(destCommands, rel));
      expect(sha256(onDisk)).toBe(e.hash);
    }
  });
});
