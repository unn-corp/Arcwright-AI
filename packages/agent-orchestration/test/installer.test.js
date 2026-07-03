import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import installer from '../lib/installer.js';

const {
  sha256, escapeRe, detectBmad, getHomes, resolveToolPath,
  readManifest, writeManifest, readFilesManifest, writeFilesManifest,
  buildModuleConfig, getFileHeader, getClaudeMdLocations,
  updateGitignore, stripGitignoreBlock,
  cleanupManagedBlocks, upsertManagedBlock, migrateOldClaudeMd,
  writeClaudeSettings, stripInstallerSettingsKeys,
  buildArcwrightRulesEntry, buildTmuxEntry, buildProactiveEntry,
} = installer._internal;

// Silent chalk stub (every helper that logs takes a chalk-like object).
const chalk = new Proxy({}, { get: () => (s) => s });

let dir;
beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'arcw-inst-'));
});
afterEach(() => {
  fs.rmSync(dir, { recursive: true, force: true });
});

describe('sha256', () => {
  it('produces the known digest for a fixed input', () => {
    expect(sha256('abc')).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'
    );
  });
  it('is deterministic and differs by input', () => {
    expect(sha256('x')).toBe(sha256('x'));
    expect(sha256('x')).not.toBe(sha256('y'));
  });
});

describe('escapeRe', () => {
  it('escapes regex metacharacters so the string matches literally', () => {
    const lit = 'a.b*c+(d)[e]';
    const re = new RegExp(escapeRe(lit));
    expect(re.test(lit)).toBe(true);
    expect(re.test('aXbYYc')).toBe(false);
  });
});

describe('detectBmad', () => {
  it('reports absent on a clean project', () => {
    expect(detectBmad(dir)).toEqual({ present: false, signals: [] });
  });
  it('detects a _bmad directory', () => {
    fs.mkdirSync(path.join(dir, '_bmad'));
    const r = detectBmad(dir);
    expect(r.present).toBe(true);
    expect(r.signals).toContain('_bmad/');
  });
  it('detects bmad-*.md slash commands with correct pluralization', () => {
    const cmd = path.join(dir, '.claude', 'commands');
    fs.mkdirSync(cmd, { recursive: true });
    fs.writeFileSync(path.join(cmd, 'bmad-foo.md'), 'x');
    fs.writeFileSync(path.join(cmd, 'bmad-bar.md'), 'x');
    fs.writeFileSync(path.join(cmd, 'other.md'), 'x');
    const r = detectBmad(dir);
    expect(r.present).toBe(true);
    expect(r.signals.some((s) => s.includes('2 bmad-*.md command files'))).toBe(true);
  });
  it('uses singular for a single bmad command', () => {
    const cmd = path.join(dir, '.claude', 'commands');
    fs.mkdirSync(cmd, { recursive: true });
    fs.writeFileSync(path.join(cmd, 'bmad-foo.md'), 'x');
    expect(detectBmad(dir).signals.some((s) => s.includes('1 bmad-*.md command file') && !s.includes('files'))).toBe(true);
  });
});

describe('getHomes / resolveToolPath', () => {
  it('returns linux home and null windows home off WSL', () => {
    const homes = getHomes('linux');
    expect(homes.linux).toBe(os.homedir());
    expect(homes.windows).toBe(null);
  });
  it('resolveToolPath returns null for project (non-global) installs', () => {
    expect(resolveToolPath('claude-code', '.claude/x', false, { linux: '/h' }, 'linux')).toBe(null);
  });
  it('resolves a global path under the linux home', () => {
    expect(resolveToolPath('claude-code', '.claude/x', true, { linux: '/h', windows: null }, 'linux')).toBe('/h/.claude/x');
  });
  it('terminal tools use the linux home even on WSL', () => {
    const p = resolveToolPath('claude-code', '.claude/x', true, { linux: '/lin', windows: '/mnt/c' }, 'windows-wsl');
    expect(p).toBe('/lin/.claude/x');
  });
  it('GUI tools use the windows home on WSL', () => {
    const p = resolveToolPath('kiro', '.kiro/x', true, { linux: '/lin', windows: '/mnt/c' }, 'windows-wsl');
    expect(p).toBe('/mnt/c/.kiro/x');
  });
});

describe('manifest read/write round-trips', () => {
  it('writeManifest then readManifest returns the same object', async () => {
    const m = { version: '1.2.3', tools: ['claude-code'], teams: true };
    await writeManifest(dir, m);
    expect(await readManifest(dir)).toEqual(m);
  });
  it('readManifest returns null when absent', async () => {
    expect(await readManifest(dir)).toBe(null);
  });
  it('files manifest round-trips path,hash rows', async () => {
    const entries = [{ relPath: 'a.md', hash: 'h1' }, { relPath: 'b/c.md', hash: 'h2' }];
    await writeFilesManifest(dir, entries);
    expect(await readFilesManifest(dir)).toEqual(entries);
  });
  it('readFilesManifest returns [] when absent', async () => {
    expect(await readFilesManifest(dir)).toEqual([]);
  });
});

describe('buildModuleConfig', () => {
  it('builds a config with per-module output folder keys', () => {
    const cfg = buildModuleConfig('awm', 'Lance', '_arcwright-output');
    expect(cfg.user_name).toBe('Lance');
    expect(cfg.output_folder).toBe('{project-root}/_arcwright-output');
    expect(cfg.awm_output_folder).toBe('{project-root}/_arcwright-output/awm');
  });
});

describe('getFileHeader', () => {
  it('returns the Arcwright Claude Code header', () => {
    expect(getFileHeader('claude-code')).toMatch(/Arcwright/);
    expect(getFileHeader('anything')).toMatch(/Arcwright/);
  });
});

describe('getClaudeMdLocations', () => {
  it('project install returns .claude/CLAUDE.md and root CLAUDE.md', () => {
    const locs = getClaudeMdLocations('/proj', false, 'linux', { linux: '/h' });
    expect(locs).toEqual([path.join('/proj', '.claude', 'CLAUDE.md'), path.join('/proj', 'CLAUDE.md')]);
  });
  it('global install returns the single ~/.claude/CLAUDE.md', () => {
    const locs = getClaudeMdLocations('/proj', true, 'linux', { linux: '/h', windows: null });
    expect(locs).toEqual(['/h/.claude/CLAUDE.md']);
  });
});

describe('updateGitignore / stripGitignoreBlock', () => {
  it('output-only mode writes a managed block', async () => {
    await updateGitignore(dir, 'output-only', chalk);
    const gi = fs.readFileSync(path.join(dir, '.gitignore'), 'utf8');
    expect(gi).toMatch(/Arcwright installation/);
    expect(gi).toMatch(/_arcwright-output\//);
  });
  it('none mode writes nothing', async () => {
    await updateGitignore(dir, 'none', chalk);
    expect(fs.existsSync(path.join(dir, '.gitignore'))).toBe(false);
  });
  it('re-running replaces the block in place (idempotent, no duplication)', async () => {
    await updateGitignore(dir, 'full', chalk);
    await updateGitignore(dir, 'full', chalk);
    const gi = fs.readFileSync(path.join(dir, '.gitignore'), 'utf8');
    expect(gi.match(/Arcwright installation/g)).toHaveLength(1);
  });
  it('preserves pre-existing user content when appending', async () => {
    fs.writeFileSync(path.join(dir, '.gitignore'), 'node_modules/\n');
    await updateGitignore(dir, 'output-only', chalk);
    const gi = fs.readFileSync(path.join(dir, '.gitignore'), 'utf8');
    expect(gi).toMatch(/node_modules\//);
    expect(gi).toMatch(/Arcwright installation/);
  });
  it('stripGitignoreBlock removes the managed block and is idempotent', async () => {
    fs.writeFileSync(path.join(dir, '.gitignore'), 'node_modules/\n');
    await updateGitignore(dir, 'output-only', chalk);
    expect(await stripGitignoreBlock(dir)).toBe(true);
    const gi = fs.readFileSync(path.join(dir, '.gitignore'), 'utf8');
    expect(gi).not.toMatch(/Arcwright installation/);
    expect(gi).toMatch(/node_modules\//);
    expect(await stripGitignoreBlock(dir)).toBe(false); // nothing left to strip
  });
  it('stripGitignoreBlock is a no-op when there is no .gitignore', async () => {
    expect(await stripGitignoreBlock(dir)).toBe(false);
  });
});

describe('upsertManagedBlock', () => {
  const S = '<!-- start -->';
  const E = '<!-- end -->';
  it('creates the file when missing', async () => {
    const f = path.join(dir, 'sub', 'F.md');
    expect(await upsertManagedBlock(f, S, E, 'hello')).toBe('created');
    expect(fs.readFileSync(f, 'utf8')).toBe(`${S}\nhello\n${E}\n`);
  });
  it('appends when the file exists without markers', async () => {
    const f = path.join(dir, 'F.md');
    fs.writeFileSync(f, '# Title\n');
    expect(await upsertManagedBlock(f, S, E, 'body')).toBe('appended');
    expect(fs.readFileSync(f, 'utf8')).toMatch(/# Title[\s\S]*start[\s\S]*body[\s\S]*end/);
  });
  it('updates the block content in place', async () => {
    const f = path.join(dir, 'F.md');
    await upsertManagedBlock(f, S, E, 'one');
    expect(await upsertManagedBlock(f, S, E, 'two')).toBe('updated');
    const txt = fs.readFileSync(f, 'utf8');
    expect(txt).toMatch(/two/);
    expect(txt).not.toMatch(/one/);
  });
  it('returns noop when content is unchanged', async () => {
    const f = path.join(dir, 'F.md');
    await upsertManagedBlock(f, S, E, 'same');
    // strip the trailing newline so the replacement equals the existing content
    fs.writeFileSync(f, `${S}\nsame\n${E}`);
    expect(await upsertManagedBlock(f, S, E, 'same')).toBe('noop');
  });
});

describe('cleanupManagedBlocks', () => {
  const pair = { start: '<!-- AW START -->', end: '<!-- AW END -->' };
  it('removes a managed block, keeping surrounding content', async () => {
    const f = path.join(dir, 'C.md');
    fs.writeFileSync(f, `# Keep\n\n${pair.start}\nremove me\n${pair.end}\n\n# Also keep\n`);
    expect(await cleanupManagedBlocks(f, [pair])).toBe(true);
    const txt = fs.readFileSync(f, 'utf8');
    expect(txt).toMatch(/# Keep/);
    expect(txt).toMatch(/# Also keep/);
    expect(txt).not.toMatch(/remove me/);
  });
  it('returns false when no markers are present', async () => {
    const f = path.join(dir, 'C.md');
    fs.writeFileSync(f, '# nothing managed here\n');
    expect(await cleanupManagedBlocks(f, [pair])).toBe(false);
  });
  it('returns false when the file does not exist', async () => {
    expect(await cleanupManagedBlocks(path.join(dir, 'missing.md'), [pair])).toBe(false);
  });
  it('returns false for empty marker list', async () => {
    const f = path.join(dir, 'C.md');
    fs.writeFileSync(f, 'x');
    expect(await cleanupManagedBlocks(f, [])).toBe(false);
  });
  it('handles a start marker with a missing end marker defensively', async () => {
    const f = path.join(dir, 'C.md');
    fs.writeFileSync(f, `${pair.start}\ndangling content\n`);
    expect(await cleanupManagedBlocks(f, [pair])).toBe(true);
    expect(fs.readFileSync(f, 'utf8')).not.toMatch(/dangling content/);
  });
});

describe('cleanupManagedBlocks — markerless legacy pairs vs current marker blocks', () => {
  const legacy = { start: '## Arcwright', end: '## Agent Spawning' };

  it('skips a legacy heading that only appears inside a current managed block', async () => {
    const f = path.join(dir, 'L.md');
    fs.writeFileSync(f, [
      '# User file',
      '',
      '<!-- arcwright-agent-start -->',
      '## Arcwright',
      'managed content',
      '<!-- arcwright-agent-end -->',
      '',
      '<!-- arcwright-orchestration-start -->',
      '## Agent Spawning (in-process, tmux opt-in)',
      'more managed content',
      '<!-- arcwright-orchestration-end -->',
      '',
    ].join('\n'));
    expect(await cleanupManagedBlocks(f, [legacy])).toBe(false);
    const txt = fs.readFileSync(f, 'utf8');
    expect(txt).toMatch(/<!-- arcwright-agent-end -->/);
    expect(txt).toMatch(/<!-- arcwright-orchestration-start -->/);
    expect(txt).toMatch(/managed content/);
  });

  it('still strips a genuine legacy section outside managed blocks', async () => {
    const f = path.join(dir, 'L.md');
    fs.writeFileSync(f, [
      '# User file',
      '',
      '## Arcwright',
      'old markerless install content',
      '',
      '## Agent Spawning (tmux-aware)',
      'old tmux content',
      '',
    ].join('\n'));
    expect(await cleanupManagedBlocks(f, [legacy])).toBe(true);
    const txt = fs.readFileSync(f, 'utf8');
    expect(txt).not.toMatch(/old markerless install content/);
    expect(txt).toMatch(/# User file/);
    expect(txt).toMatch(/## Agent Spawning \(tmux-aware\)/); // strip stops at the end heading
  });

  it('never strips into a following managed block when the end heading only exists inside it', async () => {
    const f = path.join(dir, 'L.md');
    fs.writeFileSync(f, [
      '## Arcwright',
      'genuine legacy leftovers',
      '',
      '<!-- arcwright-orchestration-start -->',
      '## Agent Spawning (in-process, tmux opt-in)',
      'current managed content',
      '<!-- arcwright-orchestration-end -->',
      '',
    ].join('\n'));
    expect(await cleanupManagedBlocks(f, [legacy])).toBe(true);
    const txt = fs.readFileSync(f, 'utf8');
    expect(txt).not.toMatch(/genuine legacy leftovers/);
    expect(txt).toMatch(/<!-- arcwright-orchestration-start -->/);
    expect(txt).toMatch(/current managed content/);
    expect(txt).toMatch(/<!-- arcwright-orchestration-end -->/);
  });
});

describe('migrateOldClaudeMd — consecutive update cycles do not corrupt CLAUDE.md', () => {
  // Mirrors what writeIdeConfig does on every install/update: migrate, then
  // upsert the three managed blocks. Pre-fix, the markerless legacy pairs
  // matched headings INSIDE the managed blocks and each cycle ate markers and
  // duplicated content.
  async function updateCycle(f) {
    await migrateOldClaudeMd(f);
    await upsertManagedBlock(f, '<!-- arcwright-agent-start -->',         '<!-- arcwright-agent-end -->',         buildArcwrightRulesEntry(['awm', 'core']));
    await upsertManagedBlock(f, '<!-- arcwright-orchestration-start -->', '<!-- arcwright-orchestration-end -->', buildTmuxEntry());
    await upsertManagedBlock(f, '<!-- arcwright-proactive-start -->',     '<!-- arcwright-proactive-end -->',     buildProactiveEntry());
    return fs.readFileSync(f, 'utf8');
  }
  const count = (s, needle) => s.split(needle).length - 1;

  it('is stable and keeps exactly one of each marker across three cycles', async () => {
    const f = path.join(dir, 'CLAUDE.md');
    fs.writeFileSync(f, '# My project\n\nUser notes here.\n');

    const first = await updateCycle(f);
    const second = await updateCycle(f);
    const third = await updateCycle(f);

    expect(second).toBe(first);
    expect(third).toBe(second);
    expect(third).toMatch(/User notes here\./);
    for (const marker of [
      '<!-- arcwright-agent-start -->', '<!-- arcwright-agent-end -->',
      '<!-- arcwright-orchestration-start -->', '<!-- arcwright-orchestration-end -->',
      '<!-- arcwright-proactive-start -->', '<!-- arcwright-proactive-end -->',
    ]) {
      expect(count(third, marker)).toBe(1);
    }
  });
});

describe('writeClaudeSettings / stripInstallerSettingsKeys', () => {
  it('writes the Arcwright env defaults on a fresh settings file', async () => {
    await writeClaudeSettings(dir, chalk, 'none', false);
    const s = JSON.parse(fs.readFileSync(path.join(dir, 'settings.json'), 'utf8'));
    expect(s.env.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS).toBe('1');
    expect(s.env.CLAUDE_CODE_NO_FLICKER).toBe('1');
    expect(s.skillListingBudgetFraction).toBe(0.03);
    expect(s.fallbackModel).toEqual(['sonnet']);
  });
  it('never clobbers a user-customized value', async () => {
    fs.writeFileSync(
      path.join(dir, 'settings.json'),
      JSON.stringify({ skillListingBudgetFraction: 0.5, env: { CLAUDE_CODE_NO_FLICKER: '0' } })
    );
    await writeClaudeSettings(dir, chalk, 'none', false);
    const s = JSON.parse(fs.readFileSync(path.join(dir, 'settings.json'), 'utf8'));
    expect(s.skillListingBudgetFraction).toBe(0.5);
    expect(s.env.CLAUDE_CODE_NO_FLICKER).toBe('0');
  });
  it('safe hooks mode seeds guard hooks and the acceptEdits posture', async () => {
    await writeClaudeSettings(dir, chalk, 'safe', false);
    const s = JSON.parse(fs.readFileSync(path.join(dir, 'settings.json'), 'utf8'));
    expect(s.permissions.defaultMode).toBe('acceptEdits');
    expect(s.hooks.PreToolUse.some((g) => g.hooks.some((h) => h.command.includes('arcwright-hooks')))).toBe(true);
    expect(fs.existsSync(path.join(dir, 'arcwright-hooks', 'guard-bash.js'))).toBe(true);
  });
  it('full hooks mode adds the PostToolUse typecheck entry', async () => {
    await writeClaudeSettings(dir, chalk, 'full', false);
    const s = JSON.parse(fs.readFileSync(path.join(dir, 'settings.json'), 'utf8'));
    expect(s.hooks.PostToolUse.some((g) => g.hooks.some((h) => h.command.includes('typecheck.js')))).toBe(true);
    expect(fs.existsSync(path.join(dir, 'arcwright-hooks', 'typecheck.js'))).toBe(true);
  });
  it('stripInstallerSettingsKeys removes only installer-default values', async () => {
    await writeClaudeSettings(dir, chalk, 'none', false);
    expect(await stripInstallerSettingsKeys(dir)).toBe(true);
    const s = JSON.parse(fs.readFileSync(path.join(dir, 'settings.json'), 'utf8'));
    expect(s.skillListingBudgetFraction).toBeUndefined();
    expect(s.fallbackModel).toBeUndefined();
    expect(s.env).toBeUndefined(); // both env keys removed → env dropped
  });
  it('stripInstallerSettingsKeys preserves user-customized values', async () => {
    fs.writeFileSync(
      path.join(dir, 'settings.json'),
      JSON.stringify({ skillListingBudgetFraction: 0.5, fallbackModel: ['opus'] })
    );
    expect(await stripInstallerSettingsKeys(dir)).toBe(false);
    const s = JSON.parse(fs.readFileSync(path.join(dir, 'settings.json'), 'utf8'));
    expect(s.skillListingBudgetFraction).toBe(0.5);
    expect(s.fallbackModel).toEqual(['opus']);
  });
  it('stripInstallerSettingsKeys is a no-op when settings is absent', async () => {
    expect(await stripInstallerSettingsKeys(dir)).toBe(false);
  });
});

describe('rules-entry builders', () => {
  it('buildArcwrightRulesEntry mentions the modules and update command', () => {
    const out = buildArcwrightRulesEntry(['awm', 'core']);
    expect(out).toMatch(/## Arcwright/);
    expect(out).toMatch(/awm, core/);
    expect(out).toMatch(/npx @arcwright-ai\/agent-orchestration/);
  });
  it('buildTmuxEntry and buildProactiveEntry return non-empty strings', () => {
    expect(typeof buildTmuxEntry()).toBe('string');
    expect(buildTmuxEntry().length).toBeGreaterThan(0);
    expect(typeof buildProactiveEntry()).toBe('string');
    expect(buildProactiveEntry().length).toBeGreaterThan(0);
  });
});
