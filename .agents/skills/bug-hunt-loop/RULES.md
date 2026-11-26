# Bug Hunt Loop — Quick Rules

> Load full `SKILL.md` when executing this skill as a formal procedure.

## When to Trigger
- "Bug hunt", "find and fix bugs for 2h", "hunt race conditions until 6pm", "/bug-hunt-loop"
- Bounds: `--duration 2h` · `--loops N` · `--until 17:30` — first one hit wins. None given → `--loops 3`.

## Loop (terse)
0. Setup once: `scripts/budget.sh init …`, clean tree check, branch `bug-hunt/<date>-<hex>` off base (or `--pr` head), baseline test run, ranked attack-surface map, ledger in `$(budget.sh dir)/ledger.md`.
1. `budget.sh check` → STOP ⇒ wrap-up. Else `loop-start`.
2. Pick untouched (module × lens); rotate lenses: races, boundaries, errors, resources, state, time, input, security, perf.
3. Hunt with executable attacks: stress harness, race detector, property/fuzz, fault injection, shuffled/repeated runs.
4. Confirm: failing repro required (races: measurable fail rate). Classify P0/P1/P2.
5. Fix: smallest root-cause change. Too big / API change / design call ⇒ "Needs human", no fix.
6. Verify: repro passes (same iteration count), regression test added, affected suite + lint green.
7. One commit per bug, plain push, first fix opens a draft PR, later loops `gh pr edit --body-file`.
8. Ledger + `loop-end --confirmed n --fixed n`, one progress line, continue without asking.

## Never
- Fix without repro · sleeps/retries/skips as fixes · weaken tests · refactor drive-bys
- Force-push · push to base · merge the PR · second PR
- Stress/fuzz prod, shared envs, paid APIs · leave a broken/uncommitted tree at a loop boundary
