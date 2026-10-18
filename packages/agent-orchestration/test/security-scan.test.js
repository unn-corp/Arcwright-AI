import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const scanner = path.resolve(__dirname, '../../../.agents/skills/security-review/scripts/secret-scan.sh');
const canary = 'SYNTHETIC_CREDENTIAL_VALUE_DO_NOT_PRINT';

function fixture(check) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'arcw-secret-scan-'));
  const bin = path.join(root, 'bin');
  fs.mkdirSync(bin);
  for (const [tool, variable] of [['gitleaks', 'LEAK_STATUS'], ['trufflehog', 'HOG_STATUS']]) {
    fs.writeFileSync(path.join(bin, tool), `#!/bin/sh\nprintf '%s\\n' '${canary}'\nprintf '%s\\n' '${canary}' >&2\nexit "$${variable}"\n`, { mode: 0o755 });
  }
  const run = (leakStatus, hogStatus, target = root) => spawnSync('/bin/bash', [scanner, 'files', target], {
    env: { ...process.env, PATH: bin, LEAK_STATUS: String(leakStatus), HOG_STATUS: String(hogStatus) },
    encoding: 'utf8',
  });
  try { check({ root, bin, run }); }
  finally { fs.rmSync(root, { recursive: true, force: true }); }
}

describe.skipIf(process.platform === 'win32')('secret screening output boundary', () => {
  it('distinguishes completed scans, candidates, and errors without forwarding either output stream', () => fixture(({ run }) => {
    for (const [leaks, hog, expected, messages] of [
      [0, 0, 0, ['completed; no candidates']],
      [3, 183, 1, ['candidates found']],
      [1, 1, 2, ['scan error']],
      [3, 126, 2, ['candidates found', 'scan error']],
    ]) {
      const result = run(leaks, hog);
      expect(result.status, result.stderr).toBe(expected);
      for (const message of messages) expect(result.stdout).toContain(message);
      expect(result.stdout + result.stderr).not.toContain(canary);
      expect(result.stdout).not.toContain('unavailable');
    }
  }));

  it('reports missing tools and invalid targets as incomplete without exposing target text', () => fixture(({ root, bin, run }) => {
    fs.rmSync(path.join(bin, 'gitleaks'));
    fs.rmSync(path.join(bin, 'trufflehog'));
    const missing = run(0, 0);
    expect(missing.status).toBe(2);
    expect(missing.stdout).toContain('unavailable (not installed)');
    const invalid = run(0, 0, path.join(root, canary));
    expect(invalid.status).toBe(2);
    expect(invalid.stderr).toContain('target directory unavailable');
    expect(invalid.stdout + invalid.stderr).not.toContain(canary);
  }));
});
