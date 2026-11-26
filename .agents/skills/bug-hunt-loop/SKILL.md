---
name: bug-hunt-loop
description: Bounded autonomous bug hunt. Aggressively finds races, edge cases, error-path and leak bugs, proves each with a failing repro, applies minimal root-cause fixes, and grows one PR. Bound by --duration, --loops, or --until. Use for "bug hunt" or "find and fix bugs until 6pm".
argument-hint: "[--duration 2h] [--loops N] [--until HH:MM|ISO] [--scope path...] [--base branch] [--pr N|URL] [--dry-stop N] [--focus races,boundaries,...]"
version: 1.0.0
author: arcwright
tags: [bugs, testing, race-conditions, concurrency, fuzzing, stress-testing, loop, pr]
---

# Bug Hunt Loop

**Goal:** Within a user-set budget, find as many *real, reproducible* bugs as possible and land a targeted, tested fix for each on a single branch backing a single PR. Be adversarial: assume the code is broken and go prove where. Never claim a bug you cannot reproduce, and never "fix" something by weakening a test.

Companion skills (load when relevant, do not ask): `systematic-debugging` (root cause before fixing), `edge-case-hunter` (boundary enumeration lens), `test-quality` (before writing regression tests), language skills (`rust-async-concurrency`, `typescript-best-practices`, `python-backend`, …). Technique catalog: [references/hunt-playbook.md](references/hunt-playbook.md).

The budget helper is `scripts/budget.sh` in this skill's directory (the directory containing this SKILL.md). Below, `BUDGET` means that absolute path.

---

## Arguments

| Flag | Meaning | Default |
| --- | --- | --- |
| `--duration` | Wall-clock budget: `45m`, `2h`, `1h30m`, bare number = minutes | — |
| `--loops` | Maximum hunt loops | — |
| `--until` | End time: `17:30`, `5pm`, `tomorrow 09:00`, ISO 8601. A past clock time rolls to tomorrow | — |
| `--scope` | Paths/packages to hunt in | whole repo, prioritized (see Phase 0) |
| `--focus` | Lenses to prioritize: `races,boundaries,errors,resources,state,time,input,security,perf` | rotate all |
| `--base` | Base branch for the PR | repo default branch |
| `--pr` | Continue an existing bug-hunt PR instead of opening a new one | new PR |
| `--dry-stop` | Stop after N consecutive loops with zero confirmed bugs; `0` disables | `3` |

Bounds combine: the run stops at the **first** of loop limit, deadline (earliest of `--duration`/`--until`), or saturation. Natural-language bounds ("for 3 hours", "until lunch at 12:30", "10 rounds") map onto these flags. If the user gives no bound at all, use `--loops 3` and say so in the kickoff line; do not stop to ask.

---

## Hard rules

- **MUST** check the budget with `BUDGET check` before starting every loop, and `BUDGET remaining` between phases. Never estimate elapsed time yourself.
- **MUST** have a failing reproduction (test, stress harness, or script) before fixing anything. No repro → record as *suspected*, don't fix.
- **MUST** make each fix the smallest change that removes the root cause. No refactors, renames, formatting sweeps, dependency upgrades, or "while I'm here" edits.
- **MUST** commit each bug as its own commit (fix + regression test together) and push it to the hunt branch. One branch, one PR, for the entire run.
- **MUST NOT** delete, skip, `xfail`, loosen, or retry-wrap a test to make it pass; MUST NOT add sleeps to "fix" a race. Fix ordering/synchronization instead.
- **MUST NOT** force-push, rewrite published history, push to or merge into the base branch, or merge the PR. The PR stays open for human review.
- **MUST NOT** run stress, fuzz, or load tests against production, shared staging, paid third-party APIs, or real user data. Local/ephemeral targets only; wrap long commands in `timeout`.
- **MUST** leave the branch green and committed at every loop boundary. If the deadline hits mid-fix, either finish and verify within ~5 minutes or revert the uncommitted change (`git restore`/`git checkout -- <files>`) and log it as *in progress*.
- **MUST NOT** pause between loops to ask the user anything. The only stop-and-ask points are in Phase 0 (dirty tree, ambiguous base) and a discovered problem that needs a human decision (see "Needs human").
- **SHOULD** follow the host's commit-attribution and PR-linking conventions.

---

## Phase 0 — Setup (once)

1. **Parse args** and run `BUDGET init [--duration …] [--loops …] [--until …] [--dry-stop …]`. Echo its status block to the user as the kickoff line, e.g. *"Bug hunt: 2h budget (until 16:42), up to 10 loops, scope src/. Working on branch bug-hunt/2026-11-26-a1b2."*
2. **Read project rules**: `AGENTS.md` / `CLAUDE.md` / `GEMINI.md` from repo root down to scope; obey their test/lint/commit conventions.
3. **Working tree**: if `git status --porcelain` is non-empty, STOP and ask whether to proceed from a clean checkout/worktree — never stash or commit the user's work into the hunt.
4. **Branch**:
   - `--pr` given: `gh pr view <pr> --json headRefName,baseRefName,url,state`; it must be OPEN. Check out its head, `git pull --ff-only`. Record `BUDGET set PR_URL …`.
   - Otherwise: base = `--base` or `gh repo view --json defaultBranchRef -q .defaultBranchRef.name`; `git fetch origin <base>`; `git switch -c bug-hunt/<YYYY-MM-DD>-<4 hex> origin/<base>`.
   - `BUDGET set BRANCH <branch>` and `BUDGET set BASE <base>`.
5. **Baseline**: discover build/test/lint/typecheck commands (package.json scripts, Makefile, Cargo, pyproject, go.mod, CI workflow files). Run the suite once. Record pre-existing failures/flakes in the ledger's *Baseline* section; they are not yours to "fix" unless you hunt them as bugs deliberately. If nothing builds, stop and report — a hunt on a broken baseline is noise.
6. **Map the attack surface** (cheap, ≤10 min): list modules ranked by bug-likelihood — concurrency primitives (locks, async, threads, channels, workers, queues), shared mutable state and caches, parsers/serializers, money/time/units math, retries/timeouts, file/network/DB I/O, auth/permission checks, recently churned files (`git log --since=90.days --name-only`), and files with weak test coverage. Write the ranked list into the ledger's *Coverage map*.
7. **Ledger**: create `$(BUDGET dir)/ledger.md` (inside the git dir — never committed) from the template below. This file plus `BUDGET status` is how you resume after context compaction: re-read both, then continue at the next loop.

---

## The loop

Repeat until `BUDGET check` prints `STOP`:

### 1. Gate
`BUDGET check` → on `STOP`, go to **Wrap-up**. Otherwise `BUDGET loop-start`.

### 2. Pick a target
Choose the highest-ranked (module × lens) pair from the Coverage map not yet hunted. Rotate lenses so consecutive loops attack different failure classes; honor `--focus` by weighting, not exclusively. After a dry loop, escalate: switch to a lens/module you haven't touched, or go one layer deeper (integration seams, startup/shutdown, cancellation, error-in-error-handler).

Lenses: **races** (data races, check-then-act, TOCTOU, lost updates, double-dispatch, unawaited promises, re-entrancy, lock ordering/deadlock), **boundaries** (0/1/max, empty, off-by-one, overflow, unicode, huge inputs), **errors** (swallowed errors, partial failure, rollback, retry storms, error-path leaks), **resources** (leaked handles/listeners/timers/goroutines, unbounded growth, missing close on error), **state** (invalid transitions, stale cache, idempotency, ordering assumptions), **time** (timezones, DST, clock skew, timeouts, monotonic vs wall clock), **input** (malformed/adversarial payloads, injection-adjacent parsing), **security** (authz gaps, unsafe defaults), **perf** (pathological complexity that becomes a DoS/timeout bug).

### 3. Hunt (aggressive)
Read the target code with the lens in mind, form concrete hypotheses ("two concurrent `save()` calls can both pass the version check"), then **attack** them with executable evidence — targeted unit tests, property-based tests, fuzzers, concurrency stress harnesses (N parallel workers × M iterations), race detectors/sanitizers, fault injection (fail the Nth I/O call, kill mid-write, cancel mid-await), randomized test ordering, and repeated runs. See the playbook for per-ecosystem commands. Spend most of the loop here; a hunt that only reads code is not a hunt.

A subagent MAY run the hunt phase for a large target to keep the main context lean (it returns findings + repro files, it does not edit source). Fixes are always applied by the orchestrating agent, sequentially, on the hunt branch. For a stubborn or high-risk race, a cross-provider second opinion on the root cause is encouraged.

### 4. Confirm
For each candidate: reproduce it. A finding is **confirmed** only if the repro fails on the current branch for the stated reason. Races: the stress repro must fail at a measurable rate (record e.g. "fails 37/200 runs"). Classify severity:
- **P0** crash, data loss/corruption, security hole, deadlock
- **P1** wrong result, race under realistic load, resource leak
- **P2** edge case with limited blast radius

Can't reproduce after a fair attempt → ledger *Suspected* with your evidence; move on.

### 5. Fix (targeted)
Fix confirmed bugs in severity order. Root cause first (`systematic-debugging`): fix where the invariant breaks, not where the symptom shows. Keep the diff minimal and in the style of the surrounding code.

Do **not** fix — log under *Needs human* instead — when the fix would: change a public API/contract or persisted data format, need a migration, touch more than ~3 files or ~60 lines, require a design decision, or address a P0 security issue whose correct fix is non-obvious.

### 6. Verify
- The repro now passes. Races: run the stress repro at **at least the same iteration count** that failed it, plus the race detector if available — 0 failures required.
- Convert the repro into a permanent regression test in the project's test suite (deterministic where possible; a bounded stress test is acceptable for races if it runs in reasonable time).
- Run the affected test package(s) plus lint/typecheck. Re-run the full suite every few loops and before wrap-up. Any new failure vs. baseline → fix or revert your change.

### 7. Commit & publish
One commit per bug: `fix(<scope>): <what was wrong>` with a body covering cause, repro, and fix. `git push -u origin <branch>` (plain push, never force).
- **First fix of the run** and no `--pr`: open a **draft** PR against the base (`gh pr create --draft --base <base> --title "Bug hunt: <scope> (<date>)" --body-file <rendered body>`), `BUDGET set PR_URL <url>`. Link it via the host's PR tools if available.
- **Every loop with changes**: regenerate the PR body from the ledger and `gh pr edit <url> --body-file <file>`.
- No PR is opened while there are zero fixes; if the run ends with zero fixes, report the ledger instead.

### 8. Record
Update the ledger (findings, coverage map ✓, suspected, needs-human), then `BUDGET loop-end --confirmed <n> --fixed <n>`. Post one terse progress line to the user: *"Loop 4/10 · 1h12m left · +2 fixed (race in JobQueue.claim, off-by-one in paginate) · total 6 fixed, 2 needs-human."* Then continue — do not end the turn.

---

## Wrap-up

1. Ensure the tree is clean and the branch is pushed; run the full suite one last time and note the result in the PR.
2. Final PR body update. Mark the PR ready for review only if the user asked; otherwise leave it draft.
3. Report to the user: stop reason (from `BUDGET check`), loops run, time used, bugs fixed by severity, suspected, needs-human, PR link, and any baseline failures that remain.

**Public repos:** check `gh repo view --json visibility`. If public, describe security-relevant findings in the PR only generically ("hardened input validation in X") and give the user the details privately in your final report.

---

## Ledger / PR body template

```markdown
## Bug hunt — <scope> · <start> → <end> · <stop reason>

Fixed **<n>** (P0 <a> · P1 <b> · P2 <c>) · Suspected <s> · Needs human <h> · Loops <k>

### Fixed
| # | Sev | Lens | Location | Bug | Repro → evidence | Commit |
|---|-----|------|----------|-----|------------------|--------|
| 1 | P1 | races | src/queue.ts:88 | Two workers can claim the same job (check-then-act) | `queue.race.test.ts`: 37/200 fail before, 0/500 after | abc1234 |

### Needs human
- <location> — <problem, why not auto-fixed, suggested direction>

### Suspected (not reproduced)
- <location> — <hypothesis, what was tried>

### Coverage map
- [x] src/queue — races, errors
- [ ] src/billing — boundaries, time

### Baseline
- Pre-existing failing/flaky tests: <list or "none">
- Final full-suite result: <pass/fail summary>
```

---

## Red flags — stop and correct

- About to fix something without a failing repro.
- The "fix" is a `sleep`, a retry, a larger timeout, or a skipped test.
- A diff that reformats or refactors beyond the bug.
- Starting a loop without running `BUDGET check`.
- Opening a second PR, or committing to the base branch.
- Asking the user "should I continue?" between loops.
