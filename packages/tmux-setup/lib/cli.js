'use strict';
/**
 * @arcwright/tmux-setup — lib/cli.js
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
  .action(async (opts) => {
    const chalk = (await import('chalk')).default;
    await setupTmux(opts.directory, chalk);
  });

program.addHelpText('after', `
Examples:
  # Interactive tmux setup
  npx @arcwright/tmux-setup

  # tmux setup for a specific project directory
  npx @arcwright/tmux-setup --directory /path/to/project
`);

program.parse(process.argv);
