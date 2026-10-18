#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { createResolver } = require('./find-entrypoint.cjs');
const discoveryMetadata = require('./skill-metadata.cjs');
const isName = value => typeof value === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
const normalize = value => String(value).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

function validateRegistry(registry) {
  if (registry?.schemaVersion !== 1 || registry.nonexclusive !== true || !Number.isInteger(registry.maxSuggestions)
    || registry.maxSuggestions < 1 || registry.maxSuggestions > 6 || !registry.roles || Array.isArray(registry.roles)) {
    throw new Error('Unsupported or restrictive Arcwright agent capability registry.');
  }
  for (const [role, item] of Object.entries(registry.roles)) {
    if (!isName(role) || !/^_arcwright\/(core|awm|awb|aws-infra|unnamed-pm)\/agents\/[a-z0-9/-]+\.md$/.test(item?.profile || '')
      || item.profile.split('/').includes('..') || !Array.isArray(item.skills)) throw new Error(`Invalid capability role: ${role}`);
    const seen = new Set();
    for (const hint of item.skills) {
      if (!isName(hint?.name) || seen.has(hint.name) || (hint.when !== undefined
        && (!Array.isArray(hint.when) || !hint.when.length || hint.when.some(term => typeof term !== 'string' || !normalize(term))))) {
        throw new Error(`Invalid or duplicate capability hint for ${role}: ${hint?.name}`);
      }
      seen.add(hint.name);
    }
  }
  return registry;
}

function skillMetadata(file, fallback) {
  const text = fs.readFileSync(file, 'utf8');
  const policy = path.join(path.dirname(file), 'agents/openai.yaml');
  return { description: discoveryMetadata.description(text, fallback).slice(0, 220),
    modelInvocable: discoveryMetadata.modelInvocable(text, fs.existsSync(policy) ? fs.readFileSync(policy, 'utf8') : '') };
}

function capabilityBrief({ role, task = '', resolver = createResolver(), registry } = {}) {
  const registryPath = path.join(resolver.skillRoot, 'agent-capabilities.json');
  registry = validateRegistry(registry || JSON.parse(fs.readFileSync(registryPath, 'utf8')));
  const requested = String(role || '').replace(/^[/\$]/, '');
  const slug = Object.hasOwn(registry.roles, requested) ? requested : requested.replace(/^arcwright-/, '');
  if (!Object.hasOwn(registry.roles, slug)) throw new Error(`Unknown Arcwright role: ${requested || '(missing)'}`);
  const definition = registry.roles[slug];
  const words = ` ${normalize(task)} `;
  const relevant = definition.skills.filter(hint => !hint.when || hint.when.some(term => words.includes(` ${normalize(term)} `)));
  const suggestions = [];
  const conditional = [];
  for (const hint of relevant) {
    const found = resolver.skillByName(hint.name);
    const optionalGate = discoveryMetadata.gate(hint.name);
    const gate = resolver.catalog.entries.find(entry => entry.kind === 'skill' && entry.name === hint.name)?.gate || optionalGate;
    if (!found) {
      conditional.push({ name: hint.name, available: false, gate, reason: 'Not installed in the effective skill scopes; continue without it or report a required missing capability. Do not silently install.' });
      continue;
    }
    const metadata = skillMetadata(found.resolvedPath, hint.name);
    if (!metadata.modelInvocable) {
      conditional.push({ name: hint.name, available: false, gate, reason: 'The effective skill has a local invocation restriction; preserve that policy.' });
      continue;
    }
    if (suggestions.some(item => item.resolvedPath === found.resolvedPath) || suggestions.length >= registry.maxSuggestions) continue;
    suggestions.push({ name: found.aliasFor || hint.name, ...metadata, resolvedPath: found.resolvedPath,
      ...(found.aliasFor ? { requestedName: hint.name } : {}), reason: hint.when ? 'Relevant to this task.' : 'Suggested for this role; load only when needed.' });
  }
  return { schemaVersion: 1, role: slug, profilePath: resolver.agentPath(definition.profile), nonexclusive: true,
    suggestions, conditional,
    discovery: { finderPath: path.join(resolver.skillRoot, 'scripts/find-entrypoint.cjs'),
      catalogPath: resolver.catalogFile, registryPath,
      skillScopes: resolver.skillsRoots },
    invocation: 'Use a native matching skill when available; otherwise read the resolved SKILL.md and follow it. Suggestions are not a role allowlist; find other relevant installed skills as needed. Preserve task authorization and host rules.' };
}

function parseArgs(args) {
  const result = {};
  while (args.length) {
    const option = args.shift();
    if (!['--role', '--task'].includes(option) || !args.length || Object.hasOwn(result, option.slice(2))) {
      throw new Error('Usage: node agent-capabilities.cjs --role <profile slug> [--task <task text>]');
    }
    result[option.slice(2)] = args.shift();
  }
  if (!result.role) throw new Error('Usage: node agent-capabilities.cjs --role <profile slug> [--task <task text>]');
  return result;
}

if (require.main === module) {
  try { console.log(JSON.stringify(capabilityBrief(parseArgs(process.argv.slice(2))), null, 2)); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}
module.exports = { capabilityBrief, parseArgs, skillMetadata, validateRegistry };
