#!/usr/bin/env node
/**
 * Arcwright PreToolUse(Bash) guard. Reads the hook payload on stdin, blocks
 * obviously destructive shell commands by exiting 2 (Claude Code treats a
 * non-zero PreToolUse exit as "deny" and shows stderr to the model).
 * Conservative by design — only high-confidence destructive patterns.
 *
 * Most patterns are matched against an effective command with quoted strings
 * and comments removed. Recursive rm and force-push checks use shell words so
 * quoted executable arguments remain visible without treating quoted prose as
 * an executed command. rm commands with unresolved shell syntax are denied
 * rather than evaluated by this lightweight parser.
 */
'use strict';

/** Read one shell word, returning its unquoted value and end offset. */
function readShellWord(text, start) {
  let value = '';
  let quote = null;
  let escaped = false;
  let started = false;
  let i = start;

  for (; i < text.length; i++) {
    const ch = text[i];
    if (quote) {
      if (quote === '"' && ch === '\\' && i + 1 < text.length) {
        value += text[++i];
      } else if (ch === quote) {
        quote = null;
      } else {
        value += ch;
      }
      continue;
    }
    if (escaped) {
      value += ch;
      escaped = false;
      started = true;
      continue;
    }
    if (ch === '\\') {
      escaped = true;
      started = true;
      continue;
    }
    if (ch === "'" || ch === '"') {
      quote = ch;
      started = true;
      continue;
    }
    if (/\s/.test(ch) || /[;&|<>]/.test(ch)) break;
    value += ch;
    started = true;
  }

  return started ? { value, end: i } : null;
}

/** Find here-document declarations on one shell source line. */
function findHereDocDelimiters(line) {
  const delimiters = [];
  let quote = null;
  let escaped = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '\n') break;
    if (quote) {
      if (quote === '"' && ch === '\\') i++;
      else if (ch === quote) quote = null;
      continue;
    }
    if (escaped) {
      escaped = false;
      continue;
    }
    if (ch === '\\') {
      escaped = true;
      continue;
    }
    if (ch === "'" || ch === '"') {
      quote = ch;
      continue;
    }
    if (ch === '#' && (i === 0 || /[\s;&|]/.test(line[i - 1]))) break;
    if (ch !== '<' || line[i + 1] !== '<' || line[i + 2] === '<') continue;

    let j = i + 2;
    let stripTabs = false;
    if (line[j] === '-') {
      stripTabs = true;
      j++;
    }
    while (j < line.length && /\s/.test(line[j]) && line[j] !== '\n') j++;
    if (line[j] === '#' || line[j] === '\n' || j >= line.length) {
      i = j;
      continue;
    }
    const word = readShellWord(line, j);
    if (word) delimiters.push({ delimiter: word.value, stripTabs });
    if (word) i = word.end - 1;
  }
  return delimiters;
}

/**
 * Replace here-document bodies with spaces while preserving line boundaries.
 * This keeps documentation fixtures out of both the regex scan and the rm
 * tokenizer, without hiding executable commands before or after the body.
 */
function maskHereDocBodies(cmd) {
  const lines = cmd.match(/[^\n]*(?:\n|$)/g) || [];
  const pending = [];
  let out = '';

  for (const line of lines) {
    if (pending.length > 0) {
      const spec = pending[0];
      const content = line.replace(/\r?\n$/, '');
      const comparable = spec.stripTabs ? content.replace(/^\t+/, '') : content;
      out += line.replace(/[^\n]/g, ' ');
      if (comparable === spec.delimiter) pending.shift();
      continue;
    }

    out += line;
    pending.push(...findHereDocDelimiters(line));
  }

  return out;
}

/**
 * Tokenize shell command lists into unquoted word values. This is deliberately
 * a small tokenizer, not a shell interpreter: it tracks quoting, escaping,
 * comments, and command separators, which are the parts relevant to these
 * conservative checks.
 */
function shellCommands(cmd) {
  const commands = [];
  let tokens = [];
  let token = '';
  let tokenStarted = false;
  let quote = null;
  let escaped = false;

  const pushToken = () => {
    if (tokenStarted) tokens.push(token);
    token = '';
    tokenStarted = false;
  };
  const pushCommand = () => {
    pushToken();
    if (tokens.length > 0) commands.push(tokens);
    tokens = [];
  };

  for (let i = 0; i < cmd.length; i++) {
    const ch = cmd[i];
    if (quote) {
      if (quote === '"' && ch === '\\' && i + 1 < cmd.length) token += cmd[++i];
      else if (ch === quote) quote = null;
      else token += ch;
      continue;
    }
    if (escaped) {
      token += ch;
      tokenStarted = true;
      escaped = false;
      continue;
    }
    if (ch === '\\') {
      escaped = true;
      tokenStarted = true;
      continue;
    }
    if (ch === "'" || ch === '"') {
      quote = ch;
      tokenStarted = true;
      continue;
    }
    if (ch === '#' && !tokenStarted && (i === 0 || /[\s;&|]/.test(cmd[i - 1]))) {
      while (i < cmd.length && cmd[i] !== '\n') i++;
      pushCommand();
      continue;
    }
    if (ch === '\n' || /[;&|]/.test(ch)) {
      pushCommand();
      while (/[&|]/.test(cmd[i + 1] || '')) i++;
      continue;
    }
    if (/\s/.test(ch)) {
      pushToken();
      continue;
    }
    token += ch;
    tokenStarted = true;
  }

  if (escaped) {
    token += '\\';
    tokenStarted = true;
  }
  pushCommand();
  return commands;
}

/**
 * Strip single/double-quoted spans and shell comments so pattern matching sees
 * only the executable structure of the command, not text it merely quotes,
 * comments, or here-document bodies. `#` starts a comment only at a word
 * boundary (start or after whitespace), matching shell behavior.
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
    if (ch === '#' && (i === 0 || /[\s;&|]/.test(cmd[i - 1]))) {
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
 * Approach: tokenize shell words, then for each `rm` command check the flag
 * tokens and operand tokens independently, so order, quoting, and spelling of
 * the flags no longer matter.
 */
const ROOTISH_TARGET =
  /^(?:\/+)(?:\*)?$|^(?:~|\$HOME|\$\{HOME\})(?:\/)?(?:\*)?$|^(?:\$HOME|\$\{HOME\}|~)\/\*$/;
const RECURSIVE_FLAG = /^-(?:-recursive$|[a-zA-Z]*[rR][a-zA-Z]*$)/;
const SHELL_ASSIGNMENT = /^[A-Za-z_][A-Za-z0-9_]*=/;
const SHELL_EXPANSION_CHARS = new Set(['$', '`', '<', '>', '*', '?', '[', ']', '{', '}', '~']);
const SHELL_WRAPPERS = new Set(['sudo', 'doas', 'env', 'command', 'nohup', 'time']);
/** Return true when a token cannot be safely evaluated without a shell. */
function hasShellExpansion(tokens) {
  return tokens.some((token) =>
    [...token].some((character) => SHELL_EXPANSION_CHARS.has(character))
  );
}

/** Remove shell redirections, which do not contribute rm operands or flags. */
function withoutRedirections(tokens) {
  const relevant = [];
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (/^\d*(?:>>?|<<?)$/.test(token)) {
      i++;
      continue;
    }
    if (/^\d*(?:>>?|<<?).+/.test(token)) continue;
    relevant.push(token);
  }
  return relevant;
}

function hasDestructiveRm(cmd) {
  for (const tokens of shellCommands(cmd)) {
    // Skip leading assignments and privilege wrappers so alternate but valid
    // shell spellings such as `A=1 rm …` and `sudo A=1 rm …` stay inspected.
    let i = 0;
    while (i < tokens.length && SHELL_ASSIGNMENT.test(tokens[i])) i++;
    while (i < tokens.length && SHELL_WRAPPERS.has(tokens[i])) {
      i++;
      while (i < tokens.length && SHELL_ASSIGNMENT.test(tokens[i])) i++;
    }
    const executable = tokens[i];
    if (!executable || hasShellExpansion([executable]) || !/(?:^|\/)rm$/.test(executable)) continue;
    const rest = withoutRedirections(tokens.slice(i + 1));
    const recursive = rest.some((t) => RECURSIVE_FLAG.test(t));
    const noPreserveRoot = rest.some((t) => t === '--no-preserve-root');
    // Do not guess what a shell expansion produces. In particular, a quoted
    // command substitution can hide both `--no-preserve-root` and `/`.
    if (hasShellExpansion(rest)) return true;
    // `--no-preserve-root` has essentially one purpose; treat it as sufficient.
    if (noPreserveRoot) return true;
    const rootish = rest.some((target) => !target.startsWith('-') && ROOTISH_TARGET.test(target));
    if (recursive && rootish) return true;
  }
  return false;
}

const GIT_GLOBAL_FLAGS = new Set([
  '--no-pager',
  '--paginate',
  '--bare',
  '--literal-pathspecs',
  '--icase-pathspecs',
  '--no-replace-objects',
  '--no-optional-locks',
  '-p',
  '-P',
]);
const GIT_GLOBAL_OPTIONS_WITH_VALUE = new Set([
  '--git-dir',
  '--work-tree',
  '--namespace',
  '--exec-path',
]);

/** Return the next token after a git global option, or null if it is unknown. */
function skipGitGlobalOption(tokens, index) {
  const token = tokens[index];
  if (!token) return null;
  if (/^-[cC](?:=|.+)$/.test(token)) return index + 1;
  if (token === '-c' || token === '-C') return index + 2;
  if (/^--(?:git-dir|work-tree|namespace|exec-path)=/.test(token)) return index + 1;
  if (GIT_GLOBAL_OPTIONS_WITH_VALUE.has(token)) return index + 2;
  if (GIT_GLOBAL_FLAGS.has(token)) return index + 1;
  return null;
}

/** True when a shell command is a force-push involving main or master. */
function hasProtectedForcePush(cmd) {
  for (const tokens of shellCommands(cmd)) {
    let i = 0;
    while (i < tokens.length && SHELL_WRAPPERS.has(tokens[i])) i++;
    while (i < tokens.length && /^[A-Za-z_][A-Za-z0-9_]*=/.test(tokens[i])) i++;
    if (!/(?:^|\/)git$/.test(tokens[i])) continue;
    i++;

    while (i < tokens.length && tokens[i] !== 'push') {
      const next = skipGitGlobalOption(tokens, i);
      if (next === null) break;
      i = next;
    }
    if (tokens[i] !== 'push') continue;

    const args = tokens.slice(i + 1);
    const forcedProtectedRefspec = args.some((arg) => {
      if (!arg.startsWith('+')) return false;
      const refspec = arg.slice(1);
      const separator = refspec.lastIndexOf(':');
      const destination = separator === -1 ? refspec : refspec.slice(separator + 1);
      return /^(?:refs\/heads\/)?(?:main|master)$/.test(destination);
    });
    if (forcedProtectedRefspec) return true;
    // `--force-with-lease` is the safe force-push variant and must not match.
    const force = args.some((arg) => arg === '-f' || /^--force(?:=|$)/.test(arg));
    const protectedBranch = args.some((arg) => /\b(?:main|master)\b/.test(arg));
    if (force && protectedBranch) return true;
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

  const executableCommand = maskHereDocBodies(cmd);
  const scanned = effectiveCommand(executableCommand);

  const deny = (why) => {
    process.stderr.write(
      `Arcwright hook blocked a destructive command (${why}).\n` +
        `Command: ${cmd}\n` +
        `If this is intentional, run it manually or disable the Arcwright bash guard in .claude/settings.json.\n`
    );
    process.exit(2);
  };

  if (hasDestructiveRm(executableCommand)) deny('rm -rf on / or home');
  if (hasProtectedForcePush(executableCommand)) deny('force-push to main/master');

  const blocks = [
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
