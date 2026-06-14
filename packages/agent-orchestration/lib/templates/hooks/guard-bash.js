#!/usr/bin/env node
/**
 * Arcwright PreToolUse(Bash) guard. Reads the hook payload on stdin, blocks
 * obviously destructive shell commands by exiting 2 (Claude Code treats a
 * non-zero PreToolUse exit as "deny" and shows stderr to the model).
 * Conservative by design — only high-confidence destructive patterns.
 *
 * Patterns are matched against the *effective* command, with quoted strings
 * and comments removed first — so a command that merely mentions a dangerous
 * pattern (e.g. `echo "git push --force main"`, a `# rm -rf /` comment, or a
 * heredoc/doc fixture) is not blocked. Only an actual unquoted destructive
 * command trips the guard. Trade-off: a quoted dangerous path like
 * `rm -rf "/"` is not caught — acceptable for a high-confidence guard.
 */
'use strict';

/**
 * Strip single/double-quoted spans and shell comments so pattern matching sees
 * only the executable structure of the command, not text it merely quotes or
 * comments. `#` starts a comment only at a word boundary (start or after
 * whitespace), matching shell behavior.
 */
function effectiveCommand(cmd) {
  let out = '';
  let quote = null;
  for (let i = 0; i < cmd.length; i++) {
    const ch = cmd[i];
    if (quote) {
      if (ch === quote) quote = null;
      continue; // drop everything inside quotes
    }
    if (ch === "'" || ch === '"') {
      quote = ch;
      out += ' '; // collapse the quoted span to a separator
      continue;
    }
    if (ch === '#' && (i === 0 || /\s/.test(cmd[i - 1]))) {
      while (i < cmd.length && cmd[i] !== '\n') i++; // skip to end of line
      out += '\n';
      continue;
    }
    out += ch;
  }
  return out;
}

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

  const scanned = effectiveCommand(cmd);

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
    if (re.test(scanned)) {
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
