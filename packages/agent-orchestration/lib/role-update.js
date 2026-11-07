'use strict';

const fs = require('fs-extra');
const path = require('node:path');
const crypto = require('node:crypto');
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');

// Check every ancestor before reading or writing a managed role destination.
async function state(file) {
  for (let current = path.resolve(file); ; current = path.dirname(current)) {
    const stat = await fs.lstat(current).catch(error => {
      if (error.code === 'ENOENT') return null;
      throw error;
    });
    if (stat?.isSymbolicLink() || (stat && current !== path.resolve(file) && !stat.isDirectory())) {
      return { conflict: true };
    }
    if (current === path.dirname(current)) break;
  }
  const stat = await fs.lstat(file).catch(error => {
    if (error.code === 'ENOENT') return null;
    throw error;
  });
  if (!stat) return { missing: true };
  if (!stat.isFile()) return { conflict: true };
  const bytes = await fs.readFile(file);
  return { bytes, hash: hash(bytes) };
}

// Preflight is read-only until all destinations are known safe. Old ownership
// and incoming bytes permit interrupted retries without adopting custom bytes.
async function prepareRoleUpdate({ candidates, owned, root }) {
  const conflicts = [];
  const changes = [];
  for (const item of candidates) {
    const current = await state(item.full);
    const incoming = hash(item.content);
    if (current.conflict || (!current.missing && current.hash !== incoming && current.hash !== owned.get(item.full))) {
      conflicts.push(item.full);
    } else if (!current.missing && current.hash !== incoming) {
      changes.push({ ...item, previous: current });
    }
  }
  if (conflicts.length) {
    throw new Error(`Role update incomplete: preserved customized or linked assets. Reconcile these paths manually:\n${conflicts.join('\n')}`);
  }
  for (const name of ['manifest.yaml', 'files-manifest.csv']) {
    if ((await state(path.join(root, '_config', name))).conflict) throw new Error('Unsafe role ownership manifest');
  }
  const recovery = path.join(root, 'backups', 'role-update');
  const receipt = path.join(recovery, 'receipt.json');
  const receiptState = await state(receipt);
  if (receiptState.conflict) throw new Error('Unsafe role recovery path');
  if (!changes.length && receiptState.missing) return { complete: async () => {} };
  await fs.ensureDir(recovery);
  const backups = [];
  for (const item of changes) {
    const backup = path.join(recovery, `${hash(item.full)}-${item.previous.hash}.bak`);
    const saved = await state(backup);
    if (saved.conflict || (!saved.missing && saved.hash !== item.previous.hash)) throw new Error('Role recovery copy changed');
    if (saved.missing) await fs.writeFile(backup, item.previous.bytes, { flag: 'wx' });
    backups.push({ path: item.full, backup: path.basename(backup), hash: item.previous.hash });
  }
  // Preserve original manifests as recovery evidence before any role replacement.
  for (const name of ['manifest.yaml', 'files-manifest.csv']) {
    const file = path.join(root, '_config', name);
    const previous = await state(file);
    if (previous.conflict) throw new Error('Unsafe role ownership manifest');
    if (previous.hash) {
      const backup = path.join(recovery, `${name}-${previous.hash}.bak`);
      const saved = await state(backup);
      if (saved.conflict || (!saved.missing && saved.hash !== previous.hash)) throw new Error('Role manifest recovery copy changed');
      if (saved.missing) await fs.writeFile(backup, previous.bytes, { flag: 'wx' });
    }
  }
  const existing = await state(receipt);
  if (existing.conflict) throw new Error('Unsafe role recovery receipt');
  const prior = existing.bytes ? JSON.parse(existing.bytes.toString('utf8')) : null;
  const record = { schemaVersion: 1, status: 'pending', backups: [...(prior?.backups || []), ...backups] };
  const save = async status => {
    // Atomic replacement means readers see pending until the final checkpoint.
    const temporary = path.join(recovery, `receipt-${crypto.randomUUID()}.next`);
    if (!(await state(temporary)).missing) throw new Error('Role recovery checkpoint already exists');
    await fs.writeFile(temporary, JSON.stringify({ ...record, status }, null, 2) + '\n', { flag: 'wx' });
    await fs.rename(temporary, receipt);
  };
  await save('pending');
  return { complete: () => save('complete') };
}

// The receipt precedes asset writes, including updates interrupted before the
// manifest checkpoint. Treat unreadable or invalid recovery state as incomplete.
async function assertRoleUpdateComplete(root, manifest) {
  const incomplete = () => new Error('Role migration incomplete; retain recovery copies and retry the supported update after resolving the failure.');
  if (manifest?.roleMigration === 'pending') throw incomplete();
  let receipt;
  try {
    const saved = await state(path.join(root, 'backups', 'role-update', 'receipt.json'));
    if (saved.missing) return;
    if (saved.conflict) throw incomplete();
    receipt = JSON.parse(saved.bytes.toString('utf8'));
  } catch {
    throw incomplete();
  }
  if (receipt?.schemaVersion !== 1 || receipt.status !== 'complete') throw incomplete();
}

module.exports = { prepareRoleUpdate, assertRoleUpdateComplete };
