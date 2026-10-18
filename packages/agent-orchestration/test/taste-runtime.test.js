import { afterEach, describe, expect, it } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { runtimePaths, evidenceDirectory } from '../../../.agents/skills/design-taste-frontend/scripts/lib/runtime.mjs';

const SKILL = path.resolve(__dirname, '../../../.agents/skills/design-taste-frontend');
const temporary = [];
const fixture = () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'arcw-taste-'));
  temporary.push(root);
  const project = path.join(root, 'active project');
  fs.mkdirSync(path.join(project, '_arcwright'), { recursive: true });
  const run = path.join(project, '_arcwright/_memory/skill-runs/taste-test');
  const env = { ...process.env, TASTE_SKILL_RUN: 'test' };
  delete env.TASTE_SKILL_HISTORY;
  const call = (script, args = [], options = {}) => spawnSync(process.execPath,
    [...(options.nodeArgs || []), path.join(SKILL, 'scripts', script), ...args], {
      cwd: options.cwd || project, env: { ...env, ...options.env }, encoding: 'utf8', timeout: 10000,
    });
  return { root, project, run, call };
};
const draw = ['--sector', 'agency', '--brief', 'A print studio on the canal', '--sections', 'intro,work,contact,footer', '--seed', '17'];
afterEach(() => temporary.splice(0).forEach(root => fs.rmSync(root, { recursive: true, force: true })));

describe('Taste working output and source checks', () => {
  it('deals and reprints a direction under Arcwright while preserving brand type and palette', () => {
    const f = fixture();
    const result = f.call('draw.mjs', [...draw, '--keep', 'palette,type']);
    expect(result.status, result.stderr).toBe(0);
    const sheet = JSON.parse(fs.readFileSync(path.join(f.run, 'direction.json')));
    expect(sheet.type).toBeNull();
    expect(sheet.palette).toBeNull();
    expect(sheet.input.brief).toBe('A print studio on the canal');
    expect(JSON.parse(fs.readFileSync(path.join(f.run, 'history.json')))).toHaveLength(1);
    expect(f.call('draw.mjs', ['--show']).stdout).toBe(result.stdout);
    expect(fs.existsSync(path.join(f.project, '.taste-skill'))).toBe(false);
  });

  it('supports explicit project roots from another directory and keeps options read-only', () => {
    const f = fixture();
    const args = [...draw, '--project-root', f.project];
    expect(f.call('draw.mjs', [...args, '--options', '3'], { cwd: f.root }).status).toBe(0);
    expect(fs.existsSync(f.run)).toBe(false);
    expect(f.call('draw.mjs', args, { cwd: SKILL }).status).toBe(0);
    expect(fs.existsSync(path.join(f.run, 'direction.json'))).toBe(true);
  });

  it.each([
    ['draw.mjs', [...draw, '--out', 'src']],
    ['assets.mjs', ['--get', 'aic:1', '--to', 'public']],
    ['inspect.mjs', ['https://example.invalid', '--out', 'screenshots']],
  ])('rejects an output escape before %s can perform its work', (script, args) => {
    const f = fixture();
    const result = f.call(script, args);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('must stay under');
    expect(fs.readdirSync(f.project)).toEqual(['_arcwright']);
  });

  it('rejects installed or cached skills as project roots and outside history overrides', () => {
    const f = fixture();
    const cached = path.join(f.root, 'cache/demo');
    fs.mkdirSync(cached, { recursive: true });
    fs.writeFileSync(path.join(cached, 'SKILL.md'), 'cached skill');
    expect(f.call('draw.mjs', draw, { cwd: cached }).stderr).toContain('never an installed skill');
    expect(f.call('draw.mjs', [...draw, '--project-root', cached]).stderr).toContain('never an installed skill');
    const outside = path.join(f.root, 'history.json');
    expect(f.call('draw.mjs', draw, { env: { TASTE_SKILL_HISTORY: outside } }).stderr).toContain('must stay under');
    expect(fs.existsSync(outside)).toBe(false);
  });

  it.skipIf(process.platform === 'win32')('rejects symlinked run directories and artifact files', () => {
    const f = fixture();
    fs.mkdirSync(path.dirname(f.run), { recursive: true });
    fs.symlinkSync(f.root, f.run);
    expect(f.call('draw.mjs', draw).stderr).toContain('symlinked Taste output');
    fs.unlinkSync(f.run);
    fs.mkdirSync(f.run);
    const outside = path.join(f.root, 'keep.json');
    fs.writeFileSync(outside, 'preserve me');
    fs.symlinkSync(outside, path.join(f.run, 'direction.json'));
    expect(f.call('draw.mjs', draw).stderr).toContain('symlinked Taste output');
    expect(fs.readFileSync(outside, 'utf8')).toBe('preserve me');
  });

  it('keeps the host evidence exception separate from working output', () => {
    const f = fixture();
    expect(evidenceDirectory(f.root)).toBe(f.root);
    const runtime = runtimePaths(['--project-root', f.project]);
    expect(() => runtime.output(f.root)).toThrow('must stay under');
    expect(() => evidenceDirectory(SKILL)).toThrow('outside installed skills');
  });

  it('downloads a controlled public-domain fixture and retains its source and credits', () => {
    const f = fixture();
    const mock = path.join(f.root, 'fetch-fixture.mjs');
    fs.writeFileSync(mock, `globalThis.fetch = async url => {
      const value = String(url);
      if (value.startsWith('https://api.artic.edu/api/v1/artworks/1?')) return Response.json({
        data: { id: 1, title: 'Canal print', artist_title: 'Fixture Artist', image_id: 'fixture', is_public_domain: true },
        config: { iiif_url: 'https://fixture.invalid/iiif' }
      });
      if (value.startsWith('https://fixture.invalid/iiif/fixture/')) return new Response(Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a96sAAAAASUVORK5CYII=', 'base64'), {headers:{'content-type':'image/png'}});
      throw new Error('Unexpected network request: '+value);
    };`);
    const result = f.call('assets.mjs', ['--get', 'aic:1'], { nodeArgs: ['--import', mock] });
    expect(result.status, result.stderr).toBe(0);
    const credits = JSON.parse(fs.readFileSync(path.join(f.run, 'assets/credits.json')));
    expect(credits[0]).toMatchObject({ creator: 'Fixture Artist', licenseCode: 'cc0', page: 'https://www.artic.edu/artworks/1' });
    expect(fs.existsSync(path.join(f.project, credits[0].file))).toBe(true);
    expect(f.call('assets.mjs', ['--credits']).stdout).toContain('Fixture Artist');
  });

  it('enforces the no-eyebrow and no-em-dash rules even on ignored lines', () => {
    const f = fixture();
    const file = path.join(f.project, 'index.html');
    fs.writeFileSync(file, '<p class="eyebrow">Made here</p> <!-- taste-skill-ignore -->\n<h1>Made here &mdash; built well</h1> <!-- taste-skill-ignore -->');
    const result = f.call('lint.mjs', [file, '--json']);
    expect(result.status).toBe(1);
    expect(JSON.parse(result.stdout).findings.map(finding => finding.id)).toEqual(expect.arrayContaining(['eyebrow', 'em-dash']));
    expect(f.call('inspect.mjs', ['https://example.invalid', '--allow', 'eyebrow']).stderr).toContain('does not allow eyebrow');
  });

  it('skips Arcwright runtime output while checking real page source', () => {
    const f = fixture();
    fs.writeFileSync(path.join(f.project, 'index.html'), '<h1>Prints from the canal</h1>');
    fs.mkdirSync(f.run, { recursive: true });
    fs.writeFileSync(path.join(f.run, 'old.html'), '<p class="eyebrow">Old fixture &mdash; ignore runtime</p>');
    const result = f.call('lint.mjs', [f.project, '--json']);
    expect(result.status, result.stdout).toBe(0);
    expect(JSON.parse(result.stdout)).toMatchObject({ files: 1, findings: [] });
  });
});
