#!/usr/bin/env node
/**
 * arcwright/bin/arcwright.js
 * NPX entry point — handles npx temp-directory path issues, then delegates to CLI.
 */
'use strict';

const path = require('path');
const { execFileSync } = require('child_process');

const cliPath = path.join(__dirname, '..', 'lib', 'cli.js');
const isNpx = __dirname.includes('_npx') || __dirname.includes('.npm') || __dirname.includes('npx');

// Inject 'install' when invocation starts with options (or has no arguments).
// Any bare first argument is a command for Commander to validate, which keeps
// this wrapper from duplicating the command registry in lib/cli.js.
const userArgs = process.argv.slice(2);
const hasExplicitCommand = userArgs.length > 0 && !userArgs[0].startsWith('-');
const effectiveArgs = hasExplicitCommand ? userArgs : ['install', ...userArgs];

if (isNpx) {
  // When running via npx, CWD is the user's project. Pass argv directly rather
  // than interpolating it into a shell command: JSON quotes do not stop shell
  // command substitution in a second evaluation.
  try {
    execFileSync(process.execPath, [cliPath, ...effectiveArgs], {
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
