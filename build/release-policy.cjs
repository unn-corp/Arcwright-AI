'use strict';

const STABLE = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
const NIGHTLY = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)-nightly\.(\d{8})\.([1-9]\d*)$/;
const VERSION = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z]+(?:[.-][0-9A-Za-z]+)*)?$/;
const MIN_AGE = 24 * 60 * 60 * 1000;

function validateVersion(version) {
  if (typeof version !== 'string' || !VERSION.test(version)) throw new Error('Invalid release version');
  return version;
}

function compareCore(a, b) {
  const left = a.split('.').map(Number), right = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) if (left[i] !== right[i]) return Math.sign(left[i] - right[i]);
  return 0;
}

function planRelease({ channel, head, runNumber, now, packageVersion, stable, nightlies = [] }) {
  if (!/^[a-f0-9]{40}$/.test(head)) throw new Error('Expected the full main commit');
  if (!STABLE.test(packageVersion) || (stable && !STABLE.test(stable.version))) throw new Error('Expected a stable base version');
  const time = new Date(now);
  if (!Number.isFinite(time.getTime())) throw new Error('Invalid release time');
  if (channel === 'nightly') {
    if (stable?.sourceCommit === head || nightlies.some(r => r.sourceCommit === head)) {
      return { skip: true, reason: 'This main commit is already published.' };
    }
    if (!/^[1-9]\d*$/.test(String(runNumber))) throw new Error('Expected the workflow run number');
    const next = stable ? stable.version.replace(/\d+$/, patch => String(Number(patch) + 1)) : packageVersion;
    const base = compareCore(packageVersion, next) > 0 ? packageVersion : next;
    const date = time.toISOString().slice(0, 10).replaceAll('-', '');
    const version = `${base}-nightly.${date}.${runNumber}`;
    return { skip: false, channel: 'next', version, tag: `v${version}`, commit: head };
  }
  if (channel !== 'stable') throw new Error('Expected nightly or stable channel');
  const candidates = nightlies.filter(r => {
    const match = NIGHTLY.exec(r.version);
    const age = time.getTime() - Date.parse(r.publishedAt);
    return match && Number.isFinite(age) && age >= MIN_AGE && r.onMain !== false && r.afterStable !== false &&
      r.sourceCommit !== stable?.sourceCommit && (!stable || compareCore(match.slice(1, 4).join('.'), stable.version) > 0);
  }).sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt));
  const candidate = candidates[0];
  if (!candidate) return { skip: true, reason: 'No newer nightly has completed 24 hours on main.' };
  const version = candidate.version.split('-')[0];
  return { skip: false, channel: 'stable', version, tag: `v${version}`, commit: candidate.sourceCommit, promotedFrom: `v${candidate.version}` };
}

function versionedRuntime(pkg, lock, version) {
  validateVersion(version);
  if (!lock.packages?.['']) throw new Error('Expected a lockfile with root package metadata');
  return {
    pkg: { ...pkg, version },
    lock: { ...lock, version, packages: { ...lock.packages, '': { ...lock.packages[''], version } } },
  };
}

module.exports = { planRelease, versionedRuntime, validateVersion, compareCore };
