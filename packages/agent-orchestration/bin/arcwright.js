#!/usr/bin/env node
/**
 * arcwright/bin/arcwright.js
 * Release runtime entry point. Delegates install/update behavior to the shared CLI.
 */
'use strict';

const path = require('path');

const cliPath = path.join(__dirname, '..', 'lib', 'cli.js');

// Inject 'install' when invocation starts with options (or has no arguments).
// Any bare first argument is a command for Commander to validate, which keeps
// this wrapper from duplicating the command registry in lib/cli.js.
const userArgs = process.argv.slice(2);
const hasExplicitCommand = userArgs.length > 0 && !userArgs[0].startsWith('-');
const effectiveArgs = hasExplicitCommand ? userArgs : ['install', ...userArgs];

process.argv = [process.argv[0], process.argv[1], ...effectiveArgs];
require(cliPath);
