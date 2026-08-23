import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs-extra';
import os from 'node:os';
import path from 'node:path';
import { execSync } from 'node:child_process';
import installer from '../lib/installer.js';
import { adaptKiroContent } from '../lib/kiro-adapter.js';

const { writeKiroConfig } = installer._internal;
const PKG_ROOT = path.resolve(__dirname, '..');
const REPO_ROOT = path.resolve(PKG_ROOT, '..', '..');
const SRC_DIR = path.join(PKG_ROOT, 'src');
const chalk = new Proxy({}, { get: () => (s) => s });
const platform = 'linux-native';

beforeAll(() => {
  if (!fs.existsSync(SRC_DIR)) execSync('node build/build.js', { cwd: REPO_ROOT, stdio: 'pipe' });
}, 120000);

let projectDir, homeDir;
beforeEach(() => {
  projectDir = fs.mkdtempSync(path.join(os.tmpdir(), 'arcw-kiro-proj-'));
  homeDir = fs.mkdtempSync(path.join(os.tmpdir(), 'arcw-kiro-home-'));
  vi.spyOn(console, 'log').mockImplementation(() => {});
});
afterEach(() => {
  vi.restoreAllMocks();
  fs.rmSync(projectDir, { recursive: true, force: true });
  fs.rmSync(homeDir, { recursive: true, force: true });
});

const homes = () => ({ linux: homeDir, windows: null });

describe('writeKiroConfig — native Unnamed MCP hooks', () => {
  it('rewrites generic skill and launcher references for Kiro', () => {
    const content = [
      '.agents/skills/clarification-gate/SKILL.md',
      '.claude/commands/triage.md',
      'claude --dangerously-skip-permissions --resume session',
    ].join('\n');

    expect(adaptKiroContent(content)).toBe([
      '.kiro/skills/clarification-gate/SKILL.md',
      '.kiro/agents/triage.md',
      'kiro-cli chat --trust-all-tools --agent --resume session',
    ].join('\n'));
  });

  it('installs Kiro agent hooks and grants MCP access to the Unnamed agent', async () => {
    await writeKiroConfig(projectDir, chalk, false, homes(), platform, true, false, false, true);

    const hookPath = path.join(projectDir, '.kiro', 'hooks', 'unnamed-dev-mcp.json');
    const agentPath = path.join(projectDir, '.kiro', 'agents', 'unnamed-dev-mcp.json');
    const hooks = await fs.readJson(hookPath);
    const agent = await fs.readJson(agentPath);
    const generalAgent = await fs.readJson(path.join(projectDir, '.kiro', 'agents', 'triage.json'));

    expect(hooks.version).toBe('v1');
    expect(hooks.hooks.map((hook) => hook.trigger)).toEqual(['SessionStart', 'UserPromptSubmit', 'Stop']);
    expect(agent.includeMcpJson).toBe(true);
    expect(generalAgent.includeMcpJson).toBe(true);
  });

  it('adapts generic skills while preserving their manifest entries', async () => {
    const entries = await writeKiroConfig(projectDir, chalk, false, homes(), platform, true, false, false, true);
    const skillPath = path.join(projectDir, '.kiro', 'skills', 'clarification-gate', 'SKILL.md');
    const content = await fs.readFile(skillPath, 'utf8');
    const entry = entries.find(({ relPath }) => relPath === '.kiro/skills/clarification-gate/SKILL.md');

    expect(content).toContain('.kiro/skills/');
    expect(content).not.toContain('.agents/skills/');
    expect(entry.hash).toBe(installer._internal.sha256(content));
  });
});
