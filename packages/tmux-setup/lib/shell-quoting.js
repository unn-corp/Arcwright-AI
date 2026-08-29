'use strict';

const CONTROL_CHARACTER_RE = /[\u0000-\u001f\u007f]/u;
const CLAUDE_COMMAND = 'claude --dangerously-skip-permissions';

function assertNoControlCharacters(value, label = 'Value') {
  if (typeof value !== 'string') {
    throw new TypeError(`${label} must be a string`);
  }
  if (CONTROL_CHARACTER_RE.test(value)) {
    throw new Error(`${label} cannot contain control characters`);
  }
  return value;
}

function quoteForPosixShell(value) {
  assertNoControlCharacters(value, 'POSIX shell value');
  return `'${value.replace(/'/g, "'\\''")}'`;
}

function quoteForPowerShell(value) {
  assertNoControlCharacters(value, 'PowerShell value');
  return `'${value.replace(/'/g, "''")}'`;
}

function buildPosixAliasBlock(projectRoot) {
  const quotedRoot = quoteForPosixShell(projectRoot);
  const tmuxCommand = `tmux new-session -c ${quotedRoot}`;
  const tmuxClaudeCommand = `${tmuxCommand} ${quoteForPosixShell(CLAUDE_COMMAND)}`;

  const tmuxAlias = `alias tmux-ai=${quoteForPosixShell(tmuxCommand)}`;
  const tmuxClaudeAlias = `alias tmux-claude=${quoteForPosixShell(tmuxClaudeCommand)}`;
  return `\n# Arcwright tmux shortcuts\n${tmuxAlias}\n${tmuxClaudeAlias}\n`;
}

function buildPowerShellAliasBlock(projectRoot, distro = '') {
  const quotedRoot = quoteForPowerShell(projectRoot);
  const distroFlag = distro ? `-d ${quoteForPowerShell(distro)} ` : '';
  const quotedClaudeCommand = quoteForPowerShell(CLAUDE_COMMAND);

  return [
    '',
    '# Arcwright tmux shortcuts (wraps WSL tmux)',
    `function tmux-ai     { wsl ${distroFlag}--cd ${quotedRoot} -- tmux new-session }`,
    `function tmux-claude { wsl ${distroFlag}--cd ${quotedRoot} -- tmux new-session ${quotedClaudeCommand} }`,
    '',
  ].join('\n');
}

module.exports = {
  assertNoControlCharacters,
  buildPosixAliasBlock,
  buildPowerShellAliasBlock,
  quoteForPosixShell,
  quoteForPowerShell,
};
