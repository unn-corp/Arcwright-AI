#!/usr/bin/env node
/**
 * arcwright/lib/cli.js
 * Main CLI — parses commands and delegates to installer.
 */
'use strict';

const { Command } = require('commander');
const path = require('path');
const pkg = require('../package.json');

const SUPPORTED_TOOLS = [
  'claude-code',
  'kiro',
  'cursor',
  'windsurf',
  'cline',
  'github-copilot',
  'gemini',
].join(', ');

const program = new Command();

program
  .name('arcwright')
  .description('Arcwright — install AI-native agile workflows into your project')
  .version(pkg.version);

// ─── install (default) ────────────────────────────────────────────────────────

program
  .command('install', { isDefault: true })
  .description('Install Arcwright into the current project (default command — runs on `npx @arcwright-ai/agent-orchestration`)')
  .option('-d, --directory <path>', 'Target project root', process.cwd())
  .option('-m, --modules <ids>', 'Modules to install (comma-separated: awm,awb,core,_memory)', 'awm,awb,core,_memory')
  .option('--tools <ids>', `IDE integrations to configure (comma-separated). Supported: ${SUPPORTED_TOOLS}`, 'claude-code')
  .option('--user-name <name>', 'Your name (written into config.yaml)', '')
  .option('--output-folder <path>', 'Output folder for Arcwright artifacts', '_arcwright-output')
  .option('-y, --yes', 'Skip interactive prompts and accept all defaults', false)
  .option('-g, --global', 'Install to global config dirs (~/.claude/, ~/.kiro/, etc.)')
  .option('--no-teams', 'Skip agent team skills and /team command (saves 17 team-* skills)')
  .option('--docker-check', 'Install /docker-check and docker-type-check skill (runs tsc inside Docker dev container)')
  .option('--gitignore <mode>', 'Gitignore mode: full | skills | output-only | none (default: prompted interactively, or output-only with --yes)')
  .addHelpText('after', `
Examples:
  # Interactive install — prompts for your name, detects existing installation
  npx @arcwright-ai/agent-orchestration

  # Non-interactive, install everything
  npx @arcwright-ai/agent-orchestration --yes

  # Install without agent teams
  npx @arcwright-ai/agent-orchestration --no-teams --yes

  # Install with specific IDEs
  npx @arcwright-ai/agent-orchestration --tools claude-code,kiro,cursor --yes

  # Install into a specific directory
  npx @arcwright-ai/agent-orchestration --directory /path/to/project --yes

  # Global install (applies to all projects)
  npx @arcwright-ai/agent-orchestration --global --yes

  # Install with gitignore mode set (skips the gitignore prompt)
  npx @arcwright-ai/agent-orchestration --yes --gitignore output-only
  npx @arcwright-ai/agent-orchestration --yes --gitignore full
  npx @arcwright-ai/agent-orchestration --yes --gitignore none
`)
  .action(async (opts) => {
    const { install } = require('./installer');
    await install(opts);
  });

// ─── update ───────────────────────────────────────────────────────────────────

program
  .command('update')
  .description('Update an existing Arcwright installation — adds/removes files to match new version, preserves config.yaml')
  .option('-d, --directory <path>', 'Target project root', process.cwd())
  .option('-m, --modules <ids>', 'Modules to update (defaults to all installed modules)', 'awm,awb,core,_memory')
  .option('--tools <ids>', `IDE integrations to re-configure (comma-separated). Supported: ${SUPPORTED_TOOLS}`, 'claude-code')
  .option('-y, --yes', 'Skip interactive prompts', false)
  .option('-g, --global', 'Update global config dirs (~/.claude/, ~/.kiro/, etc.)')
  .option('--no-teams', 'Skip agent team skills and /team command')
  .option('--docker-check', 'Install /docker-check and docker-type-check skill')
  .option('--gitignore <mode>', 'Gitignore mode: full | skills | output-only | none (default: prompted interactively, or output-only with --yes)')
  .addHelpText('after', `
Examples:
  # Interactive update — shows installed version, preserves your name
  npx @arcwright-ai/agent-orchestration update

  # Non-interactive update
  npx @arcwright-ai/agent-orchestration update --yes

  # Update and add Kiro support
  npx @arcwright-ai/agent-orchestration update --tools claude-code,kiro --yes

  # Update with explicit gitignore mode
  npx @arcwright-ai/agent-orchestration update --yes --gitignore skills
`)
  .action(async (opts) => {
    const { install } = require('./installer');
    await install({ ...opts, action: 'update' });
  });

// ─── status ───────────────────────────────────────────────────────────────────

program
  .command('status')
  .description('Show current Arcwright installation status, version, and tracked file count')
  .option('-d, --directory <path>', 'Target project root', process.cwd())
  .action(async (opts) => {
    const { status } = require('./installer');
    await status(opts);
  });

// ─── platforms ────────────────────────────────────────────────────────────────

program
  .command('platforms')
  .description('List all supported IDE platforms and the files they configure')
  .action(() => {
    console.log('\nSupported IDE platforms:\n');
    const rows = [
      ['Platform ID',      'Label',            'Rules file',                        'Agent stubs'],
      ['claude-code',      'Claude Code',       '.claude/CLAUDE.md',                 '.claude/agents/'],
      ['kiro',             'Kiro (IDE + CLI)',   '.kiro/steering/*.md',               '.kiro/skills/'],
      ['cursor',           'Cursor',            '.cursor/rules/arcwright.mdc',        '—'],
      ['windsurf',         'Windsurf',          '.windsurfrules',                    '—'],
      ['cline',            'Cline',             '.clinerules',                       '—'],
      ['github-copilot',   'GitHub Copilot',    '.github/copilot-instructions.md',   '—'],
      ['gemini',           'Gemini CLI',        'GEMINI.md',                         '—'],
    ];
    const widths = rows[0].map((_, i) => Math.max(...rows.map(r => r[i].length)));
    for (const row of rows) {
      console.log('  ' + row.map((cell, i) => cell.padEnd(widths[i])).join('   '));
    }
    console.log('\nPass multiple platforms with --tools:\n  npx @arcwright-ai/agent-orchestration --tools claude-code,kiro,cursor\n');
  });

// ─── tmux ─────────────────────────────────────────────────────────────────────

program
  .command('tmux')
  .description('Set up tmux for AI agent workflows — writes config, scripts, and walks through WSL prerequisites')
  .option('-d, --directory <path>', 'Project root (used for tmux-ai/tmux-claude aliases)', process.cwd())
  .addHelpText('after', `
Examples:
  # Interactive tmux setup
  npx @arcwright-ai/agent-orchestration tmux

  # tmux setup for a specific project directory
  npx @arcwright-ai/agent-orchestration tmux --directory /path/to/project
`)
  .action(async (opts) => {
    const { setupTmux } = require('./installer');
    const chalk = (await import('chalk')).default;
    await setupTmux(path.resolve(opts.directory), chalk);
  });

// ─── migrate ─────────────────────────────────────────────────────────────────

program
  .command('migrate')
  .description('Migrate an existing bmad installation to arcwright naming — renames dirs, files, and content')
  .option('-d, --directory <path>', 'Target project root', process.cwd())
  .option('--dry-run', 'Preview changes without applying them', false)
  .addHelpText('after', `
Examples:
  # Preview what would change
  npx @arcwright-ai/agent-orchestration migrate --dry-run

  # Apply the migration
  npx @arcwright-ai/agent-orchestration migrate

  # Migrate a specific project
  npx @arcwright-ai/agent-orchestration migrate --directory /path/to/project
`)
  .action(async (opts) => {
    const { migrate } = require('./migrate');
    migrate(path.resolve(opts.directory), opts.dryRun);
  });

program.parse();
