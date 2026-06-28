'use strict';
/**
 * @arcwright-ai/tmux-setup — lib/cli.js
 */

const { Command } = require('commander');
const { setupTmux } = require('./installer');

const program = new Command();

program
  .name('arcwright-tmux')
  .description('tmux setup for AI agent workflows — Claude Code + multi-agent pipelines')
  .version('1.0.0');

program
  .command('install', { isDefault: true })
  .description('Interactive tmux setup — config, scripts, TPM, Nerd Fonts, aliases')
  .option('-d, --directory <path>', 'Project root (used for tmux-ai/tmux-claude aliases)', process.cwd())
  .option('--claude-usage', 'Install the Claude usage status-bar segment (skip the prompt)')
  .option('--no-claude-usage', 'Skip the Claude usage status-bar segment')
  .action(async (opts) => {
    const chalk = (await import('chalk')).default;
    // opts.claudeUsage: true (--claude-usage), false (--no-claude-usage), or
    // undefined (neither → installer prompts interactively).
    await setupTmux(opts.directory, chalk, { claudeUsage: opts.claudeUsage });
  });

program.addHelpText('after', `
Examples:
  # Interactive tmux setup
  npx @arcwright-ai/tmux-setup

  # tmux setup for a specific project directory
  npx @arcwright-ai/tmux-setup --directory /path/to/project
`);

program.parse(process.argv);
