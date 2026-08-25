import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const REPO_ROOT = path.resolve(__dirname, '..', '..', '..');

describe('build source walker', () => {
  it.skipIf(process.platform === 'win32')('rejects an outside-root symlink before it reaches generated src or the package tarball', () => {
    const outsideDir = fs.mkdtempSync(path.join(os.tmpdir(), 'arcw-build-symlink-'));
    const packDir = fs.mkdtempSync(path.join(os.tmpdir(), 'arcw-build-pack-'));
    const caseId = path.basename(outsideDir);
    const outsideFile = path.join(outsideDir, 'outside-root.txt');
    const sourceLink = path.join(REPO_ROOT, '_arcwright', 'core', `.outside-root-${caseId}.txt`);
    const generatedFile = path.join(REPO_ROOT, 'packages', 'agent-orchestration', 'src', 'core', `.outside-root-${caseId}.txt`);
    const packageEntry = `package/src/core/.outside-root-${caseId}.txt`;

    try {
      fs.writeFileSync(outsideFile, 'outside-root sentinel', 'utf8');
      fs.symlinkSync(outsideFile, sourceLink);

      let buildError;
      try {
        execFileSync(process.execPath, [path.join(REPO_ROOT, 'build', 'build.js')], {
          cwd: REPO_ROOT,
          encoding: 'utf8',
          stdio: ['ignore', 'pipe', 'pipe'],
        });
      } catch (error) {
        buildError = error;
      }

      expect(buildError).toBeTruthy();
      expect(`${buildError?.stderr ?? ''}`).toMatch(/symlink/i);
      expect(fs.existsSync(generatedFile)).toBe(false);

      const packResult = JSON.parse(execFileSync('npm', ['pack', '--json', '--pack-destination', packDir], {
        cwd: path.join(REPO_ROOT, 'packages', 'agent-orchestration'),
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
      }));
      const tarballPath = path.join(packDir, packResult[0].filename);
      const tarListing = execFileSync('tar', ['-tf', tarballPath], { encoding: 'utf8' });
      expect(tarListing.split('\n')).not.toContain(packageEntry);
    } finally {
      fs.rmSync(sourceLink, { force: true });
      try {
        execFileSync(process.execPath, [path.join(REPO_ROOT, 'build', 'build.js')], {
          cwd: REPO_ROOT,
          stdio: 'ignore',
        });
      } finally {
        fs.rmSync(generatedFile, { force: true });
        fs.rmSync(outsideDir, { recursive: true, force: true });
        fs.rmSync(packDir, { recursive: true, force: true });
      }
    }
  }, 120000);
});
