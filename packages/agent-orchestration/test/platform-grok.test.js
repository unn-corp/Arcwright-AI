import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs-extra';
import os from 'node:os';
import path from 'node:path';
import { execSync } from 'node:child_process';
import installer from '../lib/installer.js';

const { writeGrokConfig, sha256 } = installer._internal;

const PKG_ROOT = path.resolve(__dirname, '..');
const REPO_ROOT = path.resolve(PKG_ROOT, '..', '..');
const SRC_DIR = path.join(PKG_ROOT, 'src');

// writeGrokConfig reads from the built src/ (gitignored). Build it once if
// missing so the suite is self-sufficient locally and in a fresh CI checkout.
beforeAll(() => {
  if (!fs.existsSync(SRC_DIR)) {
    execSync('node build/build.js', { cwd: REPO_ROOT, stdio: 'pipe' });
  }
}, 120000);

const chalk = new Proxy({}, { get: () => (s) => s });
const platform = 'linux-native';

let projectDir, homeDir;

beforeEach(() => {
  projectDir = fs.mkdtempSync(path.join(os.tmpdir(), 'arcw-grok-proj-'));
  homeDir = fs.mkdtempSync(path.join(os.tmpdir(), 'arcw-grok-home-'));
  vi.spyOn(console, 'log').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  fs.rmSync(projectDir, { recursive: true, force: true });
  fs.rmSync(homeDir, { recursive: true, force: true });
});

const homes = () => ({ linux: homeDir, windows: null });

describe('writeGrokConfig — project install', () => {
  it('writes AGENTS.md with the managed Arcwright block', async () => {
    await writeGrokConfig(projectDir, ['awm', 'core'], chalk, false, homes(), platform);
    const agentsPath = path.join(projectDir, 'AGENTS.md');
    expect(fs.existsSync(agentsPath)).toBe(true);
    const content = fs.readFileSync(agentsPath, 'utf8');
    expect(content).toContain('<!-- arcwright-agent-start -->');
    expect(content).toContain('<!-- arcwright-agent-end -->');
    expect(content).toContain('## Arcwright');
    expect(content).toContain('Key modules: awm, core');
  });

  it('is idempotent — re-running does not duplicate the block', async () => {
    await writeGrokConfig(projectDir, ['awm'], chalk, false, homes(), platform);
    const first = fs.readFileSync(path.join(projectDir, 'AGENTS.md'), 'utf8');
    await writeGrokConfig(projectDir, ['awm'], chalk, false, homes(), platform);
    const second = fs.readFileSync(path.join(projectDir, 'AGENTS.md'), 'utf8');
    expect(second).toBe(first);
    expect((second.match(/<!-- arcwright-agent-start -->/g) || []).length).toBe(1);
  });

  it('preserves user content outside the managed block', async () => {
    fs.writeFileSync(path.join(projectDir, 'AGENTS.md'), '# My custom instructions\n\nDo the thing.\n');
    await writeGrokConfig(projectDir, ['awm'], chalk, false, homes(), platform);
    const content = fs.readFileSync(path.join(projectDir, 'AGENTS.md'), 'utf8');
    expect(content).toContain('# My custom instructions');
    expect(content).toContain('Do the thing.');
    expect(content).toContain('<!-- arcwright-agent-start -->');
  });

  it('copies skills into .agents/skills/ (Grok-scanned path) and returns matching manifest entries', async () => {
    const entries = await writeGrokConfig(projectDir, ['awm'], chalk, false, homes(), platform);
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

  it('copies slash commands into .grok/commands/ verbatim', async () => {
    const entries = await writeGrokConfig(projectDir, ['awm'], chalk, false, homes(), platform);
    const destCommands = path.join(projectDir, '.grok', 'commands');
    expect(fs.existsSync(destCommands)).toBe(true);
    expect(fs.existsSync(path.join(destCommands, 'team.md'))).toBe(true);
    const srcContent = fs.readFileSync(path.join(SRC_DIR, '.claude', 'commands', 'team.md'), 'utf8');
    const destContent = fs.readFileSync(path.join(destCommands, 'team.md'), 'utf8');
    expect(destContent).toBe(srcContent);
    const cmdEntries = entries.filter(e => e.relPath.startsWith('.grok/commands/'));
    expect(cmdEntries.length).toBeGreaterThan(0);
    for (const e of cmdEntries) {
      const onDisk = fs.readFileSync(path.join(projectDir, e.relPath));
      expect(sha256(onDisk)).toBe(e.hash);
    }
  });

  it('writes agent stubs into .grok/agents/', async () => {
    const entries = await writeGrokConfig(projectDir, ['awm', 'awb'], chalk, false, homes(), platform);
    const destAgents = path.join(projectDir, '.grok', 'agents');
    expect(fs.existsSync(path.join(destAgents, 'arcwright-dev.md'))).toBe(true);
    const agentEntries = entries.filter(e => e.relPath.startsWith('.grok/agents/'));
    expect(agentEntries.length).toBeGreaterThan(0);
    const stub = fs.readFileSync(path.join(destAgents, 'arcwright-dev.md'), 'utf8');
    expect(stub).toContain('name: arcwright-dev');
    expect(stub).toContain('agent-activation');
  });

  it('skips team-* skills when teams are declined', async () => {
    const entries = await writeGrokConfig(projectDir, ['awm'], chalk, false, homes(), platform, false);
    expect(entries.some(e => e.relPath.includes('/team-'))).toBe(false);
    expect(fs.existsSync(path.join(projectDir, '.agents', 'skills', 'team-arch-dev'))).toBe(false);
    expect(fs.existsSync(path.join(projectDir, '.grok', 'commands', 'team.md'))).toBe(false);
  });

  it('guards against copying .agents/skills onto itself', async () => {
    try {
      const entries = await writeGrokConfig(SRC_DIR, ['awm'], chalk, false, homes(), platform);
      expect(entries.every(e => !e.relPath.startsWith('.agents/skills/'))).toBe(true);
      const logged = console.log.mock.calls.flat().join('\n');
      expect(logged).toContain('already the source');
    } finally {
      fs.removeSync(path.join(SRC_DIR, 'AGENTS.md'));
      fs.removeSync(path.join(SRC_DIR, '.grok'));
    }
  });
});

describe('writeGrokConfig — global install', () => {
  it('writes ~/.grok/AGENTS.md and ~/.grok/skills (not ~/.agents/skills)', async () => {
    const entries = await writeGrokConfig(projectDir, ['awm'], chalk, true, homes(), platform);
    expect(fs.existsSync(path.join(homeDir, '.grok', 'AGENTS.md'))).toBe(true);
    expect(fs.existsSync(path.join(homeDir, '.grok', 'skills'))).toBe(true);
    expect(fs.existsSync(path.join(homeDir, '.grok', 'skills', 'triage', 'SKILL.md'))).toBe(true);
    expect(fs.existsSync(path.join(homeDir, '.agents', 'skills'))).toBe(false);
    const skillEntries = entries.filter(e => e.relPath.startsWith('.grok/skills/'));
    expect(skillEntries.length).toBeGreaterThan(0);
  });

  it('preserves pre-existing bundled skills under ~/.grok/skills/', async () => {
    const bundled = path.join(homeDir, '.grok', 'skills', 'help', 'SKILL.md');
    fs.ensureDirSync(path.dirname(bundled));
    fs.writeFileSync(bundled, '---\nname: help\n---\n# Bundled help\n');
    await writeGrokConfig(projectDir, ['awm'], chalk, true, homes(), platform);
    expect(fs.existsSync(bundled)).toBe(true);
    expect(fs.readFileSync(bundled, 'utf8')).toContain('Bundled help');
    expect(fs.existsSync(path.join(homeDir, '.grok', 'skills', 'triage', 'SKILL.md'))).toBe(true);
  });

  it('writes ~/.grok/commands/ and returns matching manifest entries', async () => {
    const entries = await writeGrokConfig(projectDir, ['awm'], chalk, true, homes(), platform);
    const destCommands = path.join(homeDir, '.grok', 'commands');
    expect(fs.existsSync(destCommands)).toBe(true);
    expect(fs.existsSync(path.join(destCommands, 'team.md'))).toBe(true);
    const cmdEntries = entries.filter(e => e.relPath.startsWith('.grok/commands/'));
    expect(cmdEntries.length).toBeGreaterThan(0);
    for (const e of cmdEntries) {
      const rel = e.relPath.slice('.grok/commands/'.length);
      const onDisk = fs.readFileSync(path.join(destCommands, rel));
      expect(sha256(onDisk)).toBe(e.hash);
    }
  });

  it('writes agent stubs into ~/.grok/agents/', async () => {
    const entries = await writeGrokConfig(projectDir, ['awm'], chalk, true, homes(), platform);
    const destAgents = path.join(homeDir, '.grok', 'agents');
    expect(fs.existsSync(path.join(destAgents, 'arcwright-dev.md'))).toBe(true);
    const agentEntries = entries.filter(e => e.relPath.startsWith('.grok/agents/'));
    expect(agentEntries.length).toBeGreaterThan(0);
  });
});
