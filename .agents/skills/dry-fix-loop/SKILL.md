---
name: dry-fix-loop
description: Bounded whole-repo DRY/SOLID refactor loop. Measures duplication, applies behavior-preserving refactors protected by tests, and grows one PR with before/after metrics. Bound by --duration, --loops, or --until. For the current diff only, use /dry-loop.
argument-hint: "[--duration 2h] [--loops N] [--until HH:MM|ISO] [--scope path...] [--min-severity critical|major|minor] [--rules core-dry,org-function-size,...] [--base branch] [--pr N|URL] [--dry-stop N]"
version: 1.0.0
author: arcwright
tags: [dry, solid, refactoring, code-quality, duplication, loop, pr]
---

# DRY Fix Loop

**Goal:** Within a user-set budget, remove as much *real* duplication and structural debt as possible through small, behavior-preserving refactors, each proven safe by tests, all landing on a single branch backing a single PR. The output is less code that does exactly the same thing, not different code.

**Rule source:** `clean-code-standards` (23 rules, `DRY-NNN` finding IDs, 🔴/🟡/🟢 severities). Load its `SKILL.md` in Phase 0. Companion skills (load when relevant, do not ask): `karpathy-discipline` (smallest change), `test-quality` (before writing characterization tests), `drift` (duplicate-function detection), the language skill for the code you touch. Tooling catalog: [references/dry-playbook.md](references/dry-playbook.md).

The budget helper is `scripts/budget.sh` in this skill's directory (the directory containing this SKILL.md). Below, `BUDGET` means that absolute path.

| | `/dry-loop` | `dry-fix-loop` (this skill) |
| --- | --- | --- |
| Scope | Current diff | Whole repo or `--scope` |
| Bound | Pass count | Duration / loops / end time |
| Output | Edits in working tree | One commit per refactor, one PR, metrics |

---

## Arguments

| Flag | Meaning | Default |
| --- | --- | --- |
| `--duration` | Wall-clock budget: `45m`, `2h`, `1h30m`, bare number = minutes | — |
| `--loops` | Maximum loops | — |
| `--until` | End time: `17:30`, `5pm`, `tomorrow 09:00`, ISO 8601. A past clock time rolls to tomorrow | — |
| `--scope` | Paths/packages to remediate | whole repo minus generated/vendored code |
| `--min-severity` | Lowest severity worth fixing: `critical`, `major`, `minor` | `major` |
| `--rules` | Restrict/prioritize rule IDs from clean-code-standards | `core-dry` first, then the priority order below |
| `--base` | Base branch for the PR | repo default branch |
| `--pr` | Continue an existing dry-fix PR instead of opening a new one | new PR |
| `--dry-stop` | Stop after N consecutive loops with no actionable finding at ≥ `--min-severity`; `0` disables | `3` |

Bounds combine: the run stops at the **first** of loop limit, deadline (earliest of `--duration`/`--until`), or saturation. Natural-language bounds map onto these flags. No bound at all → `--loops 3`, stated in the kickoff line; do not stop to ask.

---

## Hard rules

- **MUST** run `BUDGET check` before every loop and `BUDGET remaining` between phases. Never estimate elapsed time yourself.
- **MUST** preserve behavior. Every refactor is a pure restructuring: same inputs → same outputs, same side effects, same errors, same public API. If behavior would change, it is not this skill's job.
- **MUST** have tests covering the code before changing it. If coverage is missing, first add *characterization tests* that pin current behavior (including current quirks), commit them, then refactor against them.
- **MUST** keep the full relevant suite, typecheck, and lint green after every refactor. Red → fix or revert; never adjust a test's expectations to match a refactor.
- **MUST** make one logical refactor per commit (`refactor(<scope>): …`) and push it to the single hunt branch. One branch, one PR, for the entire run.
- **MUST NOT** change public/exported APIs, persisted formats, wire protocols, DB schemas, or config keys. Needed changes go under *Needs human*.
- **MUST NOT** abstract coincidental similarity. Apply the rule of three and the "same reason to change" test: if two blocks look alike but serve different domain concepts that will evolve separately, leave them. A wrong abstraction is worse than duplication.
- **MUST NOT** introduce speculative generality (plugin systems, option flags, base classes with one subclass) while removing duplication — that trades a `core-dry` finding for a `core-yagni` one.
- **MUST NOT** mix in bug fixes, formatting sweeps, renames outside the touched code, dependency upgrades, or new features. Real bugs found along the way → *Found bugs* in the ledger (suggest `/bug-hunt-loop`), not fixed here.
- **MUST NOT** force-push, rewrite published history, push to/merge into the base branch, or merge the PR.
- **MUST** leave the branch green and committed at every loop boundary. Deadline hit mid-refactor → finish and verify within ~5 minutes, or revert the uncommitted change and log it.
- **MUST NOT** pause between loops to ask the user anything. Stop-and-ask only in Phase 0 (dirty tree, ambiguous base).
- **SHOULD** avoid files touched by other open PRs (`gh pr list --state open --json number,files`) to prevent merge conflicts; log them as *Deferred (conflict risk)*.
- **SHOULD** follow the host's commit-attribution and PR-linking conventions.

---

## Phase 0 — Setup (once)

1. **Parse args**, run `BUDGET init [--duration …] [--loops …] [--until …] [--dry-stop …]`, and echo a kickoff line: *"DRY fix loop: 90m (until 15:10), min severity major, scope packages/api. Branch dry-fix/2026-11-26-c3d4."*
2. **Load rules**: `clean-code-standards/SKILL.md`; read `AGENTS.md` / `CLAUDE.md` / `GEMINI.md` from repo root down to scope — project conventions override generic rules (e.g. a sanctioned large file or naming scheme is not a violation).
3. **Working tree**: non-empty `git status --porcelain` → STOP and ask. Never stash or commit the user's work.
4. **Branch**: `--pr` → check out its head (must be OPEN), `git pull --ff-only`, `BUDGET set PR_URL …`. Otherwise `git fetch origin <base>` and `git switch -c dry-fix/<YYYY-MM-DD>-<4 hex> origin/<base>`. `BUDGET set BRANCH …`, `BUDGET set BASE …`.
5. **Baseline**: discover and run build, tests, typecheck, lint. Record pre-existing failures in the ledger. A red baseline means refactors can't be verified: stop and report, or narrow `--scope` to packages whose suites are green.
6. **Measure** (see playbook): duplication % and clone list (e.g. `jscpd`), oversized functions/modules and nesting/complexity (e.g. `lizard`), and duplicate-function candidates (`drift`) if available. Exclude generated, vendored, migration, fixture, and lockfile paths. Save the baseline numbers in the ledger's *Metrics* table.
7. **Backlog**: convert the measurements plus a quick rule sweep into `DRY-NNN` findings at ≥ `--min-severity`, ranked by **value = severity × (lines removed or complexity reduced) × call-site count ÷ blast radius**. Ties go to code with strong existing test coverage. Write the ranked backlog to the ledger.
8. **Ledger**: create `$(BUDGET dir)/ledger.md` (inside the git dir, never committed) from the template below. Re-read it plus `BUDGET status` to resume after context compaction.

Priority order when `--rules` is not given: `core-dry` (clones, duplicated constants/validation/queries) → `org-function-size` / `org-nesting` → `solid-srp` / `core-soc` → `pattern-repository` / `pattern-factory` (only where they remove existing duplication) → `func-args` → `core-lod` / `core-encapsulation` → the rest. Naming/doc rules only when the same refactor already touches the lines.

---

## The loop

Repeat until `BUDGET check` prints `STOP`:

### 1. Gate
`BUDGET check` → on `STOP`, go to **Wrap-up**. Otherwise `BUDGET loop-start`.

### 2. Pick
Take the top backlog finding not yet attempted. Re-validate it against the current branch (earlier refactors may have changed or resolved it). Apply the abstraction test: *do these copies change for the same reason?* If not, mark **Rejected (coincidental similarity)** and pick the next.

### 3. Protect
Identify the tests that exercise every copy/call site being changed. Missing or thin coverage → write characterization tests that pin current behavior (inputs, outputs, errors, side effects), run them green on the unchanged code, and commit them first as `test(<scope>): characterize <unit> before refactor`.

### 4. Refactor
Apply the smallest structural change that resolves the finding — extract function/module/constant, replace copies with calls, split an oversized function along existing seams, flatten nesting with early returns, introduce a parameter object. Place shared code where the codebase already keeps shared code; match local style. Keep the commit's diff reviewable: if it would exceed ~200 changed lines or ~8 files, split it into sequential commits that are each green, or log it as *Needs human*.

### 5. Verify
- Characterization + existing tests green; typecheck and lint green; build green where the change touches build-visible code.
- No public signature changes: diff exported symbols (`git diff` on export lines / type declarations) and confirm none changed.
- Re-measure the touched area: duplication or complexity must strictly improve and nothing new appears (no new clones, no new oversized functions). No improvement → revert and mark **Rejected (no net gain)**.
- Run the full suite every few loops and before wrap-up.

### 6. Commit & publish
One commit per refactor: `refactor(<scope>): <what was unified/split> (DRY-NNN)`, body with rule, before/after metric, and call sites changed. Plain `git push -u origin <branch>`.
- **First refactor** without `--pr`: open a **draft** PR (`gh pr create --draft --base <base> --title "DRY fix loop: <scope> (<date>)" --body-file <rendered body>`), `BUDGET set PR_URL <url>`, link it via host PR tools if available.
- **Every loop with changes**: regenerate the PR body from the ledger and `gh pr edit <url> --body-file <file>`.
- No PR while there are zero refactors; an empty run reports the ledger instead.

### 7. Record
Update the ledger and backlog, then `BUDGET loop-end --confirmed <actionable findings attempted> --fixed <refactors committed>`. Post one progress line: *"Loop 3/8 · 52m left · DRY-004 unified 4 copies of date-range validation (−63 lines) · duplication 6.8% → 5.9%."* Continue without ending the turn. When the backlog is exhausted, re-measure the scope to refill it before the next loop.

---

## Wrap-up

1. Clean tree, branch pushed, full suite green (or baseline-equal) — note the result in the PR.
2. Final re-measure of the whole scope; fill the *After* column of the metrics table; final PR body update. Leave the PR in draft unless the user asked otherwise.
3. Report: stop reason, loops, time used, refactors committed, lines removed, metric deltas, rejected/needs-human/found-bugs counts, PR link.

---

## Ledger / PR body template

```markdown
## DRY fix loop — <scope> · <start> → <end> · <stop reason>

Refactors **<n>** · Net lines **−<x>** · Rejected <r> · Needs human <h> · Loops <k>
Behavior-preserving only: no API, schema, or behavior changes. Each commit is independently green.

### Metrics
| Metric | Before | After |
|--------|--------|-------|
| Duplicated lines (%) | 6.8% | 4.1% |
| Clone groups | 41 | 22 |
| Functions > 30 lines | 57 | 49 |
| Max nesting depth > 3 | 18 | 12 |

### Refactors
| ID | Sev | Rule | Change | Call sites | Δ lines | Commit |
|----|-----|------|--------|-----------|---------|--------|
| DRY-004 | 🔴 | core-dry | Extracted `validateDateRange()` from 4 handlers | 4 | −63 | abc1234 |

### Needs human
- DRY-011 <location> — <why it needs an API/design decision, suggested direction>

### Rejected
- DRY-007 <location> — coincidental similarity (different reasons to change)

### Deferred (conflict risk) / Found bugs
- <file> — touched by #<PR>
- <location> — <suspected bug; not fixed here>

### Baseline
- Pre-existing failing tests: <list or "none"> · Final full-suite result: <summary>
```

---

## Red flags — stop and correct

- Refactoring code no test exercises.
- Editing a test's expected values so a refactor passes.
- A shared helper with boolean flags or `mode` params that switch between the old copies' behaviors — the copies weren't really the same.
- A new base class/interface/factory with exactly one implementation.
- The diff changes an exported signature, a schema, or a serialized shape.
- Metrics did not improve but the commit is going in anyway.
- Opening a second PR, committing to the base branch, or asking "should I continue?" between loops.
