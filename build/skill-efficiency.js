#!/usr/bin/env node
'use strict';

// Offline, read-only checks against an explicitly reviewed footprint. UTF-8
// bytes describe context volume; they are not provider token or billing counts.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { auditAgentCapabilities, description, loadSkillAliases, skillEntries } = require('./invocation');

const { skillName } = require('../.agents/skills/arcwright/scripts/skill-metadata.cjs');

const BASELINE = 'docs/skill-efficiency-baseline.json';
const sha256 = text => crypto.createHash('sha256').update(text).digest('hex');

function sourceState(root) {
  const skills = skillEntries(root);
  const issues = [];
  const names = new Map();
  const metrics = {};
  for (const skill of skills) {
    if (names.has(skill.name)) issues.push(`Duplicate skill name ${skill.name}: ${names.get(skill.name)}, ${skill.path}`);
    else names.set(skill.name, skill.path);
    const desc = description(skill.text, '');
    if (!desc) issues.push(`Missing skill description: ${skill.path}`);
    metrics[skill.path] = { name: skill.name, entrypointBytes: Buffer.byteLength(skill.text), descriptionBytes: Buffer.byteLength(desc) };
  }
  try { loadSkillAliases(root, skills); } catch (error) { issues.push(error.message); }
  issues.push(...auditAgentCapabilities(root).issues);
  return { skills, metrics, issues };
}

function refreshBaseline(root) {
  const { metrics, issues } = sourceState(root);
  if (issues.length) throw new Error(issues.join('\n'));
  return { schemaVersion: 1, measurement: 'UTF-8 bytes, not provider token counts',
    review: 'Reviewed entrypoint and description footprints. Refresh only after reviewing additions, removals, and growth.', skills: metrics };
}

// Scope order is the explicit router/audit precedence, not a promise about every
// native host's catalog. Reading symlinked installs is safe; this never writes them.
function scopeSkills({ label, root }) {
  const records = [];
  if (!fs.existsSync(root)) return records;
  const visit = (file, ancestors = new Set(), linked = false) => {
    const symlinked = linked || fs.lstatSync(file).isSymbolicLink();
    const actual = fs.realpathSync(file);
    if (fs.statSync(file).isDirectory()) {
      if (ancestors.has(actual)) throw new Error(`Skill scope directory cycle: ${file}`);
      const next = new Set([...ancestors, actual]);
      for (const entry of fs.readdirSync(file).sort()) visit(path.join(file, entry), next, symlinked);
    } else if (path.basename(file) === 'SKILL.md') {
      const text = fs.readFileSync(file, 'utf8');
      const name = skillName(text);
      if (!name) throw new Error(`Missing or invalid skill name: ${file}`);
      records.push({ name, scope: label, path: path.resolve(file), hash: sha256(text), symlinked });
    }
  };
  visit(root);
  return records;
}

function auditScopes(scopes) {
  const byName = new Map();
  const issues = [];
  const labels = new Set();
  for (const scope of scopes) {
    if (!scope.label || labels.has(scope.label)) throw new Error(`Duplicate or missing skill scope label: ${scope.label}`);
    labels.add(scope.label);
    const seen = new Map();
    try {
      for (const record of scopeSkills(scope)) {
        if (seen.has(record.name)) issues.push(`Duplicate skill name in ${scope.label}: ${record.name} (${seen.get(record.name)}, ${record.path})`);
        else seen.set(record.name, record.path);
        if (!byName.has(record.name)) byName.set(record.name, []);
        byName.get(record.name).push(record);
      }
    } catch (error) { issues.push(`${scope.label}: ${error.message}`); }
  }
  const duplicates = [...byName.entries()].filter(([, copies]) => copies.length > 1).map(([name, copies]) => ({
    name, drift: new Set(copies.map(copy => copy.hash)).size > 1, effective: copies[0], copies,
  })).sort((a, b) => a.name.localeCompare(b.name));
  return { precedence: scopes.map(scope => scope.label), duplicates, driftCount: duplicates.filter(item => item.drift).length, issues };
}

function auditEfficiency(root, baseline, { scopes = [] } = {}) {
  const state = sourceState(root);
  const issues = [...state.issues];
  if (baseline?.schemaVersion !== 1 || !baseline.skills || Array.isArray(baseline.skills)) {
    issues.push(`Missing or invalid reviewed footprint baseline; review sources, then run --refresh-baseline (${BASELINE}).`);
  } else {
    for (const [file, current] of Object.entries(state.metrics)) {
      const expected = baseline.skills[file];
      if (!expected) { issues.push(`Unreviewed skill entrypoint: ${file}`); continue; }
      if (current.name !== expected.name) issues.push(`Skill identity changed: ${file}`);
      for (const field of ['entrypointBytes', 'descriptionBytes']) {
        if (!Number.isInteger(expected[field]) || expected[field] < 0) issues.push(`Invalid ${field} baseline: ${file}`);
        else if (current[field] > expected[field]) issues.push(`${field} grew ${expected[field]} -> ${current[field]}: ${file}`);
      }
    }
    for (const file of Object.keys(baseline.skills)) if (!state.metrics[file]) issues.push(`Removed reviewed skill entrypoint: ${file}`);
  }
  const scopeAudit = auditScopes([{ label: 'project', root: path.join(root, '.agents', 'skills') }, ...scopes]);
  issues.push(...scopeAudit.issues);
  const rows = Object.values(state.metrics);
  return { measurement: 'UTF-8 bytes, not provider token counts', skills: rows.length,
    entrypointBytes: rows.reduce((sum, row) => sum + row.entrypointBytes, 0),
    descriptionBytes: rows.reduce((sum, row) => sum + row.descriptionBytes, 0), scopes: scopeAudit, issues };
}

if (require.main === module) {
  try {
    const args = process.argv.slice(2);
    let mode = '--check';
    let json = false;
    let root = path.resolve(__dirname, '..');
    const scopes = [];
    while (args.length) {
      const arg = args.shift();
      if (arg === '--check' || arg === '--refresh-baseline') mode = arg;
      else if (arg === '--json') json = true;
      else if (arg === '--root' && args.length) root = path.resolve(args.shift());
      else if (arg === '--scope' && args.length) {
        const item = args.shift();
        const at = item.indexOf('=');
        if (at < 1 || !item.slice(at + 1)) throw new Error('Expected --scope label=/absolute/skills/path');
        scopes.push({ label: item.slice(0, at), root: path.resolve(item.slice(at + 1)) });
      } else throw new Error('Usage: node build/skill-efficiency.js [--check|--refresh-baseline] [--scope label=skills-root] [--json] [--root directory]');
    }
    const file = path.join(root, BASELINE);
    if (mode === '--refresh-baseline') {
      const baseline = refreshBaseline(root);
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, `${JSON.stringify(baseline, null, 2)}\n`);
      console.log(`Recorded reviewed footprints for ${Object.keys(baseline.skills).length} skill entrypoints. No skill or installed copy was changed.`);
    } else {
      const baseline = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : null;
      const result = auditEfficiency(root, baseline, { scopes });
      if (json) console.log(JSON.stringify(result, null, 2));
      else {
        console.log(`Checked ${result.skills} skill entrypoints (${result.entrypointBytes} bytes; descriptions ${result.descriptionBytes} bytes).`);
        if (scopes.length) {
          console.log(`Scope precedence: ${result.scopes.precedence.join(' > ')}. ${result.scopes.duplicates.length} shared names; ${result.scopes.driftCount} differ.`);
          for (const item of result.scopes.duplicates.filter(item => item.drift)) console.log(`${item.name}: effective ${item.effective.path}; differing copies preserved.`);
        }
        if (result.issues.length) console.error(result.issues.join('\n'));
        else console.log('Reviewed footprints, unique source names, and alias targets/cycles passed.');
      }
      if (result.issues.length) process.exitCode = 1;
    }
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

module.exports = { BASELINE, auditEfficiency, auditScopes, refreshBaseline, scopeSkills, sourceState };
