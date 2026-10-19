'use strict';
const fs = require('fs-extra');
const path = require('path');
const crypto = require('crypto');
const digest = value => crypto.createHash('sha256').update(value).digest('hex');
const statePath = home => path.join(home, '.arcwright', '_config', 'sharing-state.json');

async function snapshot(file) {
  const stat = await fs.lstat(file).catch(error => { if (error.code === 'ENOENT') return null; throw error; });
  if (!stat) return { type: 'absent' };
  if (stat.isSymbolicLink()) return { type: 'link', target: await fs.readlink(file) };
  if (stat.isFile()) return { type: 'file', hash: digest(await fs.readFile(file)), mode: stat.mode & 0o777 };
  if (stat.isDirectory()) {
    const entries = [];
    for (const name of (await fs.readdir(file)).sort()) entries.push([name, await snapshot(path.join(file, name))]);
    return { type: 'directory', hash: digest(JSON.stringify(entries)), mode: stat.mode & 0o777 };
  }
  return { type: 'other' };
}
// Account directories are checked for emptiness only. Never inventory credentials or sessions.
async function operationSnapshot(operation, file = operation.path) {
  if (operation.action === 'mkdir') {
    const stat = await fs.lstat(file).catch(error => { if (error.code === 'ENOENT') return null; throw error; });
    if (stat?.isDirectory() && (await fs.readdir(file)).length) return { type: 'directory', nonempty: true };
  }
  return snapshot(file);
}
const equal = (a, b) => JSON.stringify(a) === JSON.stringify(b);
async function safeParents(file) {
  for (let current = path.dirname(file); ; current = path.dirname(current)) {
    const stat = await fs.lstat(current).catch(error => { if (error.code === 'ENOENT') return null; throw error; });
    if (stat && (!stat.isDirectory() || stat.isSymbolicLink())) return false;
    if (current === path.dirname(current)) return true;
  }
}
async function readState(homeDir) {
  try {
    const state = await fs.readJson(statePath(homeDir));
    if (state.schemaVersion !== 1 || !Array.isArray(state.operations)) throw new Error('Unsupported sharing records');
    return state;
  } catch (error) {
    if (error.code === 'ENOENT') return { schemaVersion: 1, operations: [] };
    throw error;
  }
}
async function privateDir(dir) {
  await fs.ensureDir(dir, { mode: 0o700 });
  await fs.chmod(dir, 0o700);
}
async function saveState(homeDir, state) {
  const file = statePath(homeDir);
  await privateDir(path.dirname(file));
  const tmp = `${file}.${process.pid}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(state, null, 2) + '\n', { mode: 0o600 });
  await fs.rename(tmp, file);
}

async function applySharingPlan(plan, { dryRun = false } = {}) {
  if (dryRun || !plan.operations.length) return { applied: 0, pending: plan.pending, plan };
  const homeDir = plan.homeDir;
  const lock = path.join(homeDir, '.arcwright', '_config', 'sharing.lock');
  if (!await safeParents(lock)) throw new Error('Sharing records have an unsafe parent');
  await privateDir(path.dirname(lock));
  let fd;
  try { fd = await fs.open(lock, 'wx', 0o600); } catch (error) {
    if (error.code === 'EEXIST') throw new Error('Another sharing operation is active; inspect sharing.lock before retrying');
    throw error;
  }
  let applied = 0;
  const failed = new Set();
  const pending = [...plan.pending];
  try {
    const state = await readState(homeDir);
    // A stale preview may not replace ownership records written by another run.
    if (!equal(state, plan.state)) throw new Error('Sharing state changed after preview; retry');
    for (const operation of plan.operations) {
      if ((operation.requires || []).some(file => failed.has(file))) {
        pending.push(`${operation.path}: sharing dependency could not be applied`);
        failed.add(operation.path);
        continue;
      }
      if (!await safeParents(operation.path) || !equal(await operationSnapshot(operation), operation.before)
        || (operation.source && (!await safeParents(operation.source) || !equal(await snapshot(operation.source), operation.sourceBefore)))) {
        pending.push(`${operation.path}: changed after preview or unsafe parent`);
        failed.add(operation.path);
        continue;
      }
      const runDir = path.dirname(operation.record);
      if (!await safeParents(operation.record)) throw new Error('Unsafe backup parent');
      await privateDir(path.join(homeDir, '.arcwright', 'backups'));
      await privateDir(path.join(homeDir, '.arcwright', 'backups', 'sharing'));
      await privateDir(runDir);
      const record = { ...operation, preimageType: operation.before.type, backup: operation.before.type === 'absent' ? null : operation.backup };
      if (record.backup) await fs.copy(operation.path, record.backup, { dereference: false, preserveTimestamps: true });
      await fs.writeJson(operation.record, record, { spaces: 2, mode: 0o600 });
      // Persist a pending receipt before mutation. Recovery never guesses ownership.
      state.operations.push(record);
      await saveState(homeDir, state);
      await fs.ensureDir(path.dirname(operation.path), { mode: 0o700 });
      if (operation.action === 'remove') await fs.remove(operation.path);
      else if (operation.action === 'mkdir') await fs.mkdir(operation.path, { mode: 0o700 });
      else {
        const staged = `${operation.path}.arcwright-${crypto.randomBytes(8).toString('hex')}`;
        const displaced = `${staged}.previous`;
        try {
          if (operation.action === 'link') await fs.symlink(operation.target, staged);
          else if (operation.action === 'adopt') await fs.copy(operation.source, staged, { dereference: false });
          else await fs.writeFile(staged, operation.content, { mode: operation.mode || operation.before.mode || 0o600, flag: 'wx' });
          if (operation.source && (!equal(await snapshot(operation.source), operation.sourceBefore) || !equal(await snapshot(staged), operation.sourceBefore))) throw new Error(`Bundle changed during sharing apply: ${operation.source}`);
          if (!equal(await operationSnapshot(operation), operation.before)) throw new Error(`Changed during sharing apply: ${operation.path}`);
          if (operation.before.type === 'directory') await fs.rename(operation.path, displaced);
          try { await fs.rename(staged, operation.path); }
          catch (error) {
            if (operation.before.type === 'directory') await fs.rename(displaced, operation.path);
            throw error;
          }
          if (operation.before.type === 'directory') await fs.remove(displaced);
        } finally { await fs.remove(staged); }
      }
      record.applied = await operationSnapshot(operation);
      // Canonical content is retained even when enrollment is later disabled.
      await fs.writeJson(operation.record, record, { spaces: 2, mode: 0o600 });
      await saveState(homeDir, state);
      applied++;
    }
  } finally {
    await fs.close(fd);
    await fs.remove(lock);
  }
  return { applied, pending, plan };
}

async function planRestore({ homeDir, state = null, keepPaths = new Set() }) {
  state ||= await readState(homeDir);
  const operations = [];
  const pending = [];
  const simulated = new Map();
  for (const record of [...state.operations].reverse()) {
    if (record.restored || record.canonical || keepPaths.has(record.path)) continue;
    if (!record.applied) { pending.push(`${record.path}: incomplete receipt requires manual recovery`); continue; }
    const current = simulated.get(record.path) || await operationSnapshot(record);
    if (!equal(current, record.applied) || !await safeParents(record.path)) {
      pending.push(`${record.path}: later user changes preserved`); continue;
    }
    if (record.backup) {
      const root = path.join(homeDir, '.arcwright', 'backups', 'sharing') + path.sep;
      if (!path.resolve(record.backup).startsWith(root) || !equal(await snapshot(record.backup), record.before)) {
        pending.push(`${record.path}: backup missing or changed`); continue;
      }
    }
    operations.push(record);
    simulated.set(record.path, record.before);
  }
  return { homeDir, state, operations, pending, restore: true };
}
async function restoreSharing(plan, { dryRun = false } = {}) {
  if (dryRun || !plan.operations.length) return { applied: 0, pending: plan.pending };
  const lock = path.join(plan.homeDir, '.arcwright', '_config', 'sharing.lock');
  if (!await safeParents(lock)) throw new Error('Unsafe sharing records');
  const fd = await fs.open(lock, 'wx', 0o600);
  const pending = [...plan.pending];
  let applied = 0;
  try {
    if (!equal(await readState(plan.homeDir), plan.state)) throw new Error('Sharing state changed after preview');
    for (const record of plan.operations) {
      if (!await safeParents(record.path) || !equal(await operationSnapshot(record), record.applied)) {
        pending.push(`${record.path}: later user changes preserved`); continue;
      }
      // Do not recursively remove account homes that acquired private state.
      await fs.remove(record.path);
      if (record.backup) await fs.copy(record.backup, record.path, { dereference: false, preserveTimestamps: true });
      record.restored = true;
      await fs.writeJson(record.record, record, { spaces: 2, mode: 0o600 });
      await saveState(plan.homeDir, plan.state);
      applied++;
    }
  } finally { await fs.close(fd); await fs.remove(lock); }
  return { applied, pending };
}
module.exports = { snapshot, equal, safeParents, readState, applySharingPlan, planRestore, restoreSharing };
