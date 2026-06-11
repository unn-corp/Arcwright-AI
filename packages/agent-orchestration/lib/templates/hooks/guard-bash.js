#!/usr/bin/env node
/**
 * Arcwright PreToolUse(Bash) guard. Reads the hook payload on stdin, blocks
 * obviously destructive shell commands by exiting 2 (Claude Code treats a
 * non-zero PreToolUse exit as "deny" and shows stderr to the model).
 * Conservative by design — only high-confidence destructive patterns.
 */
'use strict';

let raw = '';
process.stdin.on('data', (c) => (raw += c));
process.stdin.on('end', () => {
  let cmd = '';
  try {
    const payload = JSON.parse(raw || '{}');
    cmd = (payload.tool_input && payload.tool_input.command) || '';
  } catch {
    process.exit(0); // can't parse — don't block
  }
  if (!cmd) process.exit(0);

  const blocks = [
    [/\brm\s+-rf?\s+(\/|~|\$HOME)(\s|$)/, 'rm -rf on / or home'],
    [/\bgit\s+push\s+(--force|-f)\b.*\b(main|master)\b/, 'force-push to main/master'],
    [/\bgit\s+push\s+.*\b(main|master)\b.*\s(--force|-f)\b/, 'force-push to main/master'],
    [/\bgit\s+reset\s+--hard\s+origin\//, 'hard reset to remote (discards local work)'],
    [/\bgit\s+clean\s+-[a-z]*f[a-z]*d/, 'git clean -fd (deletes untracked files)'],
    [/\bchmod\s+-R\s+777\b/, 'recursive chmod 777'],
    [/:\(\)\s*\{\s*:\|:&\s*\}\s*;:/, 'fork bomb'],
    [/\bmkfs\.|\bdd\s+if=.*of=\/dev\//, 'disk format / raw device write'],
    [/>\s*\/dev\/sd[a-z]/, 'write to raw block device'],
  ];

  for (const [re, why] of blocks) {
    if (re.test(cmd)) {
      process.stderr.write(
        `Arcwright hook blocked a destructive command (${why}).\n` +
          `Command: ${cmd}\n` +
          `If this is intentional, run it manually or disable the Arcwright bash guard in .claude/settings.json.\n`
      );
      process.exit(2); // deny
    }
  }
  process.exit(0);
});
