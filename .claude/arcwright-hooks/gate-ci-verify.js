#!/usr/bin/env node
/**
 * Arcwright ci-gates PostToolUse(Bash) CI-verification gate. After a real
 * `git push` (or `git commit` that pushes via `&& git push`), it asks GitHub
 * whether the CI gates for the pushed commit actually passed, and reports the
 * verdict back to the model. The local hooks mirror CI but can be bypassed
 * (`--no-verify`, quoting), so this closes the loop against the authoritative
 * remote gate.
 *
 * Enforcement:
 *   - CI concluded failure/cancelled/timed_out  → exit 2 (stderr fed to model).
 *   - CI passed, still running, or unknowable    → exit 0 (advisory stdout).
 *
 * It is intentionally tolerant: no `gh`, not authenticated, no network, not a
 * git repo with a GitHub remote, or no workflow for the commit → it prints a
 * short note and exits 0. It never blocks the push itself (the push already
 * happened); it only surfaces the result so the model can react.
 *
 * Only a real, unquoted `git push` trips the gate — a mention inside quotes or
 * a comment is ignored (same effective-command stripping the other gates use).
 *
 * Marker: "arcwright-hooks" via its install path so settings.json merges are
 * idempotent.
 *
 * Tunables via env:
 *   ARCWRIGHT_CI_VERIFY=0        → disable this gate entirely.
 *   ARCWRIGHT_CI_TIMEOUT_SECONDS → max seconds to wait for CI (default 180).
 *   ARCWRIGHT_CI_POLL_SECONDS    → seconds between polls (default 10).
 */
'use strict';

const { execSync, execFileSync } = require('child_process');

if (process.env.ARCWRIGHT_CI_VERIFY === '0') process.exit(0);

const TIMEOUT_S = Number(process.env.ARCWRIGHT_CI_TIMEOUT_SECONDS || 180);
const POLL_S = Number(process.env.ARCWRIGHT_CI_POLL_SECONDS || 10);

// Strip quoted strings and comments so only the *executed* command is matched.
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

function ok(msg) {
  if (msg) process.stdout.write(msg + '\n');
  process.exit(0);
}
function fail(msg) {
  process.stderr.write(msg + '\n');
  process.exit(2);
}

function sh(cmd, opts = {}) {
  return execSync(cmd, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], ...opts }).trim();
}
function gh(args) {
  return execFileSync('gh', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
}
function sleep(seconds) {
  // Synchronous sleep without spawning a shell loop.
  execFileSync(process.execPath, ['-e', `setTimeout(()=>{}, ${Math.max(0, seconds) * 1000})`], {
    stdio: 'ignore',
  });
}

let raw = '';
process.stdin.on('data', (c) => (raw += c));
process.stdin.on('end', () => {
  let payload = {};
  try {
    payload = JSON.parse(raw || '{}');
  } catch {
    process.exit(0);
  }

  const command = payload?.tool_input?.command || '';
  if (!command) process.exit(0);

  const eff = effectiveCommand(command);
  if (!/\bgit\s+push\b/.test(eff)) process.exit(0); // not a push — nothing to verify

  // If the push itself failed, don't chase a CI run that was never triggered.
  const resp = payload.tool_response;
  const respText = typeof resp === 'string' ? resp : JSON.stringify(resp || {});
  if (/\b(rejected|failed to push|error: failed|Permission denied|fatal:)\b/i.test(respText)) {
    ok('[ci-verify] push did not succeed — skipping CI check.');
  }

  // Preconditions: gh present + authenticated + a GitHub remote on a real repo.
  try {
    sh('command -v gh');
  } catch {
    ok('[ci-verify] gh CLI not found — skipping CI check (install gh to enable).');
  }
  try {
    gh(['auth', 'status']);
  } catch {
    ok('[ci-verify] gh not authenticated — skipping CI check.');
  }

  let sha = '';
  let branch = '';
  try {
    sha = sh('git rev-parse HEAD');
    branch = sh('git rev-parse --abbrev-ref HEAD');
  } catch {
    ok('[ci-verify] not a git repo — skipping CI check.');
  }

  const deadline = Date.now() + TIMEOUT_S * 1000;
  let lastStatus = 'none';

  while (Date.now() < deadline) {
    let runs = [];
    try {
      const json = gh([
        'run',
        'list',
        '--commit',
        sha,
        '--limit',
        '30',
        '--json',
        'databaseId,status,conclusion,workflowName,event',
      ]);
      runs = JSON.parse(json || '[]');
    } catch {
      ok('[ci-verify] could not query GitHub Actions (no remote run or API error) — skipping.');
    }

    if (!runs.length) {
      lastStatus = 'pending-registration';
      sleep(POLL_S);
      continue;
    }

    const incomplete = runs.filter((r) => r.status !== 'completed');
    if (incomplete.length) {
      lastStatus = 'in_progress';
      sleep(POLL_S);
      continue;
    }

    // All runs for this commit have completed — verdict time.
    const bad = runs.filter((r) => r.conclusion && !['success', 'skipped', 'neutral'].includes(r.conclusion));
    if (bad.length) {
      const lines = bad.map((r) => `  ✗ ${r.workflowName}: ${r.conclusion}`).join('\n');
      fail(
        `[ci-verify] CI gates FAILED for ${branch}@${sha.slice(0, 9)}:\n${lines}\n` +
          `Inspect: gh run view --log-failed <run-id>  (gh run list --commit ${sha})\n` +
          `Fix the failing gate(s) and push again.`
      );
    }
    ok(`[ci-verify] ✓ all CI gates passed for ${branch}@${sha.slice(0, 9)} (${runs.length} workflow run(s)).`);
  }

  // Timed out waiting.
  const hint =
    lastStatus === 'pending-registration'
      ? 'no run registered yet'
      : lastStatus === 'in_progress'
        ? 'still running'
        : lastStatus;
  ok(
    `[ci-verify] CI not finished within ${TIMEOUT_S}s (${hint}) for ${sha.slice(0, 9)}.\n` +
      `Check later: gh run list --commit ${sha}, then gh run watch <run-id>  (or raise ARCWRIGHT_CI_TIMEOUT_SECONDS).`
  );
});
