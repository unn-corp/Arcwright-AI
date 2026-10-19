'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');

const MARKERS = ['config.toml', 'auth.json', 'sessions', 'AGENTS.md'];
const DAEMON_ENTRIES = { daemon: 'app-server-daemon', control: 'app-server-control' };
const MAX_AUTH_BYTES = 1024 * 1024;

function realpathOrNull(filePath) {
  try {
    return fs.realpathSync(filePath);
  } catch {
    return null;
  }
}

/** Discover only immediate, marked homes; aliases retain their first lexical path. */
function discoverCodexHomes({ homeDir }) {
  let names;
  try {
    names = fs.readdirSync(homeDir).sort();
  } catch {
    return [];
  }
  const homes = [];
  const seen = new Set();
  for (const label of names) {
    if (!/^\.codex(?:$|[-_])/.test(label) || /\.t3-shadow-backups$|\.bak|backup|\.tmp/i.test(label)) continue;
    const homePath = path.resolve(homeDir, label);
    try {
      if (!fs.statSync(homePath).isDirectory()) continue;
      const real = fs.realpathSync(homePath);
      if (seen.has(real)) continue;
      if (!MARKERS.some(marker => {
        try {
          fs.lstatSync(path.join(homePath, marker));
          return true;
        } catch {
          return false;
        }
      })) continue;
      seen.add(real);
      homes.push({ path: homePath, label });
    } catch {
      // Broken aliases and inaccessible candidates cannot identify a home.
    }
  }
  return homes;
}

function sameObject(left, right) {
  return left.dev === right.dev && left.ino === right.ino;
}

function saveLinkRecord(backupRoot, entryPath, linkTarget) {
  fs.mkdirSync(backupRoot, { recursive: true, mode: 0o700 });
  if (!fs.lstatSync(backupRoot).isDirectory()) throw new Error('Backup root is not a directory');
  const at = new Date().toISOString();
  let timestamp = Date.now();
  for (;;) {
    try {
      fs.writeFileSync(path.join(backupRoot, `codex-home-health-${timestamp}.json`),
        JSON.stringify({ path: entryPath, linkTarget, at }) + '\n', { flag: 'wx', mode: 0o600 });
      return;
    } catch (error) {
      if (error.code !== 'EEXIST') throw error;
      timestamp += 1;
    }
  }
}

function checkDaemon(entryPath, { managedBy, selfHeal, dryRun, backupRoot, platform }) {
  let before;
  try {
    before = fs.lstatSync(entryPath);
    if (before.isDirectory()) return 'ok';
    if (!before.isSymbolicLink()) return 'conflict';
    if (managedBy === 'arcwright-code') return 'pending-arcwright-code';
    if (!selfHeal) return 'conflict';
    if (dryRun) return 'would-repair';

    const linkTarget = fs.readlinkSync(entryPath);
    saveLinkRecord(backupRoot, entryPath, linkTarget);
    const current = fs.lstatSync(entryPath);
    if (!current.isSymbolicLink() || !sameObject(before, current) || fs.readlinkSync(entryPath) !== linkTarget) {
      return 'conflict';
    }
    // Never traverse or remove the target, including a broken link's target.
    if (platform === 'win32') fs.rmdirSync(entryPath);
    else fs.unlinkSync(entryPath);
    fs.mkdirSync(entryPath, { mode: 0o700 });
    const after = fs.lstatSync(entryPath);
    return after.isDirectory() && !after.isSymbolicLink() ? 'repaired' : 'conflict';
  } catch (error) {
    // ENOENT before inspection means absent; after a failed repair it is a conflict.
    return !before && error.code === 'ENOENT' ? 'absent' : 'conflict';
  }
}

/** Bound reads and reject links, special files and replacements without exposing errors. */
function inspectAuth(authPath) {
  let fd;
  try {
    const before = fs.lstatSync(authPath);
    if (before.isSymbolicLink()) return { status: 'symlink' };
    if (!before.isFile() || before.size > MAX_AUTH_BYTES) return { status: 'not-checked' };
    fd = fs.openSync(authPath, fs.constants.O_RDONLY | (fs.constants.O_NOFOLLOW || 0) | (fs.constants.O_NONBLOCK || 0));
    const opened = fs.fstatSync(fd);
    if (!opened.isFile() || opened.size > MAX_AUTH_BYTES || !sameObject(before, opened)) return { status: 'not-checked' };
    const buffer = Buffer.alloc(MAX_AUTH_BYTES + 1);
    let size = 0;
    while (size < buffer.length) {
      const read = fs.readSync(fd, buffer, size, buffer.length - size, null);
      if (read === 0) break;
      size += read;
    }
    if (size > MAX_AUTH_BYTES) return { status: 'not-checked' };
    const current = fs.lstatSync(authPath);
    if (current.isSymbolicLink() || !sameObject(opened, current)) return { status: 'not-checked' };
    const parsed = JSON.parse(buffer.toString('utf8', 0, size));
    const token = parsed?.tokens?.refresh_token;
    if (typeof token !== 'string') return { status: 'not-checked' };
    return { status: 'private', digest: createHash('sha256').update(token).digest('hex') };
  } catch (error) {
    return { status: fd === undefined && error.code === 'ENOENT' ? 'missing' : 'not-checked' };
  } finally {
    if (fd !== undefined) fs.closeSync(fd);
  }
}

/** Counts describe daemon/control entries; notChecked counts unchecked auth files. */
function runCodexHomeHealth({ homeDir, codeHomes, policy = {}, dryRun = false,
  backupRoot = path.join(homeDir, '.arcwright', 'backups'), platform = process.platform }) {
  const owned = new Set((codeHomes?.codex || []).map(home => home.shadowHome && realpathOrNull(home.shadowHome)).filter(Boolean));
  const groups = new Map();
  const homes = discoverCodexHomes({ homeDir }).map(home => {
    const managedBy = codeHomes?.status === 'unreadable' ? 'unknown' : owned.has(realpathOrNull(home.path)) ? 'arcwright-code' : 'standalone';
    const options = { managedBy, selfHeal: policy.selfHeal === true, dryRun, backupRoot, platform };
    const auth = policy.copiedLoginCheck === 'local'
      ? inspectAuth(path.join(home.path, 'auth.json')) : { status: 'not-checked' };
    const result = { ...home, managedBy,
      daemon: managedBy === 'unknown' ? 'pending-ownership' : checkDaemon(path.join(home.path, DAEMON_ENTRIES.daemon), options),
      control: managedBy === 'unknown' ? 'pending-ownership' : checkDaemon(path.join(home.path, DAEMON_ENTRIES.control), options),
      auth: auth.status };
    if (auth.digest) {
      if (!groups.has(auth.digest)) groups.set(auth.digest, []);
      groups.get(auth.digest).push(result);
    }
    return result;
  });
  const duplicates = [];
  for (const [digest, members] of groups) {
    if (members.length < 2) continue;
    for (const member of members) member.auth = 'shared-copy';
    duplicates.push({ labels: members.map(member => member.label), fingerprint: digest.slice(0, 12) });
  }
  groups.clear();
  const counts = { repaired: 0, wouldRepair: 0, unchanged: 0, pending: 0, conflicted: 0, notChecked: 0 };
  const countFor = { ok: 'unchanged', absent: 'unchanged', repaired: 'repaired',
    'would-repair': 'wouldRepair', 'pending-arcwright-code': 'pending', 'pending-ownership': 'pending', conflict: 'conflicted' };
  for (const home of homes) {
    counts[countFor[home.daemon]] += 1;
    counts[countFor[home.control]] += 1;
    if (home.auth === 'not-checked') counts.notChecked += 1;
  }
  return { homes, duplicates, counts };
}

function formatCodexHomeHealth(result) {
  const lines = [];
  for (const group of result.duplicates) {
    lines.push(`These homes contain the same Codex refresh credential: ${group.labels.join(', ')} (fingerprint ${group.fingerprint}). Keep it in one home. In each other home, move auth.json out of the home first, then sign in with CODEX_HOME=<home> codex login. Signing in or out over a copy revokes the session for every home that shares it. Do not copy auth.json.`);
  }
  for (const home of result.homes) {
    if (home.auth === 'symlink') lines.push(`${home.label}: auth.json is a link to another home. Sign in separately in this home.`);
    const statuses = new Set([home.daemon, home.control]);
    if (statuses.has('pending-ownership')) lines.push(`${home.label}: Arcwright Code ownership is unknown because settings are unreadable; daemon health pending, no change made.`);
    if (statuses.has('repaired')) lines.push(`${home.label}: Codex daemon state is now account-local.`);
    if (statuses.has('would-repair')) lines.push(`${home.label}: would make Codex daemon state account-local (dry run).`);
    if (statuses.has('pending-arcwright-code')) lines.push(`${home.label}: Arcwright Code links this home's daemon state. Install an Arcwright Code build with per-account daemon state; no change made.`);
    for (const [field, entry] of Object.entries(DAEMON_ENTRIES)) {
      if (home[field] === 'conflict') lines.push(`${home.label}: ${entry} is not a directory or link; left unchanged.`);
    }
  }
  if (lines.length) {
    const c = result.counts;
    lines.push(`Codex home health: ${c.repaired} repaired, ${c.wouldRepair} would repair, ${c.unchanged} unchanged, ${c.pending} pending, ${c.conflicted} conflicted, ${c.notChecked} not checked.`);
  }
  return lines;
}

module.exports = { discoverCodexHomes, runCodexHomeHealth, formatCodexHomeHealth };
