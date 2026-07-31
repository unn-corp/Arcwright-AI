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
 *   ARCWRIGHT_CI_VERIFY=0         → disable this gate entirely.
 *   ARCWRIGHT_CI_TIMEOUT_SECONDS  → max seconds to wait for CI (default 180).
 *   ARCWRIGHT_CI_POLL_SECONDS     → max seconds between polls (default 10).
 *   ARCWRIGHT_CI_REGISTER_SECONDS → max seconds to wait for a run to even
 *                                   appear before giving up (default 30).
 */
'use strict';

const { execSync, execFileSync } = require('child_process');

if (process.env.ARCWRIGHT_CI_VERIFY === '0') process.exit(0);

const TIMEOUT_S = Number(process.env.ARCWRIGHT_CI_TIMEOUT_SECONDS || 180);
const POLL_S = Number(process.env.ARCWRIGHT_CI_POLL_SECONDS || 10);
// Workflows are usually scoped (`on: push: branches: [...]`, or a paths filter),
// so pushing a branch outside that scope registers NO run. Polling for the full
// TIMEOUT_S in that case is a multi-minute blocking stall plus a wasted API call
// per poll, all to conclude "no run registered yet". Cap the
// wait-for-registration phase separately from the wait-for-completion phase.
const REGISTER_S = Number(process.env.ARCWRIGHT_CI_REGISTER_SECONDS || 30);

/**
 * `git` accepts global options BEFORE the subcommand, so a real push can be
 * spelled `git -C <dir> push` or `git --no-pager push`. A naive
 * /\bgit\s+push\b/ misses those, and the CI verification is then skipped
 * silently — the push looks unverified-but-fine rather than unchecked.
 */
const GIT_GLOBAL_OPT = String.raw`(?:-[cC](?:\s+|=)?\S+|--(?:git-dir|work-tree|namespace|exec-path)(?:=|\s+)\S+|--no-pager|--paginate|--bare|--literal-pathspecs|--icase-pathspecs|--no-replace-objects|--no-optional-locks|-p|-P)`;
const GIT_PUSH = new RegExp(String.raw`\bgit(?:\s+${GIT_GLOBAL_OPT})*\s+push\b`);

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
// Synchronous sleep with no subprocess at all. The previous implementation
// spawned a whole Node interpreter per sleep (`node -e setTimeout(...)`) — a
// ~26ms boot plus a full V8 heap, up to 18 times per invocation, purely to
// wait. Atomics.wait blocks this thread for the exact duration with zero
// spawns. (Node permits Atomics.wait on the main thread; browsers do not.)
const SLEEP_LOCK = new Int32Array(new SharedArrayBuffer(4));
function sleep(seconds) {
  Atomics.wait(SLEEP_LOCK, 0, 0, Math.max(0, seconds) * 1000);
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
  if (!GIT_PUSH.test(eff)) process.exit(0); // not a push — nothing to verify

  // If the push itself failed, don't chase a CI run that was never triggered.
  const resp = payload.tool_response;
  const respText = typeof resp === 'string' ? resp : JSON.stringify(resp || {});
  if (/\b(rejected|failed to push|error: failed|Permission denied|fatal:)\b/i.test(respText)) {
    ok('[ci-verify] push did not succeed — skipping CI check.');
  }

  // Preconditions: gh present + authenticated + a GitHub remote on a real repo.
  // One probe, not two: `gh auth status` already fails when gh is missing, and
  // a missing binary surfaces as ENOENT — so the separate `command -v gh` call
  // (which spawned a shell just to answer the same question) is redundant.
  try {
    gh(['auth', 'status']);
  } catch (e) {
    ok(
      e && e.code === 'ENOENT'
        ? '[ci-verify] gh CLI not found — skipping CI check (install gh to enable).'
        : '[ci-verify] gh not authenticated — skipping CI check.'
    );
  }

  let sha = '';
  let branch = '';
  try {
    sha = sh('git rev-parse HEAD');
    branch = sh('git rev-parse --abbrev-ref HEAD');
  } catch {
    ok('[ci-verify] not a git repo — skipping CI check.');
  }

  const started = Date.now();
  const deadline = started + TIMEOUT_S * 1000;
  let lastStatus = 'none';
  // Poll fast at first (a run usually registers within a few seconds), then back
  // off toward POLL_S. A flat 10s interval both waited too long for the common
  // fast case and hammered the API for the slow one.
  let pollS = Math.min(3, POLL_S);
  // Run IDs seen on the previous poll. GitHub registers a commit's workflow runs
  // PROGRESSIVELY, so "every run I can currently see has completed" is not the
  // same as "CI is done" — a second workflow may not have been created yet. A
  // green verdict therefore requires seeing the SAME run set twice in a row.
  // Without this the gate can report "✓ all CI gates passed" while another
  // workflow is still queuing, which is the exact false-green this hook exists
  // to prevent.
  let prevIds = null;

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
      // No run has appeared. If REGISTER_S has elapsed, this push almost
      // certainly triggered nothing (a branch outside the workflow's `on: push`
      // list, or a paths filter that excluded the diff) — stop instead of
      // blocking the turn for the rest of TIMEOUT_S.
      if (Date.now() - started >= REGISTER_S * 1000) {
        ok(
          `[ci-verify] no GitHub Actions run registered for ${branch}@${sha.slice(0, 9)} within ${REGISTER_S}s ` +
            `— this branch likely does not trigger a workflow. Skipping.`
        );
      }
      sleep(pollS);
      pollS = Math.min(pollS * 2, POLL_S);
      continue;
    }

    const ids = runs
      .map((r) => r.databaseId)
      .sort()
      .join(',');

    const incomplete = runs.filter((r) => r.status !== 'completed');
    if (incomplete.length) {
      lastStatus = 'in_progress';
      prevIds = ids;
      sleep(pollS);
      pollS = Math.min(pollS * 2, POLL_S);
      continue;
    }

    // A FAILURE verdict is trustworthy immediately — a run that already
    // concluded badly will not be un-failed by another workflow registering.
    // A SUCCESS verdict is not: it must survive one more poll with an unchanged
    // run set, proving nothing else was still queuing.
    const bad0 = runs.filter((r) => r.conclusion && !['success', 'skipped', 'neutral'].includes(r.conclusion));
    if (!bad0.length && prevIds !== ids) {
      lastStatus = 'settling';
      prevIds = ids;
      sleep(pollS);
      pollS = Math.min(pollS * 2, POLL_S);
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
