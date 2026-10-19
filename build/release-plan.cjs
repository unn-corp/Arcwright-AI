#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { execFileSync, spawnSync } = require('node:child_process');
const { planRelease, validateVersion, compareCore } = require('./release-policy.cjs');
const repo = process.env.GITHUB_REPOSITORY;
const head = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
const root = path.resolve(__dirname, '..');
const packageVersion = require(path.join(root, 'packages/agent-orchestration/package.json')).version;
const ancestor = (a, b) => {
  const result = spawnSync('git', ['merge-base', '--is-ancestor', a, b], { stdio: 'ignore' });
  if (![0, 1].includes(result.status)) throw new Error('Unable to establish release ancestry');
  return result.status === 0;
};
const api = endpoint => JSON.parse(execFileSync('gh', ['api', endpoint], { encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 }));

function metadata(release) {
  const asset = release.assets.find(a => a.name === 'release.json');
  if (!asset) throw new Error(`Published release ${release.tag_name} lacks release.json`);
  const value = JSON.parse(execFileSync('gh', ['api', '-H', 'Accept: application/octet-stream', `repos/${repo}/releases/assets/${asset.id}`], { encoding: 'utf8' }));
  validateVersion(value.version);
  if (value.tag !== release.tag_name || value.tag !== `v${value.version}` ||
      value.archive !== `arcwright-${value.version}.tar.gz` || !/^[a-f0-9]{64}$/.test(value.sha256) ||
      !/^[a-f0-9]{40}$/.test(value.sourceCommit)) throw new Error('Invalid published release identity');
  return { ...value, publishedAt: release.published_at };
}

function plan() {
  if (repo !== 'unn-corp/Arcwright-AI') throw new Error('Publication is restricted to unn-corp/Arcwright-AI');
  if (!ancestor(head, 'origin/main')) throw new Error('Release source is not on main');
  const ref = process.env.GITHUB_REF || '';
  if (ref.startsWith('refs/tags/v')) {
    const version = validateVersion(ref.slice('refs/tags/v'.length));
    if (version !== packageVersion) throw new Error('Manual tag must match the source package version');
    return { skip: false, channel: version.includes('-') ? 'next' : 'stable', version, tag: `v${version}`, commit: head };
  }
  if (ref !== 'refs/heads/main') throw new Error('Scheduled and dispatched publication requires main');
  const channel = process.env.GITHUB_EVENT_NAME === 'schedule'
    ? (process.env.RELEASE_SCHEDULE === '23 8 * * 0' ? 'stable' : 'nightly')
    : process.env.RELEASE_CHANNEL || 'nightly';
  const releases = [];
  for (let page = 1; ; page++) {
    const batch = api(`repos/${repo}/releases?per_page=100&page=${page}`);
    releases.push(...batch.filter(r => !r.draft && /^v\d+\.\d+\.\d+(?:-nightly\.\d{8}\.\d+)?$/.test(r.tag_name)));
    if (batch.length < 100) break;
  }
  const stableRelease = releases.filter(r => !r.prerelease && !r.tag_name.includes('-'))
    .sort((a, b) => compareCore(b.tag_name.slice(1), a.tag_name.slice(1)))[0];
  const stable = stableRelease ? metadata(stableRelease) : null;
  const nightlies = releases.filter(r => r.prerelease && r.tag_name.includes('-nightly.')).map(metadata);
  if (channel === 'stable') for (const candidate of nightlies) {
    candidate.onMain = ancestor(candidate.sourceCommit, head);
    candidate.afterStable = !stable || ancestor(stable.sourceCommit, candidate.sourceCommit);
  }
  return planRelease({ channel, head, packageVersion, stable, nightlies,
    now: new Date().toISOString(), runNumber: process.env.GITHUB_RUN_NUMBER });
}

try {
  const result = plan();
  if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT,
    Object.entries(result).map(([key, value]) => `${key}=${value}\n`).join(''));
  console.log(JSON.stringify(result));
} catch (error) { console.error(error.message); process.exitCode = 1; }
