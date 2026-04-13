#!/usr/bin/env node
/**
 * arcwright/bin/arcwright.js
 * NPX entry point — handles npx temp-directory path issues, then delegates to CLI.
 */
'use strict';

const path = require('path');
const { execSync } = require('child_process');

const cliPath = path.join(__dirname, '..', 'lib', 'cli.js');
const isNpx = __dirname.includes('_npx') || __dirname.includes('.npm') || __dirname.includes('npx');

// Inject 'install' as default subcommand when none is provided
const SUBCOMMANDS = ['install', 'update', 'status', 'platforms', 'tmux'];
const userArgs = process.argv.slice(2);
const hasSubcommand = userArgs.length > 0 && SUBCOMMANDS.includes(userArgs[0]);
const effectiveArgs = hasSubcommand ? userArgs : ['install', ...userArgs];

if (isNpx) {
  // When running via npx, CWD is the user's project — spawn with correct CWD
  const args = effectiveArgs.map(a => JSON.stringify(a)).join(' ');
  try {
    execSync(`node ${JSON.stringify(cliPath)} ${args}`, {
      cwd: process.cwd(),
      stdio: 'inherit',
      env: process.env,
    });
  } catch (e) {
    process.exit(e.status || 1);
  }
} else {
  // Rewrite argv so Commander sees the effective args
  process.argv = [process.argv[0], process.argv[1], ...effectiveArgs];
  require(cliPath);
}
