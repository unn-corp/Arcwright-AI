#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const metadata = require('./skill-metadata.cjs');

// Shared read-only resolution for the command router and delegated capability
// briefs. Skill hints use skillByName, never a namesake command wrapper.
function createResolver({ skillRoot = path.resolve(__dirname, '..'), cwd = process.cwd(), home = os.homedir() } = {}) {
  const catalogFile = path.join(skillRoot, 'catalog.json');
  const sourceRoot = path.resolve(skillRoot, '../../..');
  const sourceHelper = path.join(sourceRoot, 'build/invocation.js');
  const sourceFallback = !fs.existsSync(catalogFile) && fs.existsSync(sourceHelper)
    && fs.existsSync(path.join(sourceRoot, '.claude/commands'));
  const catalog = sourceFallback
    ? require(sourceHelper).buildInvocationCatalog(sourceRoot, { source: true, write: false })
    : fs.existsSync(catalogFile) ? JSON.parse(fs.readFileSync(catalogFile, 'utf8')) : { schemaVersion: 1, entries: [] };
  if (catalog.schemaVersion !== 1 || !Array.isArray(catalog.entries)) throw new Error('Unsupported Arcwright invocation catalog.');
  const siblingSkills = path.dirname(skillRoot);
  const projectSkills = [];
  let projectRoot = null;
  for (let current = path.resolve(cwd); ; current = path.dirname(current)) {
    if (fs.existsSync(path.join(current, '_arcwright')) || fs.existsSync(path.join(current, '.git'))) {
      projectRoot = current;
      const host = path.basename(path.dirname(siblingSkills));
      for (const scope of new Set([host, '.agents'])) {
        const candidate = path.join(current, scope, 'skills');
        if (fs.existsSync(candidate)) projectSkills.push(candidate);
      }
      break;
    }
    if (current === path.dirname(current)) break;
  }
  const skillsRoots = [...new Set([...projectSkills, siblingSkills])];
  const installed = skillsRoots.flatMap(root => fs.existsSync(root) ? fs.readdirSync(root) : []);
  const gateEnabled = gate => metadata.gateEnabled(gate, installed);
  const skillPath = logical => {
    if (typeof logical !== 'string' || !logical.startsWith('.agents/skills/') || !logical.endsWith('/SKILL.md')) return null;
    const relative = logical.slice('.agents/skills/'.length);
    if (relative.split('/').some(segment => !segment || segment === '..' || segment === '.') || relative.includes('\\')) return null;
    return skillsRoots.map(root => path.join(root, relative)).find(file => fs.existsSync(file)) || null;
  };
  const agentPath = logical => {
    if (!/^_arcwright\/(core|awm|awb|aws-infra|unnamed-pm)\/agents\/[a-z0-9/-]+\.md$/.test(logical)
      || logical.split('/').includes('..')) return null;
    const local = projectRoot && path.join(projectRoot, logical);
    if (local && fs.existsSync(local)) return local;
    if (sourceFallback && fs.existsSync(path.join(sourceRoot, logical))) return path.join(sourceRoot, logical);
    const global = path.join(home, '.arcwright', logical.slice('_arcwright/'.length));
    return fs.existsSync(global) ? global : null;
  };
  const entryPath = entry => {
    if (entry.kind === 'skill') return skillPath(entry.path);
    if (entry.kind === 'agent') return agentPath(entry.path);
    if (entry.kind !== 'command') return null;
    if (sourceFallback) {
      const relative = path.relative(path.join(sourceRoot, '.claude/commands'), entry.path);
      return relative && !relative.startsWith('..') && !path.isAbsolute(relative) ? entry.path : null;
    }
    return /^commands\/[a-z0-9-]+\.md$/.test(entry.path) ? path.join(skillRoot, entry.path) : null;
  };
  const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
  const resolve = entry => {
    if (!gateEnabled(entry.gate)) return null;
    const original = entryPath(entry);
    if (!original || !fs.existsSync(original)) return null;
    const target = entry.redirect;
    if (target) {
      // Customized aliases and command wrappers retain their authored behavior.
      const sources = (target.sources || []).map(item => ({ ...item, full: skillPath(item.path) }));
      const commandUnchanged = entry.kind !== 'command' || hash(original) === target.commandHash;
      if (commandUnchanged && sources.some(item => !item.full || !fs.existsSync(item.full))) return null;
      const unchanged = commandUnchanged && sources.length && sources.every(item => hash(item.full) === item.hash);
      if (unchanged) {
        const full = skillPath(target.path);
        if (!gateEnabled(target.gate) || !full || !fs.existsSync(full)) return null;
        return { ...entry, executionKind: 'skill', resolvedPath: full, aliasFor: target.name };
      }
    }
    return { ...entry, executionKind: entry.kind, resolvedPath: original };
  };
  const skillByName = name => {
    const entry = catalog.entries.find(item => item.kind === 'skill' && item.name === name);
    if (entry) return resolve(entry);
    // A project-owned/custom skill may be newer than an installed catalog.
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name)) return null;
    const direct = skillPath(`.agents/skills/${name}/SKILL.md`);
    return direct ? { name, kind: 'skill', executionKind: 'skill', resolvedPath: direct } : null;
  };
  return { catalog, catalogFile: fs.existsSync(catalogFile) ? catalogFile : null, sourceFallback,
    skillRoot, projectRoot, skillsRoots, gateEnabled, skillPath, agentPath, resolve, skillByName };
}

function findEntrypoints(resolver, input) {
  const query = input.replace(/^[/\$]/, '').toLowerCase();
  const words = query.split(/[^a-z0-9]+/).filter(word => word.length > 1);
  const list = input === '--list';
  const priority = { command: 0, agent: 1, skill: 2 };
  const rank = entry => {
    if (entry.name === query) return 1000;
    const title = new Set(entry.name.toLowerCase().split(/[^a-z0-9]+/));
    const description = new Set(entry.description.toLowerCase().split(/[^a-z0-9]+/));
    return words.reduce((score, word) => score + (title.has(word) ? 10 : 0) + (description.has(word) ? 1 : 0), 0);
  };
  const routes = new Map();
  for (const entry of resolver.catalog.entries.map(resolver.resolve).filter(Boolean).sort((a, b) => priority[a.kind] - priority[b.kind])) {
    const score = list ? 1 : rank(entry);
    if (!routes.has(entry.name)) routes.set(entry.name, { ...entry, score });
    else routes.get(entry.name).score = Math.max(routes.get(entry.name).score, score);
  }
  const unique = [...routes.values()].filter(entry => entry.score > 0)
    .sort((a, b) => b.score - a.score || priority[a.kind] - priority[b.kind] || a.name.localeCompare(b.name));
  const exact = list ? [] : unique.filter(entry => entry.name === query);
  return list ? unique : exact.length ? exact : unique.slice(0, 8);
}

if (require.main === module) {
  try {
    const input = process.argv.slice(2).join(' ').trim();
    if (!input) {
      console.error('Pass a command name or a short task description; use --list to list installed routes.');
      process.exitCode = 2;
    } else {
      const found = findEntrypoints(createResolver(), input);
      console.log(JSON.stringify(found, null, 2));
      if (!found.length) process.exitCode = 1;
    }
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

module.exports = { createResolver, findEntrypoints };
