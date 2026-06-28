---
description: Examine a codebase and set up (or audit) CI/CD quality gates — local hooks, GitHub Actions, branch protection, and test-coverage gaps.
---

# /ci-gates — Set up or audit CI/CD quality gates

Examine the current repo and stand up the standard quality-gate stack: the local
Claude Code hooks that catch problems as you edit/commit, the GitHub Actions
workflow that is the authoritative merge gate, and (optionally) branch protection
to make those checks required. If gates already exist, switch to **audit mode**
and report what is missing — most usefully, code that has no tests.

## Instructions

1. Load `.agents/skills/ci-gates/SKILL.md` for the full protocol (hook scripts,
   tiered enforcement, the CI template, and the three-layer model). Follow it.

2. **Ask scope first:** global (`~/.claude`, applies everywhere) or project
   (`./.claude`, committed with the repo). Honor what the user already said.

3. **Detect the stack** (per the skill's Step 2): package.json + Vitest/Jest,
   pyproject.toml/requirements.txt, existing `.github/workflows/`, and whether
   `.claude/settings.json` already carries the `arcwright-hooks` gate entries.

4. **Branch the work:**
   - Decide whether gates already exist (CI workflow present AND the local gate
     hooks are wired). 
   - **If gates are missing →** install the hooks (Step 3 of the skill), scaffold
     the CI workflow trimmed to the detected stack (Step 4), and add the coverage
     thresholds (80/80/70 by default).
   - **If gates already exist →** run **audit mode** (see below) instead of
     re-scaffolding.

5. **Branch protection / required status checks (asks first — outward-facing):**
   - Identify the prod branch (the repo's `default_branch`) and the integration
     branch (`dev`). Create `dev` from the prod branch if it does not exist
     (`git push origin <prod>:refs/heads/dev` or via `gh api`).
   - Set the CI jobs as required status checks on **both** branches, using the
     exact job `name:` values from the scaffolded `ci.yml`. Prefer a repository
     **ruleset**; fall back to classic branch protection.
   - **Plan gate:** branch protection and rulesets require GitHub Pro/Team on
     private repos (the API returns 403 on a private free-tier repo). If blocked,
     do NOT pretend it worked — tell the user it needs a plan upgrade or making
     the repo public, and hand them the ready-to-run `gh api` command from
     `references/branch-protection.md` for when that is resolved.
   - This is a hard-to-reverse admin change on a real repo — confirm before any
     `gh api` write.

## Audit mode (gates already present)

Report, do not re-scaffold:

1. **Test-coverage gaps — the priority.** Map source modules to test files and
   list source that has **no** corresponding test:
   - Node/TS: source under `src/`/`lib`/`packages/*/lib` with no `*.test.ts` /
     `*.spec.ts` / `__tests__` neighbour. Note if there is no test runner at all.
   - Python: modules with no `test_*.py` / `*_test.py` under `tests/`.
   - Rank by risk (entry points, money/auth/security paths, most-imported modules
     first — use `/code-graph` if available for blast radius).
2. **Gate drift:** checks in CI but not the local hooks (or vice versa); coverage
   thresholds missing or below 80/80/70; jobs in `ci.yml` that reference tools
   the repo does not have; required-status-check names that no job emits.
3. **Output:** a ranked list of untested modules with a suggested test target for
   each, plus any gate-drift fixes. Offer to generate the missing tests (hand off
   to the QA persona / `team-tdd`) — do not bulk-write tests unprompted.

## Arguments

`$ARGUMENTS` — optional mode hint: `setup` (force install), `audit` (force the
test-gap scan), or `global`/`project` (scope). Empty = auto-detect.
