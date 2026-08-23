import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execSync } from 'node:child_process';
import installer from '../lib/installer.js';

const {
  sha256, escapeRe, detectBmad, getHomes, resolveToolPath,
  readManifest, writeManifest, readFilesManifest, writeFilesManifest, removeEmptyDirsUpward,
  buildModuleConfig, getFileHeader, getClaudeMdLocations,
  updateGitignore, stripGitignoreBlock,
  cleanupManagedBlocks, upsertManagedBlock, migrateOldClaudeMd,
  writeClaudeSettings, stripInstallerSettingsKeys,
  buildArcwrightRulesEntry, buildTmuxEntry, buildProactiveEntry,
  ensureHermesCliInstalled, setupHermesModelSurface,
  getSupportedToolIds, getToolPromptOptions, parseToolIds,
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

describe('supported tools (installer options)', () => {
  it('includes Cursor alongside the other first-class targets', () => {
    const ids = getSupportedToolIds();
    expect(ids).toEqual(['claude-code', 'kiro', 'codex', 'hermes', 'opencode', 'grok', 'cursor']);
  });

  it('exposes grok in the interactive multiselect options', () => {
    const options = getToolPromptOptions();
    const grok = options.find((o) => o.value === 'grok');
    expect(grok).toBeTruthy();
    expect(grok.label).toMatch(/Grok/i);
    expect(grok.hint).toBeTruthy();
  });

  it('parseToolIds accepts Cursor and rejects unknown ids', () => {
    expect(parseToolIds('grok')).toEqual(['grok']);
    expect(parseToolIds('claude-code,grok')).toEqual(['claude-code', 'grok']);
    expect(parseToolIds('cursor')).toEqual(['cursor']);
    expect(() => parseToolIds('grok,not-a-tool')).toThrow(/Unknown --tools id/);
  });
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
  it('Cursor uses the windows home on WSL', () => {
    const p = resolveToolPath('cursor', '.cursor/x', true, { linux: '/lin', windows: '/mnt/c' }, 'windows-wsl');
    expect(p).toBe('/mnt/c/.cursor/x');
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

describe('Hermes model surface helpers', () => {
  it('installs Hermes through the official installer when hermes is absent', async () => {
    const calls = [];
    const run = (cmd) => {
      calls.push(cmd);
      if (cmd.startsWith('command -v hermes')) throw new Error('missing');
      return '';
    };
    await ensureHermesCliInstalled({ linux: dir, windows: null }, chalk, run);
    expect(calls.some((cmd) => cmd.includes('https://hermes-agent.nousresearch.com/install.sh'))).toBe(true);
  });

  it('does not run the installer when ~/.local/bin/hermes already exists', async () => {
    const localBin = path.join(dir, '.local', 'bin');
    fs.mkdirSync(localBin, { recursive: true });
    fs.writeFileSync(path.join(localBin, 'hermes'), '#!/bin/sh\n');
    const calls = [];
    const run = (cmd) => {
      calls.push(cmd);
      if (cmd.startsWith('command -v hermes')) throw new Error('missing');
      return '';
    };
    await ensureHermesCliInstalled({ linux: dir, windows: null }, chalk, run);
    expect(calls.some((cmd) => cmd.includes('install.sh'))).toBe(false);
  });

  it('configures Hermes custom provider, OmniRoute base URL, key, and fallback model', async () => {
    const calls = [];
    const run = (cmd) => {
      calls.push(cmd);
      if (cmd.startsWith('command -v hermes')) return '/usr/local/bin/hermes\n';
      return '';
    };
    const result = await setupHermesModelSurface({
      homes: { linux: dir, windows: null },
      chalk,
      baseUrl: 'https://omniroute.example/v1',
      apiKey: 'test-key',
      model: 'agent-fallback',
      run,
    });
    expect(result.configured).toBe(true);
    expect(calls).toContain("'/usr/local/bin/hermes' config set model.provider custom");
    expect(calls).toContain("'/usr/local/bin/hermes' config set model.base_url 'https://omniroute.example/v1'");
    expect(calls).toContain("'/usr/local/bin/hermes' config set model.default 'agent-fallback'");
    expect(calls).toContain("'/usr/local/bin/hermes' config set model.api_key 'test-key'");
  });
});

describe('getFileHeader', () => {
  it('returns the Arcwright Claude Code header', () => {
    expect(getFileHeader('claude-code')).toMatch(/Arcwright/);
    expect(getFileHeader('anything')).toMatch(/Arcwright/);
  });
});

describe('getClaudeMdLocations', () => {
  // These are the files uninstall strips managed blocks from, so anything
  // missing here stays behind and keeps instructing the user's agent.
  it('project install covers CLAUDE.md and AGENTS.md', () => {
    const locs = getClaudeMdLocations('/proj', false, 'linux', { linux: '/h' });
    expect(locs).toEqual([
      path.join('/proj', '.claude', 'CLAUDE.md'),
      path.join('/proj', 'CLAUDE.md'),
      // Codex, OpenCode, Grok, Hermes and Cursor all write their block here.
      path.join('/proj', 'AGENTS.md'),
    ]);
  });
  it('global install covers every per-tool global rules file', () => {
    const locs = getClaudeMdLocations('/proj', true, 'linux', { linux: '/h', windows: null });
    expect(locs).toContain('/h/.claude/CLAUDE.md');
    expect(locs).toContain('/h/.codex/AGENTS.md');
    expect(locs).toContain('/h/.config/opencode/AGENTS.md');
    expect(locs).toContain('/h/.grok/AGENTS.md');
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
  it('ignores personal .user.toml overlays in every writing mode', async () => {
    // CLAUDE.md documents .user.toml as personal, but only `full` covered them
    // (via the whole _arcwright/ dir), so the default install left them
    // committable.
    for (const mode of ['output-only', 'skills']) {
      fs.rmSync(path.join(dir, '.gitignore'), { force: true });
      await updateGitignore(dir, mode, chalk);
      const gi = fs.readFileSync(path.join(dir, '.gitignore'), 'utf8');
      expect(gi).toMatch(/_arcwright\/custom\/\*\.user\.toml/);
    }
  });
  it('full mode covers every shipped slash command', async () => {
    // This list used to be 21 hand-written entries against 154 shipped command
    // files, so `--gitignore full` left 133 generated commands visible to git.
    //
    // updateGitignore reads the built src/, which is gitignored and therefore
    // absent from a fresh checkout — the same reason install.integration.test.js
    // builds in beforeAll. Build here too rather than skipping, so the
    // assertion is real in CI instead of vacuously passing on an empty read.
    const repoRoot = path.join(__dirname, '..', '..', '..');
    const srcCommands = path.join(__dirname, '..', 'src', '.claude', 'commands');
    if (!fs.existsSync(srcCommands)) {
      execSync('node build/build.js', { cwd: repoRoot, stdio: 'pipe' });
    }

    await updateGitignore(dir, 'full', chalk);
    const gi = fs.readFileSync(path.join(dir, '.gitignore'), 'utf8');
    const shipped = fs.readdirSync(srcCommands).filter((f) => f.endsWith('.md'));
    expect(shipped.length).toBeGreaterThan(50); // guard against a silent empty read
    const missing = shipped.filter((c) => !gi.includes(`.claude/commands/${c}`));
    expect(missing).toEqual([]);
  }, 120000);
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
    expect(s.skillListingBudgetFraction).toBe(0.05);
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
  it('preserves malformed user settings instead of overwriting them', async () => {
    const settingsPath = path.join(dir, 'settings.json');
    const malformed = '{ "preserve": true,';
    fs.writeFileSync(settingsPath, malformed);

    await writeClaudeSettings(dir, chalk, 'safe', false);

    expect(fs.readFileSync(settingsPath, 'utf8')).toBe(malformed);
    expect(fs.existsSync(path.join(dir, 'arcwright-hooks', 'guard-bash.js'))).toBe(false);
  });
  it('preserves JSON settings whose root is not an object', async () => {
    const settingsPath = path.join(dir, 'settings.json');
    fs.writeFileSync(settingsPath, '[]');

    await writeClaudeSettings(dir, chalk, 'safe', false);

    expect(fs.readFileSync(settingsPath, 'utf8')).toBe('[]');
    expect(fs.existsSync(path.join(dir, 'arcwright-hooks', 'guard-bash.js'))).toBe(false);
  });
  it('preserves settings with an invalid hooks field', async () => {
    const settingsPath = path.join(dir, 'settings.json');
    const settings = { hooks: [] };
    fs.writeFileSync(settingsPath, JSON.stringify(settings));

    await writeClaudeSettings(dir, chalk, 'safe', false);

    expect(JSON.parse(fs.readFileSync(settingsPath, 'utf8'))).toEqual(settings);
    expect(fs.existsSync(path.join(dir, 'arcwright-hooks', 'guard-bash.js'))).toBe(false);
  });
  it('safe hooks mode seeds guard hooks and the acceptEdits posture', async () => {
    await writeClaudeSettings(dir, chalk, 'safe', false);
    const s = JSON.parse(fs.readFileSync(path.join(dir, 'settings.json'), 'utf8'));
    expect(s.permissions.defaultMode).toBe('acceptEdits');
    expect(s.hooks.PreToolUse.some((g) => g.hooks.some((h) => h.command.includes('arcwright-hooks')))).toBe(true);
    expect(fs.existsSync(path.join(dir, 'arcwright-hooks', 'guard-bash.js'))).toBe(true);
    expect(fs.existsSync(path.join(dir, 'arcwright-hooks', 'amplify-context.js'))).toBe(true);
    expect(fs.existsSync(path.join(dir, 'arcwright-hooks', 'amplify-review.js'))).toBe(true);
    expect(fs.existsSync(path.join(dir, 'arcwright-hooks', 'cloudfront-context.js'))).toBe(true);
    expect(fs.existsSync(path.join(dir, 'arcwright-hooks', 'cloudfront-review.js'))).toBe(true);
    expect(fs.existsSync(path.join(dir, 'arcwright-hooks', 's3-context.js'))).toBe(true);
    expect(fs.existsSync(path.join(dir, 'arcwright-hooks', 's3-review.js'))).toBe(true);
    expect(fs.existsSync(path.join(dir, 'arcwright-hooks', 'aurora-context.js'))).toBe(true);
    expect(fs.existsSync(path.join(dir, 'arcwright-hooks', 'aurora-review.js'))).toBe(true);
    expect(fs.existsSync(path.join(dir, 'arcwright-hooks', 'ses-sns-smtp-context.js'))).toBe(true);
    expect(fs.existsSync(path.join(dir, 'arcwright-hooks', 'ses-sns-smtp-review.js'))).toBe(true);
    expect(fs.existsSync(path.join(dir, 'arcwright-hooks', 'eventbridge-context.js'))).toBe(true);
    expect(fs.existsSync(path.join(dir, 'arcwright-hooks', 'eventbridge-review.js'))).toBe(true);
    expect(fs.existsSync(path.join(dir, 'arcwright-hooks', 'cognito-context.js'))).toBe(true);
    expect(fs.existsSync(path.join(dir, 'arcwright-hooks', 'cognito-review.js'))).toBe(true);
    expect(fs.existsSync(path.join(dir, 'arcwright-hooks', 'lambda-context.js'))).toBe(true);
    expect(fs.existsSync(path.join(dir, 'arcwright-hooks', 'lambda-review.js'))).toBe(true);
    expect(fs.existsSync(path.join(dir, 'arcwright-hooks', 'step-functions-context.js'))).toBe(true);
    expect(fs.existsSync(path.join(dir, 'arcwright-hooks', 'step-functions-review.js'))).toBe(true);
    expect(s.hooks.SessionStart.some((g) => g.hooks.some((h) => h.command.includes('amplify-context.js')))).toBe(true);
    expect(s.hooks.UserPromptSubmit.some((g) => g.hooks.some((h) => h.command.includes('amplify-context.js')))).toBe(true);
    expect(s.hooks.PostToolUse.some((g) => g.hooks.some((h) => h.command.includes('amplify-review.js')))).toBe(true);
    expect(s.hooks.SessionStart.some((g) => g.hooks.some((h) => h.command.includes('cloudfront-context.js')))).toBe(true);
    expect(s.hooks.UserPromptSubmit.some((g) => g.hooks.some((h) => h.command.includes('cloudfront-context.js')))).toBe(true);
    expect(s.hooks.PostToolUse.some((g) => g.hooks.some((h) => h.command.includes('cloudfront-review.js')))).toBe(true);
    expect(s.hooks.SessionStart.some((g) => g.hooks.some((h) => h.command.includes('s3-context.js')))).toBe(true);
    expect(s.hooks.UserPromptSubmit.some((g) => g.hooks.some((h) => h.command.includes('s3-context.js')))).toBe(true);
    expect(s.hooks.PostToolUse.some((g) => g.hooks.some((h) => h.command.includes('s3-review.js')))).toBe(true);
    expect(s.hooks.SessionStart.some((g) => g.hooks.some((h) => h.command.includes('aurora-context.js')))).toBe(true);
    expect(s.hooks.UserPromptSubmit.some((g) => g.hooks.some((h) => h.command.includes('aurora-context.js')))).toBe(true);
    expect(s.hooks.PostToolUse.some((g) => g.hooks.some((h) => h.command.includes('aurora-review.js')))).toBe(true);
    expect(s.hooks.SessionStart.some((g) => g.hooks.some((h) => h.command.includes('ses-sns-smtp-context.js')))).toBe(true);
    expect(s.hooks.UserPromptSubmit.some((g) => g.hooks.some((h) => h.command.includes('ses-sns-smtp-context.js')))).toBe(true);
    expect(s.hooks.PostToolUse.some((g) => g.hooks.some((h) => h.command.includes('ses-sns-smtp-review.js')))).toBe(true);
    expect(s.hooks.SessionStart.some((g) => g.hooks.some((h) => h.command.includes('eventbridge-context.js')))).toBe(true);
    expect(s.hooks.UserPromptSubmit.some((g) => g.hooks.some((h) => h.command.includes('eventbridge-context.js')))).toBe(true);
    expect(s.hooks.PostToolUse.some((g) => g.hooks.some((h) => h.command.includes('eventbridge-review.js')))).toBe(true);
    expect(s.hooks.SessionStart.some((g) => g.hooks.some((h) => h.command.includes('cognito-context.js')))).toBe(true);
    expect(s.hooks.UserPromptSubmit.some((g) => g.hooks.some((h) => h.command.includes('cognito-context.js')))).toBe(true);
    expect(s.hooks.PostToolUse.some((g) => g.hooks.some((h) => h.command.includes('cognito-review.js')))).toBe(true);
    expect(s.hooks.SessionStart.some((g) => g.hooks.some((h) => h.command.includes('lambda-context.js')))).toBe(true);
    expect(s.hooks.UserPromptSubmit.some((g) => g.hooks.some((h) => h.command.includes('lambda-context.js')))).toBe(true);
    expect(s.hooks.PostToolUse.some((g) => g.hooks.some((h) => h.command.includes('lambda-review.js')))).toBe(true);
    expect(s.hooks.SessionStart.some((g) => g.hooks.some((h) => h.command.includes('step-functions-context.js')))).toBe(true);
    expect(s.hooks.UserPromptSubmit.some((g) => g.hooks.some((h) => h.command.includes('step-functions-context.js')))).toBe(true);
    expect(s.hooks.PostToolUse.some((g) => g.hooks.some((h) => h.command.includes('step-functions-review.js')))).toBe(true);
  });
  it('unnamed MCP hooks work independently of the optional guard-hook mode', async () => {
    await writeClaudeSettings(dir, chalk, 'none', false, true);
    await writeClaudeSettings(dir, chalk, 'none', false, true);
    const s = JSON.parse(fs.readFileSync(path.join(dir, 'settings.json'), 'utf8'));
    const count = (name) => JSON.stringify(s.hooks).split(name).length - 1;

    expect(fs.existsSync(path.join(dir, 'arcwright-hooks', 'unnamed-dev-context.js'))).toBe(true);
    expect(fs.existsSync(path.join(dir, 'arcwright-hooks', 'guard-bash.js'))).toBe(false);
    expect(s.hooks.SessionStart.some((g) => g.hooks.some((h) => h.command.includes('unnamed-dev-context.js')))).toBe(true);
    expect(s.hooks.UserPromptSubmit.some((g) => g.hooks.some((h) => h.command.includes('unnamed-dev-context.js')))).toBe(true);
    expect(s.hooks.Stop.some((g) => g.hooks.some((h) => h.command.includes('unnamed-dev-context.js')))).toBe(true);
    expect(count('unnamed-dev-context.js')).toBe(3);
  });
  it('adds a native project-context MCP trigger for project-scoped Claude installs', async () => {
    execSync('git init -q && git remote add origin https://github.com/example/project.git', { cwd: dir, stdio: 'pipe' });
    await writeClaudeSettings(dir, chalk, 'none', false, true, dir);
    await writeClaudeSettings(dir, chalk, 'none', false, true, dir);

    const s = JSON.parse(fs.readFileSync(path.join(dir, 'settings.json'), 'utf8'));
    const mcpHooks = Object.values(s.hooks)
      .flatMap((groups) => groups)
      .flatMap((group) => group.hooks)
      .filter((hook) => hook.type === 'mcp_tool');

    expect(mcpHooks).toHaveLength(2);
    expect(mcpHooks.every((hook) => hook.server === 'unnamed-development')).toBe(true);
    expect(mcpHooks.every((hook) => hook.tool === 'get_project_context')).toBe(true);
    expect(mcpHooks.every((hook) => hook.input.repoUrl === 'https://github.com/example/project.git')).toBe(true);

    execSync('git remote set-url origin https://user:secret@example.com/project.git', { cwd: dir, stdio: 'pipe' });
    await writeClaudeSettings(dir, chalk, 'none', false, true, dir);
    const sanitized = JSON.parse(fs.readFileSync(path.join(dir, 'settings.json'), 'utf8'));
    expect(JSON.stringify(sanitized)).not.toContain('secret');
    expect(JSON.stringify(sanitized)).toContain('https://example.com/project.git');
  });
  it('does not delete foreign hooks that share the arcwright-hooks directory', async () => {
    // The ci-gates skill installs its gates into the SAME .claude/arcwright-hooks/
    // folder. Ownership must be decided by which script an entry invokes, not by
    // the directory name, or a routine `update` wipes those gates.
    const foreign = (name) => ({
      matcher: 'Write|Edit',
      hooks: [{ type: 'command', command: `node "$CLAUDE_PROJECT_DIR/.claude/arcwright-hooks/${name}"` }],
    });
    fs.writeFileSync(
      path.join(dir, 'settings.json'),
      JSON.stringify({
        hooks: {
          PostToolUse: [foreign('gate-lint.js'), foreign('gate-leak.js')],
          PreToolUse: [foreign('gate-precommit.js')],
        },
      })
    );
    await writeClaudeSettings(dir, chalk, 'safe', false);
    const s = JSON.parse(fs.readFileSync(path.join(dir, 'settings.json'), 'utf8'));
    const all = JSON.stringify(s.hooks);
    expect(all).toContain('gate-lint.js');
    expect(all).toContain('gate-leak.js');
    expect(all).toContain('gate-precommit.js');
    // ...and our own guards are still installed alongside them.
    expect(all).toContain('guard-bash.js');
    // safe mode clears only OUR PostToolUse entry, never the whole event.
    expect(s.hooks.PostToolUse).toBeDefined();
  });
  it('replaces its own hook entries on re-run without duplicating', async () => {
    await writeClaudeSettings(dir, chalk, 'full', false);
    await writeClaudeSettings(dir, chalk, 'full', false);
    const s = JSON.parse(fs.readFileSync(path.join(dir, 'settings.json'), 'utf8'));
    const count = (name) => JSON.stringify(s.hooks).split(name).length - 1;
    expect(count('guard-bash.js')).toBe(1);
    expect(count('guard-write.js')).toBe(1);
    expect(count('typecheck.js')).toBe(1);
    expect(count('dynamodb-context.js')).toBe(1);
    expect(count('amplify-context.js')).toBe(2); // SessionStart + UserPromptSubmit
    expect(count('amplify-review.js')).toBe(1);
    expect(count('cloudfront-context.js')).toBe(2); // SessionStart + UserPromptSubmit
    expect(count('cloudfront-review.js')).toBe(1);
    expect(count('s3-context.js')).toBe(2); // SessionStart + UserPromptSubmit
    expect(count('s3-review.js')).toBe(1);
    expect(count('aurora-context.js')).toBe(2); // SessionStart + UserPromptSubmit
    expect(count('aurora-review.js')).toBe(1);
    expect(count('ses-sns-smtp-context.js')).toBe(2); // SessionStart + UserPromptSubmit
    expect(count('ses-sns-smtp-review.js')).toBe(1);
    expect(count('eventbridge-context.js')).toBe(2); // SessionStart + UserPromptSubmit
    expect(count('eventbridge-review.js')).toBe(1);
    expect(count('cognito-context.js')).toBe(2); // SessionStart + UserPromptSubmit
    expect(count('cognito-review.js')).toBe(1);
    expect(count('lambda-context.js')).toBe(2); // SessionStart + UserPromptSubmit
    expect(count('lambda-review.js')).toBe(1);
    expect(count('step-functions-context.js')).toBe(2); // SessionStart + UserPromptSubmit
    expect(count('step-functions-review.js')).toBe(1);
    expect(count('run the project-context scan')).toBe(1);
    expect(fs.existsSync(path.join(dir, 'arcwright-hooks', 'dynamodb-context.js'))).toBe(true);
    expect(fs.existsSync(path.join(dir, 'arcwright-hooks', 'amplify-review.js'))).toBe(true);
    expect(s.hooks.UserPromptSubmit.some((group) => (
      group.hooks.some((hook) => hook.command?.includes('dynamodb-context.js'))
    ))).toBe(true);
  });
  it('full hooks mode adds the PostToolUse typecheck entry', async () => {
    await writeClaudeSettings(dir, chalk, 'full', false);
    const s = JSON.parse(fs.readFileSync(path.join(dir, 'settings.json'), 'utf8'));
    expect(s.hooks.PostToolUse.some((g) => g.hooks.some((h) => h.command.includes('typecheck.js')))).toBe(true);
    expect(fs.existsSync(path.join(dir, 'arcwright-hooks', 'typecheck.js'))).toBe(true);
  });
  it('removes the DynamoDB router when hooks are disabled', async () => {
    await writeClaudeSettings(dir, chalk, 'safe', false);
    await writeClaudeSettings(dir, chalk, 'none', false);
    const s = JSON.parse(fs.readFileSync(path.join(dir, 'settings.json'), 'utf8'));
    expect(s.hooks.UserPromptSubmit?.some((group) => (
      group.hooks.some((hook) => hook.command?.includes('dynamodb-context.js'))
    ))).not.toBe(true);
    expect(JSON.stringify(s.hooks || {})).not.toContain('amplify-context.js');
    expect(JSON.stringify(s.hooks || {})).not.toContain('amplify-review.js');
    expect(JSON.stringify(s.hooks || {})).not.toContain('cloudfront-context.js');
    expect(JSON.stringify(s.hooks || {})).not.toContain('cloudfront-review.js');
    expect(JSON.stringify(s.hooks || {})).not.toContain('s3-context.js');
    expect(JSON.stringify(s.hooks || {})).not.toContain('s3-review.js');
    expect(JSON.stringify(s.hooks || {})).not.toContain('aurora-context.js');
    expect(JSON.stringify(s.hooks || {})).not.toContain('aurora-review.js');
    expect(JSON.stringify(s.hooks || {})).not.toContain('ses-sns-smtp-context.js');
    expect(JSON.stringify(s.hooks || {})).not.toContain('ses-sns-smtp-review.js');
    expect(JSON.stringify(s.hooks || {})).not.toContain('eventbridge-context.js');
    expect(JSON.stringify(s.hooks || {})).not.toContain('eventbridge-review.js');
    expect(JSON.stringify(s.hooks || {})).not.toContain('cognito-context.js');
    expect(JSON.stringify(s.hooks || {})).not.toContain('cognito-review.js');
    expect(JSON.stringify(s.hooks || {})).not.toContain('lambda-context.js');
    expect(JSON.stringify(s.hooks || {})).not.toContain('lambda-review.js');
    expect(JSON.stringify(s.hooks || {})).not.toContain('step-functions-context.js');
    expect(JSON.stringify(s.hooks || {})).not.toContain('step-functions-review.js');
  });
  it('stripInstallerSettingsKeys removes only installer-default values', async () => {
    await writeClaudeSettings(dir, chalk, 'none', false);
    expect(await stripInstallerSettingsKeys(dir)).toBe(true);
    const s = JSON.parse(fs.readFileSync(path.join(dir, 'settings.json'), 'utf8'));
    expect(s.skillListingBudgetFraction).toBeUndefined();
    expect(s.fallbackModel).toBeUndefined();
    expect(s.env).toBeUndefined(); // both env keys removed → env dropped
  });
  it('stripInstallerSettingsKeys removes owned hooks and acceptEdits when requested', async () => {
    await writeClaudeSettings(dir, chalk, 'safe', false);
    expect(await stripInstallerSettingsKeys(dir, {
      removeHooks: true,
      removeDefaultMode: true,
    })).toBe(true);
    const s = JSON.parse(fs.readFileSync(path.join(dir, 'settings.json'), 'utf8'));
    expect(s.hooks).toBeUndefined();
    expect(s.permissions).toBeUndefined();
  });
  it('stripInstallerSettingsKeys also removes a legacy budget default', async () => {
    // Machines that installed before the budget was raised carry 0.03. If strip
    // only recognised the current default, uninstall would strand it there.
    fs.writeFileSync(
      path.join(dir, 'settings.json'),
      JSON.stringify({ skillListingBudgetFraction: 0.03 })
    );
    expect(await stripInstallerSettingsKeys(dir)).toBe(true);
    const s = JSON.parse(fs.readFileSync(path.join(dir, 'settings.json'), 'utf8'));
    expect(s.skillListingBudgetFraction).toBeUndefined();
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
    expect(out).toMatch(/pending tracker payload/);
  });
  it('buildTmuxEntry and buildProactiveEntry return non-empty strings', () => {
    expect(typeof buildTmuxEntry()).toBe('string');
    expect(buildTmuxEntry().length).toBeGreaterThan(0);
    expect(typeof buildProactiveEntry()).toBe('string');
    expect(buildProactiveEntry().length).toBeGreaterThan(0);
  });
});

describe('removeEmptyDirsUpward — orphan-cleanup leaves no empty skill dirs', () => {
  it('removes the now-empty skill dir but keeps the skills root', async () => {
    const skillsRoot = path.join(dir, 'skills');
    const foo = path.join(skillsRoot, 'foo');
    fs.mkdirSync(foo, { recursive: true });
    fs.writeFileSync(path.join(foo, 'SKILL.md'), 'x');
    fs.rmSync(path.join(foo, 'SKILL.md')); // simulate orphan file removal
    await removeEmptyDirsUpward(path.join(foo, 'SKILL.md'));
    expect(fs.existsSync(foo)).toBe(false);        // empty skill dir cleaned up
    expect(fs.existsSync(skillsRoot)).toBe(true);  // container root preserved
  });

  it('keeps a dir that still has sibling files', async () => {
    const foo = path.join(dir, 'skills', 'foo');
    fs.mkdirSync(foo, { recursive: true });
    fs.writeFileSync(path.join(foo, 'SKILL.md'), 'x');
    fs.writeFileSync(path.join(foo, 'RULES.md'), 'y');
    fs.rmSync(path.join(foo, 'SKILL.md'));
    await removeEmptyDirsUpward(path.join(foo, 'SKILL.md'));
    expect(fs.existsSync(foo)).toBe(true);          // RULES.md still there, dir stays
    expect(fs.existsSync(path.join(foo, 'RULES.md'))).toBe(true);
  });

  it('cleans nested empty dirs up to the container root', async () => {
    const refs = path.join(dir, 'skills', 'foo', 'references');
    fs.mkdirSync(refs, { recursive: true });
    fs.writeFileSync(path.join(refs, 'a.md'), 'x');
    fs.rmSync(path.join(refs, 'a.md'));
    await removeEmptyDirsUpward(path.join(refs, 'a.md'));
    expect(fs.existsSync(path.join(dir, 'skills', 'foo'))).toBe(false); // whole empty skill tree gone
    expect(fs.existsSync(path.join(dir, 'skills'))).toBe(true);         // root kept
  });
});
