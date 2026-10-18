#!/usr/bin/env node
'use strict';

// Provision local records only. Device discovery and updates are separate tasks.
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const fleet = path.join(root, '.fleet');
const args = process.argv.slice(2);

if (args.length === 1 && ['--help', '-h'].includes(args[0])) {
  console.log('Usage: npm run fleet:init\nCreates a private .fleet/ workspace in this checkout; preserves existing files.');
  process.exit(0);
}
if (args.length) {
  console.error(`Unknown argument: ${args[0]}. Use --help for usage.`);
  process.exit(1);
}

let created = 0;
let preserved = 0;

function ensureDirectory(directory) {
  try {
    const stat = fs.lstatSync(directory);
    if (!stat.isDirectory() || stat.isSymbolicLink()) {
      throw new Error(`Expected a local directory: ${directory}`);
    }
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    fs.mkdirSync(directory, { mode: 0o700 });
    created++;
  }
}

function createFile(name, content) {
  const file = path.join(fleet, name);
  try {
    fs.writeFileSync(file, content, { flag: 'wx', mode: 0o600 });
    created++;
  } catch (error) {
    if (error.code !== 'EEXIST') throw error;
    const stat = fs.lstatSync(file);
    if (!stat.isFile() || stat.isSymbolicLink()) {
      throw new Error(`Expected a local file: ${file}`);
    }
    preserved++;
  }
}

try {
  ensureDirectory(fleet);
  for (const name of ['runs', 'artifacts', 'recovery']) {
    ensureDirectory(path.join(fleet, name));
  }
  createFile('README.md', [
    '# Local fleet workspace',
    '',
    'This directory is Git-ignored and private to this checkout. Keep your device',
    'inventory, operational notes, and rollout history here. It is not synchronized',
    'to other devices or backed up by Git.',
    '',
    'Follow [the fleet guide](../docs/fleet-management.md) and [AGENTS.md](../AGENTS.md).',
    '',
    '- `inventory.json`: device identities, routes, install scopes, and observed versions.',
    '- `runs/<UTC>-<name>/`: plans, per-device receipts, and redacted logs.',
    '- `artifacts/`: verified downloads, grouped by version and platform.',
    '- `recovery/`: recovery references and private notes; retain native restore assets.',
    '',
    'The inventory starts empty. Add only devices verified within your authorized',
    "scope. Keep credentials in the host's credential store, never in these records.",
    'Rerunning `npm run fleet:init` fills missing files and preserves your edits.',
    '',
  ].join('\n'));
  createFile('inventory.json', JSON.stringify({ schemaVersion: 1, devices: [] }, null, 2) + '\n');
  console.log(`Fleet workspace: ${fleet}\nCreated ${created} entries; preserved ${preserved} existing files.\nSee docs/fleet-management.md before device operations.`);
} catch (error) {
  console.error(`Fleet setup failed: ${error.message}`);
  process.exitCode = 1;
}
