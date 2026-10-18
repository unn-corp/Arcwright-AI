---
name: ci-gates
description: Set up CI quality gates and matching local hooks for Node/TypeScript and Python. Use for CI pipelines, pre-commit checks, security scans, and branch protection; preserve project coverage requirements and choose new gates from the actual stack and risks.
allowed-tools: Bash(*) Read Write Edit Glob Grep
---

# CI quality gates and local feedback

Set up repository checks and required CI gates for the actual stack. Local host
hooks are optional adapters; they do not replace CI or grant merge/publication
authority. Reuse existing checks, coverage requirements, and installer choices.

## Choose scope and checks

Honor the user's project/global scope and current decisions; a repository CI
request does not authorize changing global host settings. Inspect package metadata,
existing workflows and hooks, then add only the relevant missing gates. Use
`test-quality` for tests and focused local execution. Keep outputs in an owned
Arcwright run or host evidence storage; installed skill resources are read-only.

The bundled CI template covers static checks, tests with project-configured
coverage, optional Python, security/dependency scanning, SAST, and PR titles.
Choose from the actual stack and risks; do not install every tool or impose a
new arbitrary coverage quota. See [gate catalog](references/gate-catalog.md),
[tooling](references/tooling.md), and [branch protection](references/branch-protection.md).

Resolve `SKILL_DIR` to the effective installed ci-gates directory before using its
bundled templates. Preserve user workflows/settings and merge owned entries.

## Optional local enforcement

Use the active host's documented hook/plugin interface or an existing Git/package
check. Load `hookify` for a new adapter. The bundled `gate-lint.js`,
`gate-precommit.js`, and `gate-ci-verify.js` templates use Claude-shaped event input;
follow the [Claude adapter](references/claude-hooks.md) only for that host. On other
hosts, map the same checks through their actual interface and verify the mapping,
or report the unavailable automation and keep the CI gate. Never place Claude
settings JSON into another host's configuration.

Store reusable project scripts under `_arcwright/core/arcwright-hooks/` and write
only host registration into the host's required config path. Preserve existing
Arcwright guards and custom hooks. Distinguish a pre-action block from post-action
feedback; verify intended allow/failure behavior before claiming enforcement.

## Step 4 — Scaffold CI (skip on global-only if the user declined)

```bash
mkdir -p .github/workflows
cp "$SKILL_DIR/templates/ci.yml" .github/workflows/ci.yml
```

Trim jobs to the detected stack (drop `python` if no Python; pick the Vitest or
Jest line in `test-node`). Preserve the repository's existing coverage requirements.
Use the installed `test-quality` skill for meaningful tests and focused local runs.
Coverage percentages do not prove useful assertions; do not introduce a blanket
80/80/70 quota or write filler tests to reach one. When new thresholds are requested,
establish a justified baseline and use the matching configuration examples in
`references/tooling.md`; example numbers are not defaults for every project.

**Runners (self-hosted-first):** the template targets **self-hosted** runners by
default (`runs-on: [self-hosted, linux, x64]`), no GitHub-hosted fallback — a job
queues until a matching runner is online. Pin to a fleet by adding a custom org
label (e.g. `unn` for the unn-corp mothership runners → `[self-hosted, linux,
x64, unn]`). All jobs share one `runs-on`; change it once. To use GitHub-hosted
instead, set `runs-on: ubuntu-latest`. Full guidance + the unn-corp fleet (org
runners `ci-runner-runner-{1,2,3}` on the mothership VPS) and a "queued forever"
checklist: `references/self-hosted-runners.md`.

**Monorepo:** the template's `npm ci` assumes a root `package-lock.json`. If the
lockfile lives in a subdir (e.g. `website/`), set the job's `working-directory`
and `cache-dependency-path` to that subdir, or `npm ci` fails with "can only
install with an existing package-lock.json". See this repo's own
`.github/workflows/ci.yml` for a worked monorepo example.

**gitleaks license:** `gitleaks-action@v2` runs free on public repos but needs a
`GITLEAKS_LICENSE` repo secret on **private** repos, or the `security` job errors
at startup. To publish findings to the Security tab, give the job
`permissions: security-events: write` (the workflow default `contents: read`
silently skips the SARIF upload). `semgrep` `config: auto` uses OSS rules only
unless a `SEMGREP_APP_TOKEN` is set; `trivy-action` is version-pinned — bump it
periodically.

## Step 5 — Make the gates required (optional, asks first)

Walk the user through `references/branch-protection.md` to promote the CI jobs to
required status checks. This is a remote, outward-facing change — confirm before
running any `gh api` write.

## Step 6 — Report

State: scope (global/project), which hooks were wired and where, which CI jobs
were scaffolded vs trimmed, the coverage config touched, and the branch-
protection step (done or left to the user). Remind: local hooks take effect next
session; CI runs on the next push/PR; required checks need step 5.

## Kiro note

Kiro hooks live inside agent JSON, not `settings.json`. For Kiro, install the two
gate scripts the same way but register them in the relevant agent's `hooks`
block (PreToolUse/PostToolUse with the `execute_bash`/`fs_write` tool names).
The `ci.yml` + branch-protection guidance is IDE-agnostic.
