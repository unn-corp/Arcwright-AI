#!/usr/bin/env node
/**
 * Arcwright ci-gates PreToolUse(Bash) commit gate. Intercepts `git commit` and
 * runs the local gate battery before the commit is allowed. TIERED enforcement:
 *
 *   - Secret scan (gitleaks on staged, or a built-in high-confidence fallback)
 *       → BLOCKING. Exit 2 denies the commit and shows stderr to the model.
 *   - Conventional-commit message shape (from -m / -F)
 *       → ADVISORY. Warns on stderr, does not block.
 *   - Lint / type-check / tests are handled by gate-lint.js (per edit) and CI;
 *       this hook stays fast and focused on the commit boundary.
 *
 * Only a real, unquoted `git commit` trips the gate — a command that merely
 * mentions it inside quotes or a comment is ignored (same effective-command
 * stripping the Bash guard uses).
 *
 * Marker: "arcwright-hooks" via its install path so settings.json merges are
 * idempotent.
 */
'use strict';

const { execSync, execFileSync } = require('child_process');

function effectiveCommand(cmd) {
  let out = '';
  let quote = null;
  for (let i = 0; i < cmd.length; i++) {
    const ch = cmd[i];
    if (quote) {
      if (ch === quote) quote = null;
      continue;
    }
    if (ch === "'" || ch === '"') {
      quote = ch;
      out += ' ';
      continue;
    }
    if (ch === '#' && (i === 0 || /\s/.test(cmd[i - 1]))) {
      while (i < cmd.length && cmd[i] !== '\n') i++;
      out += '\n';
      continue;
    }
    out += ch;
  }
  return out;
}

/**
 * `git` accepts global options BEFORE the subcommand, so a real commit can be
 * spelled `git -C <dir> commit`, `git -c user.email=x commit`, or
 * `git --no-pager commit`. A naive /\bgit\s+commit\b/ matches none of those.
 *
 * That is not a theoretical bypass: `-C` is the ordinary way to act on a
 * subdirectory or submodule, and `-c user.email=…` is standard when identity
 * is not configured. Because this is a BLOCKING secret gate, a missed match
 * means the scan never runs and the commit proceeds unchecked.
 */
const GIT_GLOBAL_OPT = String.raw`(?:-[cC](?:\s+|=)?\S+|--(?:git-dir|work-tree|namespace|exec-path)(?:=|\s+)\S+|--no-pager|--paginate|--bare|--literal-pathspecs|--icase-pathspecs|--no-replace-objects|--no-optional-locks|-p|-P)`;
/** Source for `git <global opts…> <sub>`. */
const gitSubSrc = (sub) => String.raw`\bgit(?:\s+${GIT_GLOBAL_OPT})*\s+${sub}\b`;

// High-confidence secret patterns for the fallback scan (gitleaks preferred).
const SECRET_PATTERNS = [
  [/-----BEGIN (?:RSA |EC |OPENSSH |PGP |DSA )?PRIVATE KEY-----/, 'private key block'],
  [/\bAKIA[0-9A-Z]{16}\b/, 'AWS access key id'],
  [/\bgh[pousr]_[A-Za-z0-9]{36,}\b/, 'GitHub token'],
  [/\bgithub_pat_[A-Za-z0-9_]{22,}\b/, 'GitHub fine-grained PAT'],
  [/\bxox[baprs]-[A-Za-z0-9-]{10,}\b/, 'Slack token'],
  [/\bsk-ant-[A-Za-z0-9-]{20,}\b/, 'Anthropic API key'],
  [/\bsk-[A-Za-z0-9]{32,}\b/, 'OpenAI-style secret key'],
];

let raw = '';
process.stdin.on('data', (c) => (raw += c));
process.stdin.on('end', () => {
  let cmd = '';
  try {
    const p = JSON.parse(raw || '{}');
    cmd = (p.tool_input && p.tool_input.command) || '';
  } catch {
    process.exit(0);
  }
  if (!cmd) process.exit(0);

  const scanned = effectiveCommand(cmd);
  if (!new RegExp(gitSubSrc('commit')).test(scanned)) process.exit(0);

  // `git commit -a/--all` stages tracked modifications at commit time, AFTER
  // this PreToolUse hook runs — so the cached diff would miss them. When -a is
  // present, also scan unstaged tracked changes.
  const includeAll = new RegExp(
    gitSubSrc('commit') + String.raw`[^\n]*\s(?:--all\b|-[a-zA-Z]*a[a-zA-Z]*\b)`
  ).test(scanned);

  // ---- BLOCKING: secret scan of the (effective) diff ----
  const secret = scanStagedForSecrets(includeAll);
  if (secret) {
    process.stderr.write(
      `[Arcwright ci-gates] Commit blocked: ${secret} detected in the diff to be committed.\n` +
        `Remove the secret (and rotate it if it was ever real), unstage the file, then commit again.\n` +
        `If this is a false positive, commit outside the gate or adjust the gitleaks allowlist.\n`
    );
    process.exit(2);
  }

  // ---- ADVISORY: conventional-commit shape ----
  const msg = extractCommitMessage(cmd);
  if (msg && !isConventional(msg)) {
    process.stderr.write(
      `[Arcwright ci-gates] Advisory: commit subject is not Conventional Commits format.\n` +
        `Expected "type(scope): summary" (type ∈ feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert).\n` +
        `Got: ${msg.split('\n')[0]}\n`
    );
    // advisory only — fall through to allow.
  }
  process.exit(0);
});

/**
 * Scan the staged diff with gitleaks. Returns 'leak' | 'clean' | 'unavailable'.
 *
 * Two spellings are tried in order. `gitleaks git --staged` is the supported
 * form; `gitleaks protect --staged` is the legacy one — still functional as a
 * hidden alias (verified against 8.30.1) but no longer listed in `--help`, so
 * relying on it alone means this BLOCKING gate would start failing open the day
 * the alias is dropped. Older gitleaks builds predate the `git` subcommand,
 * hence the fallback rather than a straight swap.
 *
 * Decide by exit status, never output text: 1 = leaks found, 0 = clean, and
 * anything else (unknown subcommand, usage/config error) means that spelling is
 * unusable — try the next, then the built-in scan.
 */
function runGitleaksStaged() {
  for (const args of [
    ['git', '--staged', '--no-banner'],
    ['protect', '--staged', '--no-banner'],
  ]) {
    try {
      execFileSync('gitleaks', args, { stdio: 'pipe', timeout: 60000 });
      return 'clean';
    } catch (e) {
      if (e && e.status === 1) return 'leak';
      if (e && e.code === 'ENOENT') return 'unavailable'; // gitleaks not installed
      // usage/config error → try the next spelling
    }
  }
  return 'unavailable';
}

function scanStagedForSecrets(includeAll) {
  const verdict = runGitleaksStaged();
  if (verdict === 'leak') return 'a secret (gitleaks)';
  if (verdict === 'clean' && !includeAll) return null; // gitleaks ran clean over staged
  // Built-in fallback (and the unstaged sweep for `-a`).
  const ranges = ['git diff --cached --no-color'];
  if (includeAll) ranges.push('git diff --no-color'); // unstaged tracked changes
  for (const cmd of ranges) {
    try {
      const diff = execSync(cmd, { stdio: 'pipe', timeout: 30000 }).toString();
      const added = diff
        .split('\n')
        .filter((l) => l.startsWith('+') && !l.startsWith('+++'))
        .join('\n');
      for (const [re, label] of SECRET_PATTERNS) {
        if (re.test(added)) return label;
      }
    } catch {
      /* no repo / nothing to diff → skip this range */
    }
  }
  return null;
}

function extractCommitMessage(cmd) {
  // -m "msg" / -m 'msg' / --message=msg
  let m = cmd.match(/(?:-m|--message)[=\s]+(["'])([\s\S]*?)\1/);
  if (m) {
    // Heredoc/command-substitution form: git commit -m "$(cat <<'EOF' ...)".
    // The captured "message" is the substitution wrapper, not real prose — skip.
    if (/^\s*\$\(/.test(m[2])) return null;
    return m[2];
  }
  m = cmd.match(/(?:-m|--message)[=\s]+(\S+)/);
  if (m) return m[1];
  return null; // -F file / editor commit → can't see it here, skip advisory
}

function isConventional(msg) {
  return /^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\([^)]+\))?!?:\s.+/.test(
    msg.trim()
  );
}
