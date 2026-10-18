#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
const MANIFEST = '.arcwright-generated.json';

function directory(root, relative, create = false) {
  let current = root;
  for (const segment of relative.split('/')) {
    current = path.join(current, segment);
    if (!fs.existsSync(current) && create) fs.mkdirSync(current);
    const info = fs.lstatSync(current);
    if (!info.isDirectory() || info.isSymbolicLink()) throw new Error(`Expected a local directory: ${current}`);
  }
  return current;
}

function fileState(file) {
  try {
    const info = fs.lstatSync(file);
    return info.isFile() && !info.isSymbolicLink() ? hash(fs.readFileSync(file)) : 'unowned';
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw error;
  }
}

function syncHostCommands(root) {
  root = fs.realpathSync(root);
  const source = directory(root, '.claude/commands');
  const names = fs.readdirSync(source).filter(name => name.endsWith('.md')).sort();
  const sources = Object.fromEntries(names.map(name => {
    if (fileState(path.join(source, name)) === 'unowned') throw new Error(`Unsafe command source: ${name}`);
    return [name, fs.readFileSync(path.join(source, name))];
  }));
  const results = [];
  for (const host of ['.grok', '.opencode']) {
    const destination = directory(root, `${host}/commands`, true);
    const manifest = path.join(destination, MANIFEST);
    const manifestState = fileState(manifest);
    if (manifestState === 'unowned') throw new Error(`Unsafe command manifest: ${manifest}`);
    const previous = manifestState ? JSON.parse(fs.readFileSync(manifest, 'utf8')) : { schemaVersion: 1, files: {} };
    if (previous.schemaVersion !== 1 || !previous.files || typeof previous.files !== 'object' || Array.isArray(previous.files)
      || Object.entries(previous.files).some(([name, value]) => path.basename(name) !== name || /[/\\]/.test(name)
        || !name.endsWith('.md') || !/^[a-f0-9]{64}$/.test(value))) {
      throw new Error(`Invalid command manifest: ${manifest}`);
    }
    const next = {};
    const result = { host, routes: names.length, written: 0, removed: 0, preserved: [] };
    for (const [name, content] of Object.entries(sources)) {
      const target = path.join(destination, name);
      const current = fileState(target);
      const expected = hash(content);
      if (current === expected) next[name] = expected;
      else if (current === null || current === previous.files[name]) {
        fs.writeFileSync(target, content, { flag: current === null ? 'wx' : 'w' });
        next[name] = expected;
        result.written++;
      } else {
        result.preserved.push(name);
        if (previous.files[name]) next[name] = previous.files[name];
      }
    }
    for (const [name, owned] of Object.entries(previous.files)) {
      if (name in sources) continue;
      const target = path.join(destination, name);
      const current = fileState(target);
      if (current === owned) {
        fs.unlinkSync(target);
        result.removed++;
      } else if (current !== null) {
        result.preserved.push(name);
        next[name] = owned;
      }
    }
    const updated = JSON.stringify({ schemaVersion: 1, files: next }, null, 2) + '\n';
    if (!manifestState || fs.readFileSync(manifest, 'utf8') !== updated) fs.writeFileSync(manifest, updated);
    results.push(result);
  }
  return results;
}

if (require.main === module) {
  try {
    if (process.argv.length !== 2) throw new Error('Usage: node build/host-commands.js');
    for (const result of syncHostCommands(path.resolve(__dirname, '..'))) {
      console.log(`${result.host}: ${result.routes} command routes; ${result.written} written, ${result.removed} retired, ${result.preserved.length} custom files preserved`);
    }
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

module.exports = { syncHostCommands };
