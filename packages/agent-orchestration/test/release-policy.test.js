import { describe, it, expect } from 'vitest';
import policy from '../../../build/release-policy.cjs';

const { planRelease, versionedRuntime } = policy;
const head = 'a'.repeat(40), earlier = 'b'.repeat(40), oldest = 'c'.repeat(40);
const stable = { version: '1.2.4', sourceCommit: oldest };
const nightly = (over = {}) => ({ version: '1.2.5-nightly.20261017.12', sourceCommit: earlier, publishedAt: '2026-10-17T07:23:00Z', ...over });
const args = (over = {}) => ({ channel: 'nightly', head, packageVersion: '1.2.4', stable, nightlies: [], runNumber: 24, now: '2026-10-19T07:23:00Z', ...over });

describe('scheduled Arcwright publication', () => {
  it('allocates ordered nightlies without requiring a source version commit each day', () => {
    expect(planRelease(args())).toEqual({ skip: false, channel: 'next', version: '1.2.5-nightly.20261019.24', tag: 'v1.2.5-nightly.20261019.24', commit: head });
    expect(planRelease(args({ packageVersion: '2.0.0' })).version).toBe('2.0.0-nightly.20261019.24');
    expect(planRelease(args({ stable: { version: '1.2.5', sourceCommit: earlier } })).version).toBe('1.2.6-nightly.20261019.24');
  });

  it('skips a main commit already published on either channel', () => {
    expect(planRelease(args({ stable: { ...stable, sourceCommit: head } })).skip).toBe(true);
    expect(planRelease(args({ nightlies: [nightly({ sourceCommit: head })] })).skip).toBe(true);
  });

  it('promotes the newest mature nightly, keeping its source rather than the current main tip', () => {
    const result = planRelease(args({ channel: 'stable', nightlies: [nightly(), nightly({ version: '1.2.5-nightly.20261019.23', sourceCommit: head, publishedAt: '2026-10-19T07:00:00Z' })] }));
    expect(result).toEqual({ skip: false, channel: 'stable', version: '1.2.5', tag: 'v1.2.5', commit: earlier, promotedFrom: 'v1.2.5-nightly.20261017.12' });
    expect(planRelease(args({ channel: 'stable', now: '2026-10-18T07:23:00Z', nightlies: [nightly()] })).skip).toBe(false);
  });

  it('does not republish stable, roll back, promote branches, or accept invalid timestamps', () => {
    for (const bad of [{ sourceCommit: oldest }, { version: '1.2.4-nightly.20261017.12' }, { onMain: false }, { afterStable: false }, { publishedAt: 'bad' }]) {
      expect(planRelease(args({ channel: 'stable', nightlies: [nightly(bad)] })).skip).toBe(true);
    }
    expect(planRelease(args({ channel: 'stable', nightlies: [] })).skip).toBe(true);
  });

  it('aligns runtime and lockfile versions while preserving dependencies and source objects', () => {
    const pkg = { name: 'arcwright', version: '1.2.4', private: true, dependencies: { yaml: '^2.4.0' } };
    const lock = { version: '1.2.4', packages: { '': { version: '1.2.4', dependencies: pkg.dependencies }, 'node_modules/yaml': { version: '2.9.0' } } };
    const result = versionedRuntime(pkg, lock, '1.2.5-nightly.20261019.24');
    expect(result.pkg.version).toBe('1.2.5-nightly.20261019.24');
    expect(result.lock.version).toBe(result.pkg.version);
    expect(result.lock.packages[''].version).toBe(result.pkg.version);
    expect(result.lock.packages['node_modules/yaml']).toEqual({ version: '2.9.0' });
    expect(result.pkg.dependencies).toEqual({ yaml: '^2.4.0' });
    expect(pkg.version).toBe('1.2.4');
    expect(lock.packages[''].version).toBe('1.2.4');
    expect(() => versionedRuntime(pkg, lock, '../unsafe')).toThrow('Invalid release version');
  });
});
