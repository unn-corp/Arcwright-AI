#!/usr/bin/env node
'use strict';

// Offline provenance checks. Refreshing local hashes never updates an upstream
// revision or claims that a locally adapted file is identical to that source.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const REPO_ROOT = path.resolve(__dirname, '..');
const MANIFEST = 'docs/skill-sources.json';
const sha256 = data => crypto.createHash('sha256').update(data).digest('hex');

function safePath(root, relative) {
  if (!relative || path.isAbsolute(relative) || relative.includes('\\')) {
    throw new Error(`Expected a repository-relative path: ${relative}`);
  }
  const full = path.resolve(root, relative);
  const rel = path.relative(root, full);
  if (!rel || rel === '..' || rel.startsWith(`..${path.sep}`) || path.isAbsolute(rel)) {
    throw new Error(`Path is outside the source scope: ${relative}`);
  }
  let current = root;
  for (const segment of rel.split(path.sep)) {
    current = path.join(current, segment);
    if (fs.lstatSync(current).isSymbolicLink()) {
      throw new Error(`Refusing symlinked provenance input: ${relative}`);
    }
  }
  return full;
}

function collectLocalFiles(root, family) {
  const files = {};
  const exclusions = family.exclude || [];
  const visit = relative => {
    if (exclusions.some(item => relative === item || relative.startsWith(`${item}/`))) return;
    if (relative.split('/').some(item => item === '.git' || item === '__pycache__') || /\.py[co]$/.test(relative)) return;
    const full = safePath(root, relative);
    if (fs.statSync(full).isDirectory()) {
      for (const entry of fs.readdirSync(full).sort()) visit(`${relative}/${entry}`);
    } else {
      files[relative] = sha256(fs.readFileSync(full));
    }
  };
  if (!Array.isArray(family.localRoots) || !family.localRoots.length) {
    throw new Error(`No local source roots for ${family.id}`);
  }
  for (const relative of family.localRoots) visit(relative);
  if (!Object.keys(files).length) throw new Error(`No local files for ${family.id}`);
  return Object.fromEntries(Object.entries(files).sort(([a], [b]) => a.localeCompare(b)));
}

function validateManifest(manifest) {
  if (manifest.schemaVersion !== 1 || !Array.isArray(manifest.families) || !manifest.families.length) {
    throw new Error('Invalid skill source manifest');
  }
  const seen = new Set();
  for (const family of manifest.families) {
    if (!family.id || seen.has(family.id)) throw new Error(`Duplicate or empty source ID: ${family.id}`);
    seen.add(family.id);
    if (!/^https:\/\/github\.com\/[^/]+\/[^/]+$/.test(family.repository) || !/^[a-f0-9]{40}$/.test(family.revision)) {
      throw new Error(`Expected canonical repository and immutable revision for ${family.id}`);
    }
    if (!family.license || !family.sourcePaths?.length || !family.adaptations) {
      throw new Error(`Missing source, license, or adaptation information for ${family.id}`);
    }
    for (const [file, hash] of Object.entries(family.upstreamFiles || {})) {
      if (!file || !/^[a-f0-9]{64}$/.test(hash)) throw new Error(`Invalid upstream hash in ${family.id}: ${file}`);
    }
  }
}

function checkSources(root, manifest) {
  validateManifest(manifest);
  const errors = [];
  for (const family of manifest.families) {
    try {
      const actual = collectLocalFiles(root, family);
      const expected = family.localFiles || {};
      for (const file of new Set([...Object.keys(actual), ...Object.keys(expected)])) {
        if (actual[file] !== expected[file]) {
          const state = !actual[file] ? 'removed' : !expected[file] ? 'added' : 'changed';
          errors.push(`${family.id}: ${state} ${file}`);
        }
      }
    } catch (error) { errors.push(`${family.id}: ${error.message}`); }
  }
  return errors;
}

function refreshLocal(root, manifest) {
  validateManifest(manifest);
  return { ...manifest, families: manifest.families.map(family => ({
    ...family, localFiles: collectLocalFiles(root, family),
  })) };
}

if (require.main === module) {
  try {
    const mode = process.argv[2] || '--check';
    if (!['--check', '--refresh-local'].includes(mode) || process.argv.length > 3) {
      throw new Error('Usage: node build/skill-sources.js [--check|--refresh-local]');
    }
    const filename = path.join(REPO_ROOT, MANIFEST);
    const manifest = JSON.parse(fs.readFileSync(filename, 'utf8'));
    if (mode === '--refresh-local') {
      fs.writeFileSync(filename, `${JSON.stringify(refreshLocal(REPO_ROOT, manifest), null, 2)}\n`);
      console.log('Updated local hashes only. Upstream revisions and audited upstream hashes are unchanged.');
    } else {
      const errors = checkSources(REPO_ROOT, manifest);
      if (errors.length) throw new Error(`Skill source drift:\n${errors.join('\n')}`);
      console.log(`Verified local source hashes for ${manifest.families.length} audited source families.`);
    }
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

module.exports = { collectLocalFiles, checkSources, refreshLocal, validateManifest };
