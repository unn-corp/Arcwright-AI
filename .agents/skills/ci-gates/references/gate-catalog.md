# CI Gate Catalog

The canonical gate set, ordered cheapest/fastest first so the pipeline fails fast
(shift-left). A 20-minute E2E suite must never block a commit; it belongs at the
merge gate or nightly.

| # | Gate | Typical time | Layer | Blocks on |
|---|------|--------------|-------|-----------|
| 1 | Format check | < 5 s | local + PR-CI | unformatted files |
| 2 | Lint | 5–30 s | local + PR-CI | lint errors |
| 3 | Type-check | 10–60 s | PR-CI (local optional) | type errors |
| 4 | Secret scan | < 30 s | local + PR-CI | committed credential |
| 5 | Unit tests + coverage | 30 s–5 min | PR-CI | failing test / coverage < threshold |
| 6 | Build verification | 1–5 min | PR-CI | build failure |
| 7 | SAST + dependency audit (OSV.dev + SAST) | 2–10 min | PR-CI | HIGH/CRITICAL finding |
| 8 | Integration tests | 5–20 min | PR-CI | failure |
| 9 | E2E tests | 10–30 min | merge gate / nightly | failure |

## The three layers

```
Layer 1 — LOCAL (pre-commit / Claude Code hooks)
  Fast, staged-files-only. format + lint + secret scan.
  Authoritative copy of these checks still lives in CI (a hook can be bypassed
  with --no-verify, so CI must re-run them).
  gate-ci-verify.js (PostToolUse on git push) closes the loop to Layer 2: after
  a push it polls GitHub Actions for that commit and reports the verdict, so a
  bypassed local check can't hide behind a green that nobody looked at.

Layer 2 — PR-CI (GitHub Actions, every push)
  Gates 1–7 in dependency order. Long E2E reserved for the merge gate.

Layer 3 — MERGE GATE (branch protection / rulesets)
  Required status checks (exact job names), conventional PR title, code-owner
  review. See branch-protection.md.
```

## Default coverage thresholds (this skill ships)

`lines 80, functions 80, branches 70` — the common industry baseline. Lower them
per-repo if a legacy codebase can't meet it yet; raise for critical libraries.

- Vitest: `test.coverage.thresholds = { lines: 80, functions: 80, branches: 70 }`
- Jest: `coverageThreshold.global = { lines: 80, functions: 80, branches: 70 }`
- pytest: `pytest --cov --cov-fail-under=80`

## Sync rule

Every gate enforced in a local hook must also run in CI, and vice versa. A rule
in the hook but not CI creates false confidence; a rule in CI but not the hook
wastes a round-trip. Keep `gate-lint.js` / `gate-precommit.js` and `ci.yml` in
agreement.
