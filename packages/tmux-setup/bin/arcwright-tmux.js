#!/usr/bin/env node
/**
 * @arcwright-ai/tmux-setup — bin/arcwright-tmux.js
 * NPX entry point — runs interactive tmux setup.
 */
'use strict';

const path = require('path');
const { execSync } = require('child_process');

const cliPath = path.join(__dirname, '..', 'lib', 'cli.js');
const isNpx = __dirname.includes('_npx') || __dirname.includes('.npm') || __dirname.includes('npx');

if (isNpx) {
  try {
    execSync(`node ${JSON.stringify(cliPath)}`, {
      cwd: process.cwd(),
      stdio: 'inherit',
      env: process.env,
    });
  } catch (e) {
    process.exit(e.status || 1);
  }
} else {
  require(cliPath);
}
