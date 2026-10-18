import { afterEach, describe, expect, it } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import invocation from '../../../build/invocation.js';

const require = createRequire(import.meta.url);
const REPO = path.resolve(__dirname, '../../..');
const ROUTER = path.join(REPO, '.agents/skills/arcwright');
const { capabilityBrief, parseArgs } = require(path.join(ROUTER, 'scripts/agent-capabilities.cjs'));
const { createResolver } = require(path.join(ROUTER, 'scripts/find-entrypoint.cjs'));
const temporary = [];
const put = (root, file, text) => {
  const target = path.join(root, file);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, text);
};
const skill = (name, description = name, extra = '') => `---\nname: ${name}\ndescription: ${description}\n${extra}---\nFollow this procedure.\n`;
const fixture = () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'arcw-capabilities-'));
  temporary.push(root);
  const home = path.join(root, 'home');
  const skillRoot = path.join(home, '.agents/skills/arcwright');
  const project = path.join(root, 'project');
  const profile = '_arcwright/awm/agents/qa.md';
  const registry = { schemaVersion: 1, nonexclusive: true, maxSuggestions: 4, roles: {
    qa: { profile, skills: [{ name: 'test-quality' }, { name: 'playwright-cli', when: ['browser', 'playwright'] },
      { name: 'tauri-testing', when: ['tauri'] }, { name: 'private-check', when: ['custom'] }] },
  } };
  put(project, '.git', 'fixture marker');
  put(skillRoot, 'SKILL.md', skill('arcwright', 'Route a task'));
  for (const file of ['find-entrypoint.cjs', 'agent-capabilities.cjs', 'skill-metadata.cjs']) {
    put(skillRoot, `scripts/${file}`, fs.readFileSync(path.join(ROUTER, 'scripts', file)));
  }
  put(skillRoot, 'agent-capabilities.json', JSON.stringify(registry));
  put(home, '.arcwright/awm/agents/qa.md', 'Global QA profile');
  put(home, '.agents/skills/test-quality/SKILL.md', skill('test-quality', 'Useful tests with global fixtures'));
  put(home, '.agents/skills/playwright-cli/SKILL.md', skill('playwright-cli', 'Browser checks'));
  put(skillRoot, 'commands/test-quality.md', 'A command wrapper must not be a skill suggestion.');
  const catalog = { schemaVersion: 1, entries: [
    { name: 'test-quality', description: 'Old catalog description', kind: 'skill', path: '.agents/skills/test-quality/SKILL.md', gate: null },
    { name: 'test-quality', description: 'Command wrapper', kind: 'command', path: 'commands/test-quality.md', gate: null },
    { name: 'playwright-cli', description: 'Browser checks', kind: 'skill', path: '.agents/skills/playwright-cli/SKILL.md', gate: null },
    { name: 'tauri-testing', description: 'Tauri tests', kind: 'skill', path: '.agents/skills/tauri-testing/SKILL.md', gate: 'tauri' },
  ] };
  put(skillRoot, 'catalog.json', JSON.stringify(catalog));
  return { root, home, project, skillRoot, registry,
    resolver: () => createResolver({ skillRoot, cwd: project, home }),
    run: (...args) => spawnSync(process.execPath, [path.join(skillRoot, 'scripts/agent-capabilities.cjs'), ...args], {
      cwd: project, encoding: 'utf8',
    }),
  };
};
afterEach(() => temporary.splice(0).forEach(root => fs.rmSync(root, { recursive: true, force: true })));

describe('portable agent capability briefs', () => {
  it('uses a customized project skill before global fallback and returns direct readable entrypoints', () => {
    const f = fixture();
    const override = path.join(f.project, '.agents/skills/test-quality/SKILL.md');
    put(f.project, '.agents/skills/test-quality/SKILL.md', skill('test-quality', 'Project-specific test guidance'));
    const result = capabilityBrief({ role: 'arcwright-qa', task: 'Check the browser journey', resolver: f.resolver() });
    expect(result).toMatchObject({ role: 'qa', nonexclusive: true, profilePath: path.join(f.home, '.arcwright/awm/agents/qa.md') });
    expect(result.suggestions).toMatchObject([
      { name: 'test-quality', description: 'Project-specific test guidance', resolvedPath: override },
      { name: 'playwright-cli', resolvedPath: path.join(f.home, '.agents/skills/playwright-cli/SKILL.md') },
    ]);
    expect(result.discovery.finderPath).toBe(path.join(f.skillRoot, 'scripts/find-entrypoint.cjs'));
    expect(result.invocation).toContain('otherwise read the resolved SKILL.md');
    for (const entry of result.suggestions) expect(fs.readFileSync(entry.resolvedPath, 'utf8')).toContain('Follow this procedure');
    expect(fs.readFileSync(override, 'utf8')).toContain('Project-specific');
  });

  it('keeps optional and task-irrelevant hints conditional without claiming installation or limiting discovery', () => {
    const f = fixture();
    const plain = capabilityBrief({ role: 'qa', task: 'Review a unit assertion', resolver: f.resolver() });
    expect(plain.suggestions.map(item => item.name)).toEqual(['test-quality']);
    expect(plain.conditional).toEqual([]);
    const missing = capabilityBrief({ role: 'qa', task: 'Verify a Tauri regression', resolver: f.resolver() });
    expect(missing.suggestions.map(item => item.name)).toEqual(['test-quality']);
    expect(missing.conditional).toMatchObject([{ name: 'tauri-testing', gate: 'tauri', available: false }]);
    expect(fs.existsSync(path.join(f.home, '.agents/skills/tauri-testing'))).toBe(false);
    put(f.project, '.agents/skills/private-check/SKILL.md', skill('private-check', 'Local custom check'));
    const custom = capabilityBrief({ role: 'qa', task: 'Run the custom check', resolver: f.resolver() });
    expect(custom.suggestions.map(item => item.name)).toEqual(['test-quality', 'private-check']);
    expect(custom.invocation).toContain('not a role allowlist');
  });

  it('preserves a project invocation restriction rather than falling through to the global copy', () => {
    const f = fixture();
    put(f.project, '.agents/skills/test-quality/SKILL.md', skill('test-quality', 'Custom restricted skill', 'disable-model-invocation: true\n'));
    const result = capabilityBrief({ role: 'qa', resolver: f.resolver() });
    expect(result.suggestions).toEqual([]);
    expect(result.conditional).toMatchObject([{ name: 'test-quality', available: false, reason: expect.stringContaining('local invocation restriction') }]);
  });

  it('keeps task arguments as data and rejects unknown or duplicate CLI flags', () => {
    const f = fixture();
    const marker = path.join(f.root, 'should-not-exist');
    const task = `browser; touch ${marker}; $(touch ${marker}) \`touch ${marker}\` --role dev`;
    const result = f.run('--role', 'arcwright-qa', '--task', task);
    expect(result.status, result.stderr).toBe(0);
    expect(JSON.parse(result.stdout).suggestions.map(item => item.name)).toEqual(['test-quality', 'playwright-cli']);
    expect(fs.existsSync(marker)).toBe(false);
    expect(() => parseArgs(['--role', 'qa', '--role', 'dev'])).toThrow('Usage:');
    expect(f.run('--role', '../dev').status).toBe(1);
    expect(f.run('--role', 'qa', '--install').status).toBe(1);
  });

  it('caps relevant suggestions without scanning or writing the installed bundle', () => {
    const f = fixture();
    const before = fs.readdirSync(f.skillRoot).sort();
    const registry = structuredClone(f.registry);
    registry.maxSuggestions = 1;
    const result = capabilityBrief({ role: 'qa', task: 'browser', resolver: f.resolver(), registry });
    expect(result.suggestions.map(item => item.name)).toEqual(['test-quality']);
    expect(fs.readdirSync(f.skillRoot).sort()).toEqual(before);
  });
});

describe('agent capability source audits', () => {
  const sourceFixture = () => {
    const f = fixture();
    const root = path.join(f.root, 'source');
    fs.cpSync(path.join(f.home, '.agents/skills'), path.join(root, '.agents/skills'), { recursive: true });
    put(root, '.agents/skills/tauri-testing/SKILL.md', skill('tauri-testing'));
    put(root, '.agents/skills/private-check/SKILL.md', skill('private-check'));
    put(root, '_arcwright/awm/agents/qa.md', '---\nname: qa\ndescription: Verify behavior\n---\nRead agent-runtime.md and execute the task.\n');
    put(root, '_arcwright/core/resources/agent-runtime.md', 'Use agent-capabilities.cjs; suggestions are nonexclusive.');
    put(root, '.agents/skills/subagent-protocol/SKILL.md', skill('subagent-protocol') + 'Use agent-capabilities.cjs in every brief.\n');
    return { ...f, sourceRoot: root };
  };

  it('audits every real role, hint identity and shared discovery wiring', () => {
    const registry = JSON.parse(fs.readFileSync(path.join(ROUTER, 'agent-capabilities.json')));
    expect(Object.keys(registry.roles)).toHaveLength(16);
    const f = sourceFixture();
    expect(invocation.auditAgentCapabilities(f.sourceRoot).issues).toEqual([]);
    put(f.sourceRoot, '_arcwright/awm/agents/new-role.md', 'Read agent-runtime.md');
    expect(invocation.auditAgentCapabilities(f.sourceRoot).issues).toContainEqual(expect.stringContaining('lacks capability hints'));
    fs.rmSync(path.join(f.sourceRoot, '_arcwright/awm/agents/new-role.md'));
    fs.rmSync(path.join(f.sourceRoot, '.agents/skills/private-check'), { recursive: true });
    expect(invocation.auditAgentCapabilities(f.sourceRoot).issues).toContainEqual(expect.stringContaining('qa -> private-check'));
    put(f.sourceRoot, '_arcwright/core/resources/agent-runtime.md', 'Old runtime');
    expect(invocation.auditAgentCapabilities(f.sourceRoot).issues).toContain('Shared agent runtime lacks portable capability discovery.');
  });

  it('detects missing profiles, restrictive role registries and stale operative model/verification mandates', () => {
    const f = sourceFixture();
    const profile = '_arcwright/awm/agents/qa.md';
    put(f.sourceRoot, profile, '---\nname: qa\nmodel: "sonnet"\n---\nRead agent-runtime.md. Require 3 consecutive full-suite passes.\n');
    expect(invocation.auditAgentCapabilities(f.sourceRoot).issues).toEqual([
      expect.stringContaining('Fixed provider/model in agent metadata'), expect.stringContaining('Repeated full-suite quota'),
    ]);
    put(f.sourceRoot, profile, 'Read agent-runtime.md. Do not impose legacy sonnet-first defaults or 3 consecutive full-suite passes.\n');
    expect(invocation.auditAgentCapabilities(f.sourceRoot).issues).toEqual([]);
    fs.rmSync(path.join(f.sourceRoot, profile));
    expect(invocation.auditAgentCapabilities(f.sourceRoot).issues).toContain('Capability registry refers to missing profile: qa');
    const file = path.join(f.sourceRoot, '.agents/skills/arcwright/agent-capabilities.json');
    const registry = JSON.parse(fs.readFileSync(file));
    registry.nonexclusive = false;
    fs.writeFileSync(file, JSON.stringify(registry));
    expect(invocation.auditAgentCapabilities(f.sourceRoot).issues).toContainEqual(expect.stringContaining('restrictive'));
  });

  it('rejects stale defaults in shipped host adapters, including JSON-encoded prompts', () => {
    const f = sourceFixture();
    for (const mod of ['awm', 'core']) fs.renameSync(path.join(f.sourceRoot, '_arcwright', mod), path.join(f.sourceRoot, mod));
    fs.rmdirSync(path.join(f.sourceRoot, '_arcwright'));
    put(f.sourceRoot, '.kiro/steering/arcwright-workflows.md', 'Default model: sonnet for every role.\n');
    put(f.sourceRoot, '.kiro/agents/team.json', JSON.stringify({ prompt: 'Run this workflow.\nRequire three consecutive full-suite passes.\n' }));
    expect(invocation.auditAgentCapabilities(f.sourceRoot).issues).toEqual([
      expect.stringContaining('Fixed provider/model in operative'), expect.stringContaining('Repeated full-suite quota'),
    ]);
    put(f.sourceRoot, '.kiro/steering/arcwright-workflows.md', 'Inherit the selected model.\n');
    put(f.sourceRoot, '.kiro/agents/team.json', JSON.stringify({ prompt: 'Use focused tests and required gates.' }));
    expect(invocation.auditAgentCapabilities(f.sourceRoot).issues).toEqual([]);
  });
});
