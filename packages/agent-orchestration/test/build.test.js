import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const REPO_ROOT = path.resolve(__dirname, '..', '..', '..');

describe('build source walker', () => {
  it.skipIf(process.platform === 'win32')('does not copy an outside-root symlink', () => {
    const outsideDir = fs.mkdtempSync(path.join(os.tmpdir(), 'arcw-build-symlink-'));
    const caseId = path.basename(outsideDir);
    const outsideFile = path.join(outsideDir, 'outside-root.txt');
    const sourceLink = path.join(REPO_ROOT, '_arcwright', 'core', `.outside-root-${caseId}.txt`);
    const generatedFile = path.join(REPO_ROOT, 'packages', 'agent-orchestration', 'src', 'core', `.outside-root-${caseId}.txt`);

    try {
      fs.writeFileSync(outsideFile, 'outside-root sentinel', 'utf8');
      fs.symlinkSync(outsideFile, sourceLink);

      execFileSync(process.execPath, [path.join(REPO_ROOT, 'build', 'build.js')], {
        cwd: REPO_ROOT,
        stdio: 'pipe',
      });

      expect(fs.existsSync(generatedFile)).toBe(false);
    } finally {
      fs.rmSync(sourceLink, { force: true });
      fs.rmSync(generatedFile, { force: true });
      fs.rmSync(outsideDir, { recursive: true, force: true });
    }
  }, 120000);
});
