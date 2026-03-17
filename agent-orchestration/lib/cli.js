#!/usr/bin/env node
/**
 * bmad-package/lib/cli.js
 * Main CLI — parses commands and delegates to installer.
 */
'use strict';

const { Command } = require('commander');
const path = require('path');
const pkg = require('../package.json');

const SUPPORTED_TOOLS = [
  'claude-code',
  'cursor',
  'windsurf',
  'cline',
  'github-copilot',
  'gemini',
].join(', ');

const program = new Command();

program
  .name('bmad')
  .description('BMAD Method — install AI-native agile workflows into your project')
  .version(pkg.version);

// ─── install (default) ────────────────────────────────────────────────────────

program
  .command('install', { isDefault: true })
  .description('Install BMAD into the current project (default command — runs on `npx @devo-bmad-custom/agent-orchestration`)')
  .option('-d, --directory <path>', 'Target project root', process.cwd())
  .option('-m, --modules <ids>', 'Modules to install (comma-separated: bmm,bmb,core,_memory)', 'bmm,bmb,core,_memory')
  .option('--tools <ids>', `IDE integrations to configure (comma-separated). Supported: ${SUPPORTED_TOOLS}`, 'claude-code')
  .option('--user-name <name>', 'Your name (written into config.yaml)', '')
  .option('--output-folder <path>', 'Output folder for BMAD artifacts', '_bmad-output')
  .option('-y, --yes', 'Skip interactive prompts and accept all defaults', false)
  .addHelpText('after', `
Examples:
  # Interactive install — prompts for your name, detects existing installation
  npx @devo-bmad-custom/agent-orchestration

  # Non-interactive, install everything
  npx @devo-bmad-custom/agent-orchestration --yes

  # Install with specific IDEs
  npx @devo-bmad-custom/agent-orchestration --tools claude-code,cursor,windsurf --yes

  # Install into a specific directory
  npx @devo-bmad-custom/agent-orchestration --directory /path/to/project --yes
`)
  .action(async (opts) => {
    const { install } = require('./installer');
    await install(opts);
  });

// ─── update ───────────────────────────────────────────────────────────────────

program
  .command('update')
  .description('Update an existing BMAD installation — adds/removes files to match new version, preserves config.yaml')
  .option('-d, --directory <path>', 'Target project root', process.cwd())
  .option('-m, --modules <ids>', 'Modules to update (defaults to all installed modules)', 'bmm,bmb,core,_memory')
  .option('--tools <ids>', `IDE integrations to re-configure (comma-separated). Supported: ${SUPPORTED_TOOLS}`, 'claude-code')
  .option('-y, --yes', 'Skip interactive prompts', false)
  .addHelpText('after', `
Examples:
  # Interactive update — shows installed version, preserves your name
  npx @devo-bmad-custom/agent-orchestration update

  # Non-interactive update
  npx @devo-bmad-custom/agent-orchestration update --yes

  # Update and add Cursor support
  npx @devo-bmad-custom/agent-orchestration update --tools claude-code,cursor --yes
`)
  .action(async (opts) => {
    const { install } = require('./installer');
    await install({ ...opts, action: 'update' });
  });

// ─── status ───────────────────────────────────────────────────────────────────

program
  .command('status')
  .description('Show current BMAD installation status, version, and tracked file count')
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
      ['cursor',           'Cursor',            '.cursor/rules/bmad.mdc',            '—'],
      ['windsurf',         'Windsurf',          '.windsurfrules',                    '—'],
      ['cline',            'Cline',             '.clinerules',                       '—'],
      ['github-copilot',   'GitHub Copilot',    '.github/copilot-instructions.md',   '—'],
      ['gemini',           'Gemini CLI',        'GEMINI.md',                         '—'],
    ];
    const widths = rows[0].map((_, i) => Math.max(...rows.map(r => r[i].length)));
    for (const row of rows) {
      console.log('  ' + row.map((cell, i) => cell.padEnd(widths[i])).join('   '));
    }
    console.log('\nPass multiple platforms with --tools:\n  npx @devo-bmad-custom/agent-orchestration --tools claude-code,cursor,windsurf\n');
  });

// ─── tmux ─────────────────────────────────────────────────────────────────────

program
  .command('tmux')
  .description('Set up tmux for AI agent workflows — writes config, scripts, and walks through WSL prerequisites')
  .option('-d, --directory <path>', 'Project root (used for squid/squid-claude aliases)', process.cwd())
  .addHelpText('after', `
Examples:
  # Interactive tmux setup
  npx @devo-bmad-custom/agent-orchestration tmux

  # tmux setup for a specific project directory
  npx @devo-bmad-custom/agent-orchestration tmux --directory /path/to/project
`)
  .action(async (opts) => {
    const { setupTmux } = require('./installer');
    const chalk = (await import('chalk')).default;
    await setupTmux(path.resolve(opts.directory), chalk);
  });

program.parse();
