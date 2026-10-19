#!/usr/bin/env node
'use strict';

// Exercise the shipped artifact in throwaway homes/projects, never the workshop.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { execFileSync } = require('node:child_process');
const yaml = require('../packages/agent-orchestration/node_modules/yaml');

const root = path.resolve(__dirname, '..');
const release = path.resolve(process.argv[2] || path.join(root, 'dist'));
const legacy = process.argv[3] && path.resolve(process.argv[3]);
const remote = process.env.ARCWRIGHT_VERIFY_REMOTE === '1';
const metadata = JSON.parse(fs.readFileSync(path.join(release, 'release.json'), 'utf8'));
const archive = path.join(release, metadata.archive);
const listing = execFileSync('tar', ['-tzf', archive], { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
for (const resource of [
  'src/.agents/skills/matt-pocock/SOURCE.json',
  'src/.agents/skills/matt-pocock-triage/AGENT-BRIEF.md',
  'src/.agents/skills/matt-pocock-tdd/LICENSE',
  'src/.claude/commands/matt-pocock.md',
  'lib/templates/hooks/guard-bash.js',
]) assert(listing.includes(`arcwright/${resource}\n`), `Missing release resource: ${resource}`);
assert(!/(?:^|\/)\.git\//m.test(listing), 'Git history was bundled');
assert(!listing.includes('unnamed-dev-skills'), 'Private organization pack was bundled');

const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'arcwright-release-verify-'));
try {
  for (const useLegacy of legacy ? [false, true] : [false]) {
    for (const global of [false, true]) {
      const name = `${useLegacy ? 'npm-migration' : 'fresh'}-${global ? 'global' : 'project'}`;
      const scenario = path.join(temporary, name);
      const isolatedHome = path.join(scenario, 'home');
      const project = path.join(scenario, 'project with spaces');
      fs.mkdirSync(isolatedHome, { recursive: true });
      fs.mkdirSync(project, { recursive: true });
      const env = { ...process.env, HOME: isolatedHome, ARCWRIGHT_PLATFORM: 'linux-native', Arcwright_PLATFORM: 'linux-native' };
      delete env.CLAUDE_CONFIG_DIR;
      const write = (file, content) => {
        fs.mkdirSync(path.dirname(file), { recursive: true });
        fs.writeFileSync(file, content);
      };
      const hostRoot = global ? isolatedHome : project;
      const bundle = global ? path.join(isolatedHome, '.arcwright') : path.join(project, '_arcwright');
      const rules = global ? path.join(bundle, 'AGENTS.md') : path.join(project, 'AGENTS.md');
      write(rules, '# Personal conventions\nKeep my instructions.\n');
      const personalSkill = path.join(hostRoot, '.agents/skills/personal-skill/SKILL.md');
      write(personalSkill, 'User-owned skill\n');
      const personalCommand = path.join(hostRoot, '.claude/commands/personal.md');
      write(personalCommand, 'User-owned command\n');
      const settingsPath = path.join(hostRoot, '.claude/settings.json');
      write(settingsPath, JSON.stringify({ env: { PERSONAL_SETTING: 'keep' }, permissions: { allow: ['Read'] } }));
      const flags = ['--yes', '--directory', project, '--hooks', 'safe', ...(global ? ['--global'] : [])];
      const run = (entry, args) => execFileSync(process.execPath, [entry, ...args], {
        env, cwd: project, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024,
        stdio: ['ignore', 'pipe', 'pipe'], timeout: 120_000,
      });
      // The published 1.2.2 baseline predates Codex and hook flags. Upgrade its
      // Claude setup and add Codex through the new release's explicit selection.
      if (useLegacy) run(path.join(legacy, 'bin/arcwright.js'), [
        'install', '--tools', 'claude-code', '--no-teams', '--no-tmux',
        '--yes', '--directory', project, ...(global ? ['--global'] : []),
      ]);
      const launcher = path.join(release, 'arcwright.cjs');
      const distribution = remote ? ['--release', metadata.version] : ['--archive', archive];
      run(launcher, [...distribution, useLegacy ? 'update' : 'install', ...flags, '--tools', 'claude-code,codex', ...(!useLegacy ? ['--no-teams'] : [])]);
      const configuration = path.join(bundle, 'awm/config.yaml');
      fs.appendFileSync(configuration, '\n# Retain this configuration\n');
      const installedLauncher = path.join(isolatedHome, '.local/bin/arcwright');
      run(installedLauncher, [...distribution, 'update', ...flags]);
      const manifest = yaml.parse(fs.readFileSync(path.join(bundle, '_config/manifest.yaml'), 'utf8'));
      assert.equal(manifest.version, metadata.version);
      assert.deepEqual(manifest.tools, ['claude-code', 'codex']);
      assert.equal(manifest.teams, false);
      assert.equal(manifest.global, global);
      assert(fs.readFileSync(configuration, 'utf8').includes('# Retain this configuration'));
      assert.equal(fs.readFileSync(personalSkill, 'utf8'), 'User-owned skill\n');
      assert.equal(fs.readFileSync(personalCommand, 'utf8'), 'User-owned command\n');
      const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
      assert.equal(settings.env.PERSONAL_SETTING, 'keep');
      assert(settings.permissions.allow.includes('Read'));
      assert(settings.hooks.SessionStart.length > 0);
      const shared = fs.readFileSync(rules, 'utf8');
      assert(shared.includes('Keep my instructions.'));
      assert(shared.includes('`arcwright update`'));
      assert(!shared.includes('npx @arcwright-ai/agent-orchestration'));
      assert.equal(shared.split('<!-- arcwright-agent-start -->').length - 1, 1);
      for (const skill of ['arcwright', 'test-quality', 'project-context']) {
        assert(fs.existsSync(path.join(hostRoot, '.agents/skills', skill, 'SKILL.md')), `Codex skill missing: ${skill}`);
        if (global) assert(fs.existsSync(path.join(isolatedHome, '.claude/skills', skill, 'SKILL.md')), `Claude skill missing: ${skill}`);
      }
      assert(fs.existsSync(path.join(hostRoot, '.claude/commands/triage.md')));
      if (global) assert(fs.readFileSync(path.join(isolatedHome, '.codex/AGENTS.md'), 'utf8').includes('Arcwright'));
      assert.equal(run(installedLauncher, ['--version']).trim(), metadata.version);
      console.log(`PASS ${name}: Codex + Claude skills, commands, hooks, preferences, and repeat update`);
    }
  }
  if (!legacy) console.log('Legacy npm migration: supply its installed runtime as the second argument to verify it.');
} finally {
  fs.rmSync(temporary, { recursive: true, force: true });
}
