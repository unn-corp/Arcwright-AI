# Commit Commands — Quick Rules

> Load full `SKILL.md` for conventional-commit rules and full procedure.

Three lean git operations. No tests/lint/typecheck — use `verify-and-ship` for quality gates.

## Core Rules

- NEVER commit without showing the message and getting confirmation
- NEVER use `--no-verify` (no hook bypass)
- NEVER amend a pushed commit
- NEVER force push — if push is rejected, stop and report
- `/clean-gone` only deletes local branches, never remotes

## Conventional Commit Quick Ref

`<type>(<scope>): <subject>` — imperative, lowercase, no period, ≤72 chars

| Type | Use for |
|------|---------|
| `feat` | New capability |
| `fix` | Bug fix |
| `refactor` | Restructure, no behavior change |
| `docs` | Docs only |
| `chore` | Build, deps, config |
| `test` | Tests |
| `perf` | Performance |

No `Co-Authored-By` or attribution footers.

## When to Use vs verify-and-ship

Use `commit-commands` for daily commits without quality checks.
Use `verify-and-ship` before shipping (runs tests, lint, typecheck, updates changelog).
