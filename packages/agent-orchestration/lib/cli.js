#!/usr/bin/env node
/**
 * arcwright/lib/cli.js
 * Main CLI — parses commands and delegates to installer.
 */
'use strict';

const { Command, Option } = require('commander');
const path = require('path');
const pkg = require('../package.json');

const SUPPORTED_TOOLS = [
  'claude-code',
  'kiro',
  'codex',
  'hermes',
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
  .option('--dotnet', 'Install curated .NET skills (dotnet-* — P/Invoke, AOT, MSBuild, local SDK) + /dotnet command, vendored from dotnet/skills (MIT)')
  .option('--electron', 'Install curated Electron skills (electron-* — security, IPC, packaging, updates, performance, native modules) + /electron command')
  .option('--tauri', 'Install curated Tauri v2 skills (tauri-* — architecture, IPC, capabilities, plugins, distribution, mobile) + /tauri command')
  .option('--aws-infra', 'Install the AWS-Infra module (aws-infra agent + aws-serverless-cdk skill + /aws-infra command)')
  .option('--unnamed-pm', 'Install the Unnamed-PM module (unnamed-pm agent + unnamed-pm-sync skill + /unnamed-pm command)')
  .option('--tmux', 'Set up tmux config (~/.tmux.conf + ~/.config/tmux/ — default when claude-code is selected)')
  .option('--no-tmux', 'Skip tmux setup')
  .option('--gitignore <mode>', 'Gitignore mode: full | skills | output-only | none (default: prompted interactively, or output-only with --yes)')
  .option('--migrate-bmad',    'Auto-migrate bmad installation to arcwright before installing (default when bmad is detected)')
  .option('--no-migrate-bmad', 'Skip auto-migration of existing bmad artifacts')
  .option('--model-launchers', 'Install alternate-model launchers (claude-glm, claude-minimax, claude-qwen, claude-sub — provider-aware) — off by default')
  .addOption(new Option('--openrouter-launchers', 'Alias for --model-launchers (kept for compatibility)').hideHelp())
  .option('--channel <channel>', 'Release channel to track: stable | next (default: stable)', 'stable')
  .option('--hooks <mode>', 'Autonomy posture: safe | full | none (default: prompted, safe with --yes). safe = auto-accept edits + destructive-command/secret guards + SessionStart context; full = + tsc/pyright on edits; none = conservative, ask first')
  .addHelpText('after', `
Examples:
  # Interactive install — prompts for your name, detects existing installation
  npx @arcwright-ai/agent-orchestration

  # Non-interactive, install everything
  npx @arcwright-ai/agent-orchestration --yes

  # Install without agent teams
  npx @arcwright-ai/agent-orchestration --no-teams --yes

  # Install with specific IDEs
  npx @arcwright-ai/agent-orchestration --tools claude-code,kiro --yes

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
  .option('--dotnet', 'Install curated .NET skills (dotnet-*) + /dotnet command')
  .option('--electron', 'Install curated Electron skills (electron-*) + /electron command')
  .option('--tauri', 'Install curated Tauri v2 skills (tauri-*) + /tauri command')
  .option('--aws-infra', 'Install the AWS-Infra module (aws-infra agent + aws-serverless-cdk skill + /aws-infra command)')
  .option('--unnamed-pm', 'Install the Unnamed-PM module (unnamed-pm agent + unnamed-pm-sync skill + /unnamed-pm command)')
  .option('--tmux', 'Set up tmux config (~/.tmux.conf + ~/.config/tmux/ — default when claude-code is selected)')
  .option('--no-tmux', 'Skip tmux setup')
  .option('--gitignore <mode>', 'Gitignore mode: full | skills | output-only | none (default: prompted interactively, or output-only with --yes)')
  .option('--migrate-bmad',    'Auto-migrate bmad installation to arcwright before updating (default when bmad is detected)')
  .option('--no-migrate-bmad', 'Skip auto-migration of existing bmad artifacts')
  .option('--model-launchers', 'Install alternate-model launchers (claude-glm, claude-minimax, claude-qwen, claude-sub — provider-aware) — off by default')
  .addOption(new Option('--openrouter-launchers', 'Alias for --model-launchers (kept for compatibility)').hideHelp())
  .option('--channel <channel>', 'Release channel to track: stable | next (default: stable)', 'stable')
  .option('--hooks <mode>', 'Autonomy posture: safe | full | none (default: prompted, safe with --yes). safe = auto-accept edits + destructive-command/secret guards + SessionStart context; full = + tsc/pyright on edits; none = conservative, ask first')
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

// ─── uninstall ────────────────────────────────────────────────────────────────

program
  .command('uninstall')
  .description('Remove Arcwright from your project or global config — strips managed CLAUDE.md blocks, .gitignore block, installer-written settings.json keys, and (with --yes) installed files.')
  .option('-y, --yes', 'Skip confirmation prompts and remove installed files without asking', false)
  .option('-g, --global', 'Uninstall from global config (~/.claude/, ~/.arcwright/)', false)
  .option('-d, --directory <path>', 'Project root', '.')
  .addHelpText('after', `
Examples:
  # Interactive uninstall from current project (prompts to remove installed files)
  npx @arcwright-ai/agent-orchestration uninstall

  # Non-interactive, remove everything
  npx @arcwright-ai/agent-orchestration uninstall --yes

  # Global uninstall
  npx @arcwright-ai/agent-orchestration uninstall --global --yes
`)
  .action(async (opts) => {
    const { uninstall } = require('./installer');
    await uninstall({
      global: opts.global,
      yes: opts.yes,
      directory: opts.directory,
    });
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
      ['Platform ID',      'Label',            'Rules file',                        'Agent stubs / skills'],
      ['claude-code',      'Claude Code',       '.claude/CLAUDE.md',                 '.claude/agents/'],
      ['kiro',             'Kiro (IDE + CLI)',   '.kiro/steering/*.md',               '.kiro/skills/'],
      ['codex',            'Codex',             'AGENTS.md',                         '.agents/skills/ ($HOME or project)'],
      ['hermes',           'Hermes',            'AGENTS.md (project only)',          '~/.hermes/skills/ (global only)'],
    ];
    const widths = rows[0].map((_, i) => Math.max(...rows.map(r => r[i].length)));
    for (const row of rows) {
      console.log('  ' + row.map((cell, i) => cell.padEnd(widths[i])).join('   '));
    }
    console.log('\nPass multiple platforms with --tools:\n  npx @arcwright-ai/agent-orchestration --tools claude-code,kiro,codex,hermes\n');
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
