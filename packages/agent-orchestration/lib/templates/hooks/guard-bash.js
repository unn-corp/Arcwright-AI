#!/usr/bin/env node
/**
 * Arcwright PreToolUse(Bash) guard. Reads the hook payload on stdin, blocks
 * obviously destructive shell commands by exiting 2 (Claude Code treats a
 * non-zero PreToolUse exit as "deny" and shows stderr to the model).
 * Conservative by design — only high-confidence destructive patterns.
 *
 * Most patterns are matched against an effective command with quoted strings
 * and comments removed. Recursive rm is handled separately against the raw
 * command so quoted filesystem operands such as `rm -rf "/"` remain blocked.
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

/**
 * True when the command contains an `rm` that recursively targets a filesystem
 * root or the home directory.
 *
 * This is a function rather than one regex because a single pattern could not
 * cover the real spelling space, and the previous one-liner
 * (`/\brm\s+-rf?\s+(\/|~|\$HOME)(\s|$)/`) let five destructive forms through:
 *
 *   rm -rf /*        target had a trailing glob, so `(\s|$)` never matched
 *   rm -rf ~/        same, trailing slash
 *   rm -rf $HOME/    same
 *   rm -fr /         flags in the other order
 *   rm -r -f /       flags as separate tokens
 *
 * Approach: split on shell separators, then for each `rm` segment check the
 * flag tokens and the operand tokens independently, so order and spelling of
 * the flags no longer matter.
 */
const ROOTISH_TARGET =
  /^(?:\/|~|\$HOME|\$\{HOME\})(?:\/)?(?:\*)?$|^(?:\$HOME|\$\{HOME\}|~)\/\*$/;
const RECURSIVE_FLAG = /^-(?:-recursive$|[a-zA-Z]*[rR][a-zA-Z]*$)/;

function normalizeRmOperand(token) {
  // Quote delimiters can surround only part of a shell word, as in
  // `"$HOME"/*`. Remove them throughout the token before matching the
  // resulting operand against the root/home patterns.
  return token.replace(/["']/g, '');
}

function hasDestructiveRm(cmd) {
  for (const segment of cmd.split(/(?:&&|\|\||[;&|\n])+/)) {
    const tokens = segment.trim().split(/\s+/).filter(Boolean);
    // Skip leading privilege wrappers so `sudo rm …` is still inspected.
    let i = 0;
    while (i < tokens.length && /^(sudo|doas|env|command|nohup|time)$/.test(tokens[i])) i++;
    if (tokens[i] !== 'rm') continue;
    const rest = tokens.slice(i + 1);
    // `--no-preserve-root` has essentially one purpose; treat it as sufficient.
    if (rest.some((t) => t === '--no-preserve-root')) return true;
    const recursive = rest.some((t) => RECURSIVE_FLAG.test(t));
    const rootish = rest.some((token) => {
      const target = normalizeRmOperand(token);
      return !target.startsWith('-') && ROOTISH_TARGET.test(target);
    });
    if (recursive && rootish) return true;
  }
  return false;
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

  const deny = (why) => {
    process.stderr.write(
      `Arcwright hook blocked a destructive command (${why}).\n` +
        `Command: ${cmd}\n` +
        `If this is intentional, run it manually or disable the Arcwright bash guard in .claude/settings.json.\n`
    );
    process.exit(2);
  };

  if (hasDestructiveRm(cmd)) deny('rm -rf on / or home');

  // `--force-with-lease` is the SAFE variant of a force-push (it refuses when
  // the remote moved under you), so it must not match `--force` here.
  const FORCE = String.raw`(?:--force(?!-with-lease)|-f)`;
  // `git` takes global options before the subcommand, so `git -C <dir> push
  // --force main` and `git -c k=v push --force main` are real force-pushes that
  // a bare /\bgit\s+push\b/ does not match.
  const GIT_GLOBAL_OPT = String.raw`(?:-[cC](?:\s+|=)?\S+|--(?:git-dir|work-tree|namespace|exec-path)(?:=|\s+)\S+|--no-pager|--paginate|--bare|--literal-pathspecs|--icase-pathspecs|--no-replace-objects|--no-optional-locks|-p|-P)`;
  const GIT_PUSH = String.raw`\bgit(?:\s+${GIT_GLOBAL_OPT})*\s+push\s+`;
  const blocks = [
    [new RegExp(String.raw`${GIT_PUSH}${FORCE}\b.*\b(main|master)\b`), 'force-push to main/master'],
    [new RegExp(String.raw`${GIT_PUSH}.*\b(main|master)\b.*\s${FORCE}\b`), 'force-push to main/master'],
    [/\bgit\s+reset\s+--hard\s+origin\//, 'hard reset to remote (discards local work)'],
    [/\bgit\s+clean\s+-[a-z]*f[a-z]*d/, 'git clean -fd (deletes untracked files)'],
    [/\bchmod\s+-R\s+777\b/, 'recursive chmod 777'],
    [/:\(\)\s*\{\s*:\|:&\s*\}\s*;:/, 'fork bomb'],
    [/\bmkfs\.|\bdd\s+if=.*of=\/dev\//, 'disk format / raw device write'],
    [/>\s*\/dev\/sd[a-z]/, 'write to raw block device'],
  ];

  for (const [re, why] of blocks) {
    if (re.test(scanned)) deny(why);
  }
  process.exit(0);
});
