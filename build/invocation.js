'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const sha256 = value => crypto.createHash('sha256').update(value).digest('hex');

function filesBelow(root) {
  if (!fs.existsSync(root)) return [];
  return fs.readdirSync(root, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name)).flatMap(entry => {
    const full = path.join(root, entry.name);
    if (entry.isSymbolicLink()) throw new Error(`Refusing symlinked invocation input: ${full}`);
    return entry.isDirectory() ? filesBelow(full) : [full];
  });
}

const { frontmatter, body, skillName, description, modelInvocable, gate } = require('../.agents/skills/arcwright/scripts/skill-metadata.cjs');

function skillEntries(root) {
  return filesBelow(path.join(root, '.agents', 'skills')).filter(file => path.basename(file) === 'SKILL.md').map(file => {
    const text = fs.readFileSync(file, 'utf8');
    const name = skillName(text);
    if (!name) throw new Error(`Missing or invalid skill name: ${file}`);
    return { name, file, text, path: path.relative(root, file).split(path.sep).join('/'), gate: gate(name) };
  });
}

// Aliases are explicitly reviewed equivalents, never guessed from names or links.
// A registry may remain in an installed bundle after its optional pack is excluded.
function resolveAliases(aliases, names, { allowAbsent = false } = {}) {
  const known = new Set(names);
  const resolved = {};
  const resolve = (name, chain = []) => {
    if (chain.includes(name)) throw new Error(`Skill alias cycle: ${[...chain, name].join(' -> ')}`);
    if (!known.has(name)) throw new Error(`Missing skill alias target: ${name}`);
    return Object.hasOwn(aliases, name) ? resolve(aliases[name], [...chain, name]) : name;
  };
  for (const [name, target] of Object.entries(aliases)) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name) || typeof target !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(target)) {
      throw new Error(`Invalid skill alias: ${name}`);
    }
    if (!known.has(name) && allowAbsent && !known.has(target)) continue;
    if (!known.has(name)) throw new Error(`Missing skill alias source: ${name}`);
    resolved[name] = resolve(name);
  }
  return resolved;
}

function loadSkillAliases(root, skills = skillEntries(root), { allowAbsent = false } = {}) {
  const file = path.join(root, '.agents', 'skills', 'arcwright', 'aliases.json');
  if (!fs.existsSync(file)) return {};
  const registry = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (registry.schemaVersion !== 1 || !registry.aliases || Array.isArray(registry.aliases) || typeof registry.aliases !== 'object') {
    throw new Error('Unsupported Arcwright skill alias registry.');
  }
  const aliases = {};
  for (const [name, item] of Object.entries(registry.aliases)) {
    if (!item || typeof item.target !== 'string' || !/^[a-f0-9]{64}$/.test(item.bodyHash || '')) {
      throw new Error(`Missing reviewed alias body: ${name}`);
    }
    const skill = skills.find(skill => skill.name === name);
    if (skill && sha256(skill.text.replace(/^---\r?\n[\s\S]*?\r?\n---\s*/, '').trim()) !== item.bodyHash) {
      throw new Error(`Skill alias body changed; review equivalence before updating the registry: ${name}`);
    }
    aliases[name] = item.target;
  }
  const resolved = resolveAliases(aliases, skills.map(skill => skill.name), { allowAbsent });
  return Object.fromEntries(Object.entries(resolved).map(([name, target]) => {
    const via = [];
    for (let current = name; Object.hasOwn(aliases, current); current = aliases[current]) via.push(current);
    return [name, { target, via }];
  }));
}

function buildInvocationCatalog(root, { source = false, write = true } = {}) {
  const skillRoot = path.join(root, '.agents', 'skills', 'arcwright');
  if (!fs.existsSync(path.join(skillRoot, 'SKILL.md'))) return { entries: [] };
  const commandsRoot = path.join(root, '.claude', 'commands');
  const entries = [];
  const skills = skillEntries(root);
  const duplicateNames = skills.filter((skill, i) => skills.findIndex(other => other.name === skill.name) !== i);
  if (duplicateNames.length) throw new Error(`Duplicate skill names: ${duplicateNames.map(skill => skill.name).join(', ')}`);
  const aliases = loadSkillAliases(root, skills, { allowAbsent: !source });
  const byName = new Map(skills.map(skill => [skill.name, skill]));
  const redirect = name => {
    if (!aliases[name]) return undefined;
    const target = byName.get(aliases[name].target);
    return { kind: 'skill', name: target.name, path: target.path, gate: target.gate,
      sources: aliases[name].via.map(alias => ({ path: byName.get(alias).path, hash: sha256(byName.get(alias).text) })) };
  };
  const put = (relative, content) => {
    if (!write) return;
    const full = path.join(skillRoot, relative);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, content);
  };
  for (const file of filesBelow(commandsRoot).filter(file => file.endsWith('.md'))) {
    const name = path.basename(file, '.md');
    if (name === 'arcwright') continue; // Router dispatch must not recurse into itself.
    const text = fs.readFileSync(file, 'utf8');
    const relative = source && !write ? file : `commands/${name}.md`;
    put(relative, text);
    const skill = byName.get(name);
    const target = redirect(name) || (skill && { kind: 'skill', name, path: skill.path, gate: skill.gate,
      sources: [{ path: skill.path, hash: sha256(skill.text) }] });
    // Only these maintained, description-only forwarding templates are equivalent.
    // Additional instructions/metadata retain the original command's behavior.
    const forwardingPrefix = `Load and run the \`${name}\` skill (\`.agents/skills/${name}/SKILL.md\`) against $ARGUMENTS. `;
    const forwards = target && /^description:[^\n]*(?:\r?\n[ \t]+[^\n]*)*\s*$/.test(frontmatter(text))
      && ['Follow the skill exactly.', 'Follow its Arcwright integration instructions.']
        .some(ending => body(text).trim() === forwardingPrefix + ending);
    entries.push({ name, kind: 'command', description: description(text, name).slice(0, 220), path: relative, gate: gate(name),
      ...(forwards ? { redirect: { ...target, commandHash: sha256(text) } } : {}) });
  }
  for (const skill of skills) {
    if (skill.name === 'arcwright') continue;
    entries.push({ name: skill.name, kind: 'skill', description: description(skill.text, skill.name).slice(0, 220),
      path: skill.path, gate: skill.gate, ...(aliases[skill.name] ? { redirect: redirect(skill.name) } : {}) });
  }
  const modules = source ? path.join(root, '_arcwright') : root;
  for (const mod of ['core', 'awm', 'awb', 'aws-infra', 'unnamed-pm']) {
    const agentsRoot = path.join(modules, mod, 'agents');
    for (const file of filesBelow(agentsRoot).filter(file => file.endsWith('.md'))) {
      const text = fs.readFileSync(file, 'utf8');
      if (!/<agent\s/.test(text) || !text.includes('</agent>') || !/<activation\b[^>]*>/.test(text)) {
        throw new Error(`Incomplete agent profile: ${file}`);
      }
      const menu = text.match(/<menu\s+src="([^"]+)"\s*\/>/);
      if (menu) {
        const menuRoot = path.join(modules, mod, 'resources', 'agent-menus');
        const target = path.resolve(path.dirname(file), menu[1]);
        if (path.isAbsolute(menu[1]) || !filesBelow(menuRoot).includes(target)) {
          throw new Error(`Missing or unsafe agent menu resource: ${file} -> ${menu[1]}`);
        }
      }
      const slug = path.basename(file, '.md');
      entries.push({ name: slug.startsWith('arcwright-') ? slug : `arcwright-${slug}`, kind: 'agent', description: description(text, slug).slice(0, 220),
        path: `_arcwright/${mod}/agents/${path.relative(agentsRoot, file).split(path.sep).join('/')}`, gate: gate(mod) });
    }
  }
  entries.sort((a, b) => a.kind.localeCompare(b.kind) || a.name.localeCompare(b.name));
  const catalog = { schemaVersion: 1, entries };
  put('catalog.json', `${JSON.stringify(catalog, null, 2)}\n`);
  return catalog;
}

function auditContext(root) {
  const groups = {
    skills: filesBelow(path.join(root, '.agents', 'skills')).filter(file => path.basename(file) === 'SKILL.md'),
    agents: ['core', 'awm', 'awb', 'aws-infra', 'unnamed-pm'].flatMap(mod => filesBelow(path.join(root, '_arcwright', mod, 'agents'))).filter(file => file.endsWith('.md')),
    commands: filesBelow(path.join(root, '.claude', 'commands')).filter(file => file.endsWith('.md')),
  };
  const blockers = [];
  const result = { measurement: 'UTF-8 bytes and whitespace-delimited words, not provider token counts', groups: {}, blockers };
  for (const [kind, files] of Object.entries(groups)) {
    const rows = files.map(file => {
      const text = fs.readFileSync(file, 'utf8');
      const relative = path.relative(root, file).split(path.sep).join('/');
      if (!modelInvocable(text)) blockers.push(relative);
      if (!description(text, '')) blockers.push(`${relative} (missing description)`);
      return { path: relative, bytes: Buffer.byteLength(text), words: text.trim().split(/\s+/).length, descriptionChars: description(text, '').length };
    });
    result.groups[kind] = { count: rows.length, bytes: rows.reduce((n, row) => n + row.bytes, 0), words: rows.reduce((n, row) => n + row.words, 0), largest: rows.sort((a, b) => b.bytes - a.bytes).slice(0, 15) };
  }
  for (const file of filesBelow(path.join(root, '.agents', 'skills')).filter(file => /[/\\]agents[/\\]openai\.yaml$/.test(file))) {
    if (!modelInvocable('', fs.readFileSync(file, 'utf8'))) blockers.push(path.relative(root, file).split(path.sep).join('/'));
  }
  const capabilities = auditAgentCapabilities(root);
  result.capabilities = capabilities;
  blockers.push(...capabilities.issues);
  return result;
}

function auditAgentCapabilities(root, { requireRegistry = false } = {}) {
  const router = path.join(root, '.agents', 'skills', 'arcwright');
  const registryFile = path.join(router, 'agent-capabilities.json');
  const source = fs.existsSync(path.join(root, '_arcwright'));
  const modules = source ? path.join(root, '_arcwright') : root;
  const runtime = path.join(modules, 'core', 'resources', 'agent-runtime.md');
  const issues = [];
  const result = { roles: 0, profiles: 0, nonexclusive: true, issues };
  // Small independent invocation fixtures and older uninstalled packages have no
  // shared runtime. A maintained runtime must never silently lose its registry.
  if (!fs.existsSync(registryFile)) {
    if (requireRegistry || fs.existsSync(runtime)) issues.push('Missing agent capability registry: .agents/skills/arcwright/agent-capabilities.json');
    return result;
  }
  let registry;
  try {
    const helper = path.join(router, 'scripts', 'agent-capabilities.cjs');
    if (!fs.existsSync(helper)) throw new Error('Missing portable agent capability helper.');
    registry = require(helper).validateRegistry(JSON.parse(fs.readFileSync(registryFile, 'utf8')));
  } catch (error) { issues.push(error.message); return result; }
  result.roles = Object.keys(registry.roles).length;
  const profiles = ['core', 'awm', 'awb', 'aws-infra', 'unnamed-pm'].flatMap(mod =>
    filesBelow(path.join(modules, mod, 'agents')).filter(file => file.endsWith('.md')).map(file => ({
      slug: path.basename(file, '.md'), file, text: fs.readFileSync(file, 'utf8'),
      logical: `_arcwright/${path.relative(modules, file).split(path.sep).join('/')}`,
    })));
  result.profiles = profiles.length;
  const skills = skillEntries(root);
  const names = new Set(skills.map(skill => skill.name));
  const seen = new Set();
  for (const profile of profiles) {
    if (seen.has(profile.slug)) issues.push(`Duplicate agent profile slug: ${profile.slug}`);
    seen.add(profile.slug);
    const definition = registry.roles[profile.slug];
    if (!definition) issues.push(`Agent profile lacks capability hints: ${profile.logical}`);
    else if (definition.profile !== profile.logical) issues.push(`Capability profile path changed: ${profile.slug}`);
    if (!profile.text.includes('agent-runtime.md')) issues.push(`Agent lacks shared discovery runtime: ${profile.logical}`);
  }
  for (const [role, definition] of Object.entries(registry.roles)) {
    // Package source contains every optional family. Installed audits may omit a
    // role only when its module is also absent; omitted skills stay conditional.
    const mod = definition.profile.split('/')[1];
    const optionalAbsent = !source && ['aws-infra', 'unnamed-pm'].includes(mod) && !fs.existsSync(path.join(modules, mod));
    if (!seen.has(role) && !optionalAbsent) issues.push(`Capability registry refers to missing profile: ${role}`);
    for (const hint of definition.skills) {
      if (!names.has(hint.name) && (source || !gate(hint.name))) issues.push(`Capability hint has no source skill: ${role} -> ${hint.name}`);
    }
  }
  if (!fs.existsSync(runtime) || !fs.readFileSync(runtime, 'utf8').includes('agent-capabilities.cjs')) {
    issues.push('Shared agent runtime lacks portable capability discovery.');
  }
  const protocol = path.join(root, '.agents', 'skills', 'subagent-protocol', 'SKILL.md');
  if (fs.existsSync(protocol) && !fs.readFileSync(protocol, 'utf8').includes('agent-capabilities.cjs')) {
    issues.push('Delegation protocol lacks explicit capability briefs.');
  }
  const teamFiles = filesBelow(path.join(root, '.agents', 'skills')).filter(file =>
    /^team-/.test(path.basename(path.dirname(file))) && /^(SKILL|RULES)\.md$/.test(path.basename(file)));
  const protocolFiles = filesBelow(path.join(root, '.agents', 'skills', 'subagent-protocol')).filter(file => file.endsWith('.md'));
  const callerFiles = ['task-manager', 'triage', 'skill-scout', 'subagent-driven-development', 'pr-review-panel', 'review-loop',
    'agent-instructions', 'hookify', 'browser-use', 'react-expert', 'ci-gates', 'build-mcp-server']
    .flatMap(name => ['SKILL.md', 'RULES.md'].map(file => path.join(root, '.agents', 'skills', name, file)))
    .concat(['triage', 'tasks', 'skill-scout'].map(name => path.join(root, '.claude', 'commands', `${name}.md`)))
    .filter(file => fs.existsSync(file));
  // Check generated host adapters as well as authored profiles. A workshop may
  // have an older local .kiro install; packaged adapters are the shipped output.
  const adapters = source ? [] : [
    path.join(root, '.kiro', 'steering', 'arcwright-workflows.md'),
    path.join(root, '.kiro', 'agents', 'team.json'),
  ].filter(file => fs.existsSync(file));
  for (const file of [...profiles.map(profile => profile.file), ...teamFiles, ...protocolFiles, ...callerFiles, ...adapters]) {
    const raw = fs.readFileSync(file, 'utf8');
    const text = file.endsWith('.json') ? JSON.parse(raw).prompt || raw : raw;
    const relative = path.relative(root, file).split(path.sep).join('/');
    const fmModel = frontmatter(text).match(/^model:\s*["']?([^"'\r\n#]+)["']?/m)?.[1]?.trim();
    if (fmModel && !/^(inherit|auto|default)$/i.test(fmModel)) issues.push(`Fixed provider/model in agent metadata: ${relative}`);
    // Restrict matching to defaults and actual call arguments. Explanations of
    // an unsupported legacy name or conditional real-host examples remain valid.
    if (/^[ \t]*["']model["']\s*:\s*["'](?:sonnet|opus|haiku|claude-[^"']+|gpt-[^"']+|gemini[^"']*)["']/mi.test(text)
      || /^(?![^\n]*(?:legacy|do not|never|rather than|no longer|previously|historical))[^\n]*(?:sonnet[ -]first|opus[ -]first|(?:default(?: model)?(?: is| to|:)?|MODEL DEFAULT:)[^\n]{0,35}\b(?:sonnet|opus|haiku)\b)/mi.test(text)) {
      issues.push(`Fixed provider/model in operative orchestration instructions: ${relative}`);
    }
    if (text.split(/\r?\n/).some(line => !/\b(?:legacy|do not|never|no longer|previously|historical)\b/i.test(line)
      && /\b(?:3|three)\s+consecutive\s+(?:successful\s+)?(?:full[- ]suite\s+)?passes\b|\b(?:3|three)\s+(?:consecutive\s+)?full[- ]suite\s+passes\b/i.test(line))) {
      issues.push(`Repeated full-suite quota in operative orchestration instructions: ${relative}`);
    }
  }
  return result;
}

function verifyModelInvocation(root) {
  const blockers = auditContext(root).blockers;
  if (blockers.length) throw new Error(`Model invocation is disabled for:\n${blockers.join('\n')}`);
}

if (require.main === module) {
  const root = path.resolve(__dirname, '..');
  if (process.argv[2] === '--local') {
    console.log(`Indexed ${buildInvocationCatalog(root, { source: true }).entries.length} local command, agent, and skill routes.`);
  } else {
    const audit = auditContext(root);
    console.log(JSON.stringify(audit, null, 2));
    if (audit.blockers.length) process.exitCode = 1;
  }
}

module.exports = { auditAgentCapabilities, auditContext, buildInvocationCatalog, description, frontmatter, gate, loadSkillAliases, resolveAliases, skillEntries, verifyModelInvocation };
