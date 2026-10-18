import { afterEach, describe, expect, it } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import invocation from '../../../build/invocation.js';
import efficiency from '../../../build/skill-efficiency.js';

const { auditContext, buildInvocationCatalog, description, resolveAliases } = invocation;
const { auditEfficiency, auditScopes, refreshBaseline } = efficiency;
const REPO = path.resolve(__dirname, '../../..');
const temporary = [];
const put = (root, file, content) => {
  const target = path.join(root, file);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content);
};
const fixture = () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'arcw-invocation-'));
  temporary.push(root);
  const base = '.agents/skills/arcwright';
  put(root, `${base}/SKILL.md`, '---\nname: arcwright\ndescription: Route a task\n---\n');
  put(root, `${base}/scripts/find-entrypoint.cjs`, fs.readFileSync(path.join(REPO, `${base}/scripts/find-entrypoint.cjs`)));
  put(root, `${base}/scripts/skill-metadata.cjs`, fs.readFileSync(path.join(REPO, `${base}/scripts/skill-metadata.cjs`)));
  put(root, '.claude/commands/debug.md', '---\ndescription: Diagnose a failure\n---\nFollow the debugging procedure for $ARGUMENTS.\n');
  put(root, '.claude/commands/arcwright.md', '---\ndescription: Route a task\n---\n');
  put(root, '.claude/commands/dotnet.md', '---\ndescription: Work on .NET\n---\nRun the installed .NET reference.\n');
  put(root, '_arcwright/awm/agents/dev.md', '---\nname: dev\ndescription: Implement code\n---\n<agent id="dev"><activation>Execute the task</activation></agent>\n');
  return { root, base, find: query => spawnSync(process.execPath, [path.join(root, `${base}/scripts/find-entrypoint.cjs`), query], { cwd: root, encoding: 'utf8' }) };
};
const aliasFixture = () => {
  const f = fixture();
  const alias = 'matt-pocock-grill-me';
  const target = 'matt-pocock-grilling';
  const body = `Read and follow [the interview](../${target}/SKILL.md).`;
  put(f.root, `.agents/skills/${alias}/SKILL.md`, `---\nname: ${alias}\ndescription: Interview to sharpen a plan\n---\n\n${body}\n`);
  put(f.root, `.agents/skills/${target}/SKILL.md`, `---\nname: ${target}\ndescription: Interview about design decisions\n---\nCanonical procedure.\n`);
  put(f.root, '.agents/skills/matt-pocock-grill-with-docs/SKILL.md', '---\nname: matt-pocock-grill-with-docs\ndescription: Interview and write design documents\n---\nRun both interview and modeling procedures.\n');
  put(f.root, `.claude/commands/${alias}.md`, `---\ndescription: Run the ${alias} skill.\n---\n\nLoad and run the \`${alias}\` skill (\`.agents/skills/${alias}/SKILL.md\`) against $ARGUMENTS. Follow its Arcwright integration instructions.\n`);
  put(f.root, `${f.base}/aliases.json`, JSON.stringify({ schemaVersion: 1, aliases: {
    [alias]: { target, bodyHash: crypto.createHash('sha256').update(body).digest('hex') },
  } }));
  return { ...f, alias, target };
};
afterEach(() => temporary.splice(0).forEach(root => fs.rmSync(root, { recursive: true, force: true })));

describe('model invocation routes and context audit', () => {
  it('routes canonical skill names and legacy aliases to the same current procedure', () => {
    const f = fixture();
    for (const [legacy, canonical] of [['claude-subagent-protocol', 'subagent-protocol'], ['claude-md-management', 'agent-instructions'], ['sol-loop', 'review-loop']]) {
      for (const name of [canonical, legacy]) {
        const run = spawnSync(process.execPath, [path.join(REPO, '.agents/skills/arcwright/scripts/find-entrypoint.cjs'), name], { cwd: REPO, encoding: 'utf8' });
        expect(run.status, run.stderr).toBe(0);
        const found = JSON.parse(run.stdout)[0];
        expect(found.executionKind).toBe('skill');
        expect(found.resolvedPath).toBe(path.join(REPO, '.agents/skills', canonical, 'SKILL.md'));
        expect(fs.readFileSync(found.resolvedPath, 'utf8')).toContain(`name: ${canonical}`);
      }
      const packaged = path.join(REPO, 'packages/agent-orchestration/src/.agents/skills');
      const run = spawnSync(process.execPath, [path.join(packaged, 'arcwright/scripts/find-entrypoint.cjs'), legacy], { cwd: f.root, encoding: 'utf8' });
      expect(run.status, run.stderr).toBe(0);
      expect(JSON.parse(run.stdout)[0]).toMatchObject({ executionKind: 'skill', aliasFor: canonical, resolvedPath: path.join(packaged, canonical, 'SKILL.md') });
    }
    // Packaging must retain operative launcher text rather than regenerating it.
    for (const name of ['full-send', 'full-stop']) {
      const packaged = path.join(REPO, 'packages/agent-orchestration/src/.agents/skills');
      const run = spawnSync(process.execPath, [path.join(packaged, 'arcwright/scripts/find-entrypoint.cjs'), name], { cwd: f.root, encoding: 'utf8' });
      expect(run.status, run.stderr).toBe(0);
      const found = JSON.parse(run.stdout)[0];
      expect(found.executionKind).toBe('command');
      expect(fs.readFileSync(found.resolvedPath, 'utf8')).toBe(fs.readFileSync(path.join(REPO, '.claude/commands', `${name}.md`), 'utf8'));
      const kiro = JSON.parse(fs.readFileSync(path.join(REPO, 'packages/agent-orchestration/src/.kiro/agents', `${name}.json`), 'utf8'));
      expect(kiro.prompt).toContain(`This invocation selects ${name === 'full-send' ? 'merge' : 'ready'} mode`);
    }
  });

  it('retains every real profile and exposes all of them through the portable catalog', () => {
    const f = fixture();
    for (const mod of ['core', 'awm', 'awb', 'aws-infra', 'unnamed-pm']) {
      fs.cpSync(path.join(REPO, '_arcwright', mod, 'agents'), path.join(f.root, '_arcwright', mod, 'agents'), { recursive: true });
      fs.cpSync(path.join(REPO, '_arcwright', mod, 'resources/agent-menus'), path.join(f.root, '_arcwright', mod, 'resources/agent-menus'), { recursive: true });
    }
    const catalog = buildInvocationCatalog(f.root, { source: true });
    const agents = catalog.entries.filter(entry => entry.kind === 'agent');
    expect(agents).toHaveLength(17);
    expect(agents.map(agent => agent.name)).toContain('arcwright-master');
    for (const agent of agents) {
      const text = fs.readFileSync(path.join(f.root, agent.path), 'utf8');
      expect(text, agent.path).toMatch(/<activation\b[^>]*>/);
      expect(text, agent.path).toContain('</agent>');
      const menu = text.match(/<menu src="([^"]+)"\s*\/>/);
      expect(menu, agent.path).not.toBeNull();
      const menuText = fs.readFileSync(path.resolve(path.dirname(path.join(f.root, agent.path)), menu[1]), 'utf8');
      expect(menuText).toContain('<menu>');
      expect(text, agent.path).toContain('agent-runtime.md');
    }
    expect(auditContext(REPO).blockers).toEqual([]);
    fs.rmSync(path.join(f.root, '_arcwright/awm/resources/agent-menus/dev.md'));
    expect(() => buildInvocationCatalog(f.root, { source: true })).toThrow('Missing or unsafe agent menu resource');
  });
  it('makes command procedures and agent profiles available without duplicating skill entrypoints', () => {
    const f = fixture();
    const catalog = buildInvocationCatalog(f.root, { source: true });
    expect(catalog.entries.map(entry => entry.name)).toEqual(['arcwright-dev', 'debug', 'dotnet']);
    expect(fs.readFileSync(path.join(f.root, f.base, 'commands/debug.md'), 'utf8')).toContain('$ARGUMENTS');
    const result = f.find('/debug');
    expect(result.status, result.stderr).toBe(0);
    expect(JSON.parse(result.stdout)[0]).toMatchObject({ name: 'debug', kind: 'command', path: 'commands/debug.md', score: 1000 });
    expect(JSON.parse(result.stdout)).toHaveLength(1);
    expect(JSON.parse(f.find('arcwright-dev').stdout)[0]).toMatchObject({ kind: 'agent', path: '_arcwright/awm/agents/dev.md' });
    expect(fs.readdirSync(path.join(f.root, '.agents/skills'))).toEqual(['arcwright']);
  });

  it('hides routes for an optional skill pack until that pack is installed', () => {
    const f = fixture();
    buildInvocationCatalog(f.root, { source: true });
    expect(f.find('dotnet').status).toBe(1);
    put(f.root, '.agents/skills/dotnet-aot-compat/SKILL.md', '---\nname: dotnet-aot-compat\ndescription: Native AOT\n---\n');
    expect(JSON.parse(f.find('dotnet').stdout)[0].name).toBe('dotnet');
  });

  it('resolves a reviewed alias directly in exact and descriptive searches while retaining combined workflows', () => {
    const f = aliasFixture();
    buildInvocationCatalog(f.root, { source: true });
    const result = JSON.parse(f.find(`/${f.alias}`).stdout);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ name: f.alias, kind: 'command', executionKind: 'skill', aliasFor: f.target,
      resolvedPath: path.join(f.root, '.agents/skills', f.target, 'SKILL.md') });
    expect(JSON.parse(f.find('sharpen plan').stdout)[0]).toMatchObject({ name: f.alias, kind: 'command', aliasFor: f.target });
    const combined = JSON.parse(f.find('matt-pocock-grill-with-docs').stdout)[0];
    expect(combined).toMatchObject({ kind: 'skill', executionKind: 'skill' });
    expect(combined.aliasFor).toBeUndefined();
    expect(fs.readFileSync(combined.resolvedPath, 'utf8')).toContain('both interview and modeling');
  });

  it('keeps exact command behavior when a namesake skill has different steps', () => {
    const f = fixture();
    put(f.root, '.agents/skills/debug/SKILL.md', '---\nname: debug\ndescription: Diagnose a failure through a different workflow\n---\nDifferent skill procedure.\n');
    buildInvocationCatalog(f.root, { source: true });
    const found = JSON.parse(f.find('/debug').stdout);
    expect(found).toHaveLength(1);
    expect(found[0].executionKind).toBe('command');
    expect(fs.readFileSync(found[0].resolvedPath, 'utf8')).toContain('for $ARGUMENTS');
  });

  it('skips a pure forwarding command while retaining custom commands and delivery mode instructions', () => {
    const f = fixture();
    put(f.root, '.agents/skills/example/SKILL.md', '---\nname: example\ndescription: Example procedure\n---\nExecute the requested example.\n');
    const wrapper = '---\ndescription: Example command\n---\n\nLoad and run the `example` skill (`.agents/skills/example/SKILL.md`) against $ARGUMENTS. Follow the skill exactly.\n';
    put(f.root, '.claude/commands/example.md', wrapper);
    buildInvocationCatalog(f.root, { source: true });
    expect(JSON.parse(f.find('example').stdout)[0]).toMatchObject({ executionKind: 'skill',
      resolvedPath: path.join(f.root, '.agents/skills/example/SKILL.md') });
    const command = path.join(f.root, f.base, 'commands/example.md');
    fs.appendFileSync(command, '\nRun my additional step.\n');
    expect(JSON.parse(f.find('example').stdout)[0]).toMatchObject({ executionKind: 'command', resolvedPath: command });
    put(f.root, '.claude/commands/example.md', wrapper.trimEnd() + ' This invocation selects merge mode.\n');
    buildInvocationCatalog(f.root, { source: true });
    expect(JSON.parse(f.find('example').stdout)[0].executionKind).toBe('command');
    put(f.root, '.claude/commands/example.md', wrapper.replace('description:', 'allowed-tools: Read\ndescription:'));
    buildInvocationCatalog(f.root, { source: true });
    expect(JSON.parse(f.find('example').stdout)[0].executionKind).toBe('command');
  });

  it('honors customized alias and command bodies instead of bypassing their steps', () => {
    const f = aliasFixture();
    buildInvocationCatalog(f.root, { source: true });
    const command = path.join(f.root, f.base, 'commands', `${f.alias}.md`);
    const original = fs.readFileSync(command, 'utf8');
    fs.appendFileSync(command, '\nRun my additional check.\n');
    expect(JSON.parse(f.find(f.alias).stdout)[0]).toMatchObject({ executionKind: 'command', resolvedPath: command });
    fs.writeFileSync(command, original);
    fs.appendFileSync(path.join(f.root, '.agents/skills', f.alias, 'SKILL.md'), '\nPreserve my local step.\n');
    expect(JSON.parse(f.find(f.alias).stdout)[0]).toMatchObject({ executionKind: 'command', resolvedPath: command });
    expect(() => buildInvocationCatalog(f.root, { source: true })).toThrow('review equivalence');
  });

  it('hides an unchanged alias when its canonical optional target is absent', () => {
    const f = aliasFixture();
    buildInvocationCatalog(f.root, { source: true });
    fs.rmSync(path.join(f.root, '.agents/skills', f.target), { recursive: true });
    const listed = JSON.parse(f.find('--list').stdout);
    expect(listed.map(entry => entry.name)).not.toContain(f.alias);
    fs.rmSync(path.join(f.root, '.agents/skills', f.alias), { recursive: true });
    // Installed catalogs can retain entries for a completely excluded pack.
    expect(f.find('/debug').status).toBe(0);
  });

  it('uses an existing project override when lookup runs from a global installed router', () => {
    const f = aliasFixture();
    buildInvocationCatalog(f.root, { source: true });
    const project = path.join(f.root, 'project');
    fs.mkdirSync(path.join(project, '_arcwright'), { recursive: true });
    const override = `.agents/skills/${f.target}/SKILL.md`;
    put(project, override, `---\nname: ${f.target}\ndescription: Project interview\n---\nProject-specific steps.\n`);
    const run = spawnSync(process.execPath, [path.join(f.root, f.base, 'scripts/find-entrypoint.cjs'), f.alias], { cwd: project, encoding: 'utf8' });
    expect(run.status, run.stderr).toBe(0);
    expect(JSON.parse(run.stdout)[0].resolvedPath).toBe(path.join(project, override));
  });

  it('rejects alias cycles and missing targets while permitting fully excluded optional packs', () => {
    expect(() => resolveAliases({ a: 'b', b: 'a' }, ['a', 'b'])).toThrow('alias cycle');
    expect(() => resolveAliases({ a: 'missing' }, ['a'])).toThrow('Missing skill alias target');
    expect(resolveAliases({ optional: 'target' }, [], { allowAbsent: true })).toEqual({});
    expect(() => resolveAliases({ optional: 'target' }, ['optional'], { allowAbsent: true })).toThrow('Missing skill alias target');
  });

  it('supports a fresh source checkout without writing a catalog or command copies', () => {
    const f = fixture();
    put(f.root, 'build/invocation.js', fs.readFileSync(path.join(REPO, 'build/invocation.js')));
    const result = f.find('/debug');
    expect(result.status, result.stderr).toBe(0);
    expect(JSON.parse(result.stdout)[0]).toMatchObject({ name: 'debug', path: path.join(f.root, '.claude/commands/debug.md') });
    expect(fs.readdirSync(path.join(f.root, f.base)).sort()).toEqual(['SKILL.md', 'scripts']);
  });

  it('keeps natural-language search bounded and reports an absent route', () => {
    const f = fixture();
    for (let i = 0; i < 15; i++) put(f.root, `.claude/commands/failure-${i}.md`, '---\ndescription: Diagnose a failure\n---\nInspect the evidence.\n');
    buildInvocationCatalog(f.root, { source: true });
    expect(JSON.parse(f.find('diagnose failure').stdout)).toHaveLength(8);
    expect(f.find('no-such-capability').status).toBe(1);
  });

  it('detects actual model blockers while preserving user-invocable policy and literal examples', () => {
    const f = fixture();
    put(f.root, '.agents/skills/hidden/SKILL.md', '---\nname: hidden\ndescription: Hidden example\ndisable-model-invocation: true\n---\n');
    put(f.root, '.agents/skills/auto/SKILL.md', '---\nname: auto\ndescription: Automatic skill\nuser-invocable: false\n---\nExample:\n```yaml\ndisable-model-invocation: true\n```\n');
    put(f.root, '.agents/skills/auto/agents/openai.yaml', 'policy:\n  allow_implicit_invocation: false\n');
    expect(auditContext(f.root).blockers).toEqual([
      '.agents/skills/hidden/SKILL.md', '.agents/skills/auto/agents/openai.yaml',
    ]);
  });

  it('reads folded YAML descriptions instead of indexing a literal block indicator', () => {
    expect(description('---\nname: demo\ndescription: >-\n  Build an app\n  with real widgets.\nlicense: MIT\n---\n', 'fallback')).toBe('Build an app with real widgets.');
  });

  it('rejects a truncated profile instead of silently dropping its invocation route', () => {
    const f = fixture();
    put(f.root, '_arcwright/awm/agents/dev.md', '---\nname: dev\ndescription: Developer\n---\nOnly a preamble survived.\n');
    expect(() => buildInvocationCatalog(f.root, { source: true })).toThrow('Incomplete agent profile');
  });

  it.skipIf(process.platform === 'win32')('rejects symlinked command input', () => {
    const f = fixture();
    fs.symlinkSync(path.join(f.root, '.claude/commands/debug.md'), path.join(f.root, '.claude/commands/linked.md'));
    expect(() => buildInvocationCatalog(f.root, { source: true })).toThrow('symlinked invocation input');
  });
});

describe('reviewed skill footprint and scope drift', () => {
  it('allows shrinkage and requires review for entrypoint and description growth separately', () => {
    const f = fixture();
    const file = '.agents/skills/example/SKILL.md';
    const original = '---\nname: example\ndescription: Example\n---\nA deliberately detailed example procedure.\n';
    put(f.root, file, original);
    const baseline = refreshBaseline(f.root);
    put(f.root, file, original.replace('deliberately detailed example procedure', 'procedure'));
    expect(auditEfficiency(f.root, baseline).issues).toEqual([]);
    put(f.root, file, `${original}Another required step.\n`);
    expect(auditEfficiency(f.root, baseline).issues).toEqual([expect.stringContaining('entrypointBytes grew')]);
    put(f.root, file, '---\nname: example\ndescription: Example with a longer trigger\n---\nGo.\n');
    expect(auditEfficiency(f.root, baseline).issues).toEqual([expect.stringContaining('descriptionBytes grew')]);
  });

  it('flags an unreviewed skill and ambiguous duplicate identities', () => {
    const f = fixture();
    const baseline = refreshBaseline(f.root);
    const text = '---\nname: duplicate\ndescription: A procedure\n---\nDo the task.\n';
    put(f.root, '.agents/skills/one/SKILL.md', text);
    expect(auditEfficiency(f.root, baseline).issues).toContainEqual(expect.stringContaining('Unreviewed skill entrypoint'));
    put(f.root, '.agents/skills/two/SKILL.md', text);
    expect(() => refreshBaseline(f.root)).toThrow('Duplicate skill name duplicate');
  });

  it('reports ordered project precedence and divergent installed copies without modifying them', () => {
    const f = fixture();
    const global = path.join(f.root, 'global-skills');
    const custom = '---\nname: arcwright\ndescription: My global router\n---\nKeep these custom steps.\n';
    put(global, 'arcwright/SKILL.md', custom);
    const report = auditScopes([{ label: 'project', root: path.join(f.root, '.agents/skills') }, { label: 'global', root: global }]);
    expect(report.issues).toEqual([]);
    expect(report.driftCount).toBe(1);
    expect(report.duplicates[0]).toMatchObject({ name: 'arcwright', drift: true, effective: { scope: 'project', path: path.join(f.root, f.base, 'SKILL.md') } });
    expect(fs.readFileSync(path.join(global, 'arcwright/SKILL.md'), 'utf8')).toBe(custom);
  });
});
