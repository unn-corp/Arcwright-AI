# Per-ecosystem tooling

Coverage numbers in these snippets illustrate configuration syntax. Preserve
existing required floors; choose new thresholds only for a requested gate with
a justified project baseline.

## Node / TypeScript

| Gate | Tool | Command |
|------|------|---------|
| Format | Prettier | `npx prettier --check .` / `--write` |
| Lint | ESLint (+ `@typescript-eslint`) | `npx eslint .` |
| Type-check | tsc | `npx tsc --noEmit` |
| Unit tests | Vitest (preferred) or Jest | `npx vitest run --coverage` / `npx jest --coverage` |
| Coverage gate | Vitest `coverage.thresholds` / Jest `coverageThreshold` | Existing project requirements; agree new floors explicitly |
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
| Unit tests | pytest + pytest-cov | `pytest --cov` using project-configured requirements |
| Git hooks | pre-commit framework | `pre-commit run --all-files` |

## Cross-ecosystem security

| Gate | Tool | Command |
|------|------|---------|
| Secret scan | gitleaks | `gitleaks protect --staged` (local) / `gitleaks detect` (CI) |
| Dependency vuln (lockfiles) | OSV-Scanner (OSV.dev) | `osv-scanner scan source -r .` / `docker run --rm -v "$PWD:/src" ghcr.io/google/osv-scanner:latest scan source -r /src` |
| Dependency vuln (filesystem/images) | Trivy | `trivy fs --scanners vuln .` |
| Node dep audit | npm audit | `npm audit --audit-level=high` |
| Python dep audit | pip-audit | `pip-audit` |
| SAST (multi-lang, no build) | Semgrep | `semgrep --config auto` |
| Container scan | Trivy image | `trivy image <ref>` |

## OSV-Scanner (OSV.dev) — the artifact's dependency surface

A built artifact's vulnerability surface is its **dependencies**, captured in the
committed lockfiles. OSV-Scanner matches every lockfile (npm, pip, Go, Cargo,
Maven, …) and SBOMs against the OSV.dev database — more precise per-package than
a filesystem image scan.

```sh
osv-scanner scan source --recursive .        # all lockfiles under the tree
osv-scanner scan source --lockfile=path/to/package-lock.json
# no local install needed — run the official image (CI parity):
docker run --rm -v "$PWD:/src" ghcr.io/google/osv-scanner:latest scan source -r /src
```

Non-zero exit on findings. **Fixing:** bump within the existing semver range
(`npm update`, `pip install -U`, etc.) and re-scan; if the fix needs a major
bump, treat it as a tracked dependency upgrade. OSV-Scanner prints the fixed
version per advisory, so the remediation target is explicit. Run it in CI (the
`security` job) and before a release.

## CI runner realities (private registries + self-hosted DinD)

The scaffolded gates account for two environment traps. Both bit a real repo;
the scaffold ships the working forms.

**1. Private npm registry token → E401 on every `npm ci`.** If a runner's
`~/.npmrc` points at a private mirror (e.g. AWS CodeArtifact) whose auth token
has expired, `npm ci`/`npm install` fails with `npm error code E401` even for
public deps. Force the public registry and ignore that userconfig:

```yaml
env:                                         # job- or workflow-level
  npm_config_registry: https://registry.npmjs.org/
  NPM_CONFIG_USERCONFIG: /dev/null
```

Locally, the same one-off: `npx --registry=https://registry.npmjs.org/ …`. If a
committed lockfile has private `resolved:` URLs, regenerate it against public npm
(`rm package-lock.json && npm install --package-lock-only` with the env above and
a clean `--cache`).

**2. Self-hosted DinD → `docker run -v workspace` mounts nothing.** Prefer
**native release binaries** for scanners (gitleaks, trivy, osv-scanner) run
against `$GITHUB_WORKSPACE`, and **`docker cp`** for image-only tools (semgrep).
The `docker run -v "$PWD:/src"` forms in the tables above are fine on a dev
machine but pass *vacuously* on a DinD runner — full explanation and the working
patterns are in [self-hosted-runners.md](./self-hosted-runners.md).

**gitleaks on private repos:** the `gitleaks/gitleaks-action@v2` wrapper requires
a paid `GITLEAKS_LICENSE` on private repos; the **CLI binary is free** (MIT). The
scaffold downloads the binary instead of using the action.

**gitleaks allowlist (`.gitleaks.toml`):** to silence documentation/example
false-positives (e.g. RFC example keys, sample tokens in skill docs) without
weakening real detection, commit a repo-root config that extends the defaults:

```toml
[extend]
useDefault = true

[allowlist]
description = "Example values in docs, not real secrets."
paths = ['''docs/.*\.md''']
regexes = ['''Sec-WebSocket-(Key|Accept):\s*\S+''']
```

The scaffolded gitleaks step auto-loads it (`--config=$GITHUB_WORKSPACE/.gitleaks.toml`)
when present. Prefer a narrow `paths`/`regexes` allowlist over disabling a rule.

**semgrep noise:** `--config auto` on a mixed repo yields many low-severity style
findings. Gate on `--severity ERROR` and add `--exclude-rule <full.rule.id>` for
documented false-positives (CLI tooling flagged by `detect-child-process`, a
`ws://` example flagged by `detect-insecure-websocket`, etc.). All rules still
run, so new high-severity issues fail the gate.

## Conventional commits / PR titles

- Local advisory: `gate-precommit.js` warns when a `-m` subject is not
  `type(scope): summary`.
- CI/merge gate: `amannn/action-semantic-pull-request` (PR title) or
  `commitlint` + `@commitlint/config-conventional`.
- GitHub branch protection cannot enforce commit format natively — use a CI job
  or GH App.
