# DRY Playbook — measuring and refactoring safely

Prefer tools the project already has. Running a tool via `npx`/`pipx`/`uvx` without adding it as a dependency is fine for measurement; don't commit tool config unless the user asks. Always exclude generated, vendored, build output, migrations, snapshots, fixtures, and lockfiles.

## Measuring

| What | Tool (multi-language unless noted) | Example |
| --- | --- | --- |
| Copy-paste clones + duplication % | `jscpd` | `npx jscpd --min-lines 6 --min-tokens 50 --reporters json,console --output "$(budget.sh dir)/jscpd" --ignore "**/node_modules/**,**/dist/**,**/build/**,**/vendor/**,**/*.min.*,**/migrations/**,**/__snapshots__/**" <scope>` |
| Clones (JVM, others) | PMD CPD | `pmd cpd --minimum-tokens 75 --dir <scope> --language java --format csv` |
| Clones (Python) | pylint | `pylint --disable=all --enable=duplicate-code --min-similarity-lines=6 <pkg>` |
| Duplicate functions / convention drift | `drift` skill (VibeDrift CLI) | see `drift/SKILL.md` |
| Function length, complexity, args | `lizard` | `uvx lizard -L 30 -C 10 -a 3 -w <scope>` (warnings only) |
| Complexity (Python) | radon | `uvx radon cc -s -n C <pkg>`; `uvx radon mi <pkg>` |
| Complexity / nesting (JS/TS) | ESLint core rules | With the project's own ESLint config (so the TS parser applies): `npx eslint --format json --rule 'max-depth: [warn, 3]' --rule 'max-lines-per-function: [warn, 30]' --rule 'complexity: [warn, 10]' --rule 'max-params: [warn, 3]' <files>` |
| Module size | shell | `git ls-files <scope> \| xargs wc -l \| sort -rn \| head -30` |
| Dead code (Py / TS) | vulture / knip / ts-prune | `uvx vulture <pkg>`; `npx knip` |
| Coverage of touched code | project coverage tool | vitest/jest `--coverage`, `pytest --cov`, `go test -cover`, `cargo llvm-cov` |

Record the same metrics the same way before and after so the PR's numbers are comparable.

## Choosing what to unify

Unify when **all** hold:
1. Three or more copies (two only if large, ≥ ~15 lines, and clearly the same concept).
2. Same domain concept and the same reason to change. Ask: "if a requirement changed in one copy, would it have to change in the others?"
3. The differences between copies are data (values, field names), not behavior. Behavioral differences that would need flags in the shared version mean they are not the same thing.

Leave alone: test setup that is clearer inline, boilerplate the framework requires, parallel structures across bounded contexts, and code slated for deletion.

## Refactoring moves (behavior-preserving)

| Smell | Move |
| --- | --- |
| Copied block in N places | Extract function → replace each copy with a call, one call site at a time, tests green after each |
| Repeated literals / magic values | Extract named constant in the module that owns the concept |
| Repeated validation / parsing | Extract a validator/parser next to the type it validates |
| Repeated query / data access | Move into the existing repository/data layer; do not invent one if the codebase has none (Needs human) |
| Long function | Extract along existing comment-delimited or blank-line-delimited seams; keep the original function as the orchestrator |
| Deep nesting | Guard clauses / early returns; extract the inner loop body |
| 4+ params repeated together | Parameter object for internal functions only (exported signatures are off-limits) |
| Demeter chains | Add a narrow accessor on the nearer object only if it removes repeated chains |
| Near-identical classes | Extract shared helper functions first; reach for inheritance only if the codebase already uses it for this |

## Safety checklist per commit
- Tests that exercise every changed call site were green before and after.
- Characterization tests pin quirks you are preserving (including odd error messages and ordering).
- Exported surface unchanged: compare `export`/`pub`/`public`/`__all__` lines and `.d.ts` output where applicable.
- Error behavior unchanged: same exception/error types and messages, same points of failure.
- Side-effect order unchanged (logging, events, I/O) unless provably irrelevant.
- Performance: no new N+1 queries or repeated work introduced by the shared helper.
- Re-measured: the clone or complexity finding is gone and nothing new appeared.
