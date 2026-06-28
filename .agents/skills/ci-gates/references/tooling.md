# Per-ecosystem tooling

## Node / TypeScript

| Gate | Tool | Command |
|------|------|---------|
| Format | Prettier | `npx prettier --check .` / `--write` |
| Lint | ESLint (+ `@typescript-eslint`) | `npx eslint .` |
| Type-check | tsc | `npx tsc --noEmit` |
| Unit tests | Vitest (preferred) or Jest | `npx vitest run --coverage` / `npx jest --coverage` |
| Coverage gate | Vitest `coverage.thresholds` / Jest `coverageThreshold` | 80/80/70 |
| Git hooks (CI parity) | Husky + lint-staged, or Lefthook | staged-files only |

Vitest reuses `vite.config.ts` (same plugins, aliases, env). Vitest config:

```ts
// vite.config.ts / vitest.config.ts
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      thresholds: { lines: 80, functions: 80, branches: 70 },
    },
  },
})
```

Jest equivalent:

```js
// jest.config.js
module.exports = {
  coverageThreshold: { global: { lines: 80, functions: 80, branches: 70 } },
}
```

Note: Vite/esbuild only transpile TS — they do NOT type-check. Always run
`tsc --noEmit` as its own gate; set `"isolatedModules": true` to catch per-file
issues early.

## Python

| Gate | Tool | Command |
|------|------|---------|
| Format | Ruff | `ruff format --check .` / (no `--check` to fix) |
| Lint | Ruff (replaces Black + isort + Flake8) | `ruff check .` |
| Type-check | Pyright (fast) or Mypy (strict) | `pyright` / `mypy .` |
| Unit tests | pytest + pytest-cov | `pytest --cov --cov-fail-under=80` |
| Git hooks | pre-commit framework | `pre-commit run --all-files` |

## Cross-ecosystem security

| Gate | Tool | Command |
|------|------|---------|
| Secret scan | gitleaks | `gitleaks protect --staged` (local) / `gitleaks detect` (CI) |
| Dependency vuln | Trivy | `trivy fs --scanners vuln .` |
| Node dep audit | npm audit | `npm audit --audit-level=high` |
| Python dep audit | pip-audit | `pip-audit` |
| SAST (multi-lang, no build) | Semgrep | `semgrep --config auto` |
| Container scan | Trivy image | `trivy image <ref>` |

## Conventional commits / PR titles

- Local advisory: `gate-precommit.js` warns when a `-m` subject is not
  `type(scope): summary`.
- CI/merge gate: `amannn/action-semantic-pull-request` (PR title) or
  `commitlint` + `@commitlint/config-conventional`.
- GitHub branch protection cannot enforce commit format natively — use a CI job
  or GH App.
