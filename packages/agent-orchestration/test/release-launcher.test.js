import { afterEach, describe, expect, it } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import http from 'node:http';
import { execFileSync, spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const launcher = fileURLToPath(new URL('../../../release/arcwright.cjs', import.meta.url));
const directories = [];
afterEach(() => {
  for (const directory of directories.splice(0)) fs.rmSync(directory, { recursive: true, force: true });
});

function fixture(code = 'console.log(JSON.stringify(process.argv.slice(2)));') {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'arcwright-launcher-'));
  directories.push(directory);
  const runtime = path.join(directory, 'stage/arcwright');
  fs.mkdirSync(path.join(runtime, 'bin'), { recursive: true });
  fs.writeFileSync(path.join(runtime, 'bin/arcwright.js'), code);
  fs.writeFileSync(path.join(runtime, 'package.json'), JSON.stringify({ version: '9.8.7' }));
  const archive = path.join(directory, 'arcwright-9.8.7.tar.gz');
  execFileSync('tar', ['-czf', archive, '-C', path.dirname(runtime), 'arcwright']);
  const metadata = {
    version: '9.8.7', tag: 'v9.8.7', archive: path.basename(archive),
    sha256: crypto.createHash('sha256').update(fs.readFileSync(archive)).digest('hex'),
  };
  fs.writeFileSync(path.join(directory, 'release.json'), JSON.stringify(metadata));
  return { directory, archive, metadata, runtime };
}

function run(home, args, extraEnv = {}, entry = launcher) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [entry, ...args], {
      env: { ...process.env, HOME: home, ...extraEnv }, cwd: home,
    });
    let stdout = '', stderr = '';
    child.stdout.on('data', chunk => { stdout += chunk; });
    child.stderr.on('data', chunk => { stderr += chunk; });
    child.on('error', reject);
    child.on('close', status => resolve({ status, stdout, stderr }));
  });
}

describe('GitHub Release launcher', () => {
  it('downloads the pinned archive, preserves literal arguments, and caches help without network', async () => {
    const { directory, archive, metadata } = fixture();
    const requests = [];
    const server = http.createServer((request, response) => {
      requests.push(request.url);
      if (request.url === '/latest/download/release.json') response.end(JSON.stringify(metadata));
      else if (request.url === '/download/v9.8.7/arcwright-9.8.7.tar.gz') response.end(fs.readFileSync(archive));
      else { response.writeHead(404); response.end(); }
    });
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    try {
      const literal = '$(touch should-not-exist)';
      const result = await run(directory, ['--directory', literal], {
        ARCWRIGHT_RELEASES_URL: `http://127.0.0.1:${server.address().port}`,
      });
      expect(result.status, result.stderr).toBe(0);
      expect(result.stdout).toContain(JSON.stringify(['--directory', literal]));
      expect(requests).toEqual(['/latest/download/release.json', '/download/v9.8.7/arcwright-9.8.7.tar.gz']);
      expect(fs.existsSync(path.join(directory, 'should-not-exist'))).toBe(false);
      const installed = path.join(directory, '.local/bin/arcwright');
      const cached = await run(directory, ['--help'], { ARCWRIGHT_RELEASES_URL: 'http://127.0.0.1:1' }, installed);
      expect(cached.status, cached.stderr).toBe(0);
      expect(cached.stdout).toContain('["--help"]');
    } finally {
      await new Promise(resolve => server.close(resolve));
    }
  });

  it('rejects a corrupt archive before changing the target or installing a command', async () => {
    const { directory, archive } = fixture();
    fs.appendFileSync(archive, 'corrupt');
    const result = await run(directory, ['--archive', archive]);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('checksum mismatch');
    expect(fs.existsSync(path.join(directory, '.local'))).toBe(false);
  });

  it('rejects archive links and preserves an unrelated existing command', async () => {
    const { directory, archive, runtime, metadata } = fixture();
    fs.symlinkSync('/tmp', path.join(runtime, 'outside'));
    execFileSync('tar', ['-czf', archive, '-C', path.dirname(runtime), 'arcwright']);
    metadata.sha256 = crypto.createHash('sha256').update(fs.readFileSync(archive)).digest('hex');
    fs.writeFileSync(path.join(directory, 'release.json'), JSON.stringify(metadata));
    const unsafe = await run(directory, ['--archive', archive]);
    expect(unsafe.status).toBe(1);
    expect(unsafe.stderr).toContain('unsupported file types');
    const existing = path.join(directory, '.local/bin/arcwright');
    fs.mkdirSync(path.dirname(existing), { recursive: true });
    fs.writeFileSync(existing, '#!/bin/sh\necho personal command\n');
    const conflict = await run(directory, ['--archive', archive]);
    expect(conflict.status).toBe(1);
    expect(conflict.stderr).toContain('existing command owns');
    expect(fs.readFileSync(existing, 'utf8')).toContain('personal command');
  });

  it('keeps the working launcher and runtime selection when an update fails', async () => {
    const good = fixture();
    expect((await run(good.directory, ['--archive', good.archive])).status).toBe(0);
    const state = path.join(good.directory, '.local/share/arcwright/current.json');
    const prior = fs.readFileSync(state, 'utf8');
    const failed = fixture('process.exit(7);');
    const result = await run(good.directory, ['--archive', failed.archive, 'update']);
    expect(result.status).toBe(7);
    expect(fs.readFileSync(state, 'utf8')).toBe(prior);
    expect((await run(good.directory, ['--version'], {}, path.join(good.directory, '.local/bin/arcwright'))).status).toBe(0);
  });
});
