# DRY Fix Loop — Quick Rules

> Load full `SKILL.md` when executing this skill as a formal procedure. Rules come from `clean-code-standards`.

## When to Trigger
- "Fix DRY violations for an hour", "dedupe until 5pm", "clean-code refactor loop into a PR", "/dry-fix-loop"
- Bounds: `--duration 2h` · `--loops N` · `--until 17:30` — first one hit wins. None given → `--loops 3`.
- Only the current diff, no PR wanted → use `/dry-loop` instead.

## Loop (terse)
0. Setup once: `scripts/budget.sh init …`, clean tree, branch `dry-fix/<date>-<hex>`, green baseline, measure (jscpd / lizard / drift), ranked DRY-NNN backlog ≥ `--min-severity` (default major), ledger in `$(budget.sh dir)/ledger.md`.
1. `budget.sh check` → STOP ⇒ wrap-up. Else `loop-start`.
2. Pick top finding; re-validate; reject coincidental similarity ("same reason to change?").
3. Protect: characterization tests first if coverage is thin (own commit).
4. Refactor: smallest behavior-preserving change; ≤ ~200 lines / ~8 files per commit.
5. Verify: tests + typecheck + lint green, no exported signature changes, metrics strictly improve (else revert).
6. One commit per refactor, plain push, first refactor opens a draft PR, later loops `gh pr edit --body-file`.
7. Ledger + `loop-end --confirmed n --fixed n`, one progress line with metric delta, continue without asking.

## Never
- Change behavior, public APIs, schemas, formats · edit test expectations to fit a refactor
- Abstract coincidental similarity · add speculative generality · mix in bug fixes or format sweeps
- Force-push · push to base · merge the PR · second PR · leave a red/uncommitted tree at a loop boundary
