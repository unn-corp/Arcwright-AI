#!/usr/bin/env node
'use strict';

// Arcwright GitHub Release launcher. Node and tar are the only runtime tools.
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const { spawnSync, execFileSync } = require('node:child_process');

const RELEASES = 'https://github.com/unn-corp/Arcwright-AI/releases';
const MARKER = '// Arcwright GitHub Release launcher.';

function option(args, name, short) {
  const index = args.findIndex(arg => arg === name || arg === short || arg.startsWith(`${name}=`));
  if (index < 0) return undefined;
  const value = args[index].includes('=') ? args[index].slice(name.length + 1) : args[index + 1];
  if (!value || value.startsWith('--')) throw new Error(`${name} needs a value`);
  return value;
}

function takeOption(args, name) {
  const value = option(args, name);
  if (value !== undefined) {
    const index = args.findIndex(arg => arg === name || arg.startsWith(`${name}=`));
    args.splice(index, args[index].includes('=') ? 1 : 2);
  }
  return value;
}

async function download(url) {
  const parsed = new URL(url);
  if (parsed.protocol !== 'https:' && !(parsed.protocol === 'http:' && ['127.0.0.1', 'localhost', '[::1]'].includes(parsed.hostname))) {
    throw new Error('Release downloads require HTTPS');
  }
  const response = await fetch(url, { signal: AbortSignal.timeout(120_000) });
  if (!response.ok) throw new Error(`Download failed (${response.status}): ${url}`);
  return Buffer.from(await response.arrayBuffer());
}

function validateMetadata(metadata) {
  if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(metadata.version)
      || metadata.tag !== `v${metadata.version}`
      || metadata.archive !== `arcwright-${metadata.version}.tar.gz`
      || !/^[a-f0-9]{64}$/.test(metadata.sha256)) {
    throw new Error('Invalid Arcwright release metadata');
  }
  return metadata;
}

function installedChannel(args) {
  const explicit = option(args, '--channel');
  if (explicit) return explicit;
  const global = args.includes('--global') || args.includes('-g');
  const directory = path.resolve(option(args, '--directory', '-d') || process.cwd());
  const manifest = path.join(global ? path.join(os.homedir(), '.arcwright') : path.join(directory, '_arcwright'), '_config/manifest.yaml');
  if (!fs.existsSync(manifest)) return 'stable';
  return /^channel:\s*['"]?next['"]?\s*$/m.test(fs.readFileSync(manifest, 'utf8')) ? 'next' : 'stable';
}

async function releaseSource(args, archive, pinned) {
  if (archive) {
    const absolute = path.resolve(archive);
    const metadata = validateMetadata(JSON.parse(fs.readFileSync(path.join(path.dirname(absolute), 'release.json'), 'utf8')));
    if (path.basename(absolute) !== metadata.archive) throw new Error('Archive filename does not match release.json');
    if (pinned && pinned.replace(/^v/, '') !== metadata.version) throw new Error('Archive does not match --release');
    return { metadata, bytes: fs.readFileSync(absolute) };
  }
  const releases = process.env.ARCWRIGHT_RELEASES_URL || RELEASES;
  let location;
  if (pinned) {
    if (!/^v?\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(pinned)) throw new Error('Invalid --release version');
    location = `${releases}/download/v${pinned.replace(/^v/, '')}`;
  } else if (installedChannel(args) === 'next') {
    const list = JSON.parse(await download('https://api.github.com/repos/unn-corp/Arcwright-AI/releases?per_page=100'));
    const release = list.find(item => !item.draft && item.prerelease && /^v\d+\.\d+\.\d+-/.test(item.tag_name));
    if (!release) throw new Error('No next-channel Arcwright release is published');
    location = `${releases}/download/${release.tag_name}`;
  } else {
    location = `${releases}/latest/download`;
  }
  const metadata = validateMetadata(JSON.parse(await download(`${location}/release.json`)));
  if (pinned && metadata.version !== pinned.replace(/^v/, '')) throw new Error('Release metadata does not match --release');
  // Resolve the archive through its immutable version URL, even when latest moves.
  const bytes = await download(`${releases}/download/${metadata.tag}/${metadata.archive}`);
  return { metadata, bytes };
}

function unpack(bytes, metadata, dataDir) {
  const digest = crypto.createHash('sha256').update(bytes).digest('hex');
  if (digest !== metadata.sha256) throw new Error('Arcwright archive checksum mismatch; nothing was installed');
  fs.mkdirSync(dataDir, { recursive: true });
  const temporary = fs.mkdtempSync(path.join(dataDir, '.download-'));
  try {
    const archive = path.join(temporary, 'release.tar.gz');
    fs.writeFileSync(archive, bytes);
    const listing = execFileSync('tar', ['-tzf', archive], { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
    for (const entry of listing.trim().split('\n')) {
      if (!entry.startsWith('arcwright/') || entry.includes('\\') || entry.split('/').includes('..')) {
        throw new Error(`Unsafe release archive entry: ${entry}`);
      }
    }
    // Releases contain only directories and regular files, never links or devices.
    const types = execFileSync('tar', ['-tvzf', archive], { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
    if (types.trim().split('\n').some(line => !/^[d-]/.test(line))) throw new Error('Release archive contains unsupported file types');
    execFileSync('tar', ['-xzf', archive, '-C', temporary], { stdio: 'pipe' });
    const extracted = path.join(temporary, 'arcwright');
    const pkg = JSON.parse(fs.readFileSync(path.join(extracted, 'package.json'), 'utf8'));
    if (pkg.version !== metadata.version || !fs.existsSync(path.join(extracted, 'bin/arcwright.js'))) {
      throw new Error('Release runtime does not match metadata');
    }
    const runtime = path.join(dataDir, 'releases', `${metadata.version}-${digest.slice(0, 16)}`);
    fs.mkdirSync(path.dirname(runtime), { recursive: true });
    if (!fs.existsSync(runtime)) fs.renameSync(extracted, runtime);
    return runtime;
  } finally {
    fs.rmSync(temporary, { recursive: true, force: true });
  }
}

function launcherPath() {
  return path.join(os.homedir(), '.local/bin/arcwright');
}

function checkLauncher() {
  const destination = launcherPath();
  if (fs.existsSync(destination) || (() => { try { return fs.lstatSync(destination).isSymbolicLink(); } catch { return false; } })()) {
    if (fs.lstatSync(destination).isSymbolicLink() || !fs.readFileSync(destination, 'utf8').includes(MARKER)) {
      throw new Error(`An existing command owns ${destination}. Move it aside before installing Arcwright.`);
    }
  }
}

async function main(input = process.argv.slice(2)) {
  if (Number(process.versions.node.split('.')[0]) < 20) throw new Error('Arcwright requires Node.js 20 or newer');
  const args = [...input];
  const archive = takeOption(args, '--archive');
  const pinned = takeOption(args, '--release');
  const dataDir = path.join(os.homedir(), '.local/share/arcwright');
  const statePath = path.join(dataDir, 'current.json');
  const command = args.find(arg => !arg.startsWith('-'));
  const informational = ['--help', '-h', '--version', '-V'].some(arg => args.includes(arg)) || ['list', 'uninstall', 'migrate'].includes(command);
  let runtime;
  if (!archive && !pinned && informational && fs.existsSync(statePath)) {
    const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
    runtime = path.join(dataDir, 'releases', state.runtime);
    if (path.dirname(runtime) !== path.join(dataDir, 'releases')) throw new Error('Invalid cached runtime');
  } else {
    checkLauncher();
    const { metadata, bytes } = await releaseSource(args, archive, pinned);
    runtime = unpack(bytes, metadata, dataDir);
  }
  const result = spawnSync(process.execPath, [path.join(runtime, 'bin/arcwright.js'), ...args], {
    cwd: process.cwd(), env: process.env, stdio: 'inherit',
  });
  if (result.error) throw result.error;
  if (result.status !== 0) return result.status || 1;
  if (!informational) {
    checkLauncher();
    fs.mkdirSync(path.dirname(launcherPath()), { recursive: true });
    // Temp-file + rename leaves the previous working launcher intact on failure.
    const temporary = `${launcherPath()}.${process.pid}.tmp`;
    fs.copyFileSync(__filename, temporary);
    fs.chmodSync(temporary, 0o755);
    fs.renameSync(temporary, launcherPath());
    const stateTemporary = `${statePath}.${process.pid}.tmp`;
    fs.writeFileSync(stateTemporary, JSON.stringify({ runtime: path.basename(runtime) }) + '\n');
    fs.renameSync(stateTemporary, statePath);
    console.log(`\nArcwright command: ${launcherPath()}\nAdd ~/.local/bin to PATH if needed. Updates: arcwright update`);
  }
  return 0;
}

if (require.main === module) {
  main().then(code => { process.exitCode = code; }).catch(error => {
    console.error(`Arcwright: ${error.message}`);
    process.exitCode = 1;
  });
}

module.exports = { main };
